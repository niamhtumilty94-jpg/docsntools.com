import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";

export function ToolToaster() {
  // Lazy mount to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Toaster position="bottom-right" />;
}
