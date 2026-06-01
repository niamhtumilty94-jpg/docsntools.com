// Image encoding helpers used by all image tools.

export type ImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/avif";

export const FORMAT_LABEL: Record<ImageMime, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
};

export const FORMAT_EXT: Record<ImageMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Returns true when the browser can encode the given mime via canvas.toBlob.
 * Cheap synchronous probe - uses a 1×1 dataURL roundtrip.
 */
export function canEncode(mime: ImageMime): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    return c.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

/**
 * Promise wrapper around canvas.toBlob. Quality is ignored for PNG.
 */
export function encodeCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mime: ImageMime,
  quality = 0.85,
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      mime,
      quality,
    );
  });
}

/**
 * Draws an ImageBitmap onto a fresh canvas at the given dimensions, with
 * an optional flat background color (used for JPEG export of transparent
 * sources).
 */
export function drawToCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // High-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Inline SVG used by the “Try sample” button across image tools.
 * 1024×768 colorful gradient with a transparent corner so we can show
 * checkerboard behaviour.
 */
export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="768" fill="url(#g)"/>
  <circle cx="320" cy="280" r="160" fill="rgba(255,255,255,0.25)"/>
  <circle cx="720" cy="500" r="220" fill="rgba(0,0,0,0.18)"/>
  <text x="512" y="400" font-family="system-ui, sans-serif" font-size="84" font-weight="700"
    fill="white" text-anchor="middle" dominant-baseline="middle">Sample 1024×768</text>
</svg>`;

/**
 * Render the sample SVG to a PNG via an HTMLImageElement. Works in all
 * evergreen browsers - used as a fallback when createImageBitmap rejects
 * SVG blobs (Firefox, some older Safari).
 */
async function svgToPngViaImage(svg: string): Promise<File> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const w = img.naturalWidth || 1024;
    const h = img.naturalHeight || 768;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    ctx.drawImage(img, 0, 0, w, h);
    const png = await encodeCanvas(canvas, "image/png");
    return new File([png], "sample.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Tiny 2×2 PNG (red/green/blue/yellow) - last-resort fallback so
// sampleImageFile() can never resolve with a zero-byte file. Decoded from
// base64 at call time to avoid pulling in any binary asset.
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAGUlEQVR4nGP8z8DwnwEJMDExMDAwMDAwAAAmAwH/ot9JcQAAAABJRU5ErkJggg==";

function tinyPngFile(): File {
  const bin = atob(TINY_PNG_B64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], "sample.png", { type: "image/png" });
}

export async function sampleImageFile(): Promise<File> {
  // Fast path: OffscreenCanvas-friendly browsers can decode SVG blobs.
  try {
    const blob = new Blob([SAMPLE_SVG], { type: "image/svg+xml" });
    const bitmap = await createImageBitmap(blob);
    try {
      const canvas = drawToCanvas(bitmap, bitmap.width, bitmap.height);
      const png = await encodeCanvas(canvas, "image/png");
      if (png.size > 0) {
        const file = new File([png], "sample.png", { type: "image/png" });
        if (file.size > 0) return file;
      }
    } finally {
      bitmap.close();
    }
  } catch {
    // fall through
  }
  // Firefox / older Safari path: render SVG via <img>.
  try {
    const file = await svgToPngViaImage(SAMPLE_SVG);
    if (file.size > 0) return file;
  } catch {
    // fall through
  }
  // Final guarantee: a tiny embedded PNG.
  return tinyPngFile();
}
