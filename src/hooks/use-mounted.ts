import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted on the client.
 * Use to gate browser-only UI (Date.now, locale formatting, Radix portals,
 * Radix Select's hidden native input) so SSR renders a stable shell that
 * matches the initial client paint, avoiding hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
