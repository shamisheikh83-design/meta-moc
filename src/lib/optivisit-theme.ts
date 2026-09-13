// Client-side color theme customization for OptiVisit

export type ThemeColor = { name: string; value: string };

// 20 well-known colors, mixed intensity
export const THEME_COLORS: ThemeColor[] = [
  { name: "Midnight Navy", value: "oklch(0.28 0.09 260)" },
  { name: "Royal Blue", value: "oklch(0.50 0.18 262)" },
  { name: "Sky Blue", value: "oklch(0.82 0.09 230)" },
  { name: "Teal", value: "oklch(0.55 0.10 195)" },
  { name: "Aqua", value: "oklch(0.85 0.08 205)" },
  { name: "Emerald", value: "oklch(0.58 0.14 155)" },
  { name: "Mint", value: "oklch(0.90 0.06 165)" },
  { name: "Olive", value: "oklch(0.55 0.09 120)" },
  { name: "Lime", value: "oklch(0.85 0.15 130)" },
  { name: "Gold", value: "oklch(0.80 0.14 90)" },
  { name: "Amber", value: "oklch(0.75 0.16 70)" },
  { name: "Orange", value: "oklch(0.68 0.17 50)" },
  { name: "Coral", value: "oklch(0.72 0.14 30)" },
  { name: "Crimson", value: "oklch(0.52 0.20 22)" },
  { name: "Maroon", value: "oklch(0.38 0.12 25)" },
  { name: "Rose", value: "oklch(0.80 0.09 15)" },
  { name: "Plum", value: "oklch(0.45 0.13 320)" },
  { name: "Lavender", value: "oklch(0.85 0.07 300)" },
  { name: "Charcoal", value: "oklch(0.32 0.01 260)" },
  { name: "Ash White", value: "oklch(0.97 0.005 100)" },
];

// Grouped palette by intensity for the minimalist picker
export const THEME_PALETTE: { group: "Light" | "Mid" | "Bright"; colors: ThemeColor[] }[] = [
  {
    group: "Light",
    colors: [
      { name: "Ash White", value: "oklch(0.97 0.005 100)" },
      { name: "Mist", value: "oklch(0.94 0.012 250)" },
      { name: "Sky", value: "oklch(0.90 0.05 230)" },
      { name: "Aqua", value: "oklch(0.91 0.05 205)" },
      { name: "Mint", value: "oklch(0.92 0.05 165)" },
      { name: "Sand", value: "oklch(0.92 0.05 90)" },
      { name: "Blush", value: "oklch(0.90 0.05 25)" },
      { name: "Lilac", value: "oklch(0.90 0.05 300)" },
    ],
  },
  {
    group: "Mid",
    colors: [
      { name: "Slate", value: "oklch(0.55 0.03 250)" },
      { name: "Steel Blue", value: "oklch(0.55 0.10 245)" },
      { name: "Teal", value: "oklch(0.55 0.10 195)" },
      { name: "Sea Green", value: "oklch(0.58 0.12 160)" },
      { name: "Olive", value: "oklch(0.58 0.10 120)" },
      { name: "Bronze", value: "oklch(0.60 0.10 70)" },
      { name: "Brick", value: "oklch(0.55 0.14 30)" },
      { name: "Plum", value: "oklch(0.52 0.13 320)" },
    ],
  },
  {
    group: "Bright",
    colors: [
      { name: "Royal Blue", value: "oklch(0.55 0.20 262)" },
      { name: "Cyan", value: "oklch(0.72 0.15 210)" },
      { name: "Emerald", value: "oklch(0.68 0.18 155)" },
      { name: "Lime", value: "oklch(0.82 0.19 130)" },
      { name: "Gold", value: "oklch(0.82 0.17 90)" },
      { name: "Orange", value: "oklch(0.70 0.19 50)" },
      { name: "Crimson", value: "oklch(0.58 0.23 22)" },
      { name: "Magenta", value: "oklch(0.62 0.24 330)" },
    ],
  },
];

