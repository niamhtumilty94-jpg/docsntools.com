import { FileText, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/tools/_shared/utils";

interface PdfDropAreaProps {
  file: File | null;
  onFile: (file: File | null) => void;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  pageCount?: number;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const ACCEPT = "application/pdf";

function isPdf(f: File): boolean {
  return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
}

export function PdfDropArea({
  file,
  onFile,
  multiple = false,
  onFiles,
  pageCount,
  className,
  disabled,
  children,
}: PdfDropAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: File[]) => {
      const pdfs = files.filter(isPdf);
      if (!pdfs.length) return;
      if (multiple) onFiles?.(pdfs);
      onFile(pdfs[0]);
    },
    [multiple, onFile, onFiles],
  );

  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files?.length) return;
      const arr = Array.from(files).filter(isPdf);
      if (arr.length) {
        e.preventDefault();
        handleFiles(arr);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, handleFiles]);

  return (
    <FullPageDropZone
      onFiles={(files) => {
        handleFiles(files);
        return true;
      }}
      accept="PDF files"
      disabled={disabled}
    >
      <div className={cn("space-y-3", className)}>
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setHover(true);
            }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => {
              e.preventDefault();
              setHover(false);
              handleFiles(Array.from(e.dataTransfer.files));
            }}
            disabled={disabled}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors",
              hover && "border-primary bg-primary/5",
              disabled && "cursor-not-allowed opacity-50",
              !disabled && "hover:border-primary/60 hover:bg-muted/50",
            )}
          >
            <Upload className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">
                Drop {multiple ? "PDFs" : "a PDF"}, click to browse, or paste
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF files - processed locally in your browser
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {pageCount != null ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onFile(null)}
              disabled={disabled}
              aria-label="Remove PDF"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) handleFiles(files);
            e.target.value = "";
          }}
        />

        {children}
      </div>
    </FullPageDropZone>
  );
}
