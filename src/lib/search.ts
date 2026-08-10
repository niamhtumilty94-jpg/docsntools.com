/**
 * Relevance scoring for the command palette.
 *
 * Replaces cmdk's default `command-score`, which concatenates every field of an
 * item into one string and then accepts *any* subsequence of the query within
 * it. That is far too permissive for structured data: searching "crop" matched
 * 20 of 39 tools, because the letters c-r-o-p could be assembled from unrelated
 * words spread across a tool's name, description, category and keywords
 * ("Compress PDF" scored 0.79 against "crop").
 *
 * The model here instead:
 *  - keeps fields separate and weights them (a name hit beats a description hit)
 *  - ranks by *how* the query matched (exact > prefix > word prefix > substring)
 *  - requires every query term to match something (AND semantics), so
 *    "pdf merge" and "merge pdf" both find Merge PDF but "crop" cannot drag in
 *    Compress PDF
 *  - allows at most a single-character typo, and only on terms long enough for
 *    that to be meaningful
 */

export interface Searchable {
  name: string;
  description?: string;
  category?: string;
  keywords?: string[];
}

/** Field weights. A hit in a name is worth far more than one in prose. */
const WEIGHT = {
  name: 1,
  keywords: 0.8,
  category: 0.55,
  description: 0.45,
} as const;

/** How the term matched, best first. */
const TIER = {
  exact: 1, // field is exactly the term
  wholeWord: 0.9, // some word in the field is exactly the term
  fieldPrefix: 0.88, // field starts with the term
  wordPrefix: 0.82, // some word starts with the term ("comp" -> "compress")
  substring: 0.6, // term appears somewhere ("mage" -> "image")
  typo: 0.38, // one character off ("compres" -> "compress")
} as const;

/** Terms shorter than this are never typo-corrected - too many false hits. */
const MIN_TYPO_LEN = 4;

/**
 * Lowercase, strip accents, and reduce punctuation to spaces so "Markdown ↔
 * HTML", "json-formatter" and "JSON Formatter" all normalise comparably.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  const n = normalize(query);
  return n.length === 0 ? [] : n.split(" ");
}

/**
 * True when `a` and `b` differ by at most one insert, delete, substitution or
 * transposition (optimal string alignment distance <= 1).
 *
 * Transpositions matter: "comrpess" for "compress" is one of the most common
 * real typos, but costs two edits under plain Levenshtein and would otherwise
 * not be corrected.
 */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 1) return false;

  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i++) {
    const cur = new Array<number>(n + 1);
    cur[0] = i;
    let rowMin = cur[0];

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }

    // Every alignment through this row already costs more than we allow.
    if (rowMin > 1) return false;
    prev2 = prev;
    prev = cur;
  }
  return prev[n] <= 1;
}

/** Best tier at which `term` matches `text`, or 0 for no match. */
function matchTier(term: string, text: string): number {
  if (text.length === 0) return 0;
  if (text === term) return TIER.exact;

  const words = text.split(" ");
  if (words.includes(term)) return TIER.wholeWord;
  if (text.startsWith(term)) return TIER.fieldPrefix;
  if (words.some((w) => w.startsWith(term))) return TIER.wordPrefix;
  if (text.includes(term)) return TIER.substring;

  if (term.length >= MIN_TYPO_LEN && words.some((w) => withinOneEdit(term, w))) {
    return TIER.typo;
  }
  return 0;
}

/** Best weighted score for one term across all of an item's fields. */
function scoreTerm(item: Searchable, term: string): number {
  let best = matchTier(term, normalize(item.name)) * WEIGHT.name;

  for (const kw of item.keywords ?? []) {
    best = Math.max(best, matchTier(term, normalize(kw)) * WEIGHT.keywords);
  }
  if (item.category) {
    best = Math.max(best, matchTier(term, normalize(item.category)) * WEIGHT.category);
  }
  if (item.description) {
    best = Math.max(best, matchTier(term, normalize(item.description)) * WEIGHT.description);
  }
  return best;
}

/**
 * Overall relevance of `item` for `query`. Returns 0 when the item should be
 * hidden: every term must match something, so adding words narrows results
 * rather than widening them.
 */
export function scoreItem(item: Searchable, query: string): number {
  const terms = tokenize(query);
  if (terms.length === 0) return 1;

  let total = 0;
  for (const term of terms) {
    const s = scoreTerm(item, term);
    if (s === 0) return 0;
    total += s;
  }

  let score = total / terms.length;

  // Reward whole-query matches on the name so "Crop Image" outranks a tool that
  // merely mentions cropping.
  const name = normalize(item.name);
  const whole = normalize(query);
  if (name === whole) score += 0.5;
  else if (name.startsWith(whole)) score += 0.25;
  else if (name.includes(whole)) score += 0.1;

  return score;
}

/**
 * Filter and rank `items`. Ties break on name length then alphabetically, so
 * ordering is stable rather than dependent on array order.
 */
export function searchItems<T extends Searchable>(items: readonly T[], query: string): T[] {
  if (tokenize(query).length === 0) return [...items];

  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.name.length - b.item.name.length ||
        a.item.name.localeCompare(b.item.name),
    )
    .map((r) => r.item);
}
