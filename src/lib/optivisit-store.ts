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

export type Settings = {
  salesmanName: string;
  pinHash: string | null;
  email: string | null;
  recoveryHash: string | null;
};

const K_VISITS = "ov_visits";
const K_RETAILERS = "ov_retailers";
const K_SALESMEN = "ov_salesmen";
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
  getSettings: () => read<Settings>(K_SETTINGS, { salesmanName: "", pinHash: null, email: null, recoveryHash: null }),
  setSettings: (v: Settings) => write(K_SETTINGS, v),
  getSession: () => (typeof window !== "undefined" ? sessionStorage.getItem(K_SESSION) === "1" : false),
  setSession: (v: boolean) => {
    if (typeof window === "undefined") return;
    if (v) sessionStorage.setItem(K_SESSION, "1");
    else sessionStorage.removeItem(K_SESSION);
  },
};

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
