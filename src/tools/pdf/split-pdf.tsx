import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { PdfPageGrid, type GridPage } from "@/components/tool/pdf-page-grid";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";

type Mode = "every" | "ranges" | "select";

interface Settings {
  mode: Mode;
  ranges: string;
  every: number;
}

const DEFAULTS: Settings = { mode: "ranges", ranges: "1-3, 4", every: 1 };

function parseRanges(input: string, max: number): number[][] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((s) => parseInt(s.trim(), 10));
        if (isNaN(a) || isNaN(b)) return [];
        const start = Math.max(1, Math.min(a, b));
        const end = Math.min(max, Math.max(a, b));
        const out: number[] = [];
        for (let i = start; i <= end; i++) out.push(i - 1);
        return out;
      }
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > max) return [];
      return [n - 1];
    })
    .filter((arr) => arr.length > 0);
}

function chunkEvery(total: number, n: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < total; i += n) {
    const g: number[] = [];
    for (let j = i; j < Math.min(i + n, total); j++) g.push(j);
    out.push(g);
  }
  return out;
}

export default function SplitPdf() {
  const [settings, setSettings] = useToolSettings<Settings>("split-pdf", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { pages, loading } = usePdfDocument(file);

  const gridPages: GridPage[] = useMemo(
    () =>
      pages.map((p) => ({
        id: `p-${p.index}`,
        origIndex: p.index,
        thumb: p.thumb,
      })),
    [pages],
  );

  const total = pages.length;

  const groups = useMemo<number[][]>(() => {
    if (!total) return [];
    if (settings.mode === "every") return chunkEvery(total, Math.max(1, settings.every));
    if (settings.mode === "ranges") return parseRanges(settings.ranges, total);
    // select: one PDF containing only the selected pages, in original order
    const indices = pages.filter((p) => selected.has(`p-${p.index}`)).map((p) => p.index);
    return indices.length ? [indices] : [];
  }, [pages, selected, settings.every, settings.mode, settings.ranges, total]);

  const onToggleSelect = (id: string, e: React.MouseEvent) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (e.shiftKey && cur.size) {
        // range select from last to this
        const list = gridPages.map((g) => g.id);
        const lastSelected = list.findIndex((x) => cur.has(x));
        const target = list.indexOf(id);
        if (lastSelected >= 0 && target >= 0) {
          const [a, b] = lastSelected < target ? [lastSelected, target] : [target, lastSelected];
          for (let i = a; i <= b; i++) next.add(list[i]);
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const split = async () => {
    if (!file || groups.length === 0) {
      toast.error("No valid pages to split");
      return;
    }
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const { zipSync } = await import("fflate");
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const baseName = file.name.replace(/\.pdf$/i, "");
      const entries: Record<string, Uint8Array> = {};
      for (const g of groups) {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, g);
        for (const p of copied) out.addPage(p);
        const bytes = await out.save();
        const label = g.length === 1 ? `p${g[0] + 1}` : `p${g[0] + 1}-${g[g.length - 1] + 1}`;
        entries[`${baseName}-${label}.pdf`] = bytes;
      }
      // single result → just download the PDF; multiple → ZIP
      if (groups.length === 1) {
        const onlyKey = Object.keys(entries)[0];
        downloadBlob(
          new Blob([entries[onlyKey].buffer as ArrayBuffer], { type: "application/pdf" }),
          onlyKey,
        );
      } else {
        const zipped = zipSync(entries, { level: 6 });
        downloadBlob(
          new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" }),
          `${baseName}-split.zip`,
        );
      }
    } catch (e) {
      toast.error("Failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolToaster />
      <div className="flex justify-end">
        <SampleDataButton onLoad={async () => setFile(await samplePdfFile())} />
      </div>
      <PdfDropArea file={file} onFile={setFile} pageCount={total || undefined} />

      {file && (
        <>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <Label className="mb-2 block">Split mode</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={(v) => setSettings({ mode: v as Mode })}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-select" value="select" />
                <Label htmlFor="m-select" className="font-normal">
                  Select pages visually ({selected.size} chosen)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-ranges" value="ranges" />
                <Label htmlFor="m-ranges" className="font-normal">
                  Custom ranges
                </Label>
                <Input
                  value={settings.ranges}
                  onChange={(e) => setSettings({ ranges: e.target.value })}
                  placeholder="1-3, 5, 7-9"
                  className="ml-1 h-7 w-48 font-mono"
                  disabled={settings.mode !== "ranges"}
                />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-every" value="every" />
                <Label htmlFor="m-every" className="font-normal">
                  Every
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.every}
                  onChange={(e) => setSettings({ every: Math.max(1, Number(e.target.value) || 1) })}
                  className="ml-1 h-7 w-16 font-mono"
                  disabled={settings.mode !== "every"}
                />
                <span className="text-sm text-muted-foreground">pages</span>
              </div>
            </RadioGroup>
            {settings.mode === "select" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Click pages below to include them in a single output PDF. Shift-click for a range.
              </p>
            )}
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {groups.length === 0 ? (
                <span className="text-destructive">No valid pages selected</span>
              ) : groups.length === 1 ? (
                <>
                  Will produce 1 PDF · {groups[0].length} pages · source {formatBytes(file.size)}
                </>
              ) : (
                <>
                  Will produce {groups.length} PDFs in a ZIP ·{" "}
                  {groups.reduce((a, g) => a + g.length, 0)} pages total · source{" "}
                  {formatBytes(file.size)}
                </>
              )}
            </p>
          </div>

          {loading && pages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering pages…
            </div>
          ) : (
            <PdfPageGrid
              pages={gridPages}
              selected={settings.mode === "select" ? selected : undefined}
              onToggleSelect={settings.mode === "select" ? onToggleSelect : undefined}
              readOnly
            />
          )}

          <Button onClick={split} disabled={busy || groups.length === 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Split {groups.length === 1 ? "& download PDF" : "& download ZIP"}
          </Button>
        </>
      )}
    </div>
  );
}
