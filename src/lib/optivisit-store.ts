// Local storage helpers for OptiVisit app (client-only PIN + data)

export type Visit = {
  id: string;
  date: string; // ISO
  retailerId: string;
  salesman: string;
  purpose: string;
  outcome: "successful" | "follow-up" | "no-interest";
  ordersValue: number;
  notes: string;
};

export type Retailer = {
  id: string;
  name: string;
  owner: string;
  city: string;
  phone: string;
  address: string;
  notes: string;
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
  getSettings: () => read<Settings>(K_SETTINGS, { salesmanName: "", pinHash: null }),
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
