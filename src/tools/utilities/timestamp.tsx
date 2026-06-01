import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard } from "@/tools/_shared/utils";

type Unit = "s" | "ms";
type Mode = "single" | "batch";

function getTimeZones(): string[] {
  // Intl.supportedValuesOf is widely supported in modern browsers.
  try {
    const intlAny = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    const list = intlAny.supportedValuesOf?.("timeZone");
    if (list && list.length) return list;
    throw new Error("not supported");
  } catch {
    return ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"];
  }
}

function parseTimestamp(input: string, unit: Unit): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    return new Date(unit === "s" ? n * 1000 : n);
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelative(date: Date): string {
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [1000, "second"],
    [60_000, "minute"],
    [3_600_000, "hour"],
    [86_400_000, "day"],
    [2_592_000_000, "month"],
    [31_536_000_000, "year"],
  ];
  let chosen: [number, Intl.RelativeTimeFormatUnit] = [1000, "second"];
  for (const u of units) if (abs >= u[0]) chosen = u;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  return rtf.format(Math.round(diff / chosen[0]), chosen[1]);
}

function formatInTz(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).format(date);
  } catch {
    return "-";
  }
}

function isDST(date: Date, tz: string): boolean {
  try {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    const offset = (d: Date) => {
      const s = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      }).format(d);
      const m = s.match(/GMT([+-]\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    };
    const std = Math.min(offset(jan), offset(jul));
    return offset(date) !== std;
  } catch {
    return false;
  }
}

function getTzOffsetMin(tz: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
    const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === "+" ? 1 : -1;
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10));
  } catch {
    return 0;
  }
}

function getPartsInTz(date: Date, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "0";
    return {
      year: parseInt(get("year"), 10),
      month: parseInt(get("month"), 10),
      day: parseInt(get("day"), 10),
      hour: parseInt(get("hour"), 10) % 24,
      minute: parseInt(get("minute"), 10),
      second: parseInt(get("second"), 10),
    };
  } catch {
    return { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
  }
}

function partsToDate(
  p: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  tz: string,
): Date {
  const guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = getTzOffsetMin(tz, new Date(guess));
  return new Date(guess - offset * 60_000);
}


export default function TimestampConverter() {
  const mounted = useMounted();
  const [mode, setMode] = useState<Mode>("single");
  const [input, setInput] = useState<string>("");
  const [batch, setBatch] = useState<string>("");
  const [unit, setUnit] = useState<Unit>("s");
  const [tz, setTz] = useState<string>("UTC");
  const [now, setNow] = useState<number>(0);

  const timeZones = useMemo(() => getTimeZones(), []);

  useEffect(() => {
    setInput((prev) => prev || String(Math.floor(Date.now() / 1000)));
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = useMemo(() => parseTimestamp(input, unit), [input, unit]);

  const rows = useMemo(() => {
    if (!date) return [];
    return [
      { label: "Unix (seconds)", value: String(Math.floor(date.getTime() / 1000)) },
      { label: "Unix (milliseconds)", value: String(date.getTime()) },
      { label: "ISO 8601 (UTC)", value: date.toISOString() },
      { label: `Local (${tz})`, value: formatInTz(date, tz) },
      { label: "RFC 2822", value: date.toUTCString() },
      { label: "Date only (UTC)", value: date.toISOString().slice(0, 10) },
      { label: "Time only (UTC)", value: date.toISOString().slice(11, 19) },
      { label: "Day of week", value: date.toLocaleDateString(undefined, { weekday: "long" }) },
      { label: "Relative", value: formatRelative(date) },
      {
        label: "Discord",
        value: `<t:${Math.floor(date.getTime() / 1000)}:F>`,
      },
    ];
  }, [date, tz]);

  const batchRows = useMemo(() => {
    if (mode !== "batch") return [];
    return batch
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const d = parseTimestamp(line, unit);
        return {
          input: line,
          iso: d ? d.toISOString() : "-",
          local: d ? formatInTz(d, tz) : "-",
          relative: d ? formatRelative(d) : "-",
        };
      });
  }, [mode, batch, unit, tz]);

  const useNow = () => {
    setInput(String(unit === "s" ? Math.floor(Date.now() / 1000) : Date.now()));
  };

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-64 animate-pulse rounded-lg border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Current time
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-2xl">{Math.floor(now / 1000)}</span>
          <span className="text-sm text-muted-foreground">
            {formatInTz(new Date(now), tz)}
          </span>
          {isDST(new Date(now), tz) && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              DST
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_140px_220px]">
        <div className="space-y-2">
          <Label>Mode</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="batch">Batch</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-2">
          <Label>Numeric unit</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s">Seconds</SelectItem>
              <SelectItem value="ms">Milliseconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={tz} onValueChange={setTz}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {timeZones.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "single" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="ts-input">Input</Label>
              <Input
                id="ts-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="1700000000 or 2024-01-15T10:30:00Z"
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={useNow}>
                <RefreshCw className="h-4 w-4" /> Now
              </Button>
            </div>
          </div>

          {date && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Build from date ({tz})
                </Label>
                <span className="text-xs text-muted-foreground">Edit any field</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                {(["year", "month", "day", "hour", "minute", "second"] as const).map((k) => {
                  const parts = getPartsInTz(date, tz);
                  const limits: Record<typeof k, [number, number]> = {
                    year: [1, 9999],
                    month: [1, 12],
                    day: [1, 31],
                    hour: [0, 23],
                    minute: [0, 59],
                    second: [0, 59],
                  };
                  const [min, max] = limits[k];
                  return (
                    <div key={k} className="space-y-1">
                      <Label htmlFor={`ts-${k}`} className="text-xs capitalize text-muted-foreground">
                        {k}
                      </Label>
                      <Input
                        id={`ts-${k}`}
                        type="number"
                        min={min}
                        max={max}
                        value={parts[k]}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (isNaN(v)) return;
                          const next = { ...parts, [k]: v };
                          const d = partsToDate(next, tz);
                          setInput(String(unit === "s" ? Math.floor(d.getTime() / 1000) : d.getTime()));
                        }}
                        className="font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {date ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.label}
                      className="border-b border-border last:border-0 hover:bg-accent/50"
                    >
                      <td className="w-1/3 px-3 py-2 text-muted-foreground">{r.label}</td>
                      <td className="px-3 py-2 font-mono">{r.value}</td>
                      <td className="w-12 px-2">
                        <button
                          onClick={() => copyToClipboard(r.value)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label={`Copy ${r.label}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Couldn't parse "{input}". Try a Unix timestamp or ISO date.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ts-batch">One timestamp per line</Label>
              {batch && (
                <Button variant="ghost" size="sm" onClick={() => setBatch("")}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
            <Textarea
              id="ts-batch"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              rows={6}
              placeholder={"1700000000\n1735689600\n2024-01-15T10:30:00Z"}
              className="font-mono text-sm"
            />
          </div>
          {batchRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Input</th>
                    <th className="px-3 py-2 text-left">ISO 8601 (UTC)</th>
                    <th className="px-3 py-2 text-left">Local ({tz})</th>
                    <th className="px-3 py-2 text-left">Relative</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 font-mono">{r.input}</td>
                      <td className="px-3 py-2 font-mono">{r.iso}</td>
                      <td className="px-3 py-2 font-mono">{r.local}</td>
                      <td className="px-3 py-2">{r.relative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <ToolToaster />
    </div>
  );
}
