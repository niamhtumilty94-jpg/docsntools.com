import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface FullPageDropZoneProps {
  /**
   * Called with the dropped files. Return true to indicate handled (overlay
   * dismisses immediately); false/undefined keeps the overlay until the user
   * leaves the window.
   */
  onFiles: (files: File[]) => void | boolean | Promise<void | boolean>;
  /**
   * Optional accept hint shown in the overlay (e.g. "PDF files", "Images").
   */
  accept?: string;
  /**
   * Disable the drop zone (e.g. while a job is running).
   */
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Wraps a tool view and shows a full-page drop overlay when the user drags
 * files anywhere over the page. Lighter than per-input dropzones - the user
 * never has to aim.
 */
export function FullPageDropZone({
  onFiles,
  accept = "files",
  disabled,
  children,
}: FullPageDropZoneProps) {
  const [active, setActive] = useState(false);
  const dragDepth = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      dragDepth.current += 1;
      setActive(true);
    };
    const onDragLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setActive(false);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      dragDepth.current = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) await onFiles(files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [disabled, onFiles]);

  return (
    <>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={!active}
      >
        <div className="rounded-xl border-2 border-dashed border-primary bg-card px-10 py-8 text-center shadow-2xl">
          <Upload className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <p className="mt-3 text-lg font-semibold">Drop {accept} to load</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Files are processed in your browser
          </p>
        </div>
      </div>
    </>
  );
}
