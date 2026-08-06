import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDecodeErrorToast } from "@/hooks/use-decode-error-toast";
import { useSampleScroll } from "@/hooks/use-sample-scroll";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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
import { useImageBitmap } from "@/hooks/use-image-bitmap";
import { useToolSettings } from "@/hooks/use-tool-settings";
import {
  canEncode,
  drawToCanvas,
  encodeCanvas,
  FORMAT_EXT,
  type ImageMime,
  sampleImageFile,
} from "@/lib/image-encode";
import { ToolToaster } from "@/tools/_shared/toaster";

type FormatChoice = "keep" | ImageMime;
type AspectKey = "free" | "1:1" | "4:3" | "3:2" | "16:9" | "9:16" | "3:4" | "2:3";

interface Settings {
  aspect: AspectKey;
  format: FormatChoice;
  quality: number;
}

const ASPECT_VALUES: Record<AspectKey, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "3:4": 3 / 4,
  "2:3": 2 / 3,
};

const DEFAULTS: Settings = {
  aspect: "free",
  format: "keep",
  quality: 92,
};

function pickMime(source: string, choice: FormatChoice): ImageMime {
  if (choice !== "keep") return choice;
  if (source === "image/png") return "image/png";
  if (source === "image/webp") return "image/webp";
  if (source === "image/avif") return "image/avif";
  return "image/jpeg";
}

export default function CropImageTool() {
  const [settings, setSettings] = useToolSettings<Settings>("crop-image", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const { image, error: decodeError } = useImageBitmap(file);
  useDecodeErrorToast(decodeError);
  const dropRef = useRef<HTMLDivElement>(null);
  useSampleScroll(dropRef);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completed, setCompleted] = useState<PixelCrop | null>(null);
  const [output, setOutput] = useState<{ blob: Blob; mime: ImageMime } | null>(null);
  const [working, setWorking] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const outputUrl = useMemo(() => (output ? URL.createObjectURL(output.blob) : null), [output]);
  useEffect(
    () => () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    },
    [outputUrl],
  );

  // Initialize a centered crop when a new image arrives or aspect changes.
  useEffect(() => {
    if (!image) return;
    const a = ASPECT_VALUES[settings.aspect];
    if (a) {
      const c = centerCrop(
        makeAspectCrop({ unit: "%", width: 80 }, a, image.width, image.height),
        image.width,
        image.height,
      );
      setCrop(c);
    } else {
      setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
    }
    setCompleted(null);
    setOutput(null);
  }, [image, settings.aspect]);

  const handleCrop = async () => {
    if (!image || !completed || completed.width < 1 || completed.height < 1) return;
    setWorking(true);
    try {
      const sx = completed.x;
      const sy = completed.y;
      const sw = completed.width;
      const sh = completed.height;
      const mime = pickMime(file?.type ?? "image/png", settings.format);
      const bg = mime === "image/jpeg" ? "#ffffff" : undefined;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext("2d")!;
      if (bg) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image.bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      void drawToCanvas; // keep import in case of future reuse
      const blob = await encodeCanvas(canvas, mime, settings.quality / 100);
      setOutput({ blob, mime });
    } finally {
      setWorking(false);
    }
  };

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, "")}-cropped.${output ? FORMAT_EXT[output.mime] : "jpg"}`
    : "cropped.jpg";

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

      {previewUrl && image && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompleted(c)}
              aspect={ASPECT_VALUES[settings.aspect]}
              className="max-h-[480px] w-full"
            >
              <img src={previewUrl} className="max-h-[480px] w-auto mx-auto" />
            </ReactCrop>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Aspect ratio</Label>
              <Select
                value={settings.aspect}
                onValueChange={(v) => setSettings({ aspect: v as AspectKey })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ASPECT_VALUES).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <span className="font-mono text-xs text-muted-foreground">
                    {settings.quality}
                  </span>
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

          {completed && (
            <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-4">
              <ReadOnly label="X" value={Math.round(completed.x)} />
              <ReadOnly label="Y" value={Math.round(completed.y)} />
              <ReadOnly label="Width" value={Math.round(completed.width)} />
              <ReadOnly label="Height" value={Math.round(completed.height)} />
            </div>
          )}

          <Button onClick={handleCrop} disabled={!completed || working}>
            {working && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply crop
          </Button>
        </div>
      )}

      {output && (
        <OutputPanel title="Cropped image" blob={output.blob} filename={downloadName}>
          <div className="overflow-hidden rounded-lg border border-border">
            <img src={outputUrl ?? ""} className="mx-auto max-h-[420px]" />
          </div>
        </OutputPanel>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} readOnly className="font-mono" />
    </div>
  );
}
