// Small wrappers around pdf-lib for the patterns the PDF tools share.
import type { PDFDocument as PDFDocumentType, PDFPage } from "pdf-lib";

export async function loadPdfLib() {
  return await import("pdf-lib");
}

/**
 * Build a new PDF from a source doc by selecting page indices and
 * applying additional rotation per page (degrees, must be multiple of 90).
 */
export async function buildFromPages(
  srcBytes: ArrayBuffer,
  pageOrder: number[],
  rotations?: number[],
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await loadPdfLib();
  const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pageOrder);
  copied.forEach((page, i) => {
    const extra = rotations?.[i] ?? 0;
    if (extra) {
      const cur = page.getRotation().angle;
      page.setRotation(degrees((cur + extra) % 360));
    }
    out.addPage(page);
  });
  return await out.save();
}

export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export function anchorPosition(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  anchor: Anchor,
  margin: number,
): { x: number; y: number } {
  let x = margin;
  let y = margin;
  if (anchor.includes("right")) x = pageWidth - textWidth - margin;
  else if (anchor.includes("center")) x = (pageWidth - textWidth) / 2;
  if (anchor.startsWith("top")) y = pageHeight - margin - textHeight;
  else if (anchor.startsWith("middle")) y = (pageHeight - textHeight) / 2;
  return { x, y };
}

/** Convert hex color (#RRGGBB) to {r,g,b} normalized 0-1 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  };
}

export type StandardFontFamily = "Helvetica" | "Times" | "Courier";

export async function embedStandardFont(
  doc: PDFDocumentType,
  family: StandardFontFamily,
  bold = false,
) {
  const { StandardFonts } = await loadPdfLib();
  const map: Record<StandardFontFamily, [string, string]> = {
    Helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold],
    Times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold],
    Courier: [StandardFonts.Courier, StandardFonts.CourierBold],
  };
  return await doc.embedFont(map[family][bold ? 1 : 0]);
}

// Re-export type for use in tool modules
export type { PDFDocumentType, PDFPage };
