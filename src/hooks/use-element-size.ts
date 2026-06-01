import { useCallback, useEffect, useState } from "react";

/**
 * Tracks an element's content-box size via ResizeObserver.
 * Uses a callback ref so it works correctly with conditionally-rendered elements -
 * the observer re-attaches whenever the element mounts or unmounts.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [node, setNode] = useState<T | null>(null);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    // Seed with current size immediately so first paint isn't 0.
    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      setSize({ width, height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);

  return { ref, ...size };
}
