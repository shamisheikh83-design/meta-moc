// Local storage helpers for OptiVisit app (client-only PIN + data)

export const VISIT_STATUSES = ["Visited", "Not Visited", "No Update", "Holiday"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const OUTCOMES = [
  "Satisfactory",
  "Successful",
  "Not Interested",
  "Meeting unsuccessful",
  "Not Met",
  "Complaints",
  "Linked to Other Company",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const VISIT_PURPOSES = [
  "New connect",
  "Engagement",
  "Complaint",
  "Order booking",
  "Brand awareness",
  "Marketing",
  "Recovery",
  "Other",
] as const;
export type VisitPurpose = (typeof VISIT_PURPOSES)[number];

// Report counters / salesman visit record types
export const VISIT_ACTIVITIES = [
  "Visits",
  "City Visits",
  "Areas Visited",
  "Shops Visited",
  "Recovery Visits",
  "Complaints Visits",
  "Others Reasons",
] as const;
export type VisitActivity = (typeof VISIT_ACTIVITIES)[number];

export const UNAVAILABLE_REASONS = ["Holiday", "Sick", "Weather Conditions", "Leave"] as const;
export type UnavailableReason = (typeof UNAVAILABLE_REASONS)[number];

export type Visit = {
  id: string;
  date: string; // ISO
  retailerId: string;
  salesman: string;
  purpose: string;
  /** Area for this specific visit — defaults from the retailer's area but can be overridden. */
  area?: string;
  visitStatus: VisitStatus;
  outcome: Outcome;
  notes: string;
  activity?: VisitActivity;
  unavailableReason?: UnavailableReason;
  /** Access-control user id of whoever recorded this visit. */
  addedByUserId?: string;
  addedByName?: string;
};

export const SHOP_CATEGORIES = ["A+", "A", "B", "C"] as const;
export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export type Retailer = {
  id: string;
  name: string;
  owner: string;
  city: string;
  area: string;
  phone: string;
  address: string;
  notes: string;
  salesmanId?: string;
  category?: ShopCategory;
  /** Access-control user id of whoever created this retailer. */
  addedByUserId?: string;
  addedByName?: string;
};

export type Salesman = {
  id: string;
  name: string;
  city: string;
  region: string;
  mobile: string;
};

// ---- Lens product catalog ----
export const LENS_MAIN_CATEGORIES = [
  "Single Vision",
  "Bifocal",
  "Progressive",
  "Office / Computer",
  "Sunglass Lens",
  "Contact Lens",
] as const;
export type LensMainCategory = (typeof LENS_MAIN_CATEGORIES)[number];

export const LENS_MATERIALS = [
  "CR-39",
  "Polycarbonate",
  "Trivex",
  "High-Index 1.60",
  "High-Index 1.67",
  "High-Index 1.74",
  "Glass",
] as const;
export type LensMaterial = (typeof LENS_MATERIALS)[number];

export const LENS_COATINGS = [
  "Regular (No Coating)",
  "Anti-Reflective",
  "Blue-Cut",
  "Photochromic",
  "UV Protection",
  "Anti-Scratch",
  "Polarized",
  "Mirror Coated",
] as const;
export type LensCoating = (typeof LENS_COATINGS)[number];

export type Product = {
  id: string;
  name: string;
  brand: string;
  /** Main category: lens type. */
  mainCategory: LensMainCategory;
  /** Sub category: lens material / index family. */
  subCategory: LensMaterial;
  /** Normal category: coating / finish. */
  normalCategory: LensCoating;
  index?: string;
  powerRange?: string;
  baseCurve?: string;
  diameter?: string;
  color?: string;
  price?: number;
  stock?: number;
  sku?: string;
  supplier?: string;
  warranty?: string;
  notes?: string;
  createdAt: string;
  /** Access-control user id of whoever recorded this product. */
  addedByUserId?: string;
  addedByName?: string;
};

export type Settings = {
  salesmanName: string;
  pinHash: string | null;
  email: string | null;
  recoveryHash: string | null;
  /** Epoch ms when the recovery code stops being valid. */
  recoveryExpiresAt?: number | null;
  /** Which app user requested the recovery (empty for device-level PIN). */
  recoveryUserId?: string | null;
  /** Recent Visits window on the Dashboard: show visits from the last N days... */
  recentVisitsDays?: number;
  /** ...capped at this many entries, whichever limit is hit first. */
  recentVisitsLimit?: number;
};


const K_VISITS = "ov_visits";
const K_RETAILERS = "ov_retailers";
const K_SALESMEN = "ov_salesmen";
const K_PRODUCTS = "ov_products";
const K_SETTINGS = "ov_settings";
const K_SESSION = "ov_session";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export const store = {
  getVisits: () => read<Visit[]>(K_VISITS, []),
  setVisits: (v: Visit[]) => write(K_VISITS, v),
  getRetailers: () => read<Retailer[]>(K_RETAILERS, []),
  setRetailers: (v: Retailer[]) => write(K_RETAILERS, v),
  getSalesmen: () => read<Salesman[]>(K_SALESMEN, []),
  setSalesmen: (v: Salesman[]) => write(K_SALESMEN, v),
  getProducts: () => read<Product[]>(K_PRODUCTS, []),
  setProducts: (v: Product[]) => write(K_PRODUCTS, v),
  getSettings: () => read<Settings>(K_SETTINGS, { salesmanName: "", pinHash: null, email: null, recoveryHash: null }),
  setSettings: (v: Settings) => write(K_SETTINGS, v),
  getSession: () => getSessionInfo() !== null,
  setSession: (v: boolean) => {
    if (!v) endSession();
  },
};

/** Session record. Short-lived sessions live in sessionStorage, "keep me logged in" in localStorage. */
export type SessionInfo = { userId: string | null; expiresAt: number; persistent: boolean };

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours (normal, not "kept")
export const REMEMBER_DAY_MS = 24 * 60 * 60 * 1000;
/** "Always" is implemented as a very long, practically-never-expiring window. */
export const REMEMBER_ALWAYS_MS = 100 * 365 * REMEMBER_DAY_MS;

export const REMEMBER_DURATIONS = [1, 3, 7, 30, "always"] as const;
export type RememberDuration = (typeof REMEMBER_DURATIONS)[number];

/**
 * Start a session. When `persistent` is true, `rememberDays` picks how long it's kept
 * (a number of days, or "always"); ignored when `persistent` is false.
 */
export function startSession(userId: string | null, persistent: boolean, rememberDays: RememberDuration = 30): SessionInfo {
  const ttl = !persistent
    ? SESSION_TTL_MS
    : rememberDays === "always"
      ? REMEMBER_ALWAYS_MS
      : rememberDays * REMEMBER_DAY_MS;
  const info: SessionInfo = {
    userId,
    persistent,
    expiresAt: Date.now() + ttl,
  };
  if (typeof window === "undefined") return info;
  endSession();
  const raw = JSON.stringify(info);
  if (persistent) localStorage.setItem(K_SESSION, raw);
  else sessionStorage.setItem(K_SESSION, raw);
  return info;
}

export function getSessionInfo(): SessionInfo | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(K_SESSION) ?? localStorage.getItem(K_SESSION);
  if (!raw) return null;
  try {
    const info = JSON.parse(raw) as SessionInfo;
    if (!info?.expiresAt || Date.now() > info.expiresAt) {
      endSession();
      return null;
    }
    return info;
  } catch {
    endSession();
    return null;
  }
}

export function endSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(K_SESSION);
  localStorage.removeItem(K_SESSION);
}


// Very simple hash (not real security — this is a local gate only)
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(`optivisit::${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
