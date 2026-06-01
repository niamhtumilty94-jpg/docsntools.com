import { useEffect, type RefObject } from "react";

/**
 * Scrolls the given element into view smoothly when SampleDataButton
 * dispatches `toolkithub:sample-loaded`. Lets users see the dropzone change
 * to the loaded-file card after clicking "Try sample".
 */
export function useSampleScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handler = () => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("toolkithub:sample-loaded", handler);
    return () => window.removeEventListener("toolkithub:sample-loaded", handler);
  }, [ref]);
}
