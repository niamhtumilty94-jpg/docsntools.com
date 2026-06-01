import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Trust signal shown on every tool: "all work happens client-side".
 * Used inside the tool header by CategoryShell.
 */
export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--success)]",
        className,
      )}
      role="status"
      aria-label="Privacy guarantee"
      title="Files never leave your browser. No ad networks, no third-party trackers on tool pages."
    >
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      100% in your browser · no uploads · no ad trackers
    </div>
  );
}
