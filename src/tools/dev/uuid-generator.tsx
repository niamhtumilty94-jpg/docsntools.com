import { Copy, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5, v7 as uuidv7 } from "uuid";

import { OutputPanel } from "@/components/tool/output-panel";
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMounted } from "@/hooks/use-mounted";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

type Version = "v1" | "v4" | "v5" | "v7";

interface Settings {
  version: Version;
  count: number;
  uppercase: boolean;
  hyphens: boolean;
  v5Namespace: string;
  v5Name: string;
  format: "lines" | "csv" | "json";
}

const NAMESPACES: { value: string; label: string }[] = [
  { value: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", label: "DNS" },
  { value: "6ba7b811-9dad-11d1-80b4-00c04fd430c8", label: "URL" },
  { value: "6ba7b812-9dad-11d1-80b4-00c04fd430c8", label: "OID" },
  { value: "6ba7b814-9dad-11d1-80b4-00c04fd430c8", label: "X.500" },
];

function generate(settings: Settings): string[] {
  const out: string[] = [];
  for (let i = 0; i < settings.count; i++) {
    let id = "";
    if (settings.version === "v1") id = uuidv1();
    else if (settings.version === "v4") id = uuidv4();
    else if (settings.version === "v7") id = uuidv7();
    else id = uuidv5(settings.v5Name || `name-${i}`, settings.v5Namespace);
    if (settings.uppercase) id = id.toUpperCase();
    if (!settings.hyphens) id = id.replace(/-/g, "");
    out.push(id);
  }
  return out;
}

function format(ids: string[], fmt: Settings["format"]): string {
  if (fmt === "csv") return ids.map((id) => `"${id}"`).join(",");
  if (fmt === "json") return JSON.stringify(ids, null, 2);
  return ids.join("\n");
}

export default function UuidGeneratorTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("uuid-generator", {
    version: "v4",
    count: 10,
    uppercase: false,
    hyphens: true,
    v5Namespace: NAMESPACES[0].value,
    v5Name: "example.com",
    format: "lines",
  });

  // Bump key to force regeneration.
  const [bump, setBump] = useState(0);
  const ids = useMemo(() => (mounted ? generate(settings) : []), [settings, bump, mounted]);
  const output = useMemo(() => format(ids, settings.format), [ids, settings.format]);

  useEffect(() => {
    // Regenerate when version/v5 inputs change.
    setBump((b) => b + 1);
  }, [settings.version, settings.v5Namespace, settings.v5Name]);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Tabs
          value={settings.version}
          onValueChange={(v) => setSettings({ version: v as Version })}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="v1" className="text-xs">
              v1
            </TabsTrigger>
            <TabsTrigger value="v4" className="text-xs">
              v4
            </TabsTrigger>
            <TabsTrigger value="v5" className="text-xs">
              v5
            </TabsTrigger>
            <TabsTrigger value="v7" className="text-xs">
              v7
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {settings.version === "v1" && "Time-based with MAC address (legacy)."}
          {settings.version === "v4" && "Random - most common, secure."}
          {settings.version === "v5" && "Deterministic SHA-1 of namespace + name."}
          {settings.version === "v7" && "Time-ordered (sortable) - newest spec, great for DBs."}
        </p>

        {settings.version === "v5" && (
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Namespace</Label>
              <Select
                value={settings.v5Namespace}
                onValueChange={(v) => setSettings({ v5Namespace: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMESPACES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={settings.v5Name}
                onChange={(e) => setSettings({ v5Name: e.target.value })}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Count: {settings.count}</Label>
          <Slider
            min={1}
            max={1000}
            step={1}
            value={[settings.count]}
            onValueChange={(v) => setSettings({ count: v[0] })}
          />
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={settings.uppercase}
              onChange={(e) => setSettings({ uppercase: e.target.checked })}
            />
            Uppercase
          </Label>
          <Label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={settings.hyphens}
              onChange={(e) => setSettings({ hyphens: e.target.checked })}
            />
            Hyphens
          </Label>
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select
              value={settings.format}
              onValueChange={(v) => setSettings({ format: v as Settings["format"] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">One per line</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON array</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => setBump((b) => b + 1)} className="w-full">
          <RefreshCw className="h-4 w-4" /> Regenerate
        </Button>
      </section>

      <OutputPanel
        title={`${settings.count} UUID${settings.count === 1 ? "" : "s"}`}
        text={output}
        filename={`uuids.${settings.format === "json" ? "json" : settings.format === "csv" ? "csv" : "txt"}`}
        extra={[
          {
            label: "Copy first",
            icon: <Copy className="h-4 w-4" />,
            onClick: () => {
              if (ids[0]) navigator.clipboard.writeText(ids[0]);
            },
          },
        ]}
      >
        <pre className="max-h-[500px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          {output}
        </pre>
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
