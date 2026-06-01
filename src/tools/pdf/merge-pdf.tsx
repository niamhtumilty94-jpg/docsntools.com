import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, FileText, GripVertical, Loader2, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";
import { renderPageThumb, getDocument } from "./_pdfjs";

interface SourceFile {
  id: string;
  file: File;
  pageCount: number;
  thumbs: (string | null)[];
  rotateAll: number; // 0,90,180,270 - applied to every page
  collapsed: boolean;
}

export default function MergePdf() {
  const [items, setItems] = useState<SourceFile[]>([]);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = useCallback(async (files: File[]) => {
    const accepted = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    for (const f of accepted) {
      const id = crypto.randomUUID();
      try {
        const buf = await f.arrayBuffer();
        const doc = await getDocument(buf);
        const pageCount = doc.numPages;
        setItems((cur) => [
          ...cur,
          {
            id,
            file: f,
            pageCount,
            thumbs: new Array(pageCount).fill(null),
            rotateAll: 0,
            collapsed: pageCount > 8,
          },
        ]);
        for (let i = 0; i < pageCount; i++) {
          try {
            const t = await renderPageThumb(doc, i + 1, 110);
            setItems((cur) =>
              cur.map((it) =>
                it.id === id
                  ? { ...it, thumbs: it.thumbs.map((tt, idx) => (idx === i ? t : tt)) }
                  : it,
              ),
            );
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        console.error("Failed to load PDF", f.name, e);
      }
    }
  }, []);

  const remove = (id: string) => setItems((cur) => cur.filter((i) => i.id !== id));
  const toggleCollapse = (id: string) =>
    setItems((cur) =>
      cur.map((it) => (it.id === id ? { ...it, collapsed: !it.collapsed } : it)),
    );
  const rotateAll = (id: string) =>
    setItems((cur) =>
      cur.map((it) =>
        it.id === id ? { ...it, rotateAll: (it.rotateAll + 90) % 360 } : it,
      ),
    );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((cur) => {
      const from = cur.findIndex((i) => i.id === active.id);
      const to = cur.findIndex((i) => i.id === over.id);
      return arrayMove(cur, from, to);
    });
  };

  const merge = async () => {
    if (items.length < 1) return;
    setBusy(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const it of items) {
        const buf = await it.file.arrayBuffer();
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        for (const p of pages) {
          if (it.rotateAll) {
            const cur = p.getRotation().angle;
            p.setRotation(degrees((cur + it.rotateAll) % 360));
          }
          out.addPage(p);
        }
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        "merged.pdf",
      );
    } finally {
      setBusy(false);
    }
  };

  const totalPages = items.reduce((a, b) => a + b.pageCount, 0);

  return (
    <div className="space-y-4">
      <ToolToaster />
      <PdfDropArea
        file={null}
        onFile={() => {}}
        multiple
        onFiles={addFiles}
      />

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {items.length} PDF{items.length === 1 ? "" : "s"} · {totalPages} pages total
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/pdf,.pdf";
                  input.multiple = true;
                  input.onchange = () => {
                    const files = Array.from(input.files ?? []);
                    if (files.length) addFiles(files);
                  };
                  input.click();
                }}
                disabled={busy}
              >
                Add more PDFs
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setItems([])} disabled={busy}>
                Clear all
              </Button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <SourceRow
                    key={it.id}
                    item={it}
                    index={idx + 1}
                    onRemove={() => remove(it.id)}
                    onToggleCollapse={() => toggleCollapse(it.id)}
                    onRotateAll={() => rotateAll(it.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="flex gap-2">
            <Button onClick={merge} disabled={busy || items.length === 0}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Merge {items.length} PDF{items.length === 1 ? "" : "s"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SourceRow({
  item,
  index,
  onRemove,
  onToggleCollapse,
  onRotateAll,
}: {
  item: SourceFile;
  index: number;
  onRemove: () => void;
  onToggleCollapse: () => void;
  onRotateAll: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border border-border bg-card p-3",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <header className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label="Reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">{index}.</span>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.file.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {item.pageCount} pages · {formatBytes(item.file.size)}
            {item.rotateAll ? ` · rotated ${item.rotateAll}°` : ""}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onRotateAll} aria-label="Rotate all pages">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleCollapse}>
          {item.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove file">
          <X className="h-4 w-4" />
        </Button>
      </header>
      {!item.collapsed && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {item.thumbs.map((t, i) => (
            <div
              key={i}
              className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded border border-border bg-background p-0.5"
            >
              {t ? (
                <img
                  src={t}
                  alt={`Page ${i + 1}`}
                  style={{ transform: `rotate(${item.rotateAll}deg)` }}
                  className="max-h-full max-w-full object-contain transition-transform"
                />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
