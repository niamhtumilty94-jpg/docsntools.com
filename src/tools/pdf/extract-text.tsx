import { Loader2 } from "lucide-react";
import { useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { getDocument } from "./_pdfjs";

interface Settings {
  preserveLayout: boolean;
  format: "txt" | "md";
}

const DEFAULTS: Settings = { preserveLayout: false, format: "txt" };

interface PageText {
  page: number;
  text: string;
}

export default function ExtractText() {
  const [settings, setSettings] = useToolSettings<Settings>("extract-text", DEFAULTS);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageText[]>([]);
  const [busy, setBusy] = useState(false);
  const [activePage, setActivePage] = useState<number>(0); // 0 = all

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setPages([]);
    try {
      const doc = await getDocument(await file.arrayBuffer());
      const out: PageText[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let text: string;
        if (settings.preserveLayout) {
          // Group items by approximate Y, sort by X within each line
          type Item = { str: string; x: number; y: number; h: number };
          const items: Item[] = content.items
            .map((it) => {
              if (!("str" in it)) return null;
              const t = it as { str: string; transform: number[]; height?: number };
              return {
                str: t.str,
                x: t.transform[4],
                y: t.transform[5],
                h: t.height ?? 12,
              } as Item;
            })
            .filter(Boolean) as Item[];
          items.sort((a, b) => b.y - a.y || a.x - b.x);
          const lines: Item[][] = [];
          for (const it of items) {
            const last = lines[lines.length - 1];
            // pdfjs sometimes returns h=0 for synthetic items; clamp to a
            // sensible glyph height so they don't all collapse onto one line.
            const threshold = Math.max(it.h, 8) / 2;
            if (last && Math.abs(last[0].y - it.y) < threshold) {
              last.push(it);
            } else {
              lines.push([it]);
            }
          }
          text = lines
            .map((line) => line.sort((a, b) => a.x - b.x).map((i) => i.str).join(" "))
            .join("\n");
        } else {
          text = content.items
            .map((it) => ("str" in it ? (it as { str: string }).str : ""))
            .join(" ");
        }
        out.push({ page: i, text: text.trim() });
      }
      setPages(out);
      setActivePage(0);
    } finally {
      setBusy(false);
    }
  };

  const fullText = pages
    .map((p) => {
      if (settings.format === "md") {
        // Markdown: H2 per page, blank lines between paragraphs (double newlines).
        const body = p.text.replace(/\n{2,}/g, "\n\n").replace(/\n(?!\n)/g, "  \n");
        return `## Page ${p.page}\n\n${body}`;
      }
      return `--- Page ${p.page} ---\n${p.text}`;
    })
    .join(settings.format === "md" ? "\n\n---\n\n" : "\n\n");

  const visibleText =
    activePage === 0
      ? fullText
      : pages.find((p) => p.page === activePage)?.text ?? "";

  const filename = file
    ? `${file.name.replace(/\.pdf$/i, "")}.${settings.format}`
    : `extracted.${settings.format}`;

  return (
    <div className="space-y-4">
      <ToolToaster />
      <PdfDropArea file={file} onFile={setFile} />

      {file && (
        <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.preserveLayout}
              onCheckedChange={(v) => setSettings({ preserveLayout: v })}
              id="preserve"
            />
            <Label htmlFor="preserve">Preserve layout</Label>
          </div>
          <div>
            <Label>Output format</Label>
            <Select
              value={settings.format}
              onValueChange={(v) => setSettings({ format: v as "txt" | "md" })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Plain text (.txt)</SelectItem>
                <SelectItem value="md">Markdown (.md)</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {settings.format === "md"
                ? "## Page headings, blank-line paragraphs, --- between pages."
                : "Plain text with simple --- Page N --- separators."}
            </p>
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Extract text
            </Button>
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Label>Show page</Label>
            <Select
              value={String(activePage)}
              onValueChange={(v) => setActivePage(Number(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All pages</SelectItem>
                {pages.map((p) => (
                  <SelectItem key={p.page} value={String(p.page)}>
                    Page {p.page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <OutputPanel title="Extracted text" text={visibleText} filename={filename}>
            <Textarea
              value={visibleText}
              readOnly
              rows={18}
              className="font-mono text-xs"
            />
          </OutputPanel>
        </>
      )}
    </div>
  );
}
