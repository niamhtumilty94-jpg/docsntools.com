/**
 * Shared BPE tokenizer loading for the token-counter and context-window tools.
 *
 * The vocabularies are large, so each encoding is imported dynamically and
 * cached - nothing is fetched until a tool actually needs that encoding, and
 * switching back to one already used is instant. Like every other tool here,
 * this runs entirely in the browser: the text being counted is never sent
 * anywhere.
 */

export type EncodingName = "o200k_base" | "cl100k_base";

export interface EncodingOption {
  value: EncodingName;
  label: string;
  /** Plain-language note on where this encoding is used. */
  note: string;
}

export const ENCODINGS: EncodingOption[] = [
  {
    value: "o200k_base",
    label: "o200k_base",
    note: "The newer OpenAI encoding, used by the GPT-4o generation.",
  },
  {
    value: "cl100k_base",
    label: "cl100k_base",
    note: "The previous OpenAI encoding, used by GPT-4, GPT-3.5 and text-embedding-3.",
  },
];

interface Encoder {
  encode: (text: string) => number[];
  decode: (tokens: number[]) => string;
}

const cache = new Map<EncodingName, Promise<Encoder>>();

export function loadEncoder(name: EncodingName): Promise<Encoder> {
  const cached = cache.get(name);
  if (cached) return cached;

  const loading = (
    name === "o200k_base"
      ? import("gpt-tokenizer/encoding/o200k_base")
      : import("gpt-tokenizer/encoding/cl100k_base")
  ).then((mod) => ({
    encode: (text: string) => mod.encode(text),
    decode: (tokens: number[]) => mod.decode(tokens),
  }));

  cache.set(name, loading);
  return loading;
}

/** Byte length of `text` as UTF-8, which is what most API limits actually measure. */
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatCount(n: number): string {
  return n.toLocaleString();
}

/** "128,000" -> 128000. Returns null when the input isn't a usable number. */
export function parseTokenCount(raw: string): number | null {
  const n = Number(raw.replace(/[,_\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}
