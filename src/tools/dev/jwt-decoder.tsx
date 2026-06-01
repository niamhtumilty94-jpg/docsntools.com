import { decodeProtectedHeader, importJWK, importSPKI, importX509, jwtVerify } from "jose";
import { AlertCircle, CheckCircle2, Clock, KeyRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { OutputPanel } from "@/components/tool/output-panel";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useShareableState } from "@/hooks/use-shareable-state";
import { useToolSettings } from "@/hooks/use-tool-settings";
import { ToolToaster } from "@/tools/_shared/toaster";

// Sample (unsigned-style) - header HS256, secret = "secret".
const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTcxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.qrqDuP6vKqYdOOvsm-_Rhu1OlyA4lLb1eIwG7lGq-3o";

interface Settings {
  secretType: "secret" | "spki" | "x509" | "jwk";
}
interface ShareState {
  token: string;
}

function base64UrlToString(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  if (typeof atob === "undefined") return Buffer.from(b64, "base64").toString("utf-8");
  // UTF-8 safe
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function safePretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

function explainClaim(key: string): string | undefined {
  const map: Record<string, string> = {
    iss: "Issuer - who created the token",
    sub: "Subject - the principal (typically user id)",
    aud: "Audience - intended recipient(s)",
    exp: "Expiration time (epoch s)",
    nbf: "Not-before time (epoch s)",
    iat: "Issued-at time (epoch s)",
    jti: "JWT ID - unique identifier",
    kid: "Key ID used to sign",
    typ: "Type - typically 'JWT'",
    alg: "Signing algorithm",
  };
  return map[key];
}

export default function JwtDecoderTool() {
  const [settings, setSettings] = useToolSettings<Settings>("jwt-decoder", {
    secretType: "secret",
  });
  const share = useShareableState<ShareState>();
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("secret");
  const [verify, setVerify] = useState<{
    state: "idle" | "ok" | "fail";
    message?: string;
  }>({ state: "idle" });

  useEffect(() => {
    if (share.initial?.token) setToken(share.initial.token);
  }, [share.initial]);

  const parts = useMemo(() => {
    const segs = token.trim().split(".");
    if (segs.length < 2) return null;
    try {
      const header = base64UrlToString(segs[0]);
      const payload = base64UrlToString(segs[1]);
      return { header, payload, signature: segs[2] ?? "" };
    } catch {
      return null;
    }
  }, [token]);

  const headerObj = useMemo(() => {
    try {
      return parts ? JSON.parse(parts.header) : null;
    } catch {
      return null;
    }
  }, [parts]);

  const payloadObj = useMemo<Record<string, unknown> | null>(() => {
    try {
      return parts ? JSON.parse(parts.payload) : null;
    } catch {
      return null;
    }
  }, [parts]);

  const expiry = useMemo(() => {
    if (!payloadObj) return null;
    const exp = typeof payloadObj.exp === "number" ? payloadObj.exp : null;
    const nbf = typeof payloadObj.nbf === "number" ? payloadObj.nbf : null;
    const iat = typeof payloadObj.iat === "number" ? payloadObj.iat : null;
    const now = Math.floor(Date.now() / 1000);
    return {
      expired: exp != null && now >= exp,
      notYetValid: nbf != null && now < nbf,
      exp,
      nbf,
      iat,
    };
  }, [payloadObj]);

  const handleVerify = async () => {
    if (!parts || !headerObj) {
      setVerify({ state: "fail", message: "Invalid token format" });
      return;
    }
    try {
      const alg = String(headerObj.alg ?? "");
      let key: CryptoKey | Uint8Array;
      if (settings.secretType === "secret") {
        key = new TextEncoder().encode(secret);
      } else if (settings.secretType === "spki") {
        key = await importSPKI(secret, alg);
      } else if (settings.secretType === "x509") {
        key = await importX509(secret, alg);
      } else {
        const jwk = JSON.parse(secret);
        key = (await importJWK(jwk, alg)) as CryptoKey;
      }
      await jwtVerify(token.trim(), key);
      setVerify({ state: "ok", message: "Signature is valid" });
    } catch (e) {
      setVerify({ state: "fail", message: e instanceof Error ? e.message : String(e) });
    }
  };

  // Decode only (no verify) for header label
  useMemo(() => {
    if (!token.trim()) return;
    try {
      decodeProtectedHeader(token.trim());
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadSample = () => setToken(SAMPLE_JWT);
  const shareUrl = share.getShareUrl({ token });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Token
          </h3>
          <SampleDataButton onLoad={loadSample} />
        </header>
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={6}
          spellCheck={false}
          className="resize-y break-all font-mono text-xs"
          placeholder="Paste JWT (xxx.yyy.zzz)"
        />
        {parts && (
          <div className="grid gap-1 text-[11px] text-muted-foreground">
            <div>
              <span className="font-mono text-[color:var(--cat-pdf)]">header</span>.
              <span className="font-mono text-[color:var(--cat-text)]">payload</span>.
              <span className="font-mono text-[color:var(--cat-image)]">signature</span>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <Label className="text-xs">Verify signature</Label>
          <Tabs
            value={settings.secretType}
            onValueChange={(v) => setSettings({ secretType: v as Settings["secretType"] })}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="secret" className="text-[11px]">
                HS secret
              </TabsTrigger>
              <TabsTrigger value="spki" className="text-[11px]">
                SPKI PEM
              </TabsTrigger>
              <TabsTrigger value="x509" className="text-[11px]">
                X.509 PEM
              </TabsTrigger>
              <TabsTrigger value="jwk" className="text-[11px]">
                JWK
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            rows={settings.secretType === "secret" ? 1 : 4}
            spellCheck={false}
            className="resize-y font-mono text-xs"
            placeholder={
              settings.secretType === "secret"
                ? "your-256-bit-secret"
                : settings.secretType === "jwk"
                  ? '{"kty":"RSA",...}'
                  : "-----BEGIN PUBLIC KEY-----\n..."
            }
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerify}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <KeyRound className="h-3.5 w-3.5" /> Verify
            </button>
            {verify.state === "ok" && (
              <span className="inline-flex items-center gap-1 text-xs text-[color:var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" /> {verify.message}
              </span>
            )}
            {verify.state === "fail" && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {verify.message}
              </span>
            )}
          </div>
        </div>

        {expiry && (
          <div className="flex flex-wrap gap-2 text-xs">
            {expiry.expired && (
              <span className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-destructive">
                <Clock className="h-3.5 w-3.5" /> Expired
              </span>
            )}
            {expiry.notYetValid && (
              <span className="inline-flex items-center gap-1 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-2 py-1 text-yellow-700 dark:text-yellow-400">
                <Clock className="h-3.5 w-3.5" /> Not yet valid
              </span>
            )}
            {!expiry.expired && !expiry.notYetValid && expiry.exp && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 px-2 py-1 text-[color:var(--success)]">
                <Clock className="h-3.5 w-3.5" /> Active
              </span>
            )}
          </div>
        )}
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        <OutputPanel
          title="Header"
          text={parts ? safePretty(parts.header) : ""}
          filename="header.json"
          mime="application/json"
          shareUrl={shareUrl}
        >
          <pre className="max-h-[180px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
            {parts ? safePretty(parts.header) : "-"}
          </pre>
        </OutputPanel>
        <OutputPanel
          title="Payload"
          text={parts ? safePretty(parts.payload) : ""}
          filename="payload.json"
          mime="application/json"
        >
          <pre className="max-h-[260px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
            {parts ? safePretty(parts.payload) : "-"}
          </pre>
          {payloadObj && (
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {Object.keys(payloadObj)
                .map((k) => ({ k, hint: explainClaim(k) }))
                .filter((x) => x.hint)
                .map((x) => (
                  <li key={x.k}>
                    <code className="text-foreground">{x.k}</code> - {x.hint}
                  </li>
                ))}
            </ul>
          )}
        </OutputPanel>
      </div>
      <ToolToaster />
    </div>
  );
}
