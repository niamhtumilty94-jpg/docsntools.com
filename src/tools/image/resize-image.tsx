import { Link2, Loader2, Unlink2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDecodeErrorToast } from "@/hooks/use-decode-error-toast";
import { useSampleScroll } from "@/hooks/use-sample-scroll";

import { BeforeAfterPreview } from "@/components/tool/before-after-preview";
import { ImageDropArea } from "@/components/tool/image-drop-area";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageBitmap } from "@/hooks/use-image-bitmap";
import { useToolSettings } from "@/hooks/use-tool-settings";
import {
  canEncode,
  drawToCanvas,
  encodeCanvas,
  FORMAT_EXT,
  FORMAT_LABEL,
  type ImageMime,
  sampleImageFile,
} from "@/lib/image-encode";
import { ToolToaster } from "@/tools/_shared/toaster";

type FormatChoice = "keep" | ImageMime;
type Mode = "pixels" | "percent";

interface Settings {
  mode: Mode;
  width: number;
  height: number;
  percent: number;
  lockAspect: boolean;
  format: FormatChoice;
  quality: number;
}

const DEFAULTS: Settings = {
  mode: "pixels",
  width: 1280,
  height: 720,
  percent: 50,
  lockAspect: true,
  format: "keep",
  quality: 90,
};

const PRESETS_PERCENT = [25, 50, 75];
const PRESETS_WIDTH = [400, 800, 1280, 1920];

function pickMime(source: string, choice: FormatChoice): ImageMime {
  if (choice !== "keep") return choice;
  if (source === "image/png") return "image/png";
  if (source === "image/webp") return "image/webp";
  if (source === "image/avif") return "image/avif";
  return "image/jpeg";
}

