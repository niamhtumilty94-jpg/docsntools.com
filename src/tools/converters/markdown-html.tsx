import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";
import { useEffect, useMemo, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE_MD = `# DocnTools

A collection of **fast, private** browser tools.

## Features

- Runs entirely client-side
- No signup, no upload limits
- Works on mobile

| Tool | Category |
|------|----------|
| Merge PDF | PDF |
| JSON Formatter | Dev |

> Built with care.

\`\`\`js
console.log("Hello world");
\`\`\`

- [x] Phase 1
- [x] Phase 2
- [ ] Phase 3
`;

const SAMPLE_HTML = `<h1>DocnTools</h1>
<p>A collection of <strong>fast, private</strong> browser tools.</p>
<ul><li>Runs in your browser</li><li>No signup</li></ul>
<blockquote><p>Built with care.</p></blockquote>`;

type Direction = "md2html" | "html2md";
interface Settings {
  direction: Direction;
  view: "preview" | "raw";
  gfm: boolean;
  breaks: boolean;
}
interface ShareState {
  source: string;
  direction: Direction;
}

marked.setOptions({ gfm: true, breaks: false });

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export default function MarkdownHtmlTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("markdown-html", {
    direction: "md2html",
    view: "preview",
    gfm: true,
    breaks: false,
  });
  const share = useShareableState<ShareState>();
  const [source, setSource] = useState("");

  useEffect(() => {
    if (share.initial) {
      setSource(share.initial.source);
      setSettings({ direction: share.initial.direction });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  useEffect(() => {
    marked.setOptions({ gfm: settings.gfm, breaks: settings.breaks });
  }, [settings.gfm, settings.breaks]);

  const output = useMemo(() => {
    try {
      if (settings.direction === "md2html") {
        return marked.parse(source) as string;
      }
      return td.turndown(source);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [source, settings.direction]);

  const safeHtml = useMemo(() => {
    if (settings.direction !== "md2html" || !mounted) return "";
    return DOMPurify.sanitize(output);
  }, [output, settings.direction, mounted]);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const text = await f.text();
    setSource(text);
    if (/\.html?$/i.test(f.name)) setSettings({ direction: "html2md" });
    else setSettings({ direction: "md2html" });
  };

  const swapSample = () => {
    if (settings.direction === "md2html") setSource(SAMPLE_MD);
    else setSource(SAMPLE_HTML);
  };

  const shareUrl = share.getShareUrl({ source, direction: settings.direction });

  return (
    <FullPageDropZone onFiles={onFiles} accept=".md or .html">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {settings.direction === "md2html" ? "Markdown" : "HTML"}
            </h3>
            <div className="flex items-center gap-2">
              <Tabs
                value={settings.direction}
                onValueChange={(v) => setSettings({ direction: v as Direction })}
              >
                <TabsList>
                  <TabsTrigger value="md2html">MD → HTML</TabsTrigger>
                  <TabsTrigger value="html2md">HTML → MD</TabsTrigger>
                </TabsList>
              </Tabs>
              <SampleDataButton onLoad={swapSample} />
            </div>
          </header>
          <Textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={20}
            spellCheck={false}
            className="min-h-[460px] resize-y font-mono text-xs"
          />
          {settings.direction === "md2html" && (
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.gfm}
                  onChange={(e) => setSettings({ gfm: e.target.checked })}
                />
                GitHub Flavored
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.breaks}
                  onChange={(e) => setSettings({ breaks: e.target.checked })}
                />
                Newlines as &lt;br&gt;
              </label>
            </div>
          )}
        </section>

        <OutputPanel
          title={settings.direction === "md2html" ? "HTML" : "Markdown"}
          text={output}
          filename={settings.direction === "md2html" ? "output.html" : "output.md"}
          mime={settings.direction === "md2html" ? "text/html" : "text/markdown"}
          shareUrl={shareUrl}
        >
          {settings.direction === "md2html" && (
            <Tabs
              value={settings.view}
              onValueChange={(v) => setSettings({ view: v as Settings["view"] })}
              className="mb-2"
            >
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="raw">Raw HTML</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {settings.direction === "md2html" && settings.view === "preview" ? (
            <div
              className="prose prose-sm max-w-none rounded-md border border-border bg-muted/30 p-4 dark:prose-invert max-h-[500px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {output}
            </pre>
          )}
        </OutputPanel>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
