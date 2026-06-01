import JSON5 from "json5";
import { JSONPath } from "jsonpath-plus";
import { Braces, FileCode, Minimize2, SortAsc } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { JSONTree } from "react-json-tree";
import { toast } from "sonner";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE = `{
  "name": "DocnTools",
  "version": "1.0.0",
  "tools": [
    { "id": "json-formatter", "category": "dev", "popular": true },
    { "id": "qr-code", "category": "utilities", "popular": true },
    { "id": "merge-pdf", "category": "pdf", "popular": false }
  ],
  "stats": { "users": 12450, "uptime": 0.9997 }
}`;

type View = "tree" | "raw";
interface Settings {
  indent: number;
  sortKeys: boolean;
  view: View;
  tolerant: boolean;
}

function sortObj(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObj);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortObj((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

// React-json-tree theme - uses base16 keys; we drive from CSS tokens via inline.
const TREE_THEME = {
  scheme: "toolkithub",
  author: "lovable",
  base00: "transparent",
  base01: "#1f2937",
  base02: "#374151",
  base03: "#6b7280",
  base04: "#9ca3af",
  base05: "#d1d5db",
  base06: "#e5e7eb",
  base07: "#f3f4f6",
  base08: "#ef4444",
  base09: "#f59e0b",
  base0A: "#eab308",
  base0B: "#10b981",
  base0C: "#06b6d4",
  base0D: "#3b82f6",
  base0E: "#8b5cf6",
  base0F: "#ec4899",
};

interface ShareState {
  input: string;
  jsonpath: string;
}

export default function JsonFormatterTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("json-formatter", {
    indent: 2,
    sortKeys: false,
    view: "tree",
    tolerant: true,
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");
  const [jsonpath, setJsonpath] = useState("$..popular");

  useEffect(() => {
    if (share.initial) {
      setInput(share.initial.input);
      setJsonpath(share.initial.jsonpath);
    }
  }, [share.initial]);

  const parsed = useMemo<{ ok: true; value: unknown } | { ok: false; error: string }>(() => {
    if (!input.trim()) return { ok: false, error: "" };
    try {
      const value = settings.tolerant ? JSON5.parse(input) : JSON.parse(input);
      return { ok: true, value };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, settings.tolerant]);

  const formatted = useMemo(() => {
    if (!parsed.ok) return "";
    const value = settings.sortKeys ? sortObj(parsed.value) : parsed.value;
    return JSON.stringify(value, null, settings.indent);
  }, [parsed, settings.indent, settings.sortKeys]);

  const minified = useMemo(() => {
    if (!parsed.ok) return "";
    return JSON.stringify(settings.sortKeys ? sortObj(parsed.value) : parsed.value);
  }, [parsed, settings.sortKeys]);

  const jsonpathResult = useMemo(() => {
    if (!parsed.ok || !jsonpath.trim()) return null;
    try {
      const result = JSONPath({ path: jsonpath, json: parsed.value as object });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [parsed, jsonpath]);

  const stats = useMemo(() => {
    const bytes = new Blob([input]).size;
    const minBytes = minified ? new Blob([minified]).size : 0;
    const saved = bytes && minBytes ? Math.round((1 - minBytes / bytes) * 100) : 0;
    return { bytes, minBytes, saved };
  }, [input, minified]);

  const loadSample = () => setInput(SAMPLE);
  const handleMinify = () => setInput(minified);
  const handleFormat = () => setInput(formatted);
  const handleSort = () => {
    setSettings({ sortKeys: !settings.sortKeys });
    toast.success(settings.sortKeys ? "Keys: original order" : "Keys: sorted A→Z");
  };
  const shareUrl = share.getShareUrl({ input, jsonpath });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Input
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <SampleDataButton onLoad={loadSample} />
            <Button size="sm" variant="ghost" onClick={handleFormat} disabled={!parsed.ok}>
              <Braces className="h-4 w-4" /> Format
            </Button>
            <Button size="sm" variant="ghost" onClick={handleMinify} disabled={!parsed.ok}>
              <Minimize2 className="h-4 w-4" /> Minify
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSort} disabled={!parsed.ok}>
              <SortAsc className="h-4 w-4" /> {settings.sortKeys ? "Unsort" : "Sort keys"}
            </Button>
          </div>
        </header>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={20}
          spellCheck={false}
          className="min-h-[400px] resize-y font-mono text-xs"
          placeholder="Paste JSON here…"
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{stats.bytes.toLocaleString()} B</span>
          {stats.saved > 0 && <span>Minify saves {stats.saved}%</span>}
          <label className="ml-auto flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={settings.tolerant}
              onChange={(e) => setSettings({ tolerant: e.target.checked })}
            />
            Tolerant (JSON5: trailing commas, comments)
          </label>
        </div>
        {!parsed.ok && parsed.error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {parsed.error}
          </div>
        )}
        {parsed.ok && (
          <div className="rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 px-3 py-2 text-xs text-[color:var(--success)]">
            Valid JSON
          </div>
        )}
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        <OutputPanel
          title="Formatted output"
          text={formatted}
          filename="formatted.json"
          mime="application/json"
          shareUrl={shareUrl}
        >
          <Tabs value={settings.view} onValueChange={(v) => setSettings({ view: v as View })}>
            <TabsList className="mb-2">
              <TabsTrigger value="tree">Tree</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 pb-2 text-xs">
            <Label htmlFor="indent">Indent</Label>
            <Select
              value={String(settings.indent)}
              onValueChange={(v) => setSettings({ indent: Number(v) })}
            >
              <SelectTrigger id="indent" className="h-7 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
                <SelectItem value="0">Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {parsed.ok ? (
            settings.view === "tree" && mounted ? (
              <div className="max-h-[400px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                <JSONTree
                  data={parsed.value}
                  theme={TREE_THEME}
                  invertTheme={false}
                  hideRoot
                  shouldExpandNodeInitially={(_k, _d, level) => level < 2}
                />
              </div>
            ) : (
              <pre className="max-h-[400px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                {formatted}
              </pre>
            )
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Enter valid JSON to see the tree.
            </div>
          )}
        </OutputPanel>

        <OutputPanel title="JSONPath query" text={jsonpathResult || ""}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <Input
                value={jsonpath}
                onChange={(e) => setJsonpath(e.target.value)}
                placeholder="$..popular"
                className="font-mono text-xs"
              />
            </div>
            <pre className="max-h-[200px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {jsonpathResult ?? "-"}
            </pre>
            <p className="text-[11px] text-muted-foreground">
              Examples: <code>$.tools[*].id</code> · <code>$..popular</code> ·{" "}
              <code>$.tools[?(@.popular==true)]</code>
            </p>
          </div>
        </OutputPanel>
      </div>
      <ToolToaster />
    </div>
  );
}
