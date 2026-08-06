import { Loader2, Trash2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { PdfPageGrid, type GridPage } from "@/components/tool/pdf-page-grid";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { buildFromPages } from "@/lib/pdf-export";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob } from "@/tools/_shared/utils";

interface DeletedEntry {
  page: GridPage;
  index: number; // index in the working list at delete time
}

export default function ReorderPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState<GridPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<DeletedEntry[][]>([]);
  const { pages: loaded, loading } = usePdfDocument(file);

  // Sync loaded pages → working state (preserve order on initial load)
  useEffect(() => {
    setPages(
      loaded.map((p) => ({
        id: `p-${p.index}`,
        origIndex: p.index,
        thumb: p.thumb,
      })),
    );
    setSelected(new Set());
    setHistory([]);
  }, [loaded]);

  const pushHistory = (entries: DeletedEntry[]) => {
    setHistory((cur) => {
      const next = [...cur, entries];
      // cap at 5 most recent batches
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
  };

  const onRemove = (id: string) => {
    setPages((cur) => {
      const idx = cur.findIndex((p) => p.id === id);
      if (idx < 0) return cur;
      pushHistory([{ page: cur[idx], index: idx }]);
      return cur.filter((p) => p.id !== id);
    });
  };

  const onToggleSelect = (id: string, e: React.MouseEvent) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (e.shiftKey && cur.size) {
        const list = pages.map((g) => g.id);
        const lastSelected = list.findIndex((x) => cur.has(x));
        const target = list.indexOf(id);
        if (lastSelected >= 0 && target >= 0) {
          const [a, b] = lastSelected < target ? [lastSelected, target] : [target, lastSelected];
          for (let i = a; i <= b; i++) next.add(list[i]);
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const removeSelected = () => {
    setPages((cur) => {
      const entries: DeletedEntry[] = [];
      const next: GridPage[] = [];
      cur.forEach((p, i) => {
        if (selected.has(p.id)) entries.push({ page: p, index: i });
        else next.push(p);
      });
      if (entries.length) pushHistory(entries);
      return next;
    });
    setSelected(new Set());
  };

  const undoDelete = () => {
    setHistory((cur) => {
      if (!cur.length) return cur;
      const last = cur[cur.length - 1];
      setPages((current) => {
        const next = [...current];
        // restore in original order so indices stay valid
        [...last]
          .sort((a, b) => a.index - b.index)
          .forEach(({ page, index }) => {
            next.splice(Math.min(index, next.length), 0, page);
          });
        return next;
      });
      toast.success(last.length === 1 ? "Restored 1 page" : `Restored ${last.length} pages`);
      return cur.slice(0, -1);
    });
  };

  const save = async () => {
    if (!file || pages.length === 0) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const order = pages.map((p) => p.origIndex);
      const bytes = await buildFromPages(buf, order);
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        file.name.replace(/\.pdf$/i, "") + "-reordered.pdf",
      );
    } finally {
      setBusy(false);
    }
  };

  const toolbar = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {pages.length} page{pages.length === 1 ? "" : "s"} · drag to reorder · click to select ·
          shift-click for range
        </span>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button size="sm" variant="ghost" onClick={undoDelete}>
              <Undo2 className="h-4 w-4" /> Undo delete
            </Button>
          )}
          {selected.size > 0 && (
            <Button size="sm" variant="outline" onClick={removeSelected}>
              <Trash2 className="h-4 w-4" /> Delete {selected.size}
            </Button>
          )}
          <Button onClick={save} disabled={busy || pages.length === 0} size="sm">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save PDF
          </Button>
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages.length, selected.size, busy, history.length],
  );

  return (
    <div className="space-y-4">
      <ToolToaster />
      <div className="flex justify-end">
        <SampleDataButton onLoad={async () => setFile(await samplePdfFile())} />
      </div>
      <PdfDropArea file={file} onFile={setFile} pageCount={pages.length || undefined} />
      {file && (
        <>
          {toolbar}
          {loading && pages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering…
            </div>
          ) : (
            <PdfPageGrid
              pages={pages}
              onReorder={setPages}
              onRemove={onRemove}
              onToggleSelect={onToggleSelect}
              selected={selected}
            />
          )}
        </>
      )}
    </div>
  );
}
