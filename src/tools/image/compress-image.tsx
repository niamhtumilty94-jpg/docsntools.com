import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { zipSync } from "fflate";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
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
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";

type FormatChoice = "keep" | ImageMime;

interface Settings {
  quality: number;
  format: FormatChoice;
  maxDim: number;
  bulk: boolean;
}

const DEFAULTS: Settings = {
  quality: 75,
  format: "keep",
  maxDim: 0,
  bulk: false,
};

function pickMime(source: string, choice: FormatChoice): ImageMime {
  if (choice !== "keep") return choice;
  if (source === "image/png") return "image/png";
  if (source === "image/webp") return "image/webp";
  if (source === "image/avif") return "image/avif";
  return "image/jpeg";
}

async function compressFile(
  file: File,
  settings: Settings,
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  mime: ImageMime;
  fellBack: boolean;
} | null> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let { width, height } = bitmap;
    if (settings.maxDim > 0) {
      const longest = Math.max(width, height);
      if (longest > settings.maxDim) {
        const scale = settings.maxDim / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
    }
    const requested = pickMime(file.type, settings.format);
    // Try the requested format first, then fall back through formats most
    // browsers can definitely encode. Some mobile browsers (notably older
    // iOS Safari) return null/throw for AVIF/WebP - JPEG/PNG always work.
    const tryOrder: ImageMime[] = [requested, "image/jpeg", "image/png"];
    let lastError: unknown = null;
    for (const mime of tryOrder) {
      try {
        const bg = mime === "image/jpeg" ? "#ffffff" : undefined;
        const canvas = drawToCanvas(bitmap, width, height, bg);
        const blob = await encodeCanvas(canvas, mime, settings.quality / 100);
        if (blob && blob.size > 0) {
          return { blob, width, height, mime, fellBack: mime !== requested };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Encoding failed");
  } finally {
    bitmap.close();
  }
}

export default function CompressImageTool() {
  const [settings, setSettings] = useToolSettings<Settings>("compress-image", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<{
    blob: Blob;
    width: number;
    height: number;
    mime: ImageMime;
    fellBack: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);
  const { image, error: decodeError } = useImageBitmap(file);
  useDecodeErrorToast(decodeError);
  const dropRef = useRef<HTMLDivElement>(null);
  useSampleScroll(dropRef);

  // URL lifecycle: create on file/output change, revoke the *previous* URL
  // only after the new one is wired up so the <img> never points at a
  // revoked blob (Firefox/Safari otherwise flash a broken image).
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setBeforeUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const next = URL.createObjectURL(file);
    setBeforeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [file]);

  useEffect(() => {
    if (!output) {
      setAfterUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const next = URL.createObjectURL(output.blob);
    setAfterUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [output]);

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!file || settings.bulk) {
      setOutput(null);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setWorking(true);
      try {
        const result = await compressFile(file, settings);
        setOutput(result);
        if (result?.fellBack) {
          toast.warning(
            `Your browser couldn't encode ${FORMAT_LABEL[pickMime(file.type, settings.format)]}. Falling back to ${FORMAT_LABEL[result.mime]}.`,
          );
        }
      } catch (err) {
        console.warn("Image compression failed", err);
        setOutput(null);
        toast.error("Couldn't compress this image in your browser.");
      } finally {
        setWorking(false);
      }
    }, 150);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [file, settings]);

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, "")}.${output ? FORMAT_EXT[output.mime] : "jpg"}`
    : "compressed.jpg";

  const handleBulk = async () => {
    if (!bulkFiles.length) return;
    setWorking(true);
    try {
      const entries: Record<string, Uint8Array> = {};
      for (const f of bulkFiles) {
        const result = await compressFile(f, settings);
        if (!result) continue;
        const name = `${f.name.replace(/\.[^.]+$/, "")}.${FORMAT_EXT[result.mime]}`;
        entries[name] = new Uint8Array(await result.blob.arrayBuffer());
      }
      const zipped = zipSync(entries, { level: 6 });
      const buf = new Uint8Array(zipped).buffer;
      downloadBlob(new Blob([buf], { type: "application/zip" }), "compressed-images.zip");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-5">
      <ToolToaster />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Image input
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={settings.bulk} onCheckedChange={(v) => setSettings({ bulk: v })} />
            <span>Bulk mode</span>
          </label>
          <SampleDataButton
            onLoad={async () => {
              // Switch to a lossy format + lower quality so the sample
              // visibly demonstrates compression instead of returning the
              // same bytes as the input PNG.
              setSettings({ format: "image/webp", quality: 60 });
              setFile(await sampleImageFile());
            }}
          />
        </div>
      </div>

      {settings.bulk ? (
        <BulkPicker files={bulkFiles} setFiles={setBulkFiles} disabled={working} />
      ) : (
        <div ref={dropRef}>
          <ImageDropArea
            file={file}
            onFile={setFile}
            width={image?.width}
            height={image?.height}
            disabled={working}
          />
        </div>
      )}

      <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <div className="flex items-center justify-between">
            <Label>Quality</Label>
            <span className="font-mono text-xs text-muted-foreground">{settings.quality}</span>
          </div>
          <Slider
            value={[settings.quality]}
            min={10}
            max={100}
            step={1}
            onValueChange={([v]) => setSettings({ quality: v })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Format</Label>
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
              <SelectItem value="image/png">PNG (lossless)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Max longest side (px)</Label>
          <Input
            type="number"
            min={0}
            value={settings.maxDim || ""}
            onChange={(e) => setSettings({ maxDim: Number(e.target.value) || 0 })}
            placeholder="No cap"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tip</Label>
          <p className="text-xs text-muted-foreground">WebP at 75 typically beats JPEG by ~25%.</p>
        </div>
      </div>

      {settings.bulk ? (
        <Button onClick={handleBulk} disabled={!bulkFiles.length || working}>
          {working && <Loader2 className="h-4 w-4 animate-spin" />}
          Compress {bulkFiles.length || ""} & download ZIP
        </Button>
      ) : (
        <OutputPanel title="Result" blob={output?.blob} filename={downloadName}>
          {file && working && !output ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Encoding…
            </div>
          ) : !file ? (
            <p className="text-sm text-muted-foreground">Drop an image to begin.</p>
          ) : (
            <BeforeAfterPreview
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
              beforeBytes={file?.size}
              afterBytes={output?.blob.size}
              beforeLabel={`Original · ${image?.width ?? "?"}×${image?.height ?? "?"}`}
              afterLabel={
                output
                  ? `${FORMAT_LABEL[output.mime]} · ${output.width}×${output.height}`
                  : "Result"
              }
              mode="slider"
            />
          )}
        </OutputPanel>
      )}
    </div>
  );
}

function BulkPicker({
  files,
  setFiles,
  disabled,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center cursor-pointer hover:border-primary/60"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const arr = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          setFiles([...files, ...arr]);
        }}
      >
        <p className="text-sm font-semibold">
          {files.length
            ? `${files.length} image${files.length === 1 ? "" : "s"} queued`
            : "Drop multiple images or click to pick"}
        </p>
        <p className="text-xs text-muted-foreground">
          All files processed locally and packaged into one ZIP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const arr = Array.from(e.target.files ?? []);
            if (arr.length) setFiles([...files, ...arr]);
            e.target.value = "";
          }}
        />
      </div>
      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBytes(files.reduce((a, f) => a + f.size, 0))} total</span>
          <Button size="sm" variant="ghost" onClick={() => setFiles([])} disabled={disabled}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
