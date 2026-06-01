// Lazy pdf.js helper. Browser-only.
import type { PDFDocumentProxy } from "pdfjs-dist";

let configured = false;

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!configured) {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    configured = true;
  }
  return pdfjs;
}

export async function getDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  return await pdfjs.getDocument({ data }).promise;
}

export async function renderPageThumb(
  doc: PDFDocumentProxy,
  pageNum: number,
  maxDim = 200,
  type: "image/png" | "image/jpeg" = "image/png",
  quality = 0.85,
): Promise<string> {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxDim / Math.max(viewport.width, viewport.height);
  const v = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(v.width);
  canvas.height = Math.ceil(v.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  // pdf.js v4+: render expects { canvasContext, viewport, canvas }
  await page.render({ canvasContext: ctx, viewport: v, canvas }).promise;
  return canvas.toDataURL(type, quality);
}

export async function renderPageBlob(
  doc: PDFDocumentProxy,
  pageNum: number,
  scale: number,
  type: "image/png" | "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const page = await doc.getPage(pageNum);
  const v = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(v.width);
  canvas.height = Math.ceil(v.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  await page.render({ canvasContext: ctx, viewport: v, canvas }).promise;
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    ),
  );
}