export const NO_FILL = "none";

/** A complete, designed look: toolbar, surfaces, tokens, accents and text. */
export type ThemePreset = {
  id: string;
  name: string;
  mood: string;
  /** Light or dark base, used to group/filter presets in the picker. */
  mode: "light" | "dark";
  /** Preview swatches, in order: toolbar, surface, accent, token */
  swatches: [string, string, string, string];
  vars: Record<string, string>;
};

const preset = (
  id: string,
  name: string,
  mood: string,
  mode: "light" | "dark",
  v: {
    background: string;
    card: string;
    foreground: string;
    muted: string;
    mutedFg: string;
    border: string;
    primary: string;
    primaryFg: string;
    accent: string;
    accentFg: string;
    heading: string;
    subheading: string;
    toolbar: string;
    toolbarFg: string;
    ring: string;
  }
): ThemePreset => ({
  id,
  name,
  mood,
  mode,
  swatches: [v.toolbar, v.background, v.primary, v.card],
  vars: {
    "--background": v.background,
    "--card": v.card,
    "--popover": v.card,
    "--foreground": v.foreground,
    "--card-foreground": v.foreground,
    "--popover-foreground": v.foreground,
    "--muted": v.muted,
    "--muted-foreground": v.mutedFg,
    "--border": v.border,
    "--input": v.border,
    "--primary": v.primary,
    "--primary-foreground": v.primaryFg,
    "--secondary": v.muted,
    "--secondary-foreground": v.foreground,
    "--accent": v.accent,
    "--accent-foreground": v.accentFg,
    "--ring": v.ring,
    "--sidebar": v.card,
    "--sidebar-foreground": v.foreground,
    "--sidebar-accent": v.accent,
    "--sidebar-border": v.border,
    "--ov-heading": v.heading,
    "--ov-subheading": v.subheading,
    "--ov-toolbar": v.toolbar,
    "--ov-toolbar-foreground": v.toolbarFg,
    "--chart-1": v.primary,
    "--chart-2": v.subheading,
    "--chart-3": v.accentFg,
  },
});

