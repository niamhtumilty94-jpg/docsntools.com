import { Loader2 } from "lucide-react";
import { useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { Button } from "@/components/ui/button";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const originalBytes = await file.arrayBuffer();
      const src = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
      // Drop metadata
      src.setTitle("");
      src.setAuthor("");
      src.setSubject("");
      src.setKeywords([]);
      src.setProducer("");
      src.setCreator("");
      const bytes = await src.save({ useObjectStreams: true });
      // If "compressed" output is larger, keep the original.
      const outBytes =
        bytes.byteLength >= originalBytes.byteLength ? new Uint8Array(originalBytes) : bytes;
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      setResult({ blob, size: blob.size });
    } finally {
      setBusy(false);
    }
  };

  const savedPct = result && file ? ((file.size - result.size) / file.size) * 100 : 0;

  return (
    <div className="space-y-4">
      <ToolToaster />
      <PdfDropArea file={file} onFile={setFile} />

      {file && (
        <>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <p className="font-medium">Optimize structure (lossless)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drops metadata and re-saves with object streams. Best for PDFs with bloated metadata;
              no effect on already-optimized files (original is kept if no savings).
            </p>
          </div>

          <Button onClick={run} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Compress
          </Button>

          {result && (
            <div
              className={
                "rounded-lg border p-4 text-sm " +
                (savedPct > 0
                  ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10"
                  : "border-border bg-muted/20")
              }
            >
              <div>
                <span className="font-mono">{formatBytes(file.size)}</span> →{" "}
                <span className="font-mono font-medium">{formatBytes(result.size)}</span>
                {savedPct > 0 ? (
                  <span className="ml-2 text-[color:var(--success)]">
                    {savedPct.toFixed(1)}% smaller
                  </span>
                ) : (
                  <span className="ml-2 text-muted-foreground">
                    Already optimized - original kept
                  </span>
                )}
              </div>
              <Button
                size="sm"
                className="mt-3"
                onClick={() =>
                  downloadBlob(result.blob, file.name.replace(/\.pdf$/i, "") + "-compressed.pdf")
                }
              >
                Download compressed PDF
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
