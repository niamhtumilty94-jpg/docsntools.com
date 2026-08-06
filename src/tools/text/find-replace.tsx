import { useEffect, useMemo, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE = `The quick brown fox jumps over the lazy dog.
The Quick brown FOX jumps over the lazy DOG.
foo bar foo baz foo qux`;

interface Settings {
  regex: boolean;
  caseSensitive: boolean;
  multiline: boolean;
  global: boolean;
  dotAll: boolean;
}
interface ShareState {
  input: string;
  find: string;
  replace: string;
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function FindReplaceTool() {
  const [settings, setSettings] = useToolSettings<Settings>("find-replace", {
    regex: false,
    caseSensitive: false,
    multiline: false,
    global: true,
    dotAll: false,
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  useEffect(() => {
    if (share.initial) {
      setInput(share.initial.input);
      setFind(share.initial.find);
      setReplace(share.initial.replace);
    }
  }, [share.initial]);

  const compiled = useMemo<{ ok: true; re: RegExp } | { ok: false; error: string } | null>(() => {
    if (!find) return null;
    const flags =
      (settings.global ? "g" : "") +
      (settings.caseSensitive ? "" : "i") +
      (settings.multiline ? "m" : "") +
      (settings.dotAll ? "s" : "");
    try {
      const pattern = settings.regex ? find : escapeReg(find);
      return { ok: true, re: new RegExp(pattern, flags) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [find, settings]);

  const matchCount = useMemo(() => {
    if (!compiled || !compiled.ok) return 0;
    const re = new RegExp(
      compiled.re.source,
      compiled.re.flags.includes("g") ? compiled.re.flags : compiled.re.flags + "g",
    );
    return [...input.matchAll(re)].length;
  }, [compiled, input]);

  const output = useMemo(() => {
    if (!compiled || !compiled.ok) return input;
    if (replace === "") return input;
    try {
      return input.replace(compiled.re, replace);
    } catch (e) {
      return `Replace error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [compiled, input, replace]);

  const highlighted = useMemo(() => {
    if (!compiled || !compiled.ok) return null;
    const re = new RegExp(
      compiled.re.source,
      compiled.re.flags.includes("g") ? compiled.re.flags : compiled.re.flags + "g",
    );
    const out: React.ReactNode[] = [];
    let last = 0;
    let i = 0;
    for (const m of input.matchAll(re)) {
      const start = m.index ?? 0;
      if (start > last) out.push(input.slice(last, start));
      out.push(
        <mark key={i++} className="rounded-sm bg-[color:var(--success)]/30 px-0.5 text-foreground">
          {m[0]}
        </mark>,
      );
      last = start + m[0].length;
    }
    if (last < input.length) out.push(input.slice(last));
    return out;
  }, [compiled, input]);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setInput(await f.text());
  };

  const shareUrl = share.getShareUrl({ input, find, replace });

  return (
    <FullPageDropZone onFiles={onFiles} accept="text files">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Input
            </h3>
            <SampleDataButton
              onLoad={() => {
                setInput(SAMPLE);
                setFind("fox");
                setReplace("CAT");
              }}
            />
          </header>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="find" className="text-xs">
                Find
              </Label>
              <Input
                id="find"
                value={find}
                onChange={(e) => setFind(e.target.value)}
                placeholder={settings.regex ? "Pattern…" : "Text to find"}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="replace" className="text-xs">
                Replace {settings.regex && <span className="text-muted-foreground">($1, $2…)</span>}
              </Label>
              <Input
                id="replace"
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                placeholder="Replacement"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {(["regex", "caseSensitive", "multiline", "global", "dotAll"] as const).map((k) => (
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
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            spellCheck={false}
            className="min-h-[280px] resize-y font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">{matchCount} matches</span>
            {compiled && !compiled.ok && <span className="text-destructive">{compiled.error}</span>}
          </div>
          <div>
            <h4 className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Highlighted matches
            </h4>
            <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {highlighted ?? input}
            </pre>
          </div>
        </section>

        <OutputPanel
          title="Replaced output"
          text={output}
          filename="replaced.txt"
          shareUrl={shareUrl}
        >
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
            {output}
          </pre>
        </OutputPanel>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
