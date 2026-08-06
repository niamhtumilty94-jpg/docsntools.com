import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { PdfPageGrid, type GridPage } from "@/components/tool/pdf-page-grid";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";
import { renderPageBlob, getDocument } from "./_pdfjs";

interface Settings {
  type: "image/png" | "image/jpeg";
  scale: number;
  quality: number;
}

const DEFAULTS: Settings = { type: "image/png", scale: 2, quality: 92 };

export default function PdfToImages() {
  const [settings, setSettings] = useToolSettings<Settings>("pdf-to-images", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { pages } = usePdfDocument(file);

  useEffect(() => {
    if (pages.length) {
      // default: select all
      setSelected(new Set(pages.map((p) => `p-${p.index}`)));
    } else {
      setSelected(new Set());
    }
  }, [pages]);

  const gridPages: GridPage[] = useMemo(
    () =>
      pages.map((p) => ({
        id: `p-${p.index}`,
        origIndex: p.index,
        thumb: p.thumb,
      })),
    [pages],
  );

  const onToggleSelect = (id: string, e: React.MouseEvent) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (e.shiftKey && cur.size) {
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

  const estimate = useMemo(() => {
    if (!pages.length) return 0;
    // Rough size estimate per page
    const avgArea =
      pages.reduce((a, p) => a + p.width * p.height * settings.scale * settings.scale, 0) /
      pages.length;
    const bytesPerPx = settings.type === "image/png" ? 4 : 0.6 * (settings.quality / 100);
    return Math.round(avgArea * bytesPerPx * selected.size);
  }, [pages, settings, selected.size]);

  const run = async () => {
    if (!file || selected.size === 0) return;
    setBusy(true);
    try {
      const { zipSync } = await import("fflate");
      const doc = await getDocument(await file.arrayBuffer());
      const ext = settings.type === "image/png" ? "png" : "jpg";
      const base = file.name.replace(/\.pdf$/i, "");
      const entries: Record<string, Uint8Array> = {};
      const indices = pages.filter((p) => selected.has(`p-${p.index}`)).map((p) => p.index);
      for (const i of indices) {
        const blob = await renderPageBlob(
          doc,
          i + 1,
          settings.scale,
          settings.type,
          settings.quality / 100,
        );
        entries[`${base}-p${String(i + 1).padStart(3, "0")}.${ext}`] = new Uint8Array(
          await blob.arrayBuffer(),
        );
      }
      if (Object.keys(entries).length === 1) {
        const onlyKey = Object.keys(entries)[0];
        downloadBlob(
          new Blob([new Uint8Array(entries[onlyKey]).buffer], { type: settings.type }),
          onlyKey,
        );
      } else {
        const zipped = zipSync(entries, { level: 6 });
        downloadBlob(
          new Blob([new Uint8Array(zipped).buffer], { type: "application/zip" }),
          `${base}-images.zip`,
        );
      }
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
      <PdfDropArea file={file} onFile={setFile} pageCount={pages.length || undefined} />

      {file && (
        <>
          <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <Label>Format</Label>
              <Select
                value={settings.type}
                onValueChange={(v) => setSettings({ type: v as typeof settings.type })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/png">PNG (lossless)</SelectItem>
                  <SelectItem value="image/jpeg">JPG (smaller)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resolution multiplier: {settings.scale}×</Label>
              <Slider
                value={[settings.scale]}
                onValueChange={([v]) => setSettings({ scale: v })}
                min={1}
                max={4}
                step={0.5}
                className="mt-2"
              />
            </div>
            {settings.type === "image/jpeg" && (
              <div>
                <Label>JPG quality: {settings.quality}</Label>
                <Slider
                  value={[settings.quality]}
                  onValueChange={([v]) => setSettings({ quality: v })}
                  min={50}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
            <p className="font-mono text-xs text-muted-foreground sm:col-span-3">
              {selected.size} / {pages.length} page{pages.length === 1 ? "" : "s"} selected · est. ~
              {formatBytes(estimate)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set(gridPages.map((g) => g.id)))}
            >
              Select all
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
            <Button onClick={run} disabled={busy || selected.size === 0} className="ml-auto">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Convert {selected.size === 1 ? "& download" : "& download ZIP"}
            </Button>
          </div>

          <PdfPageGrid
            pages={gridPages}
            selected={selected}
            onToggleSelect={onToggleSelect}
            readOnly
          />
        </>
      )}
    </div>
  );
}
