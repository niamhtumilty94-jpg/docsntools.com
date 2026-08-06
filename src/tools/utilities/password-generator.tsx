import { Copy, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMounted } from "@/hooks/use-mounted";
import { ToolToaster } from "@/tools/_shared/toaster";
import { copyToClipboard } from "@/tools/_shared/utils";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>/?~",
  ambiguous: "Il1O0o",
};

// Tiny embedded EFF-style wordlist sample (kept compact; full list would bloat the bundle).
// This is a curated subset of the EFF short wordlist for passphrases.
const WORDLIST = [
  "acid",
  "acorn",
  "acre",
  "acts",
  "afar",
  "affix",
  "aged",
  "agent",
  "agile",
  "aging",
  "agony",
  "ahead",
  "aide",
  "aids",
  "aim",
  "ajar",
  "alarm",
  "alley",
  "ally",
  "alto",
  "amaze",
  "amber",
  "amble",
  "amend",
  "amino",
  "amiss",
  "amply",
  "amuse",
  "angel",
  "anger",
  "angle",
  "ankle",
  "annex",
  "anvil",
  "aorta",
  "apple",
  "april",
  "apron",
  "aqua",
  "arena",
  "argue",
  "arise",
  "armor",
  "aroma",
  "array",
  "arrow",
  "ascot",
  "ashen",
  "aside",
  "askew",
  "aspen",
  "atlas",
  "atom",
  "attic",
  "audio",
  "avert",
  "avian",
  "avoid",
  "await",
  "awake",
  "award",
  "aware",
  "awful",
  "baboon",
  "backed",
  "baggy",
  "baked",
  "baker",
  "baking",
  "balsa",
  "bamboo",
  "banana",
  "banjo",
  "barbell",
  "barber",
  "barley",
  "barn",
  "barrel",
  "based",
  "basic",
  "basil",
  "batch",
  "bath",
  "baton",
  "battle",
  "bazaar",
  "beach",
  "beaded",
  "beagle",
  "beak",
  "beam",
  "bean",
  "beard",
  "beast",
  "beat",
  "beauty",
  "beaver",
  "becalm",
  "becalmed",
  "become",
  "bedbug",
  "bedpost",
  "bedroom",
  "bedside",
  "beech",
  "beefcake",
  "beefy",
  "beehive",
  "beeline",
  "beep",
  "beer",
  "beet",
  "beggar",
  "behave",
  "behind",
  "beige",
  "being",
  "beisbol",
  "belated",
  "belay",
  "belie",
  "bell",
  "belong",
  "below",
  "belt",
  "bench",
  "bend",
  "benign",
  "bento",
  "beret",
  "berry",
  "berserk",
  "beside",
  "best",
  "betray",
  "better",
  "bevel",
  "beyond",
  "bias",
  "bib",
  "bicycle",
  "bid",
  "biked",
  "biking",
  "bin",
  "bingo",
  "binocular",
  "biology",
  "biped",
  "birch",
  "bird",
  "birth",
  "bishop",
  "biting",
  "bitmap",
  "bitten",
  "bizarre",
  "blade",
  "blame",
  "bland",
  "blank",
  "blast",
  "blaze",
  "bleach",
  "bleak",
  "bleed",
  "bleep",
  "blemish",
  "blend",
  "bless",
  "blew",
  "blimp",
  "blink",
  "blip",
  "bliss",
  "blitz",
  "bloated",
  "blob",
  "block",
  "blog",
  "bloom",
  "blot",
  "blouse",
  "blowing",
  "blown",
  "bloated",
  "blue",
  "blunt",
  "blurry",
  "blurt",
  "blush",
  "boast",
  "bobbed",
  "bobcat",
  "bodied",
  "body",
  "bogged",
  "bogus",
  "boil",
  "bok",
  "bolster",
  "bolt",
  "bolted",
  "bonanza",
  "bond",
  "bone",
  "bonnet",
  "bonsai",
  "bonus",
  "booze",
  "border",
  "boss",
  "botanic",
  "botany",
  "bother",
  "bottle",
  "bottom",
  "bouncy",
  "bovine",
  "boxcar",
  "boxer",
  "boxful",
  "boxing",
  "brace",
  "braid",
  "brain",
  "brake",
  "branch",
  "brand",
  "brash",
  "brass",
  "brat",
  "bravado",
  "brave",
  "brawl",
  "bread",
  "break",
  "breath",
  "breed",
  "breeze",
  "brew",
  "briar",
  "brick",
  "bride",
  "bridle",
  "brief",
  "bright",
  "brim",
  "bring",
  "brink",
  "brisk",
  "broad",
  "broil",
  "broke",
  "brook",
  "broom",
  "brought",
  "brown",
  "browse",
  "bruise",
  "brunet",
  "brush",
  "brute",
  "bubbly",
  "buck",
  "buddy",
  "buffalo",
  "buffer",
  "buffet",
  "bugged",
  "buggy",
  "bugle",
  "buildup",
  "built",
  "bulb",
  "bulge",
  "bulk",
  "bullfrog",
  "bullhorn",
  "bully",
  "bunch",
  "bundle",
  "bunion",
  "bunker",
  "bunny",
  "bunt",
  "burden",
  "burlap",
  "burly",
  "burner",
  "burnt",
  "bursa",
  "burst",
  "busboy",
  "bush",
  "busily",
  "busybody",
  "butane",
  "butcher",
  "butler",
  "butter",
  "button",
  "buyer",
  "buzzer",
  "cabana",
  "cabbage",
  "cabinet",
  "cable",
  "cackle",
  "cadet",
  "cadre",
  "cage",
  "caged",
  "cake",
  "calamity",
  "calf",
  "calmly",
  "calorie",
  "came",
  "cameo",
  "camp",
  "candied",
  "candle",
  "candy",
  "cane",
  "canine",
  "canister",
  "canned",
  "cannon",
  "canoe",
  "canola",
  "cantata",
  "canteen",
  "canyon",
  "caper",
  "capital",
  "capped",
  "caps",
  "capture",
  "carbon",
  "cardigan",
  "careful",
  "caress",
  "cargo",
  "caring",
  "carmine",
  "carnage",
  "carol",
  "carpet",
  "carrot",
  "carry",
  "cartel",
  "cartoon",
  "carve",
  "case",
  "cash",
  "casino",
  "casket",
  "cassette",
  "cast",
  "castaway",
  "casual",
  "cat",
  "catalog",
  "catapult",
  "catcher",
  "cater",
  "catfish",
  "catnap",
  "catnip",
  "cattail",
  "cattle",
  "catwalk",
  "caucus",
  "caulk",
  "cause",
  "cavalry",
  "cave",
  "cavern",
  "caviar",
  "cavity",
  "cease",
  "cedar",
  "celery",
  "cell",
  "cement",
  "census",
  "cent",
  "centaur",
  "central",
  "centric",
  "ceramic",
  "cereal",
  "chafe",
  "chain",
  "chair",
  "chalk",
  "chamber",
  "chance",
  "change",
  "chant",
  "chaos",
  "chapel",
  "chapter",
  "charm",
  "chart",
  "chase",
  "chasing",
  "chat",
  "cheek",
  "cheese",
  "cheesy",
  "chef",
  "chemo",
  "cherry",
  "chess",
  "chest",
  "chewable",
  "chewer",
  "chewing",
  "chewy",
  "chick",
  "chief",
  "child",
  "chili",
  "chill",
  "chimp",
  "chip",
  "chirp",
  "chisel",
  "chives",
  "choice",
  "choke",
  "choose",
  "chop",
  "chord",
  "chose",
  "chowder",
  "chowtime",
  "chrome",
  "chuck",
  "chug",
  "chummy",
  "chump",
  "chunk",
  "churn",
  "chute",
  "cider",
  "cigar",
  "cinder",
  "cipher",
  "circle",
  "cited",
  "citizen",
  "citric",
  "citrus",
  "civic",
  "civil",
  "clad",
  "claim",
  "clammy",
  "clamor",
  "clamp",
  "clan",
  "clang",
  "clank",
  "clap",
  "clarify",
  "clash",
  "clasp",
  "class",
  "clatter",
  "clause",
  "claw",
  "clean",
  "clear",
  "cleat",
  "cleaver",
  "cleft",
  "clergy",
  "clerk",
  "clever",
  "client",
  "cliff",
  "climber",
  "cling",
  "clinic",
  "clip",
  "cloak",
  "clock",
  "clog",
  "clone",
  "close",
  "cloth",
  "cloud",
  "clout",
  "clover",
  "cluck",
  "clue",
  "clump",
  "clumsy",
  "clunky",
  "cluster",
  "clutch",
  "clutter",
  "coach",
  "coal",
  "coast",
  "coat",
  "coauthor",
  "cobalt",
  "cobbler",
  "cobweb",
  "cocoa",
  "coconut",
  "cocoon",
  "coddle",
  "code",
  "cofounder",
  "coil",
  "coke",
  "cola",
  "cold",
  "collage",
  "collide",
  "colon",
  "color",
  "colt",
  "columnist",
  "comb",
  "combat",
  "combo",
  "come",
  "comfort",
  "comic",
  "coming",
  "commute",
  "compact",
  "company",
  "compass",
  "compile",
  "comply",
  "comrade",
  "concept",
  "concise",
  "condor",
  "confide",
  "conform",
  "conjurer",
  "contact",
  "contend",
  "contour",
  "convent",
  "convey",
  "cook",
  "cool",
  "cope",
  "copilot",
  "copper",
  "copy",
  "coral",
  "cork",
  "corn",
  "corny",
  "corral",
  "corridor",
  "corrode",
  "corsage",
  "cosmic",
  "costume",
  "cottage",
  "cotton",
  "cougar",
  "county",
  "couple",
  "coupon",
  "courier",
  "course",
  "court",
  "cousin",
  "covet",
  "cowbell",
  "cowering",
  "cozy",
  "crab",
  "cradle",
  "craft",
  "cramp",
  "crane",
  "crank",
  "crate",
  "crater",
  "crave",
  "crayon",
  "crazed",
  "creamer",
  "creamy",
  "credit",
  "creme",
  "cried",
  "crier",
  "crimp",
  "crisp",
  "crisper",
  "critter",
  "croak",
  "crock",
  "crony",
  "crook",
];

