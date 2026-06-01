import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Surfaces decode errors from useImageBitmap as a destructive toast,
 * but only once per transition from null → string (so it doesn't fire
 * on every render).
 */
export function useDecodeErrorToast(error: string | null) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== last.current) {
      toast.error(`Couldn't decode image: ${error}`);
    }
    last.current = error;
  }, [error]);
}
