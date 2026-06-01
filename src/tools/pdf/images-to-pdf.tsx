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
import { GripVertical, Loader2, X } from "lucide-react";
import { useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { cn } from "@/lib/utils";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, fileToDataURL, loadImage } from "@/tools/_shared/utils";

type PageSize = "fit" | "a4" | "letter";
type Orientation = "auto" | "portrait" | "landscape";
type FitMode = "contain" | "cover" | "fill";

interface Settings {
  pageSize: PageSize;
  orientation: Orientation;
  margin: number;
  fit: FitMode;
}

const DEFAULTS: Settings = {
  pageSize: "fit",
  orientation: "auto",
  margin: 0,
  fit: "contain",
};

interface Item {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

const PAGE_DIMS: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595, 842], // pt @ 72dpi
  letter: [612, 792],
};

export default function ImagesToPdf() {
  const [settings, setSettings] = useToolSettings<Settings>("images-to-pdf", DEFAULTS);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const add = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    const newOnes: Item[] = await Promise.all(
      imgs.map(async (f) => {
        const preview = await fileToDataURL(f);
        const im = await loadImage(preview);
        return {
          id: crypto.randomUUID(),
          file: f,
          preview,
          width: im.naturalWidth,
          height: im.naturalHeight,
        };
      }),
    );
    setItems((c) => [...c, ...newOnes]);
  };

  const remove = (id: string) => setItems((c) => c.filter((i) => i.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((cur) => {
      const from = cur.findIndex((i) => i.id === active.id);
      const to = cur.findIndex((i) => i.id === over.id);
      return arrayMove(cur, from, to);
    });
  };

  const create = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const it of items) {
        const buf = await it.file.arrayBuffer();
        const isJpg = /jpe?g$/i.test(it.file.type) || /\.jpe?g$/i.test(it.file.name);
        const isPng = /png$/i.test(it.file.type) || /\.png$/i.test(it.file.name);
        let img;
        if (isJpg) img = await out.embedJpg(buf);
        else if (isPng) img = await out.embedPng(buf);
        else {
          const im = await loadImage(it.preview);
          const c = document.createElement("canvas");
          c.width = im.naturalWidth;
          c.height = im.naturalHeight;
          c.getContext("2d")!.drawImage(im, 0, 0);
          const pngBlob = await new Promise<Blob>((res, rej) =>
            c.toBlob((b) => (b ? res(b) : rej(new Error())), "image/png"),
          );
          img = await out.embedPng(await pngBlob.arrayBuffer());
        }

        const imgIsLandscape = img.width > img.height;
        // Effective image dims after orientation rotation
        let rotate = 0;
        let effW = img.width;
        let effH = img.height;
        if (settings.orientation === "portrait" && imgIsLandscape) {
          rotate = 90;
          effW = img.height;
          effH = img.width;
        } else if (settings.orientation === "landscape" && !imgIsLandscape) {
          rotate = 90;
          effW = img.height;
          effH = img.width;
        }

        // Page size
        let pageW: number, pageH: number;
        if (settings.pageSize === "fit") {
          pageW = effW + settings.margin * 2;
          pageH = effH + settings.margin * 2;
        } else {
          let [w, h] = PAGE_DIMS[settings.pageSize];
          const wantsLandscape =
            settings.orientation === "landscape" ||
            (settings.orientation === "auto" && imgIsLandscape);
          if (wantsLandscape) [w, h] = [h, w];
          pageW = w;
          pageH = h;
        }
        const page = out.addPage([pageW, pageH]);
        const inW = pageW - settings.margin * 2;
        const inH = pageH - settings.margin * 2;
        let drawW = inW;
        let drawH = inH;
        if (settings.fit === "fill") {
          drawW = inW;
          drawH = inH;
        } else if (settings.fit === "cover") {
          const scale = Math.max(inW / effW, inH / effH);
          drawW = effW * scale;
          drawH = effH * scale;
        } else {
          // contain
          const scale = Math.min(inW / effW, inH / effH);
          drawW = effW * scale;
          drawH = effH * scale;
        }
        const x = settings.margin + (inW - drawW) / 2;
        const y = settings.margin + (inH - drawH) / 2;

        if (rotate === 90) {
          // pdf-lib rotates around (x, y); to place a 90°-rotated image so its
          // bounding box is [x, y, drawW, drawH], offset x by drawW and pass
          // width = drawH, height = drawW to the un-rotated image.
          page.drawImage(img, {
            x: x + drawW,
            y,
            width: drawH,
            height: drawW,
            rotate: degrees(90),
          });
        } else {
          page.drawImage(img, { x, y, width: drawW, height: drawH });
        }
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" }),
        "images.pdf",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <FullPageDropZone
      onFiles={(f) => {
        add(f);
        return true;
      }}
      accept="images"
    >
      <div className="space-y-4">
        <ToolToaster />

        {items.length === 0 && <DropArea onPick={add} />}

        {items.length > 0 && (
          <>
            <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-4">
              <div>
                <Label>Page size</Label>
                <Select
                  value={settings.pageSize}
                  onValueChange={(v) => setSettings({ pageSize: v as PageSize })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to image</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">US Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orientation</Label>
                <Select
                  value={settings.orientation}
                  onValueChange={(v) => setSettings({ orientation: v as Orientation })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (per image)</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fit mode</Label>
                <Select
                  value={settings.fit}
                  onValueChange={(v) => setSettings({ fit: v as FitMode })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Contain (no crop)</SelectItem>
                    <SelectItem value="cover">Cover (crop edges)</SelectItem>
                    <SelectItem value="fill">Fill (stretch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Margin (pt)</Label>
                <NumberInput
                  min={0}
                  max={200}
                  value={settings.margin}
                  onChange={(v) => setSettings({ margin: v })}
                  className="mt-1"
                />
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {items.map((it, i) => (
                    <SortableImageCard
                      key={it.id}
                      item={it}
                      index={i + 1}
                      onRemove={() => remove(it.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {items.length} image{items.length === 1 ? "" : "s"} → {items.length} pages
                {" · "}
                {settings.pageSize === "fit" ? "fit to image" : settings.pageSize.toUpperCase()}
                {settings.pageSize !== "fit" && ` · ${settings.orientation}`}
                {" · "}
                {settings.fit}
                {" · "}
                {settings.margin}pt margin
              </span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setItems([])}>
                  Clear
                </Button>
                <Button onClick={create} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create PDF
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </FullPageDropZone>
  );
}

function DropArea({ onPick }: { onPick: (files: File[]) => void }) {
  return (
    <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center hover:border-primary/60 hover:bg-muted/50">
      <p className="text-sm font-semibold">Drop images or click to browse</p>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP - drag to reorder afterward</p>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onPick(files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function SortableImageCard({
  item,
  index,
  onRemove,
}: {
  item: Item;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative rounded-lg border border-border bg-muted/30 p-2",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 z-10 cursor-grab touch-none rounded bg-background/80 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 z-10 rounded bg-background/90 p-1 text-destructive opacity-0 group-hover:opacity-100"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <img
        src={item.preview}
        alt=""
        className="block h-28 w-full rounded object-contain"
      />
      <div className="mt-1 text-center font-mono text-[10px] text-muted-foreground">
        {index} · {item.width}×{item.height}
      </div>
    </div>
  );
}