type Mode = "password" | "passphrase";

interface ZxcvbnLite {
  score: 0 | 1 | 2 | 3 | 4;
  guesses: number;
  crackTimesDisplay: { offlineFastHashing1e10PerSecond: string };
  feedback: { warning: string; suggestions: string[] };
}

let zxcvbnFn: ((pw: string) => ZxcvbnLite) | null = null;
async function loadZxcvbn() {
  if (zxcvbnFn) return zxcvbnFn;
  const [{ zxcvbn, zxcvbnOptions }, common, en] = await Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ]);
  zxcvbnOptions.setOptions({
    translations: en.translations,
    dictionary: { ...common.dictionary, ...en.dictionary },
    graphs: common.adjacencyGraphs,
  });
  zxcvbnFn = (pw: string) => zxcvbn(pw) as unknown as ZxcvbnLite;
  return zxcvbnFn;
}

function randomFrom(charset: string, count: number) {
  const out: string[] = [];
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  for (let i = 0; i < count; i++) out.push(charset[arr[i] % charset.length]);
  return out.join("");
}

function pickWord() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return WORDLIST[arr[0] % WORDLIST.length];
}

function generatePassword(opts: {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  mustInclude: boolean;
}) {
  const sets: string[] = [];
  let charset = "";
  if (opts.lower) {
    sets.push(SETS.lower);
    charset += SETS.lower;
  }
  if (opts.upper) {
    sets.push(SETS.upper);
    charset += SETS.upper;
  }
  if (opts.digits) {
    sets.push(SETS.digits);
    charset += SETS.digits;
  }
  if (opts.symbols) {
    sets.push(SETS.symbols);
    charset += SETS.symbols;
  }
  if (opts.excludeAmbiguous) {
    charset = charset
      .split("")
      .filter((c) => !SETS.ambiguous.includes(c))
      .join("");
  }
  if (!charset) return "";
  let pw = randomFrom(charset, opts.length);
  if (opts.mustInclude && sets.length > 1) {
    // Ensure at least one char from each enabled set by overwriting random positions.
    const positions = new Set<number>();
    while (positions.size < Math.min(sets.length, opts.length)) {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      positions.add(r[0] % opts.length);
    }
    const arr = pw.split("");
    [...positions].forEach((pos, i) => {
      let s = sets[i];
      if (opts.excludeAmbiguous)
        s = s
          .split("")
          .filter((c) => !SETS.ambiguous.includes(c))
          .join("");
      const cIdx = new Uint32Array(1);
      crypto.getRandomValues(cIdx);
      arr[pos] = s[cIdx[0] % s.length];
    });
    pw = arr.join("");
  }
  return pw;
}

