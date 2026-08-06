import { ArrowLeftRight, FileUp, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";

type Mode = "encode" | "decode";
interface Settings {
  urlSafe: boolean;
  lineWrap: boolean;
}
interface ShareState {
  mode: Mode;
  text: string;
}
const SAMPLE_TEXT = "Hello, DocnTools! 👋 Encoding works with full UTF-8.";

function bytesToBase64(bytes: Uint8Array, urlSafe: boolean): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  let b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  if (urlSafe) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

function base64ToBytes(s: string): Uint8Array {
  const cleaned = s.replace(/\s+/g, "");
  const b64 = cleaned.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((cleaned.length + 3) % 4);
  const bin =
    typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function wrap(s: string, n = 76): string {
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += n) parts.push(s.slice(i, i + n));
  return parts.join("\n");
}

function detectMime(bytes: Uint8Array): string | null {
  // Tiny magic-number sniff for previews
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes.length > 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  )
    return "image/gif";
  if (
    bytes.length > 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  if (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  )
    return "application/pdf";
  return null;
}

export default function Base64Tool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("base64", {
    urlSafe: false,
    lineWrap: false,
  });
  const share = useShareableState<ShareState>();
  const [tab, setTab] = useState<"text" | "file">("text");
  const [mode, setMode] = useState<Mode>("encode");
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);

  useEffect(() => {
    if (share.initial) {
      setMode(share.initial.mode);
      setText(share.initial.text);
    }
  }, [share.initial]);

  const textOutput = useMemo(() => {
    try {
      if (mode === "encode") {
        const enc = new TextEncoder().encode(text);
        const b64 = bytesToBase64(enc, settings.urlSafe);
        return settings.lineWrap ? wrap(b64) : b64;
      }
      const bytes = base64ToBytes(text);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [text, mode, settings]);

  const fileOutput = useMemo(() => {
    if (!file) return "";
    try {
      const b64 = bytesToBase64(file.bytes, settings.urlSafe);
      return settings.lineWrap ? wrap(b64) : b64;
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [file, settings]);

  const detectedDecode = useMemo(() => {
    if (mode !== "decode" || tab !== "text") return null;
    try {
      const bytes = base64ToBytes(text);
      const mime = detectMime(bytes);
      if (!mime) return null;
      const blob = new Blob([new Uint8Array(bytes)], { type: mime });
      return { mime, url: URL.createObjectURL(blob), blob, size: bytes.length };
    } catch {
      return null;
    }
  }, [text, mode, tab]);

  useEffect(() => {
    return () => {
      if (detectedDecode?.url) URL.revokeObjectURL(detectedDecode.url);
    };
  }, [detectedDecode?.url]);

  const handleFile = async (f: File) => {
    const bytes = new Uint8Array(await f.arrayBuffer());
    setFile({ name: f.name, bytes });
    setTab("file");
    toast.success(`Loaded ${f.name} (${formatBytes(bytes.length)})`);
  };

  const handleDrop = (files: File[]) => {
    if (files[0]) handleFile(files[0]);
    return true;
  };

  const swap = () => {
    if (mode === "encode") {
      setText(textOutput);
      setMode("decode");
    } else {
      setText(textOutput);
      setMode("encode");
    }
  };

  const downloadDecoded = () => {
    if (!detectedDecode) return;
    const ext = detectedDecode.mime.split("/")[1] || "bin";
    downloadBlob(detectedDecode.blob, `decoded.${ext}`);
  };

  const shareUrl = share.getShareUrl({ mode, text });
  const dataUri = file
    ? `data:${detectMime(file.bytes) ?? "application/octet-stream"};base64,${bytesToBase64(
        file.bytes,
        false,
      )}`
    : null;

  if (!mounted) return null;

  return (
    <FullPageDropZone onFiles={handleDrop} accept="any file">
      <div className="space-y-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "text" | "file")}>
          <TabsList>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="file">File</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </h3>
              <div className="flex items-center gap-1.5">
                {tab === "text" && (
                  <>
                    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                      <TabsList className="h-7">
                        <TabsTrigger value="encode" className="text-[11px]">
                          Encode
                        </TabsTrigger>
                        <TabsTrigger value="decode" className="text-[11px]">
                          Decode
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button size="sm" variant="ghost" onClick={swap} aria-label="Swap input/output">
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                    <SampleDataButton onLoad={() => setText(SAMPLE_TEXT)} />
                  </>
                )}
              </div>
            </header>
            {tab === "text" ? (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                spellCheck={false}
                className="resize-y break-all font-mono text-xs"
              />
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("b64-file")?.click()}
                >
                  <FileUp className="h-4 w-4" /> Choose file
                </Button>
                <input
                  id="b64-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Or drop any file anywhere on the page.
                </p>
                {file && (
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                    <span className="truncate font-mono">{file.name}</span>
                    <span className="text-muted-foreground">{formatBytes(file.bytes.length)}</span>
                    <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2 border-t border-border pt-3 text-xs">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.urlSafe}
                  onChange={(e) => setSettings({ urlSafe: e.target.checked })}
                />
                URL-safe variant (-_, no padding)
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.lineWrap}
                  onChange={(e) => setSettings({ lineWrap: e.target.checked })}
                />
                Wrap lines at 76 chars (MIME)
              </Label>
            </div>
          </section>

          <OutputPanel
            title="Output"
            text={tab === "text" ? textOutput : fileOutput}
            filename={tab === "text" ? "output.txt" : "output.b64"}
            shareUrl={tab === "text" ? shareUrl : undefined}
          >
            <pre className="max-h-[300px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {tab === "text" ? textOutput : fileOutput || "-"}
            </pre>
            {detectedDecode && (
              <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Detected: {detectedDecode.mime} ·{" "}
                    {formatBytes(detectedDecode.size)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={downloadDecoded}>
                    Download as file
                  </Button>
                </div>
                {detectedDecode.mime.startsWith("image/") && (
                  <img
                    src={detectedDecode.url}
                    alt="Decoded preview"
                    className="max-h-48 rounded border border-border"
                  />
                )}
              </div>
            )}
            {dataUri && tab === "file" && (
              <details className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-xs">
                <summary className="cursor-pointer">Show data URI</summary>
                <pre className="mt-2 max-h-32 overflow-auto break-all font-mono">{dataUri}</pre>
              </details>
            )}
          </OutputPanel>
        </div>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
