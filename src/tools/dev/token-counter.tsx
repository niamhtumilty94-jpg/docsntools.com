import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import {
  ENCODINGS,
  formatCount,
  loadEncoder,
  utf8Bytes,
  type EncodingName,
} from "@/tools/dev/_tokenizer";

const SAMPLE = `You are a helpful assistant. Answer using only the context below.

Context:
The Mariana Trench is the deepest oceanic trench on Earth, reaching about 10,935 metres at Challenger Deep. It lies in the western Pacific, east of the Mariana Islands.

Question: How deep is the Mariana Trench, and where is it?`;

interface ShareState {
  input: string;
}

/** Tokens shown in the preview strip - enough to be useful, cheap to render. */
const PREVIEW_LIMIT = 400;

const PREVIEW_COLORS = [
  "bg-sky-500/20",
  "bg-emerald-500/20",
  "bg-amber-500/20",
  "bg-violet-500/20",
  "bg-rose-500/20",
];

export default function TokenCounterTool() {
  const share = useShareableState<ShareState>();
  const [settings, setSettings] = useToolSettings("token-counter", {
    encoding: "o200k_base" as EncodingName,
  });
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState<number[] | null>(null);
  const [decoded, setDecoded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  // Re-tokenise whenever the text or encoding changes. Cancelled via `stale` so
  // a slow encoding load can't overwrite the result of a later keystroke.
  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError(null);

    loadEncoder(settings.encoding)
      .then((enc) => {
        if (stale) return;
        const ids = enc.encode(input);
        setTokens(ids);
        setDecoded(ids.slice(0, PREVIEW_LIMIT).map((id) => enc.decode([id])));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (stale) return;
        setError(e instanceof Error ? e.message : "Could not load the tokenizer.");
        setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [input, settings.encoding]);

  const stats = useMemo(() => {
    const tokenCount = tokens?.length ?? 0;
    const chars = input.length;
    const words = (input.match(/\S+/g) ?? []).length;
    return {
      tokenCount,
      chars,
      words,
      bytes: utf8Bytes(input),
      lines: input ? input.split("\n").length : 0,
      charsPerToken: tokenCount ? chars / tokenCount : 0,
      tokensPerWord: words ? tokenCount / words : 0,
    };
  }, [tokens, input]);

  const exportText = useMemo(
    () =>
      `Encoding: ${settings.encoding}
Tokens: ${stats.tokenCount}
Characters: ${stats.chars}
Words: ${stats.words}
Lines: ${stats.lines}
UTF-8 bytes: ${stats.bytes}
Characters per token: ${stats.charsPerToken.toFixed(2)}
Tokens per word: ${stats.tokensPerWord.toFixed(2)}`,
    [settings.encoding, stats],
  );

  const shareUrl = share.getShareUrl({ input });

  const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );

  const activeEncoding = ENCODINGS.find((e) => e.value === settings.encoding);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Text
          </h3>
          <SampleDataButton onLoad={() => setInput(SAMPLE)} />
        </header>

        <div>
          <Label htmlFor="tc-encoding" className="text-xs text-muted-foreground">
            Encoding
          </Label>
          <select
            id="tc-encoding"
            value={settings.encoding}
            onChange={(e) => setSettings({ ...settings, encoding: e.target.value as EncodingName })}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {ENCODINGS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          {activeEncoding && (
            <p className="mt-1.5 text-xs text-muted-foreground">{activeEncoding.note}</p>
          )}
        </div>

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={16}
          spellCheck={false}
          className="min-h-[340px] resize-y font-mono text-xs"
          placeholder="Paste a prompt to count its tokens…"
        />
      </section>

      <OutputPanel
        title="Token count"
        text={exportText}
        filename="token-count.txt"
        shareUrl={shareUrl}
      >
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat
                label="Tokens"
                value={loading && !tokens ? "…" : formatCount(stats.tokenCount)}
              />
              <Stat label="Characters" value={formatCount(stats.chars)} />
              <Stat label="Words" value={formatCount(stats.words)} />
              <Stat label="Lines" value={formatCount(stats.lines)} />
              <Stat label="UTF-8 bytes" value={formatCount(stats.bytes)} />
              <Stat label="Chars / token" value={stats.charsPerToken.toFixed(2)} />
            </div>

            <div className="mt-4">
              <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Token preview
                {stats.tokenCount > PREVIEW_LIMIT && (
                  <span className="ml-1.5 font-normal normal-case tracking-normal">
                    (first {PREVIEW_LIMIT} of {formatCount(stats.tokenCount)})
                  </span>
                )}
              </h4>
              {decoded.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Tokens appear here as you type. Each shaded block is one token - notice how
                  whitespace usually attaches to the word that follows it.
                </p>
              ) : (
                <div className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border p-3 font-mono text-xs leading-relaxed">
                  {decoded.map((piece, i) => (
                    <span
                      key={i}
                      className={`rounded-[2px] ${PREVIEW_COLORS[i % PREVIEW_COLORS.length]}`}
                      title={`Token ${i + 1}`}
                    >
                      {piece}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </OutputPanel>
    </div>
  );
}
