import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
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
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const SAMPLE_CSV = `id,name,role,active,joined
1,Ada Lovelace,Engineer,true,1843-12-10
2,Alan Turing,Cryptographer,true,1936-05-28
3,Grace Hopper,Compiler Pioneer,true,1944-08-12
4,Margaret Hamilton,Apollo Lead,false,1969-07-20`;

const SAMPLE_JSON = `[
  { "id": 1, "name": "Ada Lovelace", "role": "Engineer" },
  { "id": 2, "name": "Alan Turing", "role": "Cryptographer" },
  { "id": 3, "name": "Grace Hopper", "role": "Compiler Pioneer" }
]`;

type Direction = "csv2json" | "json2csv";
interface Settings {
  direction: Direction;
  delimiter: string; // "auto" | "," | ";" | "\t" | "|"
  header: boolean;
  inferTypes: boolean;
  indent: number;
  quoteAll: boolean;
}
interface ShareState {
  input: string;
  direction: Direction;
}

function inferValue(raw: string): unknown {
  if (raw === "") return "";
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return raw;
}

export default function CsvJsonTool() {
  const [settings, setSettings] = useToolSettings<Settings>("csv-json", {
    direction: "csv2json",
    delimiter: "auto",
    header: true,
    inferTypes: true,
    indent: 2,
    quoteAll: false,
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

  const result = useMemo<
    { ok: true; output: string; rows: number; warning?: string } | { ok: false; error: string }
  >(() => {
    try {
      if (settings.direction === "csv2json") {
        if (input.trim() === "") {
          return { ok: true, output: "", rows: 0 };
        }
        const parsed = Papa.parse<Record<string, string> | string[]>(input, {
          header: settings.header,
          delimiter: settings.delimiter === "auto" ? "" : settings.delimiter,
          skipEmptyLines: true,
        });
        const isNonFatal = (code?: string, type?: string) =>
          code === "UndetectableDelimiter" || type === "Delimiter";
        const fatal = parsed.errors.find((e) => !isNonFatal(e.code, e.type));
        if (fatal) {
          const where = fatal.row === undefined ? "" : `Row ${fatal.row}: `;
          return { ok: false, error: `${where}${fatal.message}` };
        }
        const warningEntry = parsed.errors.find((e) => isNonFatal(e.code, e.type));
        const warning = warningEntry?.message;
        let data: unknown = parsed.data;
        if (settings.inferTypes) {
          if (settings.header) {
            data = (parsed.data as Record<string, string>[]).map((row) => {
              const out: Record<string, unknown> = {};
              for (const k of Object.keys(row)) out[k] = inferValue(row[k]);
              return out;
            });
          } else {
            data = (parsed.data as string[][]).map((row) => row.map(inferValue));
          }
        }
        return {
          ok: true,
          output: JSON.stringify(data, null, settings.indent),
          rows: parsed.data.length,
          warning,
        };
      }

      if (input.trim() === "") {
        return { ok: true, output: "", rows: 0 };
      }
      const json: unknown = JSON.parse(input);
      if (!Array.isArray(json)) {
        return { ok: false, error: "JSON must be an array of objects." };
      }
      const csv = Papa.unparse(json as Record<string, unknown>[], {
        delimiter: settings.delimiter === "auto" ? "," : settings.delimiter,
        quotes: settings.quoteAll,
      });
      return { ok: true, output: csv, rows: json.length };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, settings]);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const text = await f.text();
    setInput(text);
    if (/\.json$/i.test(f.name)) setSettings({ direction: "json2csv" });
    else setSettings({ direction: "csv2json" });
  };

  const swapSample = () => {
    setInput(settings.direction === "csv2json" ? SAMPLE_CSV : SAMPLE_JSON);
  };

  const shareUrl = share.getShareUrl({ input, direction: settings.direction });
  const outFilename = settings.direction === "csv2json" ? "data.json" : "data.csv";

  return (
    <FullPageDropZone onFiles={onFiles} accept=".csv or .json">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={settings.direction}
              onValueChange={(v) => setSettings({ direction: v as Direction })}
            >
              <TabsList>
                <TabsTrigger value="csv2json">CSV → JSON</TabsTrigger>
                <TabsTrigger value="json2csv">JSON → CSV</TabsTrigger>
              </TabsList>
            </Tabs>
            <SampleDataButton onLoad={swapSample} />
          </header>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={18}
            spellCheck={false}
            className="min-h-[400px] resize-y font-mono text-xs"
            placeholder={settings.direction === "csv2json" ? "Paste CSV…" : "Paste JSON array…"}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Delimiter</Label>
              <Select
                value={settings.delimiter}
                onValueChange={(v) => setSettings({ delimiter: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value=",">Comma ,</SelectItem>
                  <SelectItem value=";">Semicolon ;</SelectItem>
                  <SelectItem value={"\t"}>Tab</SelectItem>
                  <SelectItem value="|">Pipe |</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.direction === "csv2json" && (
              <div>
                <Label className="text-xs">JSON indent</Label>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={settings.indent}
                  onChange={(e) =>
                    setSettings({ indent: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {settings.direction === "csv2json" && (
              <>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={settings.header}
                    onChange={(e) => setSettings({ header: e.target.checked })}
                  />
                  First row is header
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={settings.inferTypes}
                    onChange={(e) => setSettings({ inferTypes: e.target.checked })}
                  />
                  Infer types
                </label>
              </>
            )}
            {settings.direction === "json2csv" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.quoteAll}
                  onChange={(e) => setSettings({ quoteAll: e.target.checked })}
                />
                Quote all fields
              </label>
            )}
          </div>
        </section>

        <OutputPanel
          title="Output"
          text={result.ok ? result.output : ""}
          filename={outFilename}
          mime={settings.direction === "csv2json" ? "application/json" : "text/csv"}
          shareUrl={shareUrl}
        >
          {result.ok ? (
            <>
              <p className="mb-2 text-xs text-muted-foreground">{result.rows} rows</p>
              {result.warning && (
                <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                  {result.warning}
                </p>
              )}
              <pre className="max-h-[480px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
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
