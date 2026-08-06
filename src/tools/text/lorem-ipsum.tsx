import { useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

const CLASSIC =
  `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum`.split(
    /\s+/,
  );

const HIPSTER =
  `artisan small batch single-origin pour-over chartreuse beard tote bag fixie kombucha kale chips fanny pack mustache typewriter bicycle rights vegan portland aesthetic raclette fixie jianbing chillwave gentrify kogi sustainable pop-up brunch lo-fi narwhal ennui slow-carb tilde coloring book offal four loko pickled gluten-free jean shorts neutra freegan readymade microdosing semiotics`.split(
    /\s+/,
  );

interface Settings {
  source: "classic" | "hipster" | "custom";
  unit: "paragraphs" | "sentences" | "words" | "bytes";
  count: number;
  startWithLorem: boolean;
  format: "plain" | "html";
  customSeed: string;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function buildSentence(rng: () => number, words: string[], len: number): string {
  const out: string[] = [];
  for (let i = 0; i < len; i++) out.push(words[Math.floor(rng() * words.length)]);
  return cap(out.join(" ")) + ".";
}

function buildParagraph(rng: () => number, words: string[], sentences: number): string {
  const out: string[] = [];
  for (let i = 0; i < sentences; i++) {
    out.push(buildSentence(rng, words, 6 + Math.floor(rng() * 12)));
  }
  return out.join(" ");
}

export default function LoremIpsumTool() {
  const [settings, setSettings] = useToolSettings<Settings>("lorem-ipsum", {
    source: "classic",
    unit: "paragraphs",
    count: 3,
    startWithLorem: true,
    format: "plain",
    customSeed: "",
  });
  const [seed, setSeed] = useState(0);

  const wordlist = useMemo(() => {
    if (settings.source === "hipster") return HIPSTER;
    if (settings.source === "custom") {
      const tokens = settings.customSeed.split(/\s+/).filter(Boolean);
      return tokens.length >= 5 ? tokens : CLASSIC;
    }
    return CLASSIC;
  }, [settings.source, settings.customSeed]);

  const output = useMemo(() => {
    const rng = mulberry32(seed || 1);
    const result: string[] = [];

    if (settings.unit === "paragraphs") {
      for (let i = 0; i < settings.count; i++) {
        result.push(buildParagraph(rng, wordlist, 3 + Math.floor(rng() * 4)));
      }
    } else if (settings.unit === "sentences") {
      for (let i = 0; i < settings.count; i++) {
        result.push(buildSentence(rng, wordlist, 6 + Math.floor(rng() * 12)));
      }
    } else if (settings.unit === "words") {
      const w: string[] = [];
      for (let i = 0; i < settings.count; i++) {
        w.push(wordlist[Math.floor(rng() * wordlist.length)]);
      }
      result.push(cap(w.join(" ")) + ".");
    } else {
      // bytes - keep generating until close to target, then trim back to the
      // last whole word so we never leave a fragment like "Lor".
      let buf = "";
      while (buf.length < settings.count) {
        buf += (buf ? " " : "") + buildSentence(rng, wordlist, 6 + Math.floor(rng() * 12));
      }
      let sliced = buf.slice(0, settings.count);
      if (sliced.length === settings.count && buf.length > settings.count) {
        const lastSpace = sliced.lastIndexOf(" ");
        if (lastSpace > 0) sliced = sliced.slice(0, lastSpace);
      }
      result.push(sliced);
    }

    if (settings.startWithLorem && settings.source !== "custom" && result[0]) {
      const re = /^[A-Z][a-z]+\s+[a-z]+/;
      result[0] = result[0].replace(re, "Lorem ipsum");
    }

    if (settings.format === "html" && settings.unit === "paragraphs") {
      return result.map((p) => `<p>${p}</p>`).join("\n");
    }
    return result.join(settings.unit === "paragraphs" ? "\n\n" : " ");
  }, [settings, wordlist, seed]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Options
          </h3>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Wordlist</Label>
            <Select
              value={settings.source}
              onValueChange={(v) => setSettings({ source: v as Settings["source"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic Lorem Ipsum</SelectItem>
                <SelectItem value="hipster">Hipster Ipsum</SelectItem>
                <SelectItem value="custom">Custom seed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Select
              value={settings.unit}
              onValueChange={(v) => setSettings({ unit: v as Settings["unit"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraphs">Paragraphs</SelectItem>
                <SelectItem value="sentences">Sentences</SelectItem>
                <SelectItem value="words">Words</SelectItem>
                <SelectItem value="bytes">Bytes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Count</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={settings.count}
              onChange={(e) => setSettings({ count: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
          <div>
            <Label className="text-xs">Format</Label>
            <Select
              value={settings.format}
              onValueChange={(v) => setSettings({ format: v as Settings["format"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain text</SelectItem>
                <SelectItem value="html">HTML &lt;p&gt;</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {settings.source === "custom" && (
          <div>
            <Label className="text-xs">Custom seed words (5+, space-separated)</Label>
            <Input
              value={settings.customSeed}
              onChange={(e) => setSettings({ customSeed: e.target.value })}
              placeholder="alpha beta gamma delta epsilon …"
              className="font-mono text-xs"
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={settings.startWithLorem}
            onChange={(e) => setSettings({ startWithLorem: e.target.checked })}
          />
          Start with “Lorem ipsum”
        </label>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="self-start rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
        >
          Regenerate
        </button>
      </section>

      <OutputPanel
        title="Generated text"
        text={output}
        filename={settings.format === "html" ? "lorem.html" : "lorem.txt"}
        mime={settings.format === "html" ? "text/html" : "text/plain"}
      >
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 text-sm">
          {output}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          {output.length.toLocaleString()} characters ·{" "}
          {output.split(/\s+/).filter(Boolean).length.toLocaleString()} words
        </p>
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
