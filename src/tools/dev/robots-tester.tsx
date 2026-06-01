import { Bot, Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { ToolToaster } from "@/tools/_shared/toaster";

interface ShareState {
  robots: string;
  urls: string;
  ua: string;
}

const SAMPLE_ROBOTS = `User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /admin/public/

User-agent: Googlebot
Disallow: /no-google/
Allow: /

Sitemap: https://example.com/sitemap.xml`;

const SAMPLE_URLS = `https://example.com/
https://example.com/admin/
https://example.com/admin/public/page
https://example.com/private/secret
https://example.com/no-google/page`;

interface Group {
  agents: string[];
  rules: { type: "allow" | "disallow"; path: string }[];
}

interface ParsedRobots {
  groups: Group[];
  sitemaps: string[];
  errors: { line: number; message: string }[];
}

function parseRobots(text: string): ParsedRobots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  const errors: { line: number; message: string }[] = [];
  let current: Group | null = null;
  let lastWasUA = false;

  text.split(/\r?\n/).forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) return;
    const colon = line.indexOf(":");
    if (colon === -1) {
      errors.push({ line: lineNum, message: `Missing ':' in directive` });
      return;
    }
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasUA) {
        current = { agents: [value], rules: [] };
        groups.push(current);
      } else {
        current.agents.push(value);
      }
      lastWasUA = true;
      return;
    }

    lastWasUA = false;
    if (field === "allow" || field === "disallow") {
      if (!current) {
        errors.push({
          line: lineNum,
          message: `${field} before any User-agent`,
        });
        return;
      }
      current.rules.push({ type: field, path: value });
    } else if (field === "sitemap") {
      sitemaps.push(value);
    }
  });

  return { groups, sitemaps, errors };
}

function pathMatches(pattern: string, urlPath: string): boolean {
  if (pattern === "") return false;
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*") {
      re += ".*";
    } else if (ch === "$" && i === pattern.length - 1) {
      re += "$";
    } else {
      re += ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
    i++;
  }
  const rx = new RegExp("^" + re);
  return rx.test(urlPath);
}

function uaMatches(groupAgents: string[], ua: string): boolean {
  const u = ua.toLowerCase();
  return groupAgents.some((a) => {
    const al = a.toLowerCase();
    if (al === "*") return true;
    return u.includes(al);
  });
}

interface Decision {
  allowed: boolean;
  reason: string;
}

function decide(parsed: ParsedRobots, ua: string, urlPath: string): Decision {
  const specific = parsed.groups.filter(
    (g) => uaMatches(g.agents, ua) && !g.agents.every((a) => a === "*"),
  );
  const star = parsed.groups.filter((g) => g.agents.includes("*"));
  const candidates = specific.length > 0 ? specific : star;

  if (candidates.length === 0) {
    return { allowed: true, reason: "No matching group - default allow" };
  }

  const rules = candidates.flatMap((g) => g.rules);

  let best: { type: "allow" | "disallow"; path: string; len: number } | null = null;
  for (const r of rules) {
    if (!pathMatches(r.path, urlPath)) continue;
    const len = r.path.replace(/[*$]/g, "").length;
    if (
      !best ||
      len > best.len ||
      (len === best.len && r.type === "allow" && best.type === "disallow")
    ) {
      best = { type: r.type, path: r.path, len };
    }
  }

  if (!best) return { allowed: true, reason: "No matching rule - default allow" };
  return {
    allowed: best.type === "allow",
    reason: `${best.type === "allow" ? "Allow" : "Disallow"}: ${best.path || "/"}`,
  };
}

export default function RobotsTesterTool() {
  const share = useShareableState<ShareState>();
  const [robots, setRobots] = useState("");
  const [urls, setUrls] = useState("");
  const [ua, setUa] = useState("Googlebot");

  useEffect(() => {
    if (share.initial) {
      setRobots(share.initial.robots);
      setUrls(share.initial.urls);
      setUa(share.initial.ua);
    }
  }, [share.initial]);

  const parsed = useMemo(() => parseRobots(robots), [robots]);

  const results = useMemo(() => {
    const list = urls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
    return list.map((raw) => {
      let path = raw;
      try {
        path = new URL(raw).pathname + new URL(raw).search;
      } catch {
        if (!path.startsWith("/")) path = "/" + path;
      }
      const decision = decide(parsed, ua || "*", path);
      return { url: raw, path, ...decision };
    });
  }, [parsed, urls, ua]);

  const summary = useMemo(() => {
    const lines: string[] = [];
    lines.push(`User-agent: ${ua || "*"}`);
    lines.push("");
    results.forEach((r) => {
      lines.push(`${r.allowed ? "ALLOWED " : "BLOCKED "} ${r.url}  (${r.reason})`);
    });
    if (parsed.sitemaps.length > 0) {
      lines.push("");
      lines.push("Sitemaps:");
      parsed.sitemaps.forEach((s) => lines.push(`  ${s}`));
    }
    return lines.join("\n");
  }, [results, ua, parsed.sitemaps]);

  const loadSample = () => {
    setRobots(SAMPLE_ROBOTS);
    setUrls(SAMPLE_URLS);
    setUa("Googlebot");
  };

  const shareUrl = share.getShareUrl({ robots, urls, ua });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              robots.txt
            </h3>
            <SampleDataButton onLoad={loadSample} />
          </header>
          <Textarea
            value={robots}
            onChange={(e) => setRobots(e.target.value)}
            rows={14}
            spellCheck={false}
            className="min-h-[280px] resize-y font-mono text-xs"
            placeholder={"User-agent: *\nDisallow: /admin/"}
          />
          {parsed.errors.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <p className="mb-1 font-semibold">Parse warnings</p>
              <ul className="space-y-0.5">
                {parsed.errors.map((e, i) => (
                  <li key={i}>
                    Line {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Test
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="ua" className="text-xs">
              User-agent
            </Label>
            <Input
              id="ua"
              value={ua}
              onChange={(e) => setUa(e.target.value)}
              placeholder="Googlebot"
              className="h-8 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Common: Googlebot, Bingbot, GPTBot, Applebot, * (any)
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="urls" className="text-xs">
              URLs to test (one per line)
            </Label>
            <Textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={8}
              spellCheck={false}
              className="min-h-[180px] resize-y font-mono text-xs"
              placeholder={"https://example.com/page\n/admin/"}
            />
          </div>
        </section>
      </div>

      <OutputPanel
        title="Results"
        text={summary}
        filename="robots-test.txt"
        shareUrl={shareUrl}
      >
        {results.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Add a robots.txt and URLs to see allow / block decisions.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left font-mono uppercase tracking-wider text-[10px] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Matched rule</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 align-top">
                      {r.allowed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--success)]/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--success)]">
                          <Check className="h-3 w-3" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                          <X className="h-3 w-3" /> Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="break-all font-mono">{r.url}</div>
                      {r.path !== r.url && (
                        <div className="break-all font-mono text-[10px] text-muted-foreground">
                          path: {r.path}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">
                      {r.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {parsed.sitemaps.length > 0 && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <div className="mb-1 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px] text-muted-foreground">
              <Bot className="h-3 w-3" /> Sitemaps declared
            </div>
            <ul className="space-y-0.5 font-mono">
              {parsed.sitemaps.map((s, i) => (
                <li key={i} className="break-all">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </OutputPanel>
      <ToolToaster />
    </div>
  );
}
