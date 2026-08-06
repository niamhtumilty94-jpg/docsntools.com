import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useElementSize } from "@/hooks/use-element-size";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { hexToRgb } from "@/lib/pdf-export";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob } from "@/tools/_shared/utils";

interface Settings {
  text: string;
  opacity: number;
  size: number;
  angle: number;
  color: string;
  tile: boolean;
}

const DEFAULTS: Settings = {
  text: "DRAFT",
  opacity: 0.25,
  size: 80,
  angle: 35,
  color: "#e40707",
  tile: false,
};

export default function WatermarkPdf() {
  const [settings, setSettings] = useToolSettings<Settings>("watermark-pdf", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { pages } = usePdfDocument(file);
  const previewPage = pages[0];
  const { ref: previewRef, height: previewHeight } = useElementSize<HTMLDivElement>();

  const overlay = useMemo(() => {
    if (!previewPage || !previewHeight) return null;
    const ratio = previewHeight / previewPage.height;
    return {
      transform: `translate(-50%, -50%) rotate(${-settings.angle}deg)`,
      color: settings.color,
      opacity: settings.opacity,
      fontSize: `${settings.size * ratio}px`,
    } as React.CSSProperties;
  }, [previewPage, previewHeight, settings]);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await src.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(settings.color);
      for (const p of src.getPages()) {
        const { width, height } = p.getSize();
        const tw = font.widthOfTextAtSize(settings.text, settings.size);
        if (settings.tile) {
          const stepX = Math.max(tw * 1.6, 200);
          const stepY = Math.max(settings.size * 4, 200);
          for (let y = -stepY; y < height + stepY; y += stepY) {
            for (let x = -stepX; x < width + stepX; x += stepX) {
              p.drawText(settings.text, {
                x,
                y,
                size: settings.size,
                font,
                color: rgb(r, g, b),
                opacity: settings.opacity,
                rotate: degrees(settings.angle),
              });
            }
          }
        } else {
          p.drawText(settings.text, {
            x: width / 2 - tw / 2,
            y: height / 2 - settings.size / 2,
            size: settings.size,
            font,
            color: rgb(r, g, b),
            opacity: settings.opacity,
            rotate: degrees(settings.angle),
          });
        }
      }
      const bytes = await src.save();
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf",
      );
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

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <Label>Watermark text</Label>
          <Input
            value={settings.text}
            onChange={(e) => setSettings({ text: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Font size: {settings.size}</Label>
            <Slider
              value={[settings.size]}
              onValueChange={([v]) => setSettings({ size: v })}
              min={20}
              max={200}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Opacity: {settings.opacity.toFixed(2)}</Label>
            <Slider
              value={[settings.opacity * 100]}
              onValueChange={([v]) => setSettings({ opacity: v / 100 })}
              min={5}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Angle: {settings.angle}°</Label>
            <Slider
              value={[settings.angle]}
              onValueChange={([v]) => setSettings({ angle: v })}
              min={-90}
              max={90}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => setSettings({ color: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-border"
              />
              <Input
                value={settings.color}
                onChange={(e) => setSettings({ color: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Switch
              checked={settings.tile}
              onCheckedChange={(v) => setSettings({ tile: v })}
              id="tile"
            />
            <Label htmlFor="tile">Tile across page</Label>
          </div>
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
              className="relative overflow-hidden bg-white shadow"
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
              {overlay && (
                <span
                  className="absolute left-1/2 top-1/2 whitespace-nowrap font-bold"
                  style={overlay}
                >
                  {settings.text}
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

      <Button onClick={run} disabled={!file || busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Add watermark
      </Button>
    </div>
  );
}
