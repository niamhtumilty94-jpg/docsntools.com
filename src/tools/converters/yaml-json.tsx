import yaml from "js-yaml";
import { useEffect, useMemo, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
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

const SAMPLE_YAML = `name: DocnTools
version: 1.0.0
features:
  - name: PDF Tools
    count: 10
  - name: Dev Tools
    count: 8
stats:
  users: 12450
  uptime: 0.9997
  features_enabled:
    - search
    - share-links
    - dark-mode`;

const SAMPLE_JSON = `{
  "name": "DocnTools",
  "version": "1.0.0",
  "features": [
    { "name": "PDF Tools", "count": 10 },
    { "name": "Dev Tools", "count": 8 }
  ]
}`;

type Direction = "yaml2json" | "json2yaml";
interface Settings {
  direction: Direction;
  indent: number;
  flowLevel: number;
}
interface ShareState {
  input: string;
  direction: Direction;
}

export default function YamlJsonTool() {
  const [settings, setSettings] = useToolSettings<Settings>("yaml-json", {
    direction: "yaml2json",
    indent: 2,
    flowLevel: -1,
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (share.initial) {
      setInput(share.initial.input);
      setSettings({ direction: share.initial.direction });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  const result = useMemo<{ ok: true; output: string } | { ok: false; error: string }>(() => {
    try {
      if (settings.direction === "yaml2json") {
        const obj = yaml.load(input);
        return { ok: true, output: JSON.stringify(obj, null, settings.indent) };
      }
      const obj: unknown = JSON.parse(input);
      const out = yaml.dump(obj, {
        indent: settings.indent,
        flowLevel: settings.flowLevel,
        noRefs: true,
        sortKeys: false,
      });
      return { ok: true, output: out };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, settings]);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const text = await f.text();
    setInput(text);
    if (/\.json$/i.test(f.name)) setSettings({ direction: "json2yaml" });
    else setSettings({ direction: "yaml2json" });
  };

  const swapSample = () => {
    setInput(settings.direction === "yaml2json" ? SAMPLE_YAML : SAMPLE_JSON);
  };

  const shareUrl = share.getShareUrl({ input, direction: settings.direction });
  const outFilename = settings.direction === "yaml2json" ? "data.json" : "data.yaml";

  return (
    <FullPageDropZone onFiles={onFiles} accept=".yaml or .json">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={settings.direction}
              onValueChange={(v) => setSettings({ direction: v as Direction })}
            >
              <TabsList>
                <TabsTrigger value="yaml2json">YAML → JSON</TabsTrigger>
                <TabsTrigger value="json2yaml">JSON → YAML</TabsTrigger>
              </TabsList>
            </Tabs>
            <SampleDataButton onLoad={swapSample} />
          </header>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={20}
            spellCheck={false}
            className="min-h-[440px] resize-y font-mono text-xs"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Indent</Label>
              <Select
                value={String(settings.indent)}
                onValueChange={(v) => setSettings({ indent: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.direction === "json2yaml" && (
              <div>
                <Label className="text-xs">Style</Label>
                <Select
                  value={String(settings.flowLevel)}
                  onValueChange={(v) => setSettings({ flowLevel: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Block (default)</SelectItem>
                    <SelectItem value="0">Flow</SelectItem>
                    <SelectItem value="2">Block top, flow nested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </section>

        <OutputPanel
          title="Output"
          text={result.ok ? result.output : ""}
          filename={outFilename}
          mime={settings.direction === "yaml2json" ? "application/json" : "application/x-yaml"}
          shareUrl={shareUrl}
        >
          {result.ok ? (
            <pre className="max-h-[520px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {result.output}
            </pre>
          ) : (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {result.error}
            </div>
          )}
        </OutputPanel>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
