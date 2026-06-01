import { Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMounted } from "@/hooks/use-mounted";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard } from "@/tools/_shared/utils";

// convert-units exposes 16+ measures. We pick the most-used and add nice labels.
const MEASURES: { key: string; label: string; defaultFrom: string; defaultTo: string }[] = [
  { key: "length", label: "Length", defaultFrom: "m", defaultTo: "ft" },
  { key: "area", label: "Area", defaultFrom: "m2", defaultTo: "ft2" },
  { key: "mass", label: "Mass / Weight", defaultFrom: "kg", defaultTo: "lb" },
  { key: "volume", label: "Volume", defaultFrom: "l", defaultTo: "gal" },
  { key: "temperature", label: "Temperature", defaultFrom: "C", defaultTo: "F" },
  { key: "time", label: "Time", defaultFrom: "h", defaultTo: "min" },
  { key: "speed", label: "Speed", defaultFrom: "km/h", defaultTo: "mph" },
  { key: "pressure", label: "Pressure", defaultFrom: "bar", defaultTo: "psi" },
  { key: "digital", label: "Data size", defaultFrom: "MB", defaultTo: "MiB" },
  { key: "energy", label: "Energy", defaultFrom: "kWh", defaultTo: "J" },
  { key: "power", label: "Power", defaultFrom: "kW", defaultTo: "hp" },
  { key: "frequency", label: "Frequency", defaultFrom: "kHz", defaultTo: "Hz" },
  { key: "voltage", label: "Voltage", defaultFrom: "V", defaultTo: "mV" },
  { key: "current", label: "Current", defaultFrom: "A", defaultTo: "mA" },
  { key: "angle", label: "Angle", defaultFrom: "deg", defaultTo: "rad" },
];

function format(n: number): string {
  if (!isFinite(n)) return "-";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9 || abs < 1e-4) return n.toExponential(6);
  return parseFloat(n.toPrecision(10)).toString();
}

type ConvertModule = typeof import("convert-units").default;

export default function UnitConverter() {
  const mounted = useMounted();
  const [measure, setMeasure] = useState<string>("length");
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("m");
  const [convert, setConvert] = useState<ConvertModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // convert-units@2.x bundles ancient lodash that references `global`.
      // Shim it before importing so the module can initialize in the browser.
      const w = window as unknown as { global?: unknown };
      if (typeof w.global === "undefined") w.global = window;
      const mod = await import("convert-units");
      if (!cancelled) setConvert(() => mod.default);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset default unit when measure changes
  useEffect(() => {
    const m = MEASURES.find((x) => x.key === measure);
    if (m) setFromUnit(m.defaultFrom);
  }, [measure]);

  const allUnits = useMemo(() => {
    if (!convert) return [];
    try {
      // possibilities() is on the Converter prototype - call via an instance
      return convert(0).possibilities(measure);
    } catch {
      return [];
    }
  }, [convert, measure]);

  const rows = useMemo(() => {
    if (!convert || !allUnits.length) return [];
    const num = parseFloat(value);
    if (isNaN(num)) return allUnits.map((u) => ({ unit: u, label: u, value: "-" }));
    return allUnits.map((u) => {
      let result: number;
      try {
        result = convert(num).from(fromUnit).to(u);
      } catch {
        result = NaN;
      }
      let label = u;
      try {
        const d = convert(0).describe(u);
        label = `${d.singular} (${d.system})`;
      } catch {
        // ignore
      }
      return { unit: u, label, value: format(result) };
    });
  }, [convert, allUnits, value, fromUnit]);

  if (!mounted || !convert) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-20 animate-pulse rounded-md bg-muted/40" />
        <div className="h-72 animate-pulse rounded-lg border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr_180px]">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={measure} onValueChange={setMeasure}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {MEASURES.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="uc-val">Value</Label>
          <Input
            id="uc-val"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>From unit</Label>
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {allUnits.map((u) => {
                let label = u;
                try {
                  label = `${u} - ${convert(0).describe(u).singular}`;
                } catch {
                  // ignore
                }
                return (
                  <SelectItem key={u} value={u}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.unit}
                className={`border-t border-border hover:bg-accent/50 ${r.unit === fromUnit ? "bg-muted/30" : ""}`}
              >
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.unit}</span>{" "}
                  <span className="text-muted-foreground">- {r.label}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono">{r.value}</td>
                <td className="px-2">
                  <button
                    onClick={() => copyToClipboard(r.value)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Copy ${r.unit}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ToolToaster />
    </div>
  );
}
