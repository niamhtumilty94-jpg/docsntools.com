import { useCallback, useEffect, useRef, useState } from "react";
import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";

/**
 * URL-hash share encoding. We deflate the JSON, base64url-encode it, and put
 * it in `#s=...`. Reading happens once on mount; writing happens whenever
 * the caller calls `getShareUrl()` (we do NOT push every state change to the
 * URL - that would spam history and slow down typing).
 *
 * SSR-safe: returns `null` for the initial state on the server.
 */

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShareState<T>(state: T): string {
  const bytes = strToU8(JSON.stringify(state));
  return toBase64Url(deflateSync(bytes, { level: 9 }));
}

export function decodeShareState<T>(token: string): T | null {
  try {
    const inflated = inflateSync(fromBase64Url(token));
    return JSON.parse(strFromU8(inflated)) as T;
  } catch {
    return null;
  }
}

function readHashState<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const token = params.get(key);
  if (!token) return null;
  return decodeShareState<T>(token);
}

interface UseShareableStateResult<T> {
  /**
   * The decoded state from the URL hash, if any was present on mount.
   */
  initial: T | null;
  /**
   * Build a shareable URL for the current state. Cheap - call from a button.
   */
  getShareUrl: (state: T) => string;
  /**
   * Set the URL hash to the current state (no history entry).
   */
  writeHash: (state: T) => void;
}

export function useShareableState<T>(
  paramKey = "s",
): UseShareableStateResult<T> {
  // Read once on mount so we don't trigger re-decodes during typing.
  const initialRef = useRef<T | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initialRef.current = readHashState<T>(paramKey);
    setReady(true);
  }, [paramKey]);

  const getShareUrl = useCallback(
    (state: T) => {
      const token = encodeShareState(state);
      if (typeof window === "undefined") return `#${paramKey}=${token}`;
      const { origin, pathname } = window.location;
      return `${origin}${pathname}#${paramKey}=${token}`;
    },
    [paramKey],
  );

  const writeHash = useCallback(
    (state: T) => {
      if (typeof window === "undefined") return;
      const token = encodeShareState(state);
      const url = `${window.location.pathname}#${paramKey}=${token}`;
      window.history.replaceState(null, "", url);
    },
    [paramKey],
  );

  return { initial: ready ? initialRef.current : null, getShareUrl, writeHash };
}
