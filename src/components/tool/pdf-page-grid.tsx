import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, RotateCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GridPage {
  id: string;
  origIndex: number; // 0-based original page index
  thumb: string | null;
  rotation?: number; // current applied rotation (degrees)
}

interface PdfPageGridProps {
  pages: GridPage[];
  onReorder?: (next: GridPage[]) => void;
  onRemove?: (id: string) => void;
  onRotate?: (id: string) => void;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  selected?: Set<string>;
  /** Read-only mode: no drag handles, no actions */
  readOnly?: boolean;
  className?: string;
}

export function PdfPageGrid({
  pages,
  onReorder,
  onRemove,
  onRotate,
  onToggleSelect,
  selected,
  readOnly,
  className,
}: PdfPageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !onReorder) return;
    const from = pages.findIndex((p) => p.id === active.id);
    const to = pages.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(pages, from, to));
  };

  if (readOnly || !onReorder) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          className,
        )}
      >
        {pages.map((p, i) => (
          <PageCard
            key={p.id}
            page={p}
            displayIndex={i + 1}
            onRemove={onRemove}
            onRotate={onRotate}
            onToggleSelect={onToggleSelect}
            isSelected={selected?.has(p.id)}
            readOnly
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
            className,
          )}
        >
          {pages.map((p, i) => (
            <SortablePageCard
              key={p.id}
              page={p}
              displayIndex={i + 1}
              onRemove={onRemove}
              onRotate={onRotate}
              onToggleSelect={onToggleSelect}
              isSelected={selected?.has(p.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortablePageCard(props: PageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-90")}>
      <PageCard {...props} dragHandle={{ attributes, listeners }} />
    </div>
  );
}

interface PageCardProps {
  page: GridPage;
  displayIndex: number;
  onRemove?: (id: string) => void;
  onRotate?: (id: string) => void;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  isSelected?: boolean;
  readOnly?: boolean;
  dragHandle?: {
    attributes: React.HTMLAttributes<HTMLButtonElement>;
    listeners: React.HTMLAttributes<HTMLButtonElement> | undefined;
  };
}

function PageCard({
  page,
  displayIndex,
  onRemove,
  onRotate,
  onToggleSelect,
  isSelected,
  readOnly,
  dragHandle,
}: PageCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-muted/30 p-2 transition-colors",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      {!readOnly && dragHandle && (
        <button
          type="button"
          {...dragHandle.attributes}
          {...dragHandle.listeners}
          className="absolute left-1 top-1 z-10 cursor-grab touch-none rounded bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Reorder page"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="absolute right-1 top-1 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onRotate && (
          <button
            type="button"
            onClick={() => onRotate(page.id)}
            className="rounded bg-background/90 p-1 text-foreground shadow-sm hover:bg-accent"
            aria-label="Rotate page"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(page.id)}
            className="rounded bg-background/90 p-1 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Remove page"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => onToggleSelect?.(page.id, e)}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded border border-border bg-background"
        aria-pressed={isSelected}
      >
        {page.thumb ? (
          <img
            src={page.thumb}
            alt={`Page ${page.origIndex + 1}`}
            style={{ transform: `rotate(${page.rotation ?? 0}deg)` }}
            className="max-h-full max-w-full object-contain transition-transform"
          />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </button>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>#{displayIndex}</span>
        <span>p{page.origIndex + 1}</span>
      </div>
    </div>
  );
}

/** Toolbar helpers exposed for tool screens */
export function PageGridToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
      {children}
    </div>
  );
}

export { Button as PageGridButton };
