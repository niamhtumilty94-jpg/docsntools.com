import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Per-tool settings persisted in localStorage. SSR-safe: returns defaults
 * during the first render, then hydrates after mount to avoid mismatch.
 *
 * Storage key is `th:settings:<toolId>`.
 */
export function useToolSettings<T extends object>(
  toolId: string,
  defaults: T,
): [T, (patch: Partial<T> | ((prev: T) => T)) => void] {
  const key = `th:settings:${toolId}`;
  const [state, setState] = useState<T>(defaults);
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setState((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      /* corrupt entry - ignore */
    }
    hydrated.current = true;
  }, [key]);

  // Persist on change after hydration.
  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota - ignore */
    }
  }, [key, state]);

  const update = useCallback((patch: Partial<T> | ((prev: T) => T)) => {
    setState((prev) =>
      typeof patch === "function" ? (patch as (p: T) => T)(prev) : { ...prev, ...patch },
    );
  }, []);

  return [state, update];
}
