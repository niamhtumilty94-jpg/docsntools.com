import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/tools/_shared/utils";

interface ImageDropAreaProps {
  file: File | null;
  onFile: (file: File | null) => void;
  /** Allow multiple selection (returns first via onFile, full list via onFiles) */
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  /** Image dimensions to show in the badge once decoded */
  width?: number;
  height?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
  /** Children render below the drop area (e.g. controls) */
  children?: React.ReactNode;
}

const ACCEPT_DEFAULT = "image/png,image/jpeg,image/webp,image/avif,image/gif";

/**
 * Standard image input: drag-drop + click-to-browse + Ctrl+V paste,
 * with FullPageDropZone for anywhere-on-page drops.
 */
export function ImageDropArea({
  file,
  onFile,
  multiple = false,
  onFiles,
  width,
  height,
  accept = ACCEPT_DEFAULT,
  className,
  disabled,
  children,
}: ImageDropAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      if (multiple) onFiles?.(images);
      onFile(images[0]);
    },
    [multiple, onFile, onFiles],
  );

  // Paste support
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files;
      if (!items?.length) return;
      const arr = Array.from(items).filter((f) => f.type.startsWith("image/"));
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
      accept="images"
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
              <p className="text-sm font-semibold">Drop an image, click to browse, or paste</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPEG, WebP, AVIF, GIF - processed locally
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {width && height ? ` · ${width}×${height}` : ""}
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
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
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