export const THEME_PRESETS: ThemePreset[] = [
  preset("harbour", "Harbour", "Navy · aqua · ash", "light", {
    background: "oklch(0.975 0.006 220)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.30 0.06 255)",
    muted: "oklch(0.95 0.02 205)",
    mutedFg: "oklch(0.50 0.04 250)",
    border: "oklch(0.89 0.015 235)",
    primary: "oklch(0.42 0.13 255)",
    primaryFg: "oklch(0.99 0.01 220)",
    accent: "oklch(0.93 0.04 205)",
    accentFg: "oklch(0.36 0.10 240)",
    heading: "oklch(0.33 0.10 255)",
    subheading: "oklch(0.45 0.13 30)",
    toolbar: "linear-gradient(100deg, oklch(0.34 0.11 258), oklch(0.46 0.13 226))",
    toolbarFg: "oklch(0.98 0.01 220)",
    ring: "oklch(0.55 0.12 210)",
  }),
  preset("saffron", "Saffron", "Warm amber · plum", "light", {
    background: "oklch(0.98 0.014 85)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.32 0.05 45)",
    muted: "oklch(0.95 0.035 80)",
    mutedFg: "oklch(0.52 0.05 60)",
    border: "oklch(0.90 0.03 70)",
    primary: "oklch(0.62 0.16 55)",
    primaryFg: "oklch(0.99 0.01 90)",
    accent: "oklch(0.94 0.05 75)",
    accentFg: "oklch(0.42 0.12 40)",
    heading: "oklch(0.36 0.10 35)",
    subheading: "oklch(0.48 0.14 320)",
    toolbar: "linear-gradient(100deg, oklch(0.55 0.16 40), oklch(0.70 0.16 70))",
    toolbarFg: "oklch(0.99 0.01 90)",
    ring: "oklch(0.68 0.15 60)",
  }),
  preset("emerald", "Emerald", "Fresh green · teal", "light", {
    background: "oklch(0.975 0.012 165)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.30 0.05 175)",
    muted: "oklch(0.95 0.03 165)",
    mutedFg: "oklch(0.50 0.04 175)",
    border: "oklch(0.89 0.025 168)",
    primary: "oklch(0.50 0.13 165)",
    primaryFg: "oklch(0.99 0.01 160)",
    accent: "oklch(0.93 0.05 165)",
    accentFg: "oklch(0.38 0.10 170)",
    heading: "oklch(0.32 0.08 175)",
    subheading: "oklch(0.46 0.12 45)",
    toolbar: "linear-gradient(100deg, oklch(0.38 0.10 175), oklch(0.55 0.14 158))",
    toolbarFg: "oklch(0.99 0.01 160)",
    ring: "oklch(0.58 0.12 165)",
  }),
  preset("orchid", "Orchid", "Violet · rose", "light", {
    background: "oklch(0.975 0.012 310)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.31 0.06 305)",
    muted: "oklch(0.95 0.03 305)",
    mutedFg: "oklch(0.51 0.05 305)",
    border: "oklch(0.90 0.025 305)",
    primary: "oklch(0.50 0.17 305)",
    primaryFg: "oklch(0.99 0.01 300)",
    accent: "oklch(0.94 0.04 320)",
    accentFg: "oklch(0.40 0.13 315)",
    heading: "oklch(0.34 0.11 300)",
    subheading: "oklch(0.50 0.15 10)",
    toolbar: "linear-gradient(100deg, oklch(0.38 0.14 305), oklch(0.55 0.16 340))",
    toolbarFg: "oklch(0.99 0.01 310)",
    ring: "oklch(0.60 0.14 310)",
  }),
  preset("graphite", "Graphite", "Quiet neutral", "light", {
    background: "oklch(0.97 0.003 250)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.28 0.01 250)",
    muted: "oklch(0.945 0.005 250)",
    mutedFg: "oklch(0.50 0.01 250)",
    border: "oklch(0.89 0.005 250)",
    primary: "oklch(0.34 0.02 250)",
    primaryFg: "oklch(0.98 0 0)",
    accent: "oklch(0.94 0.01 250)",
    accentFg: "oklch(0.32 0.02 250)",
    heading: "oklch(0.28 0.02 250)",
    subheading: "oklch(0.45 0.05 250)",
    toolbar: "linear-gradient(100deg, oklch(0.27 0.01 250), oklch(0.40 0.02 250))",
    toolbarFg: "oklch(0.98 0 0)",
    ring: "oklch(0.55 0.02 250)",
  }),
  preset("midnight", "Midnight", "Dark mode · cyan", "dark", {
    background: "oklch(0.19 0.03 255)",
    card: "oklch(0.24 0.035 250)",
    foreground: "oklch(0.96 0.01 230)",
    muted: "oklch(0.28 0.035 250)",
    mutedFg: "oklch(0.75 0.02 240)",
    border: "oklch(0.34 0.03 250)",
    primary: "oklch(0.72 0.13 205)",
    primaryFg: "oklch(0.18 0.04 255)",
    accent: "oklch(0.32 0.05 210)",
    accentFg: "oklch(0.93 0.02 205)",
    heading: "oklch(0.93 0.03 205)",
    subheading: "oklch(0.80 0.10 60)",
    toolbar: "linear-gradient(100deg, oklch(0.24 0.05 255), oklch(0.32 0.07 210))",
    toolbarFg: "oklch(0.97 0.01 205)",
    ring: "oklch(0.72 0.13 205)",
  }),
  preset("ocean", "Ocean", "Deep teal · blue", "light", {
    background: "oklch(0.975 0.01 210)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.28 0.06 220)",
    muted: "oklch(0.95 0.025 210)",
    mutedFg: "oklch(0.50 0.04 220)",
    border: "oklch(0.89 0.02 210)",
    primary: "oklch(0.45 0.13 220)",
    primaryFg: "oklch(0.99 0.01 210)",
    accent: "oklch(0.92 0.05 195)",
    accentFg: "oklch(0.36 0.10 210)",
    heading: "oklch(0.30 0.09 222)",
    subheading: "oklch(0.48 0.13 195)",
    toolbar: "linear-gradient(100deg, oklch(0.30 0.10 225), oklch(0.48 0.13 195))",
    toolbarFg: "oklch(0.98 0.01 210)",
    ring: "oklch(0.55 0.11 205)",
  }),
  preset("ruby", "Ruby", "Bold crimson · ink", "light", {
    background: "oklch(0.975 0.008 20)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.30 0.03 20)",
    muted: "oklch(0.95 0.02 20)",
    mutedFg: "oklch(0.50 0.03 20)",
    border: "oklch(0.89 0.02 20)",
    primary: "oklch(0.48 0.19 25)",
    primaryFg: "oklch(0.99 0.01 20)",
    accent: "oklch(0.93 0.04 25)",
    accentFg: "oklch(0.40 0.15 25)",
    heading: "oklch(0.30 0.05 20)",
    subheading: "oklch(0.48 0.19 25)",
    toolbar: "linear-gradient(100deg, oklch(0.32 0.15 15), oklch(0.50 0.20 25))",
    toolbarFg: "oklch(0.99 0.01 20)",
    ring: "oklch(0.55 0.18 25)",
  }),
  preset("sandstone", "Sandstone", "Warm neutral · latte", "light", {
    background: "oklch(0.975 0.01 75)",
    card: "oklch(0.995 0.006 75)",
    foreground: "oklch(0.33 0.03 60)",
    muted: "oklch(0.94 0.02 75)",
    mutedFg: "oklch(0.52 0.03 65)",
    border: "oklch(0.88 0.02 70)",
    primary: "oklch(0.46 0.06 60)",
    primaryFg: "oklch(0.99 0.01 80)",
    accent: "oklch(0.90 0.04 80)",
    accentFg: "oklch(0.40 0.06 60)",
    heading: "oklch(0.33 0.04 55)",
    subheading: "oklch(0.50 0.10 40)",
    toolbar: "linear-gradient(100deg, oklch(0.40 0.05 55), oklch(0.56 0.08 70))",
    toolbarFg: "oklch(0.99 0.01 80)",
    ring: "oklch(0.58 0.06 65)",
  }),
  preset("slate-night", "Slate Night", "Dark mode · cool graphite", "dark", {
    background: "oklch(0.20 0.006 255)",
    card: "oklch(0.25 0.008 255)",
    foreground: "oklch(0.95 0.004 250)",
    muted: "oklch(0.29 0.008 255)",
    mutedFg: "oklch(0.72 0.01 250)",
    border: "oklch(0.35 0.01 255)",
    primary: "oklch(0.78 0.02 250)",
    primaryFg: "oklch(0.20 0.006 255)",
    accent: "oklch(0.33 0.02 250)",
    accentFg: "oklch(0.92 0.01 250)",
    heading: "oklch(0.94 0.005 250)",
    subheading: "oklch(0.75 0.09 90)",
    toolbar: "linear-gradient(100deg, oklch(0.22 0.01 255), oklch(0.30 0.015 250))",
    toolbarFg: "oklch(0.96 0.004 250)",
    ring: "oklch(0.70 0.02 250)",
  }),
  preset("forest", "Forest", "Deep olive · woodland", "light", {
    background: "oklch(0.975 0.012 130)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.30 0.04 135)",
    muted: "oklch(0.94 0.025 130)",
    mutedFg: "oklch(0.50 0.035 130)",
    border: "oklch(0.88 0.025 130)",
    primary: "oklch(0.42 0.09 140)",
    primaryFg: "oklch(0.99 0.01 130)",
    accent: "oklch(0.91 0.045 110)",
    accentFg: "oklch(0.36 0.08 130)",
    heading: "oklch(0.30 0.06 135)",
    subheading: "oklch(0.48 0.11 70)",
    toolbar: "linear-gradient(100deg, oklch(0.30 0.07 140), oklch(0.46 0.10 120))",
    toolbarFg: "oklch(0.98 0.01 130)",
    ring: "oklch(0.55 0.09 135)",
  }),
  preset("berry", "Berry", "Deep magenta · plum", "light", {
    background: "oklch(0.975 0.012 350)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.30 0.05 345)",
    muted: "oklch(0.95 0.03 350)",
    mutedFg: "oklch(0.50 0.05 350)",
    border: "oklch(0.89 0.025 350)",
    primary: "oklch(0.46 0.18 350)",
    primaryFg: "oklch(0.99 0.01 350)",
    accent: "oklch(0.93 0.05 345)",
    accentFg: "oklch(0.38 0.14 350)",
    heading: "oklch(0.32 0.09 350)",
    subheading: "oklch(0.48 0.14 20)",
    toolbar: "linear-gradient(100deg, oklch(0.34 0.15 340), oklch(0.50 0.19 355))",
    toolbarFg: "oklch(0.99 0.01 350)",
    ring: "oklch(0.58 0.16 350)",
  }),
  preset("steel", "Steel", "Cool blue-gray · industrial", "light", {
    background: "oklch(0.97 0.006 240)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.29 0.02 240)",
    muted: "oklch(0.94 0.012 240)",
    mutedFg: "oklch(0.50 0.02 240)",
    border: "oklch(0.88 0.012 240)",
    primary: "oklch(0.44 0.05 240)",
    primaryFg: "oklch(0.98 0.005 240)",
    accent: "oklch(0.91 0.02 210)",
    accentFg: "oklch(0.36 0.04 235)",
    heading: "oklch(0.28 0.03 240)",
    subheading: "oklch(0.50 0.10 230)",
    toolbar: "linear-gradient(100deg, oklch(0.32 0.03 240), oklch(0.46 0.05 220))",
    toolbarFg: "oklch(0.97 0.005 240)",
    ring: "oklch(0.55 0.04 235)",
  }),
  preset("sunrise", "Sunrise", "Coral · gold gradient", "light", {
    background: "oklch(0.98 0.014 60)",
    card: "oklch(1 0 0)",
    foreground: "oklch(0.33 0.05 35)",
    muted: "oklch(0.95 0.035 60)",
    mutedFg: "oklch(0.52 0.05 45)",
    border: "oklch(0.90 0.03 55)",
    primary: "oklch(0.64 0.19 35)",
    primaryFg: "oklch(0.99 0.01 70)",
    accent: "oklch(0.93 0.06 60)",
    accentFg: "oklch(0.42 0.14 30)",
    heading: "oklch(0.35 0.08 30)",
    subheading: "oklch(0.55 0.16 15)",
    toolbar: "linear-gradient(100deg, oklch(0.55 0.19 20), oklch(0.72 0.16 65))",
    toolbarFg: "oklch(0.99 0.01 70)",
    ring: "oklch(0.66 0.17 45)",
  }),
];

