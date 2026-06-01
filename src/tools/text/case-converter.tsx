import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from "change-case";
import { Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard } from "@/tools/_shared/utils";

const SAMPLE = "Hello world - this is the DocnTools Case Converter.";

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

type Variant = {
  id: string;
  name: string;
  fn: (s: string) => string;
};

const VARIANTS: Variant[] = [
  { id: "upper", name: "UPPERCASE", fn: (s) => s.toUpperCase() },
  { id: "lower", name: "lowercase", fn: (s) => s.toLowerCase() },
  { id: "title", name: "Title Case", fn: titleCase },
  { id: "sentence", name: "Sentence case", fn: sentenceCase },
  { id: "camel", name: "camelCase", fn: camelCase },
  { id: "pascal", name: "PascalCase", fn: pascalCase },
  { id: "snake", name: "snake_case", fn: snakeCase },
  { id: "constant", name: "CONSTANT_CASE", fn: constantCase },
  { id: "kebab", name: "kebab-case", fn: kebabCase },
  { id: "train", name: "Train-Case", fn: trainCase },
  { id: "dot", name: "dot.case", fn: dotCase },
  { id: "path", name: "path/case", fn: pathCase },
  { id: "no", name: "no case", fn: noCase },
  { id: "capital", name: "Capital Case", fn: capitalCase },
];

interface Settings {
  primary: string;
}
interface ShareState {
  input: string;
}

export default function CaseConverterTool() {
  const [settings, setSettings] = useToolSettings<Settings>("case-converter", {
    primary: "camel",
  });
  const share = useShareableState<ShareState>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (share.initial) setInput(share.initial.input);
  }, [share.initial]);

  const results = useMemo(
    () => VARIANTS.map((v) => ({ ...v, value: input ? v.fn(input) : "" })),
    [input],
  );
  const primary = results.find((r) => r.id === settings.primary) ?? results[0];
  const shareUrl = share.getShareUrl({ input });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Input
          </h3>
          <SampleDataButton onLoad={() => setInput(SAMPLE)} />
        </header>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          spellCheck={false}
          className="min-h-[220px] resize-y"
          placeholder="Paste any text…"
        />
        <p className="text-xs text-muted-foreground">
          {input.length.toLocaleString()} characters
        </p>
      </section>

      <OutputPanel
        title={`Output - ${primary.name}`}
        text={primary.value}
        filename="converted.txt"
        shareUrl={shareUrl}
      >
        <pre className="mb-3 max-h-[180px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
          {primary.value || "-"}
        </pre>
        <div className="grid gap-2 sm:grid-cols-2">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSettings({ primary: r.id });
                if (r.value) copyToClipboard(r.value, `${r.name} copied`);
              }}
              className={`group flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition hover:border-primary hover:bg-muted/50 ${
                primary.id === r.id ? "border-primary bg-muted/40" : "border-border"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.name}
                </div>
                <div className="mt-0.5 truncate font-mono">{r.value || "-"}</div>
              </div>
              <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
