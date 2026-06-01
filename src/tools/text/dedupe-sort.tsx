import { orderBy } from "natural-orderby";
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
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE = `file10.txt
file2.txt
file1.txt
File1.txt
  banana
apple
Banana
cherry
banana
file20.txt`;

type SortMode = "none" | "alpha" | "natural" | "length" | "numeric" | "reverse" | "shuffle";
interface Settings {
  trim: boolean;
  removeEmpty: boolean;
  dedupe: boolean;
  caseInsensitive: boolean;
  sort: SortMode;
  direction: "asc" | "desc";
}
interface ShareState {
  input: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DedupeSortTool() {
  const [settings, setSettings] = useToolSettings<Settings>("dedupe-sort", {
    trim: true,
    removeEmpty: true,
    dedupe: true,
    caseInsensitive: false,
    sort: "natural",
    direction: "asc",
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  const { output, originalCount, finalCount, dupesRemoved } = useMemo(() => {
    let lines = input.split(/\r?\n/);
    const original = lines.length;
    if (settings.trim) lines = lines.map((l) => l.trim());
    if (settings.removeEmpty) lines = lines.filter((l) => l.length > 0);

    let dupes = 0;
    if (settings.dedupe) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const l of lines) {
        const key = settings.caseInsensitive ? l.toLowerCase() : l;
        if (seen.has(key)) {
          dupes++;
          continue;
        }
        seen.add(key);
        out.push(l);
      }
      lines = out;
    }

    if (settings.sort === "alpha") {
      lines = [...lines].sort((a, b) =>
        settings.caseInsensitive
          ? a.toLowerCase().localeCompare(b.toLowerCase())
          : a.localeCompare(b),
      );
    } else if (settings.sort === "natural") {
      lines = orderBy(lines, [(v) => v]);
    } else if (settings.sort === "length") {
      lines = [...lines].sort((a, b) => a.length - b.length);
    } else if (settings.sort === "numeric") {
      lines = [...lines].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
    } else if (settings.sort === "shuffle") {
      lines = shuffle(lines);
    } else if (settings.sort === "reverse") {
      lines = [...lines].reverse();
    }
    if (settings.direction === "desc" && settings.sort !== "shuffle" && settings.sort !== "reverse" && settings.sort !== "none") {
      lines = [...lines].reverse();
    }

    return {
      output: lines.join("\n"),
      originalCount: original,
      finalCount: lines.length,
      dupesRemoved: dupes,
    };
  }, [input, settings]);

  const shareUrl = share.getShareUrl({ input });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lines
          </h3>
          <SampleDataButton onLoad={() => setInput(SAMPLE)} />
        </header>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          spellCheck={false}
          className="min-h-[380px] resize-y font-mono text-xs"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Sort</Label>
            <Select
              value={settings.sort}
              onValueChange={(v) => setSettings({ sort: v as SortMode })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No sort</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="natural">Natural (file2 &lt; file10)</SelectItem>
                <SelectItem value="length">By length</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
                <SelectItem value="shuffle">Shuffle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Direction</Label>
            <Select
              value={settings.direction}
              onValueChange={(v) => setSettings({ direction: v as "asc" | "desc" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {(["trim", "removeEmpty", "dedupe", "caseInsensitive"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings[k]}
                onChange={(e) => setSettings({ [k]: e.target.checked } as Partial<Settings>)}
              />
              {k}
            </label>
          ))}
        </div>
      </section>

      <OutputPanel title="Result" text={output} filename="lines.txt" shareUrl={shareUrl}>
        <div className="mb-2 flex gap-3 text-xs text-muted-foreground">
          <span>{originalCount} → {finalCount} lines</span>
          {dupesRemoved > 0 && <span>{dupesRemoved} duplicates removed</span>}
        </div>
        <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          {output}
        </pre>
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
