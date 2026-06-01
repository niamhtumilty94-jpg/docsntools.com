import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface SampleDataButtonProps {
  onLoad: () => void | Promise<void>;
  label?: string;
  loadingLabel?: string;
  successMessage?: string;
  className?: string;
}

/**
 * One-click "Try with sample" button. Drops realistic placeholder input into
 * the tool so first-time visitors don't bounce on an empty state.
 *
 * Handles async loaders with a built-in spinner, disabled state, and
 * success / error toasts so every call site gets consistent UX.
 */
export function SampleDataButton({
  onLoad,
  label = "Try sample",
  loadingLabel = "Loading sample…",
  successMessage = "Sample loaded",
  className,
}: SampleDataButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onLoad();
      toast.success(successMessage);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("toolkithub:sample-loaded"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Couldn't load sample: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      aria-disabled={busy}
      data-busy={busy ? "true" : undefined}
      className={`${className ?? ""} data-[busy=true]:cursor-wait data-[busy=true]:opacity-70`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      )}
      {busy ? loadingLabel : label}
    </Button>
  );
}
