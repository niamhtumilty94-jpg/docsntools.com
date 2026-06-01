import { Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { cn } from "@/lib/utils";

export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  hint,
  disabled,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: string;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFiles(Array.from(files));
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/50",
        over && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">
        {multiple ? "Drop files here" : "Drop a file here"}, or{" "}
        <span className="text-primary underline">click to browse</span>
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handle(e.target.files)}
      />
    </div>
  );
}
