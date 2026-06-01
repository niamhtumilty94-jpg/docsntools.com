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
import { zipSync } from "fflate";
import { GripVertical, Loader2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { cn } from "@/lib/utils";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob, formatBytes } from "@/tools/_shared/utils";

interface Item {
  id: string;
  file: File;
  rename: string; // user-overridable; empty means follow pattern
  preview: string | null;
}

interface Settings {
  pattern: string;
  zipName: string;
}

const DEFAULTS: Settings = {
  pattern: "{name}",
  zipName: "files.zip",
};

function splitName(name: string): { stem: string; ext: string } {
  const i = name.lastIndexOf(".");
  if (i <= 0) return { stem: name, ext: "" };
  return { stem: name.slice(0, i), ext: name.slice(i + 1) };
}

function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function applyPattern(pattern: string, item: Item, index: number): string {
  const { stem, ext } = splitName(item.file.name);
  // {n:000} zero-padded
  const padded = pattern.replace(/\{n:(0+)\}/g, (_, zeros: string) =>
    String(index).padStart(zeros.length, "0"),
  );
  let out = padded
    .replaceAll("{n}", String(index))
    .replaceAll("{name}", stem)
    .replaceAll("{ext}", ext)
    .replaceAll("{date}", todayStamp());
  // Trim a trailing dot so "image-{n}." doesn't produce "image-1." with a
  // dangling separator. Then re-append the source extension if the user
  // didn't supply one of their own.
  out = out.replace(/\.+$/, "");
  if (!/\.[A-Za-z0-9]{1,8}$/.test(out) && ext) out += `.${ext}`;
  return out || item.file.name;
}

export default function BulkZipTool() {
  const [settings, setSettings] = useToolSettings<Settings>("bulk-zip", DEFAULTS);
  const [items, setItems] = useState<Item[]>([]);
  const [working, setWorking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = (files: File[]) => {
    if (!files.length) return;
    const newOnes: Item[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      rename: "",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setItems((cur) => [...cur, ...newOnes]);
  };

  const remove = (id: string) =>
    setItems((cur) => {
      const it = cur.find((x) => x.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      return cur.filter((x) => x.id !== id);
    });

  const clear = () => {
    items.forEach((it) => it.preview && URL.revokeObjectURL(it.preview));
    setItems([]);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((cur) => {
      const from = cur.findIndex((i) => i.id === active.id);
      const to = cur.findIndex((i) => i.id === over.id);
      return arrayMove(cur, from, to);
    });
  };

  const previewNames = useMemo(
    () =>
      items.map((it, i) =>
        it.rename.trim() ? it.rename.trim() : applyPattern(settings.pattern, it, i + 1),
      ),
    [items, settings.pattern],
  );

  const applyPatternToAll = () => {
    setItems((cur) =>
      cur.map((it, i) => ({
        ...it,
        rename: applyPattern(settings.pattern, it, i + 1),
      })),
    );
  };

  const downloadZip = async () => {
    if (!items.length) return;
    setWorking(true);
    try {
      const entries: Record<string, Uint8Array> = {};
      const used = new Map<string, number>();
      for (let i = 0; i < items.length; i++) {
        let name = previewNames[i];
        // de-duplicate
        if (entries[name]) {
          const n = (used.get(name) ?? 1) + 1;
          used.set(name, n);
          const { stem, ext } = splitName(name);
          name = ext ? `${stem} (${n}).${ext}` : `${stem} (${n})`;
        }
        entries[name] = new Uint8Array(await items[i].file.arrayBuffer());
      }
      const zipped = zipSync(entries, { level: 6 });
      const blob = new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
      const zipName = settings.zipName.endsWith(".zip")
        ? settings.zipName
        : `${settings.zipName}.zip`;
      downloadBlob(blob, zipName || "files.zip");
    } finally {
      setWorking(false);
    }
  };

  const totalSize = items.reduce((a, b) => a + b.file.size, 0);

  return (
    <FullPageDropZone
      onFiles={(files) => {
        addFiles(files);
        return true;
      }}
      accept="files"
    >
      <div className="space-y-5">
        <ToolToaster />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center hover:border-primary/60 hover:bg-muted/50"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Drop files anywhere or click to browse</p>
          <p className="text-xs text-muted-foreground">
            Any file type - packaged as one ZIP locally
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) addFiles(files);
              e.target.value = "";
            }}
          />
        </button>

        <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_auto_1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="pattern">Naming pattern</Label>
            <Input
              id="pattern"
              value={settings.pattern}
              onChange={(e) => setSettings({ pattern: e.target.value })}
              placeholder="image-{n:000}"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Tokens: <code>{"{n}"}</code> <code>{"{n:000}"}</code>{" "}
              <code>{"{name}"}</code> <code>{"{ext}"}</code> <code>{"{date}"}</code>
            </p>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={applyPatternToAll}
              disabled={!items.length}
            >
              Apply to all
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zipName">ZIP filename</Label>
            <Input
              id="zipName"
              value={settings.zipName}
              onChange={(e) => setSettings({ zipName: e.target.value })}
              placeholder="files.zip"
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={downloadZip} disabled={!items.length || working}>
              {working && <Loader2 className="h-4 w-4 animate-spin" />}
              Download ZIP
            </Button>
          </div>
        </div>

        {items.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {items.length} file{items.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(totalSize)}
              </span>
              <Button size="sm" variant="ghost" onClick={clear} disabled={working}>
                Clear all
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                  {items.map((it, i) => (
                    <SortableRow
                      key={it.id}
                      item={it}
                      index={i + 1}
                      previewName={previewNames[i]}
                      onRename={(v) =>
                        setItems((cur) =>
                          cur.map((x) => (x.id === it.id ? { ...x, rename: v } : x)),
                        )
                      }
                      onRemove={() => remove(it.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </FullPageDropZone>
  );
}

function SortableRow({
  item,
  index,
  previewName,
  onRename,
  onRemove,
}: {
  item: Item;
  index: number;
  previewName: string;
  onRename: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm",
        isDragging && "z-10 bg-accent shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {index}.
      </span>
      {item.preview ? (
        <img
          src={item.preview}
          alt=""
          className="h-9 w-9 shrink-0 rounded border border-border object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-muted text-[10px] font-mono uppercase text-muted-foreground">
          {splitName(item.file.name).ext || "bin"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-xs text-muted-foreground">
          {item.file.name} · {formatBytes(item.file.size)}
        </div>
        <Input
          value={item.rename}
          onChange={(e) => onRename(e.target.value)}
          placeholder={previewName}
          className="mt-1 h-7 font-mono text-xs"
        />
      </div>
      <span className="hidden truncate font-mono text-[11px] text-muted-foreground sm:block sm:max-w-[180px]">
        → {previewName}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onRemove}
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  );
}
