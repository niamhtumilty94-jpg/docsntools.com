import { Check, Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copyToClipboard, downloadBlob, downloadText } from "@/tools/_shared/utils";

interface OutputAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface OutputPanelProps {
  title?: string;
  /**
   * Plain text body. If provided, Copy and Download text get wired automatically.
   */
  text?: string;
  /**
   * Binary blob (e.g. generated file). If provided, Download wires automatically.
   */
  blob?: Blob;
  /**
   * Filename used by the automatic Download action.
   */
  filename?: string;
  /**
   * Mime type for download when only `text` is provided.
   */
  mime?: string;
  /**
   * Share URL - when present, a Share button copies it.
   */
  shareUrl?: string;
  /**
   * Extra actions appended after the built-ins.
   */
  extra?: OutputAction[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Consistent right-side output panel for every tool. Wires up Copy / Download
 * / Share without each tool having to reimplement them.
 */
export function OutputPanel({
  title = "Output",
  text,
  blob,
  filename,
  mime = "text/plain",
  shareUrl,
  extra,
  children,
  className,
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    if (text == null) return;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    if (blob && filename) {
      downloadBlob(blob, filename);
      return;
    }
    if (text != null && filename) {
      downloadText(text, filename, mime);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl, "Share link copied");
    setShared(true);
    setTimeout(() => setShared(false), 1200);
  };

  const canCopy = text != null;
  const canDownload = (blob != null || text != null) && !!filename;
  const canShare = !!shareUrl;

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className,
      )}
      aria-label={title}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {canCopy && (
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          {canDownload && (
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          {canShare && (
            <Button size="sm" variant="ghost" onClick={handleShare}>
              {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {shared ? "Copied" : "Share"}
            </Button>
          )}
          {extra?.map((a) => (
            <Button key={a.label} size="sm" variant="ghost" onClick={a.onClick}>
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
