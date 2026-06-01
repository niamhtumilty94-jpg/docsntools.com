import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDecodeErrorToast } from "@/hooks/use-decode-error-toast";
import { useSampleScroll } from "@/hooks/use-sample-scroll";

import { BeforeAfterPreview } from "@/components/tool/before-after-preview";
import { ImageDropArea } from "@/components/tool/image-drop-area";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
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
  FORMAT_LABEL,
  type ImageMime,
  sampleImageFile,
} from "@/lib/image-encode";
import { ToolToaster } from "@/tools/_shared/toaster";

interface Settings {
  target: ImageMime;
  quality: number;
  background: string;
}

const DEFAULTS: Settings = {
  target: "image/webp",
  quality: 90,
  background: "#ffffff",
};

const ALL: ImageMime[] = ["image/png", "image/jpeg", "image/webp", "image/avif"];

export default function ConvertImageTool() {
  const [settings, setSettings] = useToolSettings<Settings>("convert-image", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const { image, error: decodeError } = useImageBitmap(file);
  useDecodeErrorToast(decodeError);
  const dropRef = useRef<HTMLDivElement>(null);
  useSampleScroll(dropRef);
  const [output, setOutput] = useState<{ blob: Blob; mime: ImageMime } | null>(null);
  const [working, setWorking] = useState(false);

  const supportedTargets = useMemo(() => ALL.filter((m) => canEncode(m)), []);

  // If saved target is unsupported, fall back to webp/jpeg.
  useEffect(() => {
    if (!supportedTargets.includes(settings.target)) {
      setSettings({ target: supportedTargets.includes("image/webp") ? "image/webp" : "image/jpeg" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedTargets.join(",")]);

  const beforeUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const afterUrl = useMemo(() => (output ? URL.createObjectURL(output.blob) : null), [output]);
  useEffect(() => () => { if (beforeUrl) URL.revokeObjectURL(beforeUrl); }, [beforeUrl]);
  useEffect(() => () => { if (afterUrl) URL.revokeObjectURL(afterUrl); }, [afterUrl]);

  const lossy = settings.target !== "image/png";
  const needsBg = settings.target === "image/jpeg";

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
        const bg = needsBg ? settings.background : undefined;
        const canvas = drawToCanvas(image.bitmap, image.width, image.height, bg);
        const blob = await encodeCanvas(canvas, settings.target, settings.quality / 100);
        setOutput({ blob, mime: settings.target });
      } finally {
        setWorking(false);
      }
    }, 150);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [file, image, settings.target, settings.quality, settings.background, needsBg]);

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, "")}.${FORMAT_EXT[settings.target]}`
    : `converted.${FORMAT_EXT[settings.target]}`;

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
        <ImageDropArea file={file} onFile={setFile} width={image?.width} height={image?.height} disabled={working} />
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Input
            value={file ? FORMAT_LABEL[(file.type as ImageMime)] ?? file.type : "-"}
            readOnly
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Target format</Label>
          <Select value={settings.target} onValueChange={(v) => setSettings({ target: v as ImageMime })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {supportedTargets.map((m) => (
                <SelectItem key={m} value={m}>{FORMAT_LABEL[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {needsBg && (
          <div className="space-y-1.5">
            <Label>Transparent → background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.background}
                onChange={(e) => setSettings({ background: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
              />
              <Input
                value={settings.background}
                onChange={(e) => setSettings({ background: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
        )}
        {lossy && (
          <div className="space-y-1.5 sm:col-span-3">
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

      {!supportedTargets.includes("image/avif") && (
        <p className="text-xs text-muted-foreground">
          AVIF encoding isn’t available in this browser - try Chrome or Edge for AVIF output.
        </p>
      )}

      <OutputPanel title="Converted image" blob={output?.blob} filename={downloadName}>
        {!file ? (
          <p className="text-sm text-muted-foreground">Drop an image to begin.</p>
        ) : working && !output ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Converting…
          </div>
        ) : (
          <BeforeAfterPreview
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            beforeBytes={file?.size}
            afterBytes={output?.blob.size}
            beforeLabel={`${FORMAT_LABEL[(file?.type as ImageMime)] ?? "Source"} · ${image?.width ?? "?"}×${image?.height ?? "?"}`}
            afterLabel={output ? `${FORMAT_LABEL[output.mime]}` : "Result"}
          />
        )}
      </OutputPanel>
    </div>
  );
}