function generatePassphrase(opts: {
  words: number;
  separator: string;
  capitalize: boolean;
  addNumber: boolean;
}) {
  const words = Array.from({ length: opts.words }, pickWord).map((w) =>
    opts.capitalize ? w[0].toUpperCase() + w.slice(1) : w,
  );
  let out = words.join(opts.separator);
  if (opts.addNumber) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    out += String(r[0] % 100);
  }
  return out;
}

const SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
const SCORE_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-yellow-500",
  "bg-green-500",
  "bg-emerald-500",
];

export default function PasswordGenerator() {
  const mounted = useMounted();
  const [mode, setMode] = useState<Mode>("password");

  // Password options
  const [length, setLength] = useState(20);
  const [count, setCount] = useState(3);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [mustInclude, setMustInclude] = useState(true);

  // Passphrase options
  const [words, setWords] = useState(5);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(true);
  const [addNumber, setAddNumber] = useState(true);

  const [passwords, setPasswords] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<number, ZxcvbnLite>>({});

  const generate = useCallback(() => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      out.push(
        mode === "password"
          ? generatePassword({
              length,
              lower,
              upper,
              digits,
              symbols,
              excludeAmbiguous,
              mustInclude,
            })
          : generatePassphrase({ words, separator, capitalize, addNumber }),
      );
    }
    setPasswords(out);
    setScores({});
  }, [
    mode,
    count,
    length,
    lower,
    upper,
    digits,
    symbols,
    excludeAmbiguous,
    mustInclude,
    words,
    separator,
    capitalize,
    addNumber,
  ]);

  // Score asynchronously after generation
  useEffect(() => {
    if (!passwords.length) return;
    let cancelled = false;
    (async () => {
      const fn = await loadZxcvbn();
      if (cancelled) return;
      const next: Record<number, ZxcvbnLite> = {};
      passwords.forEach((p, i) => {
        next[i] = fn(p);
      });
      if (!cancelled) setScores(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [passwords]);

  useEffect(() => {
    if (mounted) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const charsetEmpty = useMemo(
    () => mode === "password" && !lower && !upper && !digits && !symbols,
    [mode, lower, upper, digits, symbols],
  );

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 animate-pulse rounded-md bg-muted/40" />
        <div className="h-48 animate-pulse rounded-md bg-muted/40" />
        <div className="h-56 animate-pulse rounded-lg border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="password">Random password</TabsTrigger>
          <TabsTrigger value="passphrase">Passphrase</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {charsetEmpty && (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Pick at least one character set to generate.
          </div>
        )}
        {passwords.map((pw, i) => {
          const z = scores[i];
          const score = z?.score ?? 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-stretch gap-2">
                <Input
                  readOnly
                  value={pw}
                  className="font-mono text-sm"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(pw, "Password copied")}
                  aria-label="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${SCORE_COLORS[score]} transition-all`}
                    style={{ width: `${((score + (z ? 1 : 0)) / 5) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono">{z ? SCORE_LABELS[score] : "…"}</span>
                {z && (
                  <span className="hidden font-mono sm:inline">
                    crack: {z.crackTimesDisplay.offlineFastHashing1e10PerSecond}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={charsetEmpty}>
          <RefreshCw className="h-4 w-4" /> Regenerate
        </Button>
        {passwords.length > 1 && (
          <Button
            variant="outline"
            onClick={() => copyToClipboard(passwords.join("\n"), "All copied")}
          >
            <Copy className="h-4 w-4" /> Copy all
          </Button>
        )}
      </div>

      {mode === "password" ? (
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Length: {length}</Label>
            <Slider
              min={4}
              max={128}
              step={1}
              value={[length]}
              onValueChange={(v) => setLength(v[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Count: {count}</Label>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Character sets</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Toggle label="Lowercase (a-z)" checked={lower} onChange={setLower} />
              <Toggle label="Uppercase (A-Z)" checked={upper} onChange={setUpper} />
              <Toggle label="Digits (0-9)" checked={digits} onChange={setDigits} />
              <Toggle label="Symbols (!@#…)" checked={symbols} onChange={setSymbols} />
              <Toggle
                label="Exclude ambiguous (Il1O0)"
                checked={excludeAmbiguous}
                onChange={setExcludeAmbiguous}
              />
              <Toggle
                label="Require all enabled sets"
                checked={mustInclude}
                onChange={setMustInclude}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Words: {words}</Label>
            <Slider
              min={3}
              max={10}
              step={1}
              value={[words]}
              onValueChange={(v) => setWords(v[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Count: {count}</Label>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sep">Separator</Label>
            <Input
              id="sep"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              maxLength={3}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="grid grid-cols-1 gap-2">
              <Toggle label="Capitalize words" checked={capitalize} onChange={setCapitalize} />
              <Toggle label="Append number" checked={addNumber} onChange={setAddNumber} />
            </div>
          </div>
        </div>
      )}
      <ToolToaster />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>{label}</span>
    </label>
  );
}
