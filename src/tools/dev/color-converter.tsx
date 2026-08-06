import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";
import cmykPlugin from "colord/plugins/cmyk";
import hwbPlugin from "colord/plugins/hwb";
import labPlugin from "colord/plugins/lab";
import lchPlugin from "colord/plugins/lch";
import mixPlugin from "colord/plugins/mix";
import namesPlugin from "colord/plugins/names";
import { Pipette } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OutputPanel } from "@/components/tool/output-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { copyToClipboard } from "@/tools/_shared/utils";
import { ToolToaster } from "@/tools/_shared/toaster";

extend([a11yPlugin, cmykPlugin, hwbPlugin, labPlugin, lchPlugin, mixPlugin, namesPlugin]);

interface Settings {
  bgColor: string;
}
interface ShareState {
  color: string;
  bgColor: string;
}

const PALETTE_STEPS = 11;

function buildPalette(hex: string): string[] {
  const c = colord(hex);
  // Tailwind-style 50..950 by mixing toward white/black.
  const stops = [0.95, 0.85, 0.7, 0.55, 0.4, 0.25, 0.15, 0.07, -0.07, -0.2, -0.35];
  return stops
    .map((stop) => (stop > 0 ? c.mix("#ffffff", stop).toHex() : c.mix("#000000", -stop).toHex()))
    .slice(0, PALETTE_STEPS);
}

export default function ColorConverterTool() {
  const mounted = useMounted();
  const [settings, setSettings] = useToolSettings<Settings>("color-converter", {
    bgColor: "#ffffff",
  });
  const share = useShareableState<ShareState>();
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (share.initial) {
      setColor(share.initial.color);
      setSettings({ bgColor: share.initial.bgColor });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  const c = useMemo(() => colord(color), [color]);
  const isValid = c.isValid();

  const formats = useMemo(() => {
    if (!isValid) return [];
    const rgb = c.toRgb();
    const hsl = c.toHsl();
    const hwb = c.toHwb();
    const lab = c.toLab();
    const lch = c.toLch();
    const cmyk = c.toCmyk();
    return [
      { label: "HEX", value: c.toHex() },
      { label: "HEX (8-digit)", value: c.alpha(rgb.a ?? 1).toHex() },
      { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ?? 1})` },
      {
        label: "HSL",
        value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      },
      {
        label: "HWB",
        value: `hwb(${Math.round(hwb.h)} ${Math.round(hwb.w)}% ${Math.round(hwb.b)}%)`,
      },
      { label: "LAB", value: `lab(${lab.l.toFixed(1)}% ${lab.a.toFixed(1)} ${lab.b.toFixed(1)})` },
      { label: "LCH", value: `lch(${lch.l.toFixed(1)}% ${lch.c.toFixed(1)} ${lch.h.toFixed(1)})` },
      {
        label: "CMYK",
        value: `cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`,
      },
      { label: "Name", value: c.toName({ closest: true }) ?? "-" },
    ];
  }, [c, isValid]);

  const contrast = useMemo(() => {
    if (!isValid) return null;
    const ratio = c.contrast(settings.bgColor);
    return {
      ratio: ratio.toFixed(2),
      aa: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaa: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    };
  }, [c, isValid, settings.bgColor]);

  const palette = useMemo(() => (isValid ? buildPalette(c.toHex()) : []), [c, isValid]);

  const eyedropper = async () => {
    // EyeDropper API is Chrome/Edge only.
    const w = window as unknown as {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    };
    if (!w.EyeDropper) {
      toast.error("EyeDropper not supported in this browser");
      return;
    }
    try {
      const ed = new w.EyeDropper();
      const r = await ed.open();
      setColor(r.sRGBHex);
    } catch {
      /* user cancelled */
    }
  };

  const shareUrl = share.getShareUrl({ color, bgColor: settings.bgColor });

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <section className="grid gap-5 rounded-lg border border-border bg-card p-4 sm:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div
            className="aspect-square w-full rounded-lg border border-border"
            style={{ backgroundColor: isValid ? c.toHex() : "transparent" }}
          />
          <div className="flex gap-2">
            <Input
              type="color"
              value={isValid ? c.toHex() : "#000000"}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 p-1"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              spellCheck={false}
              className="font-mono text-sm"
              placeholder="#3b82f6 / rgb(...) / hsl(...)"
            />
            <Button variant="outline" size="icon" onClick={eyedropper} aria-label="Eyedropper">
              <Pipette className="h-4 w-4" />
            </Button>
          </div>
          {!isValid && <p className="text-xs text-destructive">Not a valid color.</p>}
        </div>

        <div className="space-y-1.5">
          {formats.map((f) => (
            <div
              key={f.label}
              className="grid grid-cols-[110px_1fr_auto] items-center gap-2 text-xs"
            >
              <Label className="font-mono text-muted-foreground">{f.label}</Label>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 px-2 py-1 font-mono">
                {f.value}
              </pre>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(f.value)}>
                Copy
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            WCAG contrast
          </h3>
          <div className="mb-3 flex items-center gap-2">
            <Label className="text-xs">Background</Label>
            <Input
              type="color"
              value={settings.bgColor}
              onChange={(e) => setSettings({ bgColor: e.target.value })}
              className="h-8 w-12 p-1"
            />
            <Input
              value={settings.bgColor}
              onChange={(e) => setSettings({ bgColor: e.target.value })}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div
            className="rounded-md border border-border p-4"
            style={{ backgroundColor: settings.bgColor }}
          >
            <p className="text-base font-medium" style={{ color: isValid ? c.toHex() : "inherit" }}>
              The quick brown fox.
            </p>
            <p className="text-xs" style={{ color: isValid ? c.toHex() : "inherit" }}>
              Small text - 12px sample.
            </p>
          </div>
          {contrast && (
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="font-mono text-2xl">{contrast.ratio}</span>
                <span className="ml-1 text-muted-foreground">: 1</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge ok={contrast.aa}>AA Normal</Badge>
                <Badge ok={contrast.aaLarge}>AA Large</Badge>
                <Badge ok={contrast.aaa}>AAA Normal</Badge>
                <Badge ok={contrast.aaaLarge}>AAA Large</Badge>
              </div>
            </div>
          )}
        </section>

        <OutputPanel
          title="Tailwind-style palette"
          shareUrl={shareUrl}
          text={JSON.stringify(palette, null, 2)}
          filename="palette.json"
          mime="application/json"
        >
          <div className="grid grid-cols-11 gap-1">
            {palette.map((p, i) => (
              <button
                key={i}
                type="button"
                title={p}
                onClick={() => {
                  copyToClipboard(p);
                }}
                className="group relative aspect-square rounded border border-border"
                style={{ backgroundColor: p }}
              >
                <span className="absolute inset-x-0 -bottom-5 hidden text-center font-mono text-[9px] text-muted-foreground group-hover:block">
                  {p}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Click any swatch to copy.</p>
        </OutputPanel>
      </div>
      <ToolToaster />
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        ok
          ? "rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 px-2 py-0.5 text-[color:var(--success)]"
          : "rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive"
      }
    >
      {ok ? "✓" : "✗"} {children}
    </span>
  );
}
