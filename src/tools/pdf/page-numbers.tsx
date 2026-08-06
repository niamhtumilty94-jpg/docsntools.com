import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useElementSize } from "@/hooks/use-element-size";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { anchorPosition, type Anchor } from "@/lib/pdf-export";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob } from "@/tools/_shared/utils";

type Family = "Helvetica" | "Times" | "Courier";

interface Settings {
  position: Anchor;
  size: number;
  start: number;
  margin: number;
  format: string;
  family: Family;
}

const DEFAULTS: Settings = {
  position: "bottom-center",
  size: 11,
  start: 1,
  margin: 24,
  format: "{n}",
  family: "Helvetica",
};

const ANCHORS: Anchor[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function renderText(format: string, n: number, total: number) {
  return format.replaceAll("{n}", String(n)).replaceAll("{total}", String(total));
}

export default function PageNumbers() {
  const [settings, setSettings] = useToolSettings<Settings>("page-numbers", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { pages } = usePdfDocument(file);
  const { ref: previewRef, height: previewHeight } = useElementSize<HTMLDivElement>();

  const previewPage = pages[0];
  const previewText = useMemo(
    () => renderText(settings.format, settings.start, pages.length || 1),
    [settings.format, settings.start, pages.length],
  );

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const fontMap: Record<Family, string> = {
        Helvetica: StandardFonts.Helvetica,
        Times: StandardFonts.TimesRoman,
        Courier: StandardFonts.Courier,
      };
      const font = await src.embedFont(fontMap[settings.family]);
      const total = src.getPageCount();
      src.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = renderText(settings.format, i + settings.start, total);
        const tw = font.widthOfTextAtSize(text, settings.size);
        const { x, y } = anchorPosition(
          width,
          height,
          tw,
          settings.size,
          settings.position,
          settings.margin,
        );
        page.drawText(text, {
          x,
          y,
          size: settings.size,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      });
      const bytes = await src.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      setResult({
        blob,
        name: file.name.replace(/\.pdf$/i, "") + "-numbered.pdf",
      });
    } finally {
      setBusy(false);
    }
  };

  // Compute preview overlay coords. Scale matches the rendered preview height exactly.
  const overlayStyle = useMemo(() => {
    if (!previewPage || !previewHeight) return null;
    const { width, height } = previewPage;
    const ratio = previewHeight / height;
    // Approx text width: 0.55 * size * chars (in pt) - only used for anchor offsetting
    const tw = settings.size * 0.55 * previewText.length;
    const { x, y } = anchorPosition(
      width,
      height,
      tw,
      settings.size,
      settings.position,
      settings.margin,
    );
    return {
      left: `${(x / width) * 100}%`,
      bottom: `${(y / height) * 100}%`,
      fontSize: `${settings.size * ratio}px`,
      fontFamily:
        settings.family === "Times"
          ? "serif"
          : settings.family === "Courier"
            ? "monospace"
            : "sans-serif",
    } as React.CSSProperties;
  }, [previewPage, previewHeight, previewText, settings]);

  return (
    <div className="space-y-4">
      <ToolToaster />
      <div className="flex justify-end">
        <SampleDataButton onLoad={async () => setFile(await samplePdfFile())} />
      </div>
      <PdfDropArea file={file} onFile={setFile} pageCount={pages.length || undefined} />

      <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
        <div>
          <Label>Position</Label>
          <Select
            value={settings.position}
            onValueChange={(v) => setSettings({ position: v as Anchor })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANCHORS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace("-", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Format</Label>
          <Input
            value={settings.format}
            onChange={(e) => setSettings({ format: e.target.value })}
            className="mt-1 font-mono"
            placeholder="{n} / {total}"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            <code>{"{n}"}</code> = current page · <code>{"{total}"}</code> = total. Try{" "}
            <code>
              Page {"{n}"} of {"{total}"}
            </code>
            .
          </p>
        </div>
        <div>
          <Label>Font family</Label>
          <Select
            value={settings.family}
            onValueChange={(v) => setSettings({ family: v as Family })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times">Times Roman</SelectItem>
              <SelectItem value="Courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Font size</Label>
          <NumberInput
            min={6}
            max={72}
            emptyValue={11}
            value={settings.size}
            onChange={(v) => setSettings({ size: v })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Starting number</Label>
          <NumberInput
            min={0}
            emptyValue={1}
            value={settings.start}
            onChange={(v) => setSettings({ start: v })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Margin (pt)</Label>
          <NumberInput
            min={0}
            max={200}
            value={settings.margin}
            onChange={(v) => setSettings({ margin: v })}
            className="mt-1"
          />
        </div>
      </div>

      {previewPage && previewPage.width > 0 && previewPage.height > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Live preview · page 1
          </p>
          <div className="mx-auto flex max-w-xs items-center justify-center">
            <div
              ref={previewRef}
              className="relative bg-white shadow"
              style={{
                aspectRatio: `${previewPage.width} / ${previewPage.height}`,
                width: 240,
              }}
            >
              {previewPage.thumb && (
                <img
                  src={previewPage.thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
              {overlayStyle && (
                <span
                  className="absolute whitespace-nowrap font-semibold leading-none text-neutral-800"
                  style={overlayStyle}
                >
                  {previewText}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : file ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mx-auto h-72 w-60 animate-pulse rounded bg-muted" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={!file || busy} variant={result ? "outline" : "default"}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {result ? "Regenerate" : "Add page numbers"}
        </Button>
        {result && (
          <Button onClick={() => downloadBlob(result.blob, result.name)}>Download PDF</Button>
        )}
      </div>
    </div>
  );
}
