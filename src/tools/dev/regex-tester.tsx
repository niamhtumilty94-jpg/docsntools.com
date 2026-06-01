import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

interface Settings {
  flagG: boolean;
  flagI: boolean;
  flagM: boolean;
  flagS: boolean;
  flagU: boolean;
  flagY: boolean;
  replacement: string;
}
interface ShareState {
  pattern: string;
  text: string;
  replacement: string;
}

const SAMPLE_PATTERN = "(\\w+)@(\\w+\\.\\w+)";
const SAMPLE_TEXT =
  "Send mail to ada@example.com or hopper@navy.mil - but never to root@localhost.\nMore: turing@bletchley.uk and lovelace@analytical.eng.";

const COMMON: { label: string; pattern: string; flags?: string }[] = [
  { label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+", flags: "g" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s]+", flags: "g" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { label: "Hex color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g" },
  { label: "ISO date", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g" },
  { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi" },
];

const GROUP_COLORS = [
  "var(--cat-pdf)",
  "var(--cat-image)",
  "var(--cat-text)",
  "var(--cat-dev)",
  "var(--cat-utilities)",
];

interface Match {
  index: number;
  end: number;
  value: string;
  groups: { start: number; end: number; value: string }[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

export default function RegexTesterTool() {
  const [settings, setSettings] = useToolSettings<Settings>("regex-tester", {
    flagG: true,
    flagI: false,
    flagM: false,
    flagS: false,
    flagU: false,
    flagY: false,
    replacement: "$1 [at] $2",
  });
  const share = useShareableState<ShareState>();
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (share.initial) {
      setPattern(share.initial.pattern);
      setText(share.initial.text);
      setSettings({ replacement: share.initial.replacement });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  const flags = useMemo(() => {
    let f = "";
    if (settings.flagG) f += "g";
    if (settings.flagI) f += "i";
    if (settings.flagM) f += "m";
    if (settings.flagS) f += "s";
    if (settings.flagU) f += "u";
    if (settings.flagY) f += "y";
    return f;
  }, [settings]);

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      return { regex: new RegExp(pattern, flags || undefined), error: null };
    } catch (e) {
      return { regex: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [pattern, flags]);

  const matches = useMemo<Match[]>(() => {
    if (!regex || !text) return [];
    const out: Match[] = [];
    if (settings.flagG) {
      let m: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((m = regex.exec(text)) !== null) {
        const groups: Match["groups"] = [];
        // Compute group offsets from cumulative matches inside m[0]
        let cursor = m.index;
        for (let i = 1; i < m.length; i++) {
          const g = m[i];
          if (g == null) continue;
          const at = text.indexOf(g, cursor);
          if (at >= 0) {
            groups.push({ start: at, end: at + g.length, value: g });
            cursor = at + g.length;
          }
        }
        out.push({ index: m.index, end: m.index + m[0].length, value: m[0], groups });
        if (m[0].length === 0) regex.lastIndex++;
        if (out.length > 5000) break;
      }
    } else {
      const m = regex.exec(text);
      if (m) {
        const groups: Match["groups"] = [];
        let cursor = m.index;
        for (let i = 1; i < m.length; i++) {
          const g = m[i];
          if (g == null) continue;
          const at = text.indexOf(g, cursor);
          if (at >= 0) {
            groups.push({ start: at, end: at + g.length, value: g });
            cursor = at + g.length;
          }
        }
        out.push({ index: m.index, end: m.index + m[0].length, value: m[0], groups });
      }
    }
    return out;
  }, [regex, text, settings.flagG]);

  const highlighted = useMemo(() => {
    if (!regex || matches.length === 0) return escapeHtml(text);
    const parts: string[] = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      parts.push(escapeHtml(text.slice(cursor, m.index)));
      // Build inner with group color overlay
      let inner = "";
      let innerCursor = m.index;
      const sortedGroups = [...m.groups].sort((a, b) => a.start - b.start);
      sortedGroups.forEach((g, gi) => {
        if (g.start > innerCursor) inner += escapeHtml(text.slice(innerCursor, g.start));
        const color = GROUP_COLORS[gi % GROUP_COLORS.length];
        inner += `<span style="background-color: color-mix(in oklab, ${color} 35%, transparent); border-radius:2px; padding:0 1px;">${escapeHtml(g.value)}</span>`;
        innerCursor = g.end;
      });
      if (innerCursor < m.end) inner += escapeHtml(text.slice(innerCursor, m.end));
      if (sortedGroups.length === 0) inner = escapeHtml(m.value);
      parts.push(
        `<mark data-match="${i}" style="background-color: color-mix(in oklab, var(--primary) 25%, transparent); border-radius:2px; padding:0 1px;">${inner}</mark>`,
      );
      cursor = m.end;
    });
    parts.push(escapeHtml(text.slice(cursor)));
    return parts.join("");
  }, [matches, text, regex]);

  const replaced = useMemo(() => {
    if (!regex) return "";
    try {
      return text.replace(regex, settings.replacement);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [regex, text, settings.replacement]);

  const shareUrl = share.getShareUrl({ pattern, text, replacement: settings.replacement });

  const flagToggle = (key: keyof Settings, label: string, hint: string) => (
    <Label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs">
      <input
        type="checkbox"
        checked={settings[key] as boolean}
        onChange={(e) => setSettings({ [key]: e.target.checked } as Partial<Settings>)}
      />
      <span className="font-mono">{label}</span>
      <span className="text-muted-foreground">{hint}</span>
    </Label>
  );

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pattern
          </h3>
          <div className="flex flex-wrap gap-1">
            {COMMON.map((c) => (
              <Button
                key={c.label}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPattern(c.pattern);
                  if (c.flags) {
                    setSettings({
                      flagG: c.flags.includes("g"),
                      flagI: c.flags.includes("i"),
                    });
                  }
                }}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </header>
        <div className="flex items-center gap-2">
          <span className="font-mono text-muted-foreground">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            className="flex-1 font-mono text-sm"
          />
          <span className="font-mono text-muted-foreground">/{flags}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {flagToggle("flagG", "g", "global")}
          {flagToggle("flagI", "i", "case-insensitive")}
          {flagToggle("flagM", "m", "multiline")}
          {flagToggle("flagS", "s", "dotall")}
          {flagToggle("flagU", "u", "unicode")}
          {flagToggle("flagY", "y", "sticky")}
        </div>
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Test string ({matches.length} match{matches.length === 1 ? "" : "es"})
            </h3>
            <SampleDataButton onLoad={() => { setPattern(SAMPLE_PATTERN); setText(SAMPLE_TEXT); }} />
          </header>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="resize-y font-mono text-xs"
          />
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <Label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Highlighted
            </Label>
            <div
              className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </section>

        <div className="space-y-4">
          <OutputPanel
            title="Replace preview"
            text={replaced}
            filename="replaced.txt"
            shareUrl={shareUrl}
          >
            <Input
              value={settings.replacement}
              onChange={(e) => setSettings({ replacement: e.target.value })}
              spellCheck={false}
              className="mb-2 font-mono text-xs"
              placeholder="$1, $2 - capture group references"
            />
            <pre className="max-h-[200px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {replaced || "-"}
            </pre>
          </OutputPanel>

          <section className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Match table
            </h3>
            {matches.length === 0 ? (
              <p className="text-xs text-muted-foreground">No matches.</p>
            ) : (
              <div className="max-h-[200px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card text-left text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1 pr-2">Index</th>
                      <th className="py-1 pr-2">Match</th>
                      <th className="py-1">Groups</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {matches.slice(0, 200).map((m, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1 pr-2 text-muted-foreground">{i}</td>
                        <td className="py-1 pr-2">{m.index}</td>
                        <td className="max-w-[120px] truncate py-1 pr-2">{m.value}</td>
                        <td className="py-1">
                          {m.groups.map((g, gi) => (
                            <span
                              key={gi}
                              className="mr-1 inline-block rounded px-1"
                              style={{
                                backgroundColor: `color-mix(in oklab, ${
                                  GROUP_COLORS[gi % GROUP_COLORS.length]
                                } 30%, transparent)`,
                              }}
                            >
                              {g.value}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
      <ToolToaster />
    </div>
  );
}