/**
 * Icon "packs" style the small icon chips used across stat cards — shape, background and
 * color — independently of the color theme. Each pack has its own fixed identity so it reads
 * consistently no matter which color theme is active.
 */
export type IconPack = { id: string; name: string; mood: string; chipClass: string; iconClass?: string };

export const DEFAULT_ICON_PACK = "soft-sky";

export const ICON_PACKS: IconPack[] = [
  { id: "soft-sky", name: "Soft Sky", mood: "Gentle tinted circles", chipClass: "rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300" },
  { id: "slate-minimal", name: "Slate Minimal", mood: "Quiet neutral squares", chipClass: "rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  { id: "emerald-bold", name: "Emerald Bold", mood: "Solid saturated blocks", chipClass: "rounded-lg bg-emerald-500 text-white dark:bg-emerald-600" },
  { id: "sunset-gradient", name: "Sunset Gradient", mood: "Warm gradient glow", chipClass: "rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-sm" },
  { id: "violet-duotone", name: "Violet Duotone", mood: "Two-tone rounded bubbles", chipClass: "rounded-full bg-violet-200 text-violet-700 dark:bg-violet-900 dark:text-violet-300" },
  { id: "amber-outline", name: "Amber Outline", mood: "Transparent ring badges", chipClass: "rounded-full bg-transparent ring-2 ring-amber-400 text-amber-600 dark:text-amber-400" },
  { id: "midnight-neon", name: "Midnight Neon", mood: "Dark chip, glowing icon", chipClass: "rounded-lg bg-slate-900 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.55)]" },
  { id: "rose-pastel", name: "Rose Pastel", mood: "Airy pastel circles", chipClass: "rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-300" },
  { id: "charcoal-block", name: "Charcoal Block", mood: "Sharp solid blocks", chipClass: "rounded-md bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900" },
  { id: "teal-ring", name: "Teal Ring Badge", mood: "Bordered badge on white", chipClass: "rounded-full bg-white ring-2 ring-teal-500 text-teal-600 shadow-sm dark:bg-neutral-900" },
];

export function getIconPack(id: string): IconPack {
  return ICON_PACKS.find((p) => p.id === id) ?? ICON_PACKS[0];
}

export type AppTheme = {
  /** Preset id, or "" for the app default look. */
  preset: string;
  background: string; // color value or NO_FILL
  card: string; // color value or NO_FILL
  font: string; // color value
  /** Accent / primary override. */
  accent: string;
  /** Icon pack id — styles icon chips independently of the color theme. */
  iconPack: string;
};

const K_THEME = "ov_theme";

export const defaultTheme: AppTheme = { preset: "", background: "", card: "", font: "", accent: "", iconPack: DEFAULT_ICON_PACK };

export function getTheme(): AppTheme {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const raw = localStorage.getItem(K_THEME);
    return raw ? { ...defaultTheme, ...(JSON.parse(raw) as AppTheme) } : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

export function setTheme(t: AppTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_THEME, JSON.stringify(t));
  applyTheme(t);
}

export function findPreset(id: string) {
  return THEME_PRESETS.find((p) => p.id === id) ?? null;
}

const PRESET_VAR_NAMES = Array.from(new Set(THEME_PRESETS.flatMap((p) => Object.keys(p.vars))));

export function applyTheme(t: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Reset everything a theme can own, then re-apply.
  for (const name of PRESET_VAR_NAMES) root.style.removeProperty(name);
  root.style.removeProperty("--theme-font");

  const p = findPreset(t.preset);
  if (p) for (const [k, v] of Object.entries(p.vars)) root.style.setProperty(k, v);

  const custom = !!(t.background || t.card || t.font || t.accent);
  root.toggleAttribute("data-custom-theme", custom || !!p);

  const set = (name: string, v: string | null) =>
    v ? root.style.setProperty(name, v) : undefined;

  if (t.background) set("--background", t.background === NO_FILL ? "transparent" : t.background);
  if (t.card) {
    set("--card", t.card === NO_FILL ? "transparent" : t.card);
    if (t.card !== NO_FILL) set("--popover", t.card);
  }
  if (t.accent) {
    set("--primary", t.accent);
    set("--ring", t.accent);
    set("--ov-toolbar", `linear-gradient(100deg, ${t.accent}, color-mix(in oklab, ${t.accent} 55%, black))`);
    set("--ov-toolbar-foreground", `oklch(0.99 0.01 220)`);
    set("--primary-foreground", `oklch(0.99 0.01 220)`);
  }
  if (t.font) {
    set("--foreground", t.font);
    set("--card-foreground", t.font);
    set("--popover-foreground", t.font);
    set("--ov-heading", t.font);
    set("--ov-subheading", t.font);
    root.style.setProperty("--theme-font", t.font);
  }
}
