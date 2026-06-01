import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

type Mode = "encode" | "decode" | "encodeComponent";
interface Settings {
  mode: Mode;
}
interface ShareState {
  text: string;
  mode: Mode;
}

const SAMPLE = "https://toolkithub.app/search?q=hello world&tags=dev,tools&n=42";

export default function UrlEncoderTool() {
  const [settings, setSettings] = useToolSettings<Settings>("url-encoder", { mode: "encode" });
  const share = useShareableState<ShareState>();
  const [text, setText] = useState("");

  useEffect(() => {
    if (share.initial) {
      setText(share.initial.text);
      setSettings({ mode: share.initial.mode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  const output = useMemo(() => {
    try {
      if (settings.mode === "encode") return encodeURI(text);
      if (settings.mode === "encodeComponent") return encodeURIComponent(text);
      return decodeURIComponent(text);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [text, settings.mode]);

  // URL parser for paste-a-URL view.
  const parsed = useMemo(() => {
    try {
      const u = new URL(text);
      const params = Array.from(u.searchParams.entries()).map(([k, v]) => ({ k, v }));
      return { url: u, params };
    } catch {
      return null;
    }
  }, [text]);

  const [paramsDraft, setParamsDraft] = useState<{ k: string; v: string }[]>([]);
  useEffect(() => {
    if (parsed) setParamsDraft(parsed.params);
  }, [parsed]);

  const rebuiltUrl = useMemo(() => {
    if (!parsed) return null;
    const u = new URL(parsed.url.toString());
    u.search = "";
    paramsDraft.forEach(({ k, v }) => {
      if (k) u.searchParams.append(k, v);
    });
    return u.toString();
  }, [parsed, paramsDraft]);

  const updateParam = (i: number, patch: Partial<{ k: string; v: string }>) =>
    setParamsDraft((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removeParam = (i: number) =>
    setParamsDraft((arr) => arr.filter((_, idx) => idx !== i));
  const addParam = () => setParamsDraft((arr) => [...arr, { k: "", v: "" }]);

  const shareUrl = share.getShareUrl({ text, mode: settings.mode });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Input
            </h3>
            <SampleDataButton onLoad={() => setText(SAMPLE)} />
          </header>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tabs
              value={settings.mode}
              onValueChange={(v) => setSettings({ mode: v as Mode })}
            >
              <TabsList className="h-7">
                <TabsTrigger value="encode" className="text-[11px]">
                  Encode URI
                </TabsTrigger>
                <TabsTrigger value="encodeComponent" className="text-[11px]">
                  Encode Component
                </TabsTrigger>
                <TabsTrigger value="decode" className="text-[11px]">
                  Decode
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setText(output)}
              aria-label="Swap"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="resize-y break-all font-mono text-xs"
          />
        </section>

        <OutputPanel
          title="Output"
          text={output}
          filename="output.txt"
          shareUrl={shareUrl}
        >
          <pre className="max-h-[260px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
            {output || "-"}
          </pre>
        </OutputPanel>
      </div>

      {parsed && (
        <section className="rounded-lg border border-border bg-card p-4">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              URL components
            </h3>
            <Button size="sm" variant="ghost" onClick={addParam}>
              <Plus className="h-4 w-4" /> Add param
            </Button>
          </header>
          <dl className="mb-4 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">Protocol</dt>
            <dd className="font-mono">{parsed.url.protocol}</dd>
            <dt className="text-muted-foreground">Host</dt>
            <dd className="font-mono">{parsed.url.host}</dd>
            <dt className="text-muted-foreground">Pathname</dt>
            <dd className="font-mono">{parsed.url.pathname}</dd>
            {parsed.url.hash && (
              <>
                <dt className="text-muted-foreground">Hash</dt>
                <dd className="font-mono break-all">{parsed.url.hash}</dd>
              </>
            )}
          </dl>
          <div className="space-y-2">
            <Label className="text-xs">Query parameters</Label>
            {paramsDraft.length === 0 && (
              <p className="text-xs text-muted-foreground">No query parameters.</p>
            )}
            {paramsDraft.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={p.k}
                  onChange={(e) => updateParam(i, { k: e.target.value })}
                  placeholder="key"
                  className="h-8 font-mono text-xs"
                />
                <Input
                  value={p.v}
                  onChange={(e) => updateParam(i, { v: e.target.value })}
                  placeholder="value"
                  className="h-8 font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParam(i)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {rebuiltUrl && rebuiltUrl !== text && (
            <div className="mt-3 space-y-1">
              <Label className="text-xs">Rebuilt URL</Label>
              <div className="flex items-center gap-2">
                <pre className="flex-1 overflow-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-xs">
                  {rebuiltUrl}
                </pre>
                <Button size="sm" variant="outline" onClick={() => setText(rebuiltUrl)}>
                  Use
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
      <ToolToaster />
    </div>
  );
}
