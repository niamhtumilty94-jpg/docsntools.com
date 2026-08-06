import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState } from "react";

import { getDocument, renderPageThumb } from "@/tools/pdf/_pdfjs";

export interface PdfPageInfo {
  index: number; // zero-based page index
  thumb: string | null;
  width: number;
  height: number;
}

/**
 * Loads a PDF and renders thumbnails for all pages eagerly (small docs)
 * with a thumb regeneration helper for live rotation previews.
 */
export function usePdfDocument(file: File | null, thumbSize = 160) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDoc(null);
      setPages([]);
      setError(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const d = await getDocument(buf);
        if (cancel) return;
        setDoc(d);
        // Initial page metadata (no thumbs)
        const initial: PdfPageInfo[] = [];
        for (let i = 0; i < d.numPages; i++) {
          const p = await d.getPage(i + 1);
          const v = p.getViewport({ scale: 1 });
          initial.push({ index: i, thumb: null, width: v.width, height: v.height });
        }
        if (cancel) return;
        setPages(initial);
        // Render thumbs sequentially
        for (let i = 0; i < d.numPages; i++) {
          if (cancel) return;
          try {
            const thumb = await renderPageThumb(d, i + 1, thumbSize);
            if (cancel) return;
            setPages((cur) => cur.map((p) => (p.index === i ? { ...p, thumb } : p)));
          } catch {
            /* ignore single-page failures */
          }
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "Failed to load PDF");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [file, thumbSize]);

  return { doc, pages, loading, error };
}
