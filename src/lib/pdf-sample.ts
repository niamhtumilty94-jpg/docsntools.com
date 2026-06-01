// Generates a tiny on-the-fly sample PDF so each PDF tool can offer
// "Try sample" without shipping a binary asset.

export async function samplePdfFile(): Promise<File> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageCount = 3;
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595, 842]); // A4
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595,
      height: 842,
      color: rgb(0.97, 0.97, 0.99),
    });
    page.drawText(`Sample PDF`, {
      x: 50,
      y: 770,
      size: 36,
      font: bold,
      color: rgb(0.15, 0.15, 0.2),
    });
    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 50,
      y: 730,
      size: 16,
      font,
      color: rgb(0.4, 0.4, 0.5),
    });
    page.drawText(
      "Generated locally for demo purposes. Use this PDF to try out merge,\nsplit, reorder, watermark, page numbers and more.",
      { x: 50, y: 680, size: 12, font, color: rgb(0.25, 0.25, 0.3), lineHeight: 16 },
    );
    page.drawRectangle({
      x: 50,
      y: 100,
      width: 495,
      height: 540,
      borderColor: rgb(0.7, 0.7, 0.78),
      borderWidth: 1,
    });
    page.drawText(`★ ${i}`, {
      x: 270,
      y: 380,
      size: 80,
      font: bold,
      color: rgb(0.6, 0.4, 0.9),
    });
  }
  const bytes = await doc.save();
  return new File([new Uint8Array(bytes)], "sample.pdf", { type: "application/pdf" });
}
