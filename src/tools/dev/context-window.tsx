import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { cn } from "@/lib/utils";
import {
  ENCODINGS,
  formatCount,
  loadEncoder,
  parseTokenCount,
  type EncodingName,
} from "@/tools/dev/_tokenizer";

const SAMPLE = `System: You are a support agent for an online bookshop. Be concise and never invent order details.

Retrieved document 1:
Orders placed before 14:00 are dispatched the same working day. Standard delivery is 2-4 working days; express is next working day.

Retrieved document 2:
Returns are accepted within 30 days of delivery provided the book is unread and undamaged. Refunds are issued to the original payment method within 5 working days of the return arriving.

Conversation so far:
Customer: I ordered a book last Tuesday and it still hasn't arrived.
Agent: I'm sorry about that - could you give me your order number?
Customer: It's BK-40192.`;

/**
 * Common context sizes rather than named models.
 *
 * Model context limits change often and vary by provider tier, so hard-coding
 * "model X = N tokens" would go stale and mislead. These are the sizes people
 * actually work against; the field below accepts any custom value.
 */
const PRESETS: { value: number; label: string }[] = [
  { value: 8192, label: "8K" },
  { value: 16384, label: "16K" },
  { value: 32768, label: "32K" },
  { value: 128000, label: "128K" },
  { value: 200000, label: "200K" },
  { value: 1000000, label: "1M" },
];

interface ShareState {
  input: string;
}

export default function ContextWindowTool() {
  const share = useShareableState<ShareState>();
  const [settings, setSettings] = useToolSettings("context-window", {
    encoding: "o200k_base" as EncodingName,
    windowSize: "128000",
    reserved: "4096",
  });
  const [input, setInput] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  useEffect(() => {
    let stale = false;
    setError(null);
    loadEncoder(settings.encoding)
      .then((enc) => {
        if (!stale) setTokenCount(enc.encode(input).length);
      })
      .catch((e: unknown) => {
        if (!stale) setError(e instanceof Error ? e.message : "Could not load the tokenizer.");
      });
    return () => {
      stale = true;
    };
  }, [input, settings.encoding]);

  const calc = useMemo(() => {
    const windowSize = parseTokenCount(settings.windowSize) ?? 0;
    const reserved = parseTokenCount(settings.reserved) ?? 0;
    // Room left for input once space for the model's reply is set aside.
    const usable = Math.max(0, windowSize - reserved);
    const remaining = usable - tokenCount;
    // With no usable room left, anything at all overflows - report that as full
    // rather than 0%, which would otherwise read as "empty" next to "Too long".
    const pct = usable > 0 ? Math.min(100, (tokenCount / usable) * 100) : tokenCount > 0 ? 100 : 0;
    return {
      windowSize,
      reserved,
      usable,
      remaining,
      pct,
      fits: windowSize > 0 && remaining >= 0,
      copies: tokenCount > 0 ? Math.floor(usable / tokenCount) : 0,
    };
  }, [settings.windowSize, settings.reserved, tokenCount]);

  const exportText = useMemo(
    () =>
      `Encoding: ${settings.encoding}
Context window: ${calc.windowSize}
Reserved for output: ${calc.reserved}
Usable for input: ${calc.usable}
Input tokens: ${tokenCount}
Remaining: ${calc.remaining}
Utilisation: ${calc.pct.toFixed(1)}%
Fits: ${calc.fits ? "yes" : "no"}`,
    [settings.encoding, calc, tokenCount],
  );

  const shareUrl = share.getShareUrl({ input });

  const barColor = !calc.fits
    ? "bg-destructive"
    : calc.pct > 85
      ? "bg-amber-500"
      : "bg-[color:var(--cat-dev)]";

  const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prompt
          </h3>
          <SampleDataButton onLoad={() => setInput(SAMPLE)} />
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cw-encoding" className="text-xs text-muted-foreground">
              Encoding
            </Label>
            <select
              id="cw-encoding"
              value={settings.encoding}
              onChange={(e) =>
                setSettings({ ...settings, encoding: e.target.value as EncodingName })
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {ENCODINGS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cw-reserved" className="text-xs text-muted-foreground">
              Reserved for output
            </Label>
            <Input
              id="cw-reserved"
              value={settings.reserved}
              onChange={(e) => setSettings({ ...settings, reserved: e.target.value })}
              inputMode="numeric"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cw-window" className="text-xs text-muted-foreground">
            Context window (tokens)
          </Label>
          <Input
            id="cw-window"
            value={settings.windowSize}
            onChange={(e) => setSettings({ ...settings, windowSize: e.target.value })}
            inputMode="numeric"
            className="mt-1"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSettings({ ...settings, windowSize: String(p.value) })}
                className={cn(
                  "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
                  String(p.value) === settings.windowSize
                    ? "border-foreground/30 bg-accent text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Context limits differ by model and provider tier and change often - check your
            provider's current documentation, then enter the figure here.
          </p>
        </div>

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={12}
          spellCheck={false}
          className="min-h-[240px] resize-y font-mono text-xs"
          placeholder="Paste the prompt, documents or transcript you plan to send…"
        />
      </section>

      <OutputPanel
        title="Context usage"
        text={exportText}
        filename="context-usage.txt"
        shareUrl={shareUrl}
      >
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div
              className="h-3 w-full overflow-hidden rounded-full border border-border bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(calc.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Context window used"
            >
              <div
                className={cn("h-full transition-all", barColor)}
                style={{ width: `${calc.pct}%` }}
              />
            </div>
            <p className="mt-2 text-sm">
              {calc.windowSize <= 0 ? (
                <span className="text-muted-foreground">Enter a context window size.</span>
              ) : calc.fits ? (
                <>
                  <span className="font-semibold">Fits.</span>{" "}
                  <span className="text-muted-foreground">
                    {formatCount(calc.remaining)} tokens spare after reserving{" "}
                    {formatCount(calc.reserved)} for the reply.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-destructive">Too long.</span>{" "}
                  <span className="text-muted-foreground">
                    Over by {formatCount(Math.abs(calc.remaining))} tokens - trim the prompt, cut
                    retrieved context, or reserve less for the reply.
                  </span>
                </>
              )}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Input tokens" value={formatCount(tokenCount)} />
              <Stat label="Usable" value={formatCount(calc.usable)} />
              <Stat label="Remaining" value={formatCount(calc.remaining)} />
              <Stat label="Used" value={`${calc.pct.toFixed(1)}%`} />
              <Stat label="Reserved" value={formatCount(calc.reserved)} />
              <Stat label="Copies that fit" value={formatCount(calc.copies)} />
            </div>
          </>
        )}
      </OutputPanel>
    </div>
  );
}
