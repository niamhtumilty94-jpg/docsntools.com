import { useEffect, useState } from "react";

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  file: File;
}

/**
 * Decode a File into an ImageBitmap honouring EXIF orientation.
 * Returns null while loading or on error. Cleans the previous bitmap
 * automatically when the file changes.
 */
export function useImageBitmap(file: File | null): {
  image: LoadedImage | null;
  error: string | null;
  loading: boolean;
} {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setImage(null);
      setError(null);
      return;
    }
    let cancelled = false;
    let current: ImageBitmap | null = null;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const bitmap = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        if (cancelled) {
          bitmap.close();
          return;
        }
        current = bitmap;
        setImage({
          bitmap,
          width: bitmap.width,
          height: bitmap.height,
          file,
        });
      } catch (err) {
        console.debug("[useImageBitmap] decode failed:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not decode image");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (current) current.close();
    };
  }, [file]);

  return { image, error, loading };
}
