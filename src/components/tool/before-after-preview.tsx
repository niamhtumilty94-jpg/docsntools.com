import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { formatBytes } from "@/tools/_shared/utils";

interface BeforeAfterPreviewProps {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeBytes?: number;
  afterBytes?: number;
  beforeLabel?: string;
  afterLabel?: string;
  /** "split" = side by side, "slider" = draggable comparison */
  mode?: "split" | "slider";
  className?: string;
}

const CHECKER =
  "bg-[conic-gradient(from_45deg,#e2e2e2_0_25%,transparent_0_50%,#e2e2e2_0_75%,transparent_0)] [background-size:16px_16px]";

function pctSaved(before?: number, after?: number): string | null {
  if (!before || !after) return null;
  const diff = ((before - after) / before) * 100;
  if (Math.abs(diff) < 0.5) return null;
  const sign = diff > 0 ? "−" : "+";
  return `${sign}${Math.abs(diff).toFixed(0)}%`;
}

export function BeforeAfterPreview({
  beforeUrl,
  afterUrl,
  beforeBytes,
  afterBytes,
  beforeLabel = "Original",
  afterLabel = "Result",
  mode = "split",
  className,
}: BeforeAfterPreviewProps) {
  const saved = pctSaved(beforeBytes, afterBytes);
  const savedPositive = beforeBytes && afterBytes ? afterBytes < beforeBytes : false;

  if (mode === "slider") {
    return (
      <SliderCompare
        beforeUrl={beforeUrl}
        afterUrl={afterUrl}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        beforeBytes={beforeBytes}
        afterBytes={afterBytes}
        saved={saved}
        savedPositive={savedPositive}
        className={className}
      />
    );
  }

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <Pane url={beforeUrl} label={beforeLabel} bytes={beforeBytes} />
      <Pane
        url={afterUrl}
        label={afterLabel}
        bytes={afterBytes}
        badge={saved ?? undefined}
        badgePositive={savedPositive}
      />
    </div>
  );
}

function Pane({
  url,
  label,
  bytes,
  badge,
  badgePositive,
}: {
  url: string | null;
  label: string;
  bytes?: number;
  badge?: string;
  badgePositive?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-card">
      <figcaption className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {bytes != null && <span>{formatBytes(bytes)}</span>}
          {badge && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                badgePositive
                  ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {badge}
            </span>
          )}
        </div>
      </figcaption>
      <div className={cn("relative flex min-h-[200px] items-center justify-center", CHECKER)}>
        {url ? (
          <img
            src={url}
            alt={label}
            className="max-h-[420px] w-auto max-w-full object-contain"
          />
        ) : (
          <div className="py-8 text-xs text-muted-foreground">No preview</div>
        )}
      </div>
    </figure>
  );
}

function SliderCompare({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  beforeBytes,
  afterBytes,
  saved,
  savedPositive,
  className,
}: {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeLabel: string;
  afterLabel: string;
  beforeBytes?: number;
  afterBytes?: number;
  saved: string | null;
  savedPositive: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const [pos, setPos] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  // Attach a non-passive native touchmove listener so we can preventDefault
  // and stop the page from scrolling while dragging on mobile. React's
  // synthetic onTouchMove is passive on modern React, so calling
  // preventDefault inside it is a no-op.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  if (!beforeUrl || !afterUrl) {
    return (
      <BeforeAfterPreview
        beforeUrl={beforeUrl}
        afterUrl={afterUrl}
        beforeBytes={beforeBytes}
        afterBytes={afterBytes}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        mode="split"
        className={className}
      />
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Primary button only (or any touch/pen contact)
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    activePointerRef.current = e.pointerId;
    // Capture the pointer so we keep getting move/up events even when the
    // finger drifts off the slider - critical on mobile where the browser
    // would otherwise hijack the gesture for scrolling.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture can throw if the pointer is already gone.
    }
    // Focus the slider so keyboard nudging works right after a click.
    containerRef.current?.focus();
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    if (activePointerRef.current !== null && e.pointerId !== activePointerRef.current) return;
    updateFromClientX(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    activePointerRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPos((p) => Math.max(0, p - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPos((p) => Math.min(100, p + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPos(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPos(100);
    }
  };

  return (
    <figure className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <figcaption className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          Drag to compare
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          {beforeBytes != null && (
            <span>
              {formatBytes(beforeBytes)} → {formatBytes(afterBytes ?? 0)}
            </span>
          )}
          {saved && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                savedPositive
                  ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {saved}
            </span>
          )}
        </div>
      </figcaption>
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Before/after comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        style={{ touchAction: "none" }}
        className={cn(
          "relative h-[320px] w-full cursor-ew-resize select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[420px]",
          CHECKER,
        )}
      >
        {/* After image - full width underneath */}
        <img
          src={afterUrl}
          alt={afterLabel}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
        {/* Before image - clipped to the left of the divider. Using clipPath
            (rather than a wrapper width + inner overflow) keeps the image's
            object-contain layout identical to the after image so they stay
            pixel-aligned at any divider position. */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        {/* Labels */}
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
          Before
        </span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
          After
        </span>
        {/* Divider + handle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-background text-xs font-semibold text-primary shadow-md">
            ↔
          </div>
        </div>
      </div>
    </figure>
  );
}
