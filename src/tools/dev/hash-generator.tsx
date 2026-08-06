// js-md5 is a callable module with `.create()` for streaming. Its types
// don't expose the default-export shape cleanly under noImplicitAny, so we
// reach for a small typed adapter at the import boundary.
import md5Default from "js-md5";
const md5 = md5Default as unknown as ((m: string | ArrayBuffer | Uint8Array) => string) & {
  create: () => {
    update: (m: ArrayBuffer | Uint8Array | string) => void;
    hex: () => string;
  };
};
import { FileUp, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard, formatBytes } from "@/tools/_shared/utils";

type SubtleAlg = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type Algo = "MD5" | SubtleAlg;
const ALGOS: Algo[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

interface Settings {
  uppercase: boolean;
  hmac: boolean;
}
interface ShareState {
  text: string;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

async function hashText(text: string, alg: Algo): Promise<string> {
  if (alg === "MD5") return md5(text);
  const buf = new TextEncoder().encode(text);
  const out = await crypto.subtle.digest(alg, buf);
  return bytesToHex(new Uint8Array(out));
}

async function hmacText(text: string, key: string, alg: SubtleAlg): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: alg },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(text));
  return bytesToHex(new Uint8Array(sig));
}

async function hashFileStreamed(
  file: File,
  alg: Algo,
  onProgress: (n: number) => void,
): Promise<string> {
  if (alg === "MD5") {
    const m = md5.create();
    const chunkSize = 4 * 1024 * 1024;
    let offset = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      const buf = await slice.arrayBuffer();
      m.update(buf);
      offset += buf.byteLength;
      onProgress(offset / file.size);
    }
    return m.hex();
  }
  // SubtleCrypto has no streaming digest API in browsers; for files, read whole
  // (most users hash <500MB). For huge files we'd need a WASM streaming impl.
  const buf = await file.arrayBuffer();
  onProgress(0.5);
  const out = await crypto.subtle.digest(alg, buf);
  onProgress(1);
  return bytesToHex(new Uint8Array(out));
}

export default function HashGeneratorTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("hash-generator", {
    uppercase: false,
    hmac: false,
  });
  const share = useShareableState<ShareState>();
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [hmacKey, setHmacKey] = useState("");
  const [results, setResults] = useState<Record<Algo, string>>({} as Record<Algo, string>);
  const [file, setFile] = useState<File | null>(null);
  const [fileResults, setFileResults] = useState<Record<Algo, string>>({} as Record<Algo, string>);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);

  useEffect(() => {
    if (share.initial?.text) setText(share.initial.text);
  }, [share.initial]);

  // Compute text hashes whenever input changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = {} as Record<Algo, string>;
      for (const alg of ALGOS) {
        try {
          if (settings.hmac && alg !== "MD5") {
            out[alg] = await hmacText(text, hmacKey, alg);
          } else {
            out[alg] = await hashText(text, alg);
          }
        } catch {
          out[alg] = "";
        }
      }
      if (!cancelled) setResults(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [text, hmacKey, settings.hmac]);

  const fmt = (s: string) => (settings.uppercase ? s.toUpperCase() : s);

  const handleFile = async (f: File) => {
    setFile(f);
    setFileBusy(true);
    setFileProgress(0);
    setFileResults({} as Record<Algo, string>);
    try {
      const out = {} as Record<Algo, string>;
      for (const alg of ALGOS) {
        out[alg] = await hashFileStreamed(f, alg, (p) => setFileProgress(p));
      }
      setFileResults(out);
      toast.success(`Hashed ${f.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hash failed");
    } finally {
      setFileBusy(false);
    }
  };

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setTab("file");
      handleFile(files[0]);
    }
    return true;
  };

  const shareUrl = share.getShareUrl({ text });
  const activeResults = tab === "text" ? results : fileResults;

  if (!mounted) return null;

  return (
    <FullPageDropZone onFiles={handleDrop} accept="any file">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "text" | "file")}>
            <TabsList>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.uppercase}
                onChange={(e) => setSettings({ uppercase: e.target.checked })}
              />
              Uppercase
            </Label>
            {tab === "text" && (
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.hmac}
                  onChange={(e) => setSettings({ hmac: e.target.checked })}
                />
                HMAC mode
              </Label>
            )}
          </div>
        </div>

        {tab === "text" ? (
          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </h3>
              <SampleDataButton
                onLoad={() => setText("The quick brown fox jumps over the lazy dog")}
              />
            </header>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              spellCheck={false}
              className="resize-y font-mono text-xs"
            />
            {settings.hmac && (
              <div className="space-y-1.5">
                <Label className="text-xs">HMAC key (used for SHA-1/256/384/512)</Label>
                <Input
                  value={hmacKey}
                  onChange={(e) => setHmacKey(e.target.value)}
                  placeholder="shared-secret"
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById("hash-file")?.click()}
              disabled={fileBusy}
            >
              <FileUp className="h-4 w-4" /> Choose file
            </Button>
            <input
              id="hash-file"
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Or drop a file anywhere on the page. Large files are read in chunks for MD5.
            </p>
            {file && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                <span className="truncate font-mono">{file.name}</span>
                <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setFileResults({} as Record<Algo, string>);
                  }}
                  disabled={fileBusy}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {fileBusy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Hashing… {Math.round(fileProgress * 100)}%
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hashes
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(shareUrl, "Share link copied")}
            >
              Share
            </Button>
          </header>
          <div className="space-y-2">
            {ALGOS.map((alg) => (
              <div key={alg} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
                <Label className="font-mono text-xs">{alg}</Label>
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 px-2 py-1.5 font-mono text-[11px]">
                  {fmt(activeResults[alg] || "")}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!activeResults[alg]}
                  onClick={() => copyToClipboard(fmt(activeResults[alg]))}
                >
                  Copy
                </Button>
              </div>
            ))}
          </div>
        </section>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
