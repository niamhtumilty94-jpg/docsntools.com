import { Download, ImagePlus, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FullPageDropZone } from "@/components/tool/full-page-drop-zone";
import { SampleDataButton } from "@/components/tool/sample-data-button";
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard } from "@/tools/_shared/utils";

type Level = "L" | "M" | "Q" | "H";
type DotType = "square" | "dots" | "rounded" | "classy" | "classy-rounded" | "extra-rounded";
type CornerSquareType = "square" | "dot" | "extra-rounded";
type DataPreset = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "phone" | "geo";

const PRESETS: { value: DataPreset; label: string }[] = [
  { value: "url", label: "URL" },
  { value: "text", label: "Plain text" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "vCard" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone" },
  { value: "geo", label: "Geo" },
];

function escapeWifi(s: string) {
  return s.replace(/([\\;,":])/g, "\\$1");
}

interface QrState {
  preset: DataPreset;
  text: string;
  wifiSsid: string;
  wifiPass: string;
  wifiAuth: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  vName: string;
  vOrg: string;
  vPhone: string;
  vEmail: string;
  vUrl: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  smsTo: string;
  smsBody: string;
  phone: string;
  geoLat: string;
  geoLng: string;
}

interface QrStyle {
  size: number;
  level: Level;
  margin: number;
  fg: string;
  bg: string;
  dotType: DotType;
  cornerType: CornerSquareType;
  logoSize: number;
}

const DEFAULT_DATA: QrState = {
  preset: "url",
  text: "https://toolkithub.app",
  wifiSsid: "",
  wifiPass: "",
  wifiAuth: "WPA",
  wifiHidden: false,
  vName: "",
  vOrg: "",
  vPhone: "",
  vEmail: "",
  vUrl: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  smsTo: "",
  smsBody: "",
  phone: "",
  geoLat: "",
  geoLng: "",
};

const DEFAULT_STYLE: QrStyle = {
  size: 360,
  level: "M",
  margin: 2,
  fg: "#0a0a0a",
  bg: "#ffffff",
  dotType: "rounded",
  cornerType: "extra-rounded",
  logoSize: 0.3,
};

const SAMPLES: Record<DataPreset, Partial<QrState>> = {
  url: { text: "https://toolkithub.app/utilities/qr-code" },
  text: { text: "Hello from DocnTools - this QR was generated entirely in your browser." },
  wifi: { wifiSsid: "Cafe-Guest", wifiPass: "espresso2024", wifiAuth: "WPA", wifiHidden: false },
  vcard: {
    vName: "Ada Lovelace",
    vOrg: "Analytical Engines Ltd.",
    vPhone: "+44 20 7946 0958",
    vEmail: "ada@example.com",
    vUrl: "https://example.com",
  },
  email: {
    emailTo: "hello@example.com",
    emailSubject: "Quick hello",
    emailBody: "Loved the talk - let's chat!",
  },
  sms: { smsTo: "+15551234567", smsBody: "On my way!" },
  phone: { phone: "+15551234567" },
  geo: { geoLat: "37.7749", geoLng: "-122.4194" },
};

export default function QrCodeTool() {
  const mounted = useMounted();

  // Persistent style settings (remembered across sessions).
  const [style, setStyle] = useToolSettings<QrStyle>("qr-code", DEFAULT_STYLE);

  // Shareable data payload (round-trips through #s=...).
  const share = useShareableState<QrState>();
  const [data, setData] = useToolSettings<QrState>("qr-code:data", DEFAULT_DATA);

  // Hydrate from share URL once on mount.
  useEffect(() => {
    if (share.initial) setData(share.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.initial]);

  // Logo lives in component state - never persisted (could be huge data URL).
  const [logo, setLogo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<unknown>(null);

  const payload = useMemo(() => {
    switch (data.preset) {
      case "url":
      case "text":
        return data.text;
      case "wifi":
        return `WIFI:T:${data.wifiAuth};S:${escapeWifi(data.wifiSsid)};${
          data.wifiAuth !== "nopass" ? `P:${escapeWifi(data.wifiPass)};` : ""
        }${data.wifiHidden ? "H:true;" : ""};`;
      case "vcard":
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          data.vName && `FN:${data.vName}`,
          data.vOrg && `ORG:${data.vOrg}`,
          data.vPhone && `TEL:${data.vPhone}`,
          data.vEmail && `EMAIL:${data.vEmail}`,
          data.vUrl && `URL:${data.vUrl}`,
          "END:VCARD",
        ]
          .filter(Boolean)
          .join("\n");
      case "email": {
        const params = new URLSearchParams();
        if (data.emailSubject) params.set("subject", data.emailSubject);
        if (data.emailBody) params.set("body", data.emailBody);
        const q = params.toString();
        return `mailto:${data.emailTo}${q ? `?${q}` : ""}`;
      }
      case "sms":
        return `SMSTO:${data.smsTo}:${data.smsBody}`;
      case "phone":
        return `tel:${data.phone}`;
      case "geo":
        return `geo:${data.geoLat},${data.geoLng}`;
    }
  }, [data]);

  // Initialize / update QR code
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      if (cancelled || !containerRef.current) return;
      const options = {
        width: style.size,
        height: style.size,
        type: "svg" as const,
        data: payload || " ",
        margin: style.margin,
        qrOptions: { errorCorrectionLevel: style.level },
        dotsOptions: { color: style.fg, type: style.dotType },
        backgroundOptions: { color: style.bg },
        cornersSquareOptions: { color: style.fg, type: style.cornerType },
        cornersDotOptions: { color: style.fg },
        image: logo || undefined,
        imageOptions: {
          crossOrigin: "anonymous" as const,
          margin: 4,
          imageSize: style.logoSize,
          hideBackgroundDots: true,
        },
      };
      const ref = qrRef as {
        current: {
          update: (o: unknown) => void;
          append: (el: HTMLElement) => void;
          download: (o: { name: string; extension: string }) => void;
        } | null;
      };
      if (!ref.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref.current = new (QRCodeStyling as any)(options);
        containerRef.current.innerHTML = "";
        ref.current!.append(containerRef.current);
      } else {
        ref.current.update(options);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload, style, logo]);

  const download = (extension: "png" | "jpeg" | "webp" | "svg") => {
    const ref = qrRef as {
      current: { download: (o: { name: string; extension: string }) => void } | null;
    };
    ref.current?.download({ name: "qrcode", extension });
  };

  const onLogoChange = (file: File | null) => {
    if (!file) {
      setLogo(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const loadSample = () => {
    setData((prev) => ({ ...prev, ...(SAMPLES[prev.preset] as QrState) }));
    toast.success("Loaded sample for " + data.preset);
  };

  const handleShare = async () => {
    const url = share.getShareUrl(data);
    await copyToClipboard(url, "Share link copied");
  };

  const handleDrop = (files: File[]) => {
    const img = files.find((f) => f.type.startsWith("image/"));
    if (img) onLogoChange(img);
    else toast.error("Drop an image to use as the QR logo");
    return true;
  };

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]" aria-busy="true">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
          <div className="h-48 animate-pulse rounded-md bg-muted/40" />
        </div>
        <div className="h-[392px] w-[392px] animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  return (
    <FullPageDropZone onFiles={handleDrop} accept="an image (logo)">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={data.preset}
              onValueChange={(v) => setData({ preset: v as DataPreset })}
              className="flex-1"
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                {PRESETS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <SampleDataButton onLoad={loadSample} />
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          {(data.preset === "url" || data.preset === "text") && (
            <div className="space-y-2">
              <Label htmlFor="qr-text">{data.preset === "url" ? "URL" : "Text"}</Label>
              <Textarea
                id="qr-text"
                value={data.text}
                onChange={(e) => setData({ text: e.target.value })}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          )}

          {data.preset === "wifi" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>SSID</Label>
                <Input
                  value={data.wifiSsid}
                  onChange={(e) => setData({ wifiSsid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  value={data.wifiPass}
                  onChange={(e) => setData({ wifiPass: e.target.value })}
                  disabled={data.wifiAuth === "nopass"}
                />
              </div>
              <div className="space-y-2">
                <Label>Encryption</Label>
                <Select
                  value={data.wifiAuth}
                  onValueChange={(v) => setData({ wifiAuth: v as QrState["wifiAuth"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA / WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.wifiHidden}
                  onChange={(e) => setData({ wifiHidden: e.target.checked })}
                />
                Hidden network
              </label>
            </div>
          )}

          {data.preset === "vcard" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={data.vName} onChange={(e) => setData({ vName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Input value={data.vOrg} onChange={(e) => setData({ vOrg: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={data.vPhone} onChange={(e) => setData({ vPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={data.vEmail} onChange={(e) => setData({ vEmail: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Website</Label>
                <Input value={data.vUrl} onChange={(e) => setData({ vUrl: e.target.value })} />
              </div>
            </div>
          )}

          {data.preset === "email" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  value={data.emailTo}
                  onChange={(e) => setData({ emailTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={data.emailSubject}
                  onChange={(e) => setData({ emailSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={data.emailBody}
                  onChange={(e) => setData({ emailBody: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {data.preset === "sms" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={data.smsTo} onChange={(e) => setData({ smsTo: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Message</Label>
                <Textarea
                  value={data.smsBody}
                  onChange={(e) => setData({ smsBody: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {data.preset === "phone" && (
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input value={data.phone} onChange={(e) => setData({ phone: e.target.value })} />
            </div>
          )}

          {data.preset === "geo" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={data.geoLat} onChange={(e) => setData({ geoLat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={data.geoLng} onChange={(e) => setData({ geoLng: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Size: {style.size}px</Label>
              <Slider
                min={128}
                max={1024}
                step={32}
                value={[style.size]}
                onValueChange={(v) => setStyle({ size: v[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quiet zone: {style.margin}</Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[style.margin]}
                onValueChange={(v) => setStyle({ margin: v[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label>Error correction</Label>
              <Select value={style.level} onValueChange={(v) => setStyle({ level: v as Level })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (~7%)</SelectItem>
                  <SelectItem value="M">Medium (~15%)</SelectItem>
                  <SelectItem value="Q">Quartile (~25%)</SelectItem>
                  <SelectItem value="H">High (~30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dot style</Label>
              <Select
                value={style.dotType}
                onValueChange={(v) => setStyle({ dotType: v as DotType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="classy">Classy</SelectItem>
                  <SelectItem value="classy-rounded">Classy rounded</SelectItem>
                  <SelectItem value="extra-rounded">Extra rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Corner style</Label>
              <Select
                value={style.cornerType}
                onValueChange={(v) => setStyle({ cornerType: v as CornerSquareType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="dot">Dot</SelectItem>
                  <SelectItem value="extra-rounded">Extra rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qr-fg">Foreground</Label>
                <Input
                  id="qr-fg"
                  type="color"
                  value={style.fg}
                  onChange={(e) => setStyle({ fg: e.target.value })}
                  className="h-10 p-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-bg">Background</Label>
                <Input
                  id="qr-bg"
                  type="color"
                  value={style.bg}
                  onChange={(e) => setStyle({ bg: e.target.value })}
                  className="h-10 p-1"
                />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("qr-logo-input")?.click()}
                >
                  <ImagePlus className="h-4 w-4" /> {logo ? "Replace" : "Upload"}
                </Button>
                {logo && (
                  <Button variant="ghost" size="sm" onClick={() => setLogo(null)}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  Or drop an image anywhere on the page
                </span>
                <input
                  id="qr-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                />
              </div>
              {logo && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Logo size: {Math.round(style.logoSize * 100)}%
                  </Label>
                  <Slider
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={[style.logoSize]}
                    onValueChange={(v) => setStyle({ logoSize: v[0] })}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download("png")}>
              <Download className="h-4 w-4" /> PNG
            </Button>
            <Button variant="outline" onClick={() => download("svg")}>
              <Download className="h-4 w-4" /> SVG
            </Button>
            <Button variant="outline" onClick={() => download("webp")}>
              <Download className="h-4 w-4" /> WebP
            </Button>
            <Button variant="outline" onClick={() => download("jpeg")}>
              <Download className="h-4 w-4" /> JPEG
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-center">
          <div className="rounded-lg border border-border bg-card p-4">
            <div ref={containerRef} className="block" />
          </div>
        </div>
        <ToolToaster />
      </div>
    </FullPageDropZone>
  );
}