export default function ResizeImageTool() {
  const [settings, setSettings] = useToolSettings<Settings>("resize-image", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<{
    blob: Blob;
    width: number;
    height: number;
    mime: ImageMime;
  } | null>(null);
  const [working, setWorking] = useState(false);
  const { image, error: decodeError } = useImageBitmap(file);
  useDecodeErrorToast(decodeError);
  const dropRef = useRef<HTMLDivElement>(null);
  useSampleScroll(dropRef);

  // When a new image is loaded, seed dimensions
  useEffect(() => {
    if (image) setSettings({ width: image.width, height: image.height });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image?.width, image?.height]);

  const computed = useMemo(() => {
    if (!image) return { width: settings.width, height: settings.height };
    if (settings.mode === "percent") {
      const s = settings.percent / 100;
      return {
        width: Math.max(1, Math.round(image.width * s)),
        height: Math.max(1, Math.round(image.height * s)),
      };
    }
    return { width: Math.max(1, settings.width), height: Math.max(1, settings.height) };
  }, [image, settings]);

  const beforeUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const afterUrl = useMemo(() => (output ? URL.createObjectURL(output.blob) : null), [output]);
  useEffect(
    () => () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    },
    [beforeUrl],
  );
  useEffect(
    () => () => {
      if (afterUrl) URL.revokeObjectURL(afterUrl);
    },
    [afterUrl],
  );

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!file || !image) {
      setOutput(null);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setWorking(true);
      try {
        const mime = pickMime(file.type, settings.format);
        const bg = mime === "image/jpeg" ? "#ffffff" : undefined;
        const canvas = drawToCanvas(image.bitmap, computed.width, computed.height, bg);
        const blob = await encodeCanvas(canvas, mime, settings.quality / 100);
        setOutput({ blob, width: computed.width, height: computed.height, mime });
      } finally {
        setWorking(false);
      }
    }, 150);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [file, image, computed.width, computed.height, settings.format, settings.quality]);

  const onChangeWidth = (v: number) => {
    if (!image || !settings.lockAspect) {
      setSettings({ width: v });
      return;
    }
    const ratio = image.height / image.width;
    setSettings({ width: v, height: Math.max(1, Math.round(v * ratio)) });
  };
  const onChangeHeight = (v: number) => {
    if (!image || !settings.lockAspect) {
      setSettings({ height: v });
      return;
    }
    const ratio = image.width / image.height;
    setSettings({ height: v, width: Math.max(1, Math.round(v * ratio)) });
  };

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, "")}-${computed.width}x${computed.height}.${output ? FORMAT_EXT[output.mime] : "jpg"}`
    : "resized.jpg";

  const lossy =
    settings.format !== "image/png" && (settings.format !== "keep" || file?.type !== "image/png");

  return (
    <div className="space-y-5">
      <ToolToaster />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Image input
        </h2>
        <SampleDataButton onLoad={async () => setFile(await sampleImageFile())} />
      </div>

      <div ref={dropRef}>
        <ImageDropArea
          file={file}
          onFile={setFile}
          width={image?.width}
          height={image?.height}
          disabled={working}
        />
      </div>

      <Tabs value={settings.mode} onValueChange={(v) => setSettings({ mode: v as Mode })}>
        <TabsList>
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
          <TabsTrigger value="percent">Percent</TabsTrigger>
        </TabsList>
      </Tabs>

      {settings.mode === "pixels" ? (
        <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_auto_1fr_auto]">
          <div className="space-y-1.5">
            <Label>Width (px)</Label>
            <Input
              type="number"
              min={1}
              value={settings.width}
              onChange={(e) => onChangeWidth(Number(e.target.value) || 1)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="self-end"
            onClick={() => setSettings({ lockAspect: !settings.lockAspect })}
            aria-pressed={settings.lockAspect}
            aria-label={settings.lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {settings.lockAspect ? <Link2 className="h-4 w-4" /> : <Unlink2 className="h-4 w-4" />}
          </Button>
          <div className="space-y-1.5">
            <Label>Height (px)</Label>
            <Input
              type="number"
              min={1}
              value={settings.height}
              onChange={(e) => onChangeHeight(Number(e.target.value) || 1)}
            />
          </div>
          <div className="flex flex-wrap items-end gap-1.5">
            {PRESETS_WIDTH.map((w) => (
              <Button
                key={w}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChangeWidth(w)}
              >
                {w}w
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <Label>Scale</Label>
            <span className="font-mono text-xs text-muted-foreground">{settings.percent}%</span>
          </div>
          <Slider
            min={5}
            max={200}
            step={1}
            value={[settings.percent]}
            onValueChange={([v]) => setSettings({ percent: v })}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS_PERCENT.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSettings({ percent: p })}
              >
                {p}%
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Output format</Label>
          <Select
            value={settings.format}
            onValueChange={(v) => setSettings({ format: v as FormatChoice })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keep">Keep original</SelectItem>
              <SelectItem value="image/jpeg">JPEG</SelectItem>
              <SelectItem value="image/webp">WebP</SelectItem>
              {canEncode("image/avif") && <SelectItem value="image/avif">AVIF</SelectItem>}
              <SelectItem value="image/png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {lossy && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Quality</Label>
              <span className="font-mono text-xs text-muted-foreground">{settings.quality}</span>
            </div>
            <Slider
              min={10}
              max={100}
              step={1}
              value={[settings.quality]}
              onValueChange={([v]) => setSettings({ quality: v })}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Browsers resample with high-quality bicubic interpolation. Output target:{" "}
        <span className="font-mono">
          {computed.width}×{computed.height}
        </span>
      </p>

      <OutputPanel title="Result" blob={output?.blob} filename={downloadName}>
        {!file ? (
          <p className="text-sm text-muted-foreground">Drop an image to begin.</p>
        ) : working && !output ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Resizing…
          </div>
        ) : (
          <BeforeAfterPreview
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            beforeBytes={file?.size}
            afterBytes={output?.blob.size}
            beforeLabel={`Original · ${image?.width ?? "?"}×${image?.height ?? "?"}`}
            afterLabel={
              output ? `${FORMAT_LABEL[output.mime]} · ${output.width}×${output.height}` : "Result"
            }
          />
        )}
      </OutputPanel>
    </div>
  );
}
