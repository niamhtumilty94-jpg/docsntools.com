import DMP from "diff-match-patch";
import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE_A = `The quick brown fox jumps over the lazy dog.
Line two stays the same.
Line three will change.
Last line.`;
const SAMPLE_B = `The quick brown fox leaps over the lazy dog.
Line two stays the same.
Line three has changed.
A new line!
Last line.`;

type Granularity = "char" | "word" | "line";
type View = "side" | "inline";

interface Settings {
  granularity: Granularity;
  view: View;
  ignoreWs: boolean;
}
interface ShareState {
  a: string;
  b: string;
}

const dmp = new DMP.diff_match_patch();

function diffWith(a: string, b: string, granularity: Granularity): [number, string][] {
  if (granularity === "char") {
    const d = dmp.diff_main(a, b);
    dmp.diff_cleanupSemantic(d);
    return d as [number, string][];
  }
  if (granularity === "line") {
    const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(a, b);
    const d = dmp.diff_main(chars1, chars2, false);
    dmp.diff_charsToLines_(d, lineArray);
    return d as [number, string][];
  }
  // word: split on whitespace boundaries
  const splitWords = (s: string) => s.match(/\S+|\s+/g) ?? [];
  const wA = splitWords(a);
  const wB = splitWords(b);
  const map = new Map<string, string>();
  let next = 0;
  const enc = (arr: string[]) =>
    arr
      .map((w) => {
        if (!map.has(w)) map.set(w, String.fromCharCode(0xe000 + next++));
        return map.get(w)!;
      })
      .join("");
  const eA = enc(wA);
  const eB = enc(wB);
  const d = dmp.diff_main(eA, eB, false);
  const lookup = new Map<string, string>();
  for (const [w, code] of map.entries()) lookup.set(code, w);
  return d.map(([op, text]) => [
    op,
    text
      .split("")
      .map((c) => lookup.get(c) ?? c)
      .join(""),
  ]) as [number, string][];
}

export default function TextDiffTool() {
  const [settings, setSettings] = useToolSettings<Settings>("text-diff", {
    granularity: "word",
    view: "side",
    ignoreWs: false,
  });
  const share = useShareableState<ShareState>();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    if (share.initial) {
      setA(share.initial.a);
      setB(share.initial.b);
    }
  }, [share.initial]);

  const { diffs, stats } = useMemo(() => {
    const aIn = settings.ignoreWs ? a.replace(/\s+/g, " ").trim() : a;
    const bIn = settings.ignoreWs ? b.replace(/\s+/g, " ").trim() : b;
    const d = diffWith(aIn, bIn, settings.granularity);
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (const [op, t] of d) {
      if (op === 1) added += t.length;
      else if (op === -1) removed += t.length;
      else unchanged += t.length;
    }
    return { diffs: d, stats: { added, removed, unchanged } };
  }, [a, b, settings]);

  const renderInline = () => (
    <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
      {diffs.map(([op, text], i) => {
        if (op === 1)
          return (
            <span
              key={i}
              className="rounded-sm bg-[color:var(--success)]/25 text-[color:var(--success)]"
            >
              {text}
            </span>
          );
        if (op === -1)
          return (
            <span key={i} className="rounded-sm bg-destructive/25 text-destructive line-through">
              {text}
            </span>
          );
        return <span key={i}>{text}</span>;
      })}
    </pre>
  );

  const renderSide = () => {
    const left: React.ReactNode[] = [];
    const right: React.ReactNode[] = [];
    diffs.forEach(([op, text], i) => {
      if (op === 0) {
        left.push(<span key={`l${i}`}>{text}</span>);
        right.push(<span key={`r${i}`}>{text}</span>);
      } else if (op === -1) {
        left.push(
          <span key={`l${i}`} className="bg-destructive/25 text-destructive">
            {text}
          </span>,
        );
      } else {
        right.push(
          <span
            key={`r${i}`}
            className="bg-[color:var(--success)]/25 text-[color:var(--success)]"
          >
            {text}
          </span>,
        );
      }
    });
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          {left}
        </pre>
        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          {right}
        </pre>
      </div>
    );
  };

  const shareUrl = share.getShareUrl({ a, b });
  const exportText = diffs
    .map(([op, t]) => (op === 1 ? `+ ${t}` : op === -1 ? `- ${t}` : `  ${t}`))
    .join("");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-8 items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original
            </h3>
            <SampleDataButton onLoad={() => { setA(SAMPLE_A); setB(SAMPLE_B); }} />
          </div>
          <Textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            rows={12}
            spellCheck={false}
            className="min-h-[240px] resize-y font-mono text-xs"
          />
        </section>
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-8 items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Changed
            </h3>
          </div>
          <Textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={12}
            spellCheck={false}
            className="min-h-[240px] resize-y font-mono text-xs"
          />
        </section>
      </div>

      <OutputPanel title="Diff" text={exportText} filename="diff.txt" shareUrl={shareUrl}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Granularity</Label>
            <Select
              value={settings.granularity}
              onValueChange={(v) => setSettings({ granularity: v as Granularity })}
            >
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="char">Character</SelectItem>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tabs value={settings.view} onValueChange={(v) => setSettings({ view: v as View })}>
            <TabsList>
              <TabsTrigger value="side">Side-by-side</TabsTrigger>
              <TabsTrigger value="inline">Inline</TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={settings.ignoreWs}
              onChange={(e) => setSettings({ ignoreWs: e.target.checked })}
            />
            Ignore whitespace
          </label>
          <div className="ml-auto flex gap-3 text-xs">
            <span className="text-[color:var(--success)]">+{stats.added}</span>
            <span className="text-destructive">−{stats.removed}</span>
            <span className="text-muted-foreground">={stats.unchanged}</span>
          </div>
        </div>
        {settings.view === "side" ? renderSide() : renderInline()}
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
