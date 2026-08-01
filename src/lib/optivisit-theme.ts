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

export const NO_FILL = "none";

export type AppTheme = {
  background: string; // color value or NO_FILL
  card: string; // color value or NO_FILL
  font: string; // color value
};

const K_THEME = "ov_theme";

export const defaultTheme: AppTheme = { background: "", card: "", font: "" };

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

export function applyTheme(t: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const custom = !!(t.background || t.card || t.font);
  root.toggleAttribute("data-custom-theme", custom);

  const set = (name: string, v: string | null) => (v ? root.style.setProperty(name, v) : root.style.removeProperty(name));

  set("--background", t.background === NO_FILL ? "transparent" : t.background || null);
  set("--card", t.card === NO_FILL ? "transparent" : t.card || null);
  set("--popover", t.card === NO_FILL ? null : t.card || null);
  if (t.font) {
    set("--foreground", t.font);
    set("--card-foreground", t.font);
    set("--popover-foreground", t.font);
    root.style.setProperty("--theme-font", t.font);
  } else {
    set("--foreground", null);
    set("--card-foreground", null);
    set("--popover-foreground", null);
    root.style.removeProperty("--theme-font");
  }
}
