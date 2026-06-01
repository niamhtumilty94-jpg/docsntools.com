import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE = `The best tools disappear into the work. They feel inevitable - like the writer thought of them in the same breath as the sentence itself. DocnTools aims for that quality: a hundred small utilities that respect your time, your privacy, and your attention.

Every tool runs entirely in your browser. Nothing is uploaded. Nothing is tracked. The point is to make the boring parts vanish so the interesting parts can show up.`;

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

interface ShareState {
  input: string;
}

export default function WordCounterTool() {
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  const stats = useMemo(() => {
    const text = input;
    const words = text.match(/\S+/g) ?? [];
    const wordCount = words.length;
    const charsAll = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = (text.match(/[^.!?]+[.!?]+/g) ?? []).length || (text.trim() ? 1 : 0);
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean).length;
    const lines = text.split(/\n/).length;
    const readingTime = wordCount / 200;
    const speakingTime = wordCount / 130;

    const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
    const flesch =
      wordCount && sentences
        ? 0.39 * (wordCount / sentences) + 11.8 * (totalSyllables / wordCount) - 15.59
        : 0;

    const freq = new Map<string, number>();
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "but", "of", "in", "on", "at", "to", "for", "with",
      "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that",
      "as", "by", "from", "you", "your", "we", "our", "i", "me", "my", "they", "them",
      "their", "he", "she", "his", "her", "have", "has", "had", "do", "does", "did",
      "not", "if", "so", "than", "then", "what", "which", "who", "all", "can", "will",
    ]);
    for (const w of words) {
      const key = w.toLowerCase().replace(/[^a-z0-9-']/g, "");
      if (!key || stopwords.has(key)) continue;
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    const keywords = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({
        word,
        count,
        density: wordCount ? (count / wordCount) * 100 : 0,
      }));

    return {
      words: wordCount,
      charsAll,
      charsNoSpaces,
      sentences,
      paragraphs,
      lines,
      readingTime,
      speakingTime,
      flesch,
      keywords,
    };
  }, [input]);

  const fmtTime = (m: number) => {
    if (m < 1) return `${Math.round(m * 60)}s`;
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return sec ? `${min}m ${sec}s` : `${min}m`;
  };

  const exportText = useMemo(
    () =>
      `Words: ${stats.words}
Characters: ${stats.charsAll}
Characters (no spaces): ${stats.charsNoSpaces}
Sentences: ${stats.sentences}
Paragraphs: ${stats.paragraphs}
Lines: ${stats.lines}
Reading time: ${fmtTime(stats.readingTime)}
Speaking time: ${fmtTime(stats.speakingTime)}
Flesch reading ease: ${stats.flesch.toFixed(1)}

Top keywords:
${stats.keywords.map((k) => `  ${k.word.padEnd(20)} ${k.count}  (${k.density.toFixed(2)}%)`).join("\n")}`,
    [stats],
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

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Text
          </h3>
          <SampleDataButton onLoad={() => setInput(SAMPLE)} />
        </header>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={20}
          spellCheck={false}
          className="min-h-[420px] resize-y"
          placeholder="Paste or type text here…"
        />
      </section>

      <OutputPanel
        title="Statistics"
        text={exportText}
        filename="text-stats.txt"
        shareUrl={shareUrl}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Words" value={stats.words.toLocaleString()} />
          <Stat label="Characters" value={stats.charsAll.toLocaleString()} />
          <Stat label="No spaces" value={stats.charsNoSpaces.toLocaleString()} />
          <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
          <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
          <Stat label="Lines" value={stats.lines.toLocaleString()} />
          <Stat label="Read" value={fmtTime(stats.readingTime)} />
          <Stat label="Speak" value={fmtTime(stats.speakingTime)} />
          <Stat label="Flesch" value={stats.flesch.toFixed(1)} />
        </div>
        <div className="mt-4">
          <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top keywords
          </h4>
          <div className="max-h-[240px] overflow-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 text-left">
                <tr>
                  <th className="px-3 py-1.5 font-medium">Word</th>
                  <th className="px-3 py-1.5 text-right font-medium">Count</th>
                  <th className="px-3 py-1.5 text-right font-medium">Density</th>
                </tr>
              </thead>
              <tbody>
                {stats.keywords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground">
                      -
                    </td>
                  </tr>
                )}
                {stats.keywords.map((k) => (
                  <tr key={k.word} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono">{k.word}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{k.count}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      {k.density.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
