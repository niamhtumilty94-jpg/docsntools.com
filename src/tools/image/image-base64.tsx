import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ImageDropArea } from "@/components/tool/image-drop-area";
import { OutputPanel } from "@/components/tool/output-panel";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, fileToDataURL, formatBytes } from "@/tools/_shared/utils";

type Direction = "encode" | "decode";
type OutputFormat = "data-uri" | "raw" | "css" | "html";

interface Settings {
  direction: Direction;
  outputFormat: OutputFormat;
  decodeMime: string;
}

const DEFAULTS: Settings = {
  direction: "encode",
  outputFormat: "data-uri",
  decodeMime: "image/png",
};

const FORMAT_LABEL: Record<OutputFormat, string> = {
  "data-uri": "Data URI",
  raw: "Raw Base64",
  css: "CSS url(...)",
  html: "<img> tag",
};

function formatOutput(dataUri: string, format: OutputFormat): string {
  const raw = dataUri.split(",")[1] ?? "";
  switch (format) {
    case "data-uri":
      return dataUri;
    case "raw":
      return raw;
    case "css":
      return `background-image: url("${dataUri}");`;
    case "html":
      return `<img src="${dataUri}" alt="" />`;
  }
}

function detectMime(input: string): string | null {
  const m = /^data:([^;,]+)[;,]/i.exec(input.trim());
  return m ? m[1] : null;
}

function extractBase64(input: string): string {
  const t = input.trim();
  if (t.startsWith("data:")) return t.split(",")[1] ?? "";
  // strip whitespace and any surrounding quotes
  return t.replace(/[\s"']/g, "");
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function ImageBase64Tool() {
  const [settings, setSettings] = useToolSettings<Settings>("image-base64", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [encoded, setEncoded] = useState<string>("");
  const [encoding, setEncoding] = useState(false);

  const [decodeInput, setDecodeInput] = useState("");
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Encode flow
  useEffect(() => {
    if (settings.direction !== "encode" || !file) {
      setEncoded("");
      return;
    }
    let cancel = false;
    setEncoding(true);
    fileToDataURL(file)
      .then((url) => {
        if (!cancel) setEncoded(url);
      })
      .finally(() => {
        if (!cancel) setEncoding(false);
      });
    return () => {
      cancel = true;
    };
  }, [file, settings.direction]);

  const encodedOutput = useMemo(
    () => (encoded ? formatOutput(encoded, settings.outputFormat) : ""),
    [encoded, settings.outputFormat],
  );

  // Decode flow: build blob+url in an effect so we never call setState during
  // render (React 19 warns) and we revoke the *previous* URL when replacing.
  const [decoded, setDecoded] = useState<{ blob: Blob; url: string; mime: string } | null>(null);

  useEffect(() => {
    if (settings.direction !== "decode" || !decodeInput.trim()) {
      setDecoded((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setDecodeError(null);
      return;
    }
    let cancelled = false;
    let createdUrl: string | null = null;
    try {
      const detected = detectMime(decodeInput);
      const mime = detected ?? (settings.decodeMime || "application/octet-stream");
      const b64 = extractBase64(decodeInput);
      if (!b64) {
        setDecoded((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return null;
        });
        return;
      }
      const blob = base64ToBlob(b64, mime);
      const url = URL.createObjectURL(blob);
      createdUrl = url;
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      setDecoded((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url, mime };
      });
      setDecodeError(null);
    } catch (e) {
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setDecoded((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setDecodeError(e instanceof Error ? e.message : "Invalid Base64");
    }
    return () => {
      cancelled = true;
    };
  }, [decodeInput, settings.decodeMime, settings.direction]);

  const decodedExt = decoded ? (decoded.mime.split("/")[1] ?? "bin") : "bin";

  return (
    <div className="space-y-5">
      <ToolToaster />

      <Tabs
        value={settings.direction}
        onValueChange={(v) => setSettings({ direction: v as Direction })}
      >
        <TabsList>
          <TabsTrigger value="encode">Encode (image → Base64)</TabsTrigger>
          <TabsTrigger value="decode">Decode (Base64 → image)</TabsTrigger>
        </TabsList>
      </Tabs>

      {settings.direction === "encode" ? (
        <>
          <ImageDropArea file={file} onFile={setFile} disabled={encoding} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Output format</Label>
              <Select
                value={settings.outputFormat}
                onValueChange={(v) => setSettings({ outputFormat: v as OutputFormat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FORMAT_LABEL) as OutputFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMAT_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stats</Label>
              <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs">
                {file
                  ? `${file.name} · ${formatBytes(file.size)} · → ${formatBytes(encodedOutput.length)} text`
                  : "Drop an image to encode"}
              </p>
            </div>
          </div>

          <OutputPanel
            title="Encoded output"
            text={encodedOutput}
            filename={file ? `${file.name.replace(/\.[^.]+$/, "")}.base64.txt` : "encoded.txt"}
          >
            {encoding ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Encoding…
              </div>
            ) : encodedOutput ? (
              <Textarea readOnly value={encodedOutput} rows={10} className="font-mono text-xs" />
            ) : (
              <p className="text-sm text-muted-foreground">No output yet.</p>
            )}
          </OutputPanel>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label>Paste Base64 or data: URI</Label>
            <Textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              rows={8}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANS..."
              className="font-mono text-xs"
            />
            {decodeError && <p className="text-xs text-destructive">{decodeError}</p>}
          </div>

          {!detectMime(decodeInput) && decodeInput.trim() && (
            <div className="space-y-1.5">
              <Label>MIME type (no data: prefix detected)</Label>
              <Input
                value={settings.decodeMime}
                onChange={(e) => setSettings({ decodeMime: e.target.value })}
                placeholder="image/png"
                className="font-mono"
              />
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </h3>
              {decoded && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadBlob(decoded.blob, `decoded.${decodedExt}`)}
                >
                  Download .{decodedExt}
                </Button>
              )}
            </header>
            {decoded ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={decoded.url}
                  alt="Decoded"
                  className="max-h-[420px] w-auto max-w-full rounded border border-border bg-[conic-gradient(from_45deg,#e2e2e2_0_25%,transparent_0_50%,#e2e2e2_0_75%,transparent_0)] [background-size:16px_16px]"
                />
                <p className="font-mono text-xs text-muted-foreground">
                  {decoded.mime} · {formatBytes(decoded.blob.size)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Paste a Base64 string above to preview the decoded image.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
