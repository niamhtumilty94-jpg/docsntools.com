import DOMPurify from "dompurify";
import { optimize, type Config, type PluginConfig } from "svgo";
import { useEffect, useMemo, useState } from "react";

/**
 * Sanitizes SVG markup before injecting it into the DOM. Strips <script>,
 * inline event handlers, and javascript: URLs to prevent XSS via shared
 * URL hashes (the source SVG is restored from the URL on load).
 */
function sanitizeSvg(svg: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

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
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { formatBytes } from "@/tools/_shared/utils";

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with care -->
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <metadata>
    <title>Sample SVG</title>
    <desc>A simple example for the optimizer.</desc>
  </metadata>
  <g id="layer1">
    <g id="group1">
      <circle cx="100.000" cy="100.000" r="80.000" fill="#3b82f6" stroke="#1e40af" stroke-width="4.0000"/>
      <path d="M 100.0000,40.0000 L 140.0000,160.0000 L 60.0000,160.0000 Z" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

type Preset = "default" | "aggressive" | "safe";
interface Settings {
  preset: Preset;
  removeComments: boolean;
  removeMetadata: boolean;
  collapseGroups: boolean;
  prefixIds: boolean;
  multipass: boolean;
}
interface ShareState {
  input: string;
}

function buildConfig(s: Settings): Config {
  const plugins: PluginConfig[] = [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeComments: s.removeComments,
          removeMetadata: s.removeMetadata,
          collapseGroups: s.collapseGroups,
          cleanupIds: s.preset !== "safe",
          removeViewBox: false,
          inlineStyles: s.preset === "aggressive",
          mergePaths: s.preset === "aggressive",
        },
      },
    } as PluginConfig,
  ];
  if (s.prefixIds) {
    plugins.push({ name: "prefixIds", params: { prefix: "svg" } } as PluginConfig);
  }
  return { multipass: s.multipass, plugins };
}

export default function SvgOptimizerTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("svg-optimizer", {
    preset: "default",
    removeComments: true,
    removeMetadata: true,
    collapseGroups: true,
    prefixIds: false,
    multipass: false,
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  const result = useMemo<{ ok: true; output: string } | { ok: false; error: string }>(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      const out = optimize(input, buildConfig(settings));
      if ("error" in out && out.error) {
        return { ok: false, error: String(out.error) };
      }
      return { ok: true, output: out.data };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, settings]);

  const stats = useMemo(() => {
    const original = new Blob([input]).size;
    const optimized = result.ok ? new Blob([result.output]).size : 0;
    const saved = original && optimized ? Math.round((1 - optimized / original) * 100) : 0;
    return { original, optimized, saved };
  }, [input, result]);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setInput(await f.text());
  };

  const shareUrl = share.getShareUrl({ input });

  return (
    <FullPageDropZone onFiles={onFiles} accept="SVG file">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Source SVG
            </h3>
            <SampleDataButton onLoad={() => setInput(SAMPLE_SVG)} />
          </header>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            spellCheck={false}
            className="min-h-[280px] resize-y font-mono text-xs"
          />
          {mounted && input.trim() && (
            <div className="rounded-md border border-border bg-[color-mix(in_oklab,white_50%,transparent)] p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Source preview
              </div>
              <div
                className="flex min-h-[120px] items-center justify-center"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(input) }}
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Preset</Label>
              <Select
                value={settings.preset}
                onValueChange={(v) => setSettings({ preset: v as Preset })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe">Safe (preserve structure)</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {(
              [
                ["removeComments", "Remove comments"],
                ["removeMetadata", "Remove metadata"],
                ["collapseGroups", "Collapse groups"],
                ["prefixIds", "Prefix IDs"],
                ["multipass", "Multipass"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings[k]}
                  onChange={(e) => setSettings({ [k]: e.target.checked } as Partial<Settings>)}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <OutputPanel
          title="Optimized"
          text={result.ok ? result.output : ""}
          filename="optimized.svg"
          mime="image/svg+xml"
          shareUrl={shareUrl}
        >
          <div className="mb-2 flex flex-wrap gap-3 text-xs">
            <span className="text-muted-foreground">{formatBytes(stats.original)} →</span>
            <span className="font-medium">{formatBytes(stats.optimized)}</span>
            {stats.saved > 0 && (
              <span className="text-[color:var(--success)]">−{stats.saved}%</span>
            )}
          </div>
          {result.ok ? (
            <>
              {mounted && result.output && (
                <div className="mb-3 rounded-md border border-border bg-[color-mix(in_oklab,white_50%,transparent)] p-3">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Optimized preview
                  </div>
                  <div
                    className="flex min-h-[120px] items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(result.output) }}
                  />
                </div>
              )}
              <pre className="max-h-[300px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                {result.output}
              </pre>
            </>
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
