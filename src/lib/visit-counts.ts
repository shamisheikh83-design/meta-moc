import type { Retailer, Visit } from "@/lib/optivisit-store";
import { addDaysToDateKey, appDateKey, dateKeyWeekday } from "./app-time";

export const VISIT_COUNT_BUCKETS = ["0", "1", "2", "3", "4", "5+"] as const;
export type VisitCountBucket = (typeof VISIT_COUNT_BUCKETS)[number];

export const PLANNER_START_YEAR = 2026;
export const PLANNER_END_YEAR = 2040;

/** Inclusive yyyy-mm-dd range check on the app clock; an empty bound means "no limit" on that side. */
export function isVisitInDateRange(visit: Pick<Visit, "date">, fromDate = "", toDate = "") {
  const date = appDateKey(visit.date);
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

export function countVisitsByRetailer(
  retailers: Retailer[],
  visits: Visit[],
  fromDate = "",
  toDate = "",
) {
  const counts = new Map(retailers.map((retailer) => [retailer.id, 0]));
  visits.forEach((visit) => {
    if (!isVisitInDateRange(visit, fromDate, toDate)) return;
    if (counts.has(visit.retailerId)) {
      counts.set(visit.retailerId, (counts.get(visit.retailerId) ?? 0) + 1);
    }
  });
  return counts;
}

export const VISIT_RANGE_PRESETS = ["today", "week", "month", "all", "custom"] as const;
export type VisitRangePreset = (typeof VISIT_RANGE_PRESETS)[number];

/**
 * yyyy-mm-dd bounds for a quick date preset, on the app clock (PKT).
 * Weeks start on Monday. "all" and "custom" have no computed bounds.
 */
export function visitRangeForPreset(preset: VisitRangePreset, now: Date = new Date()): { from: string; to: string } {
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const to = appDateKey(now);
  if (preset === "today") return { from: to, to };
  if (preset === "week") return { from: addDaysToDateKey(to, -((dateKeyWeekday(to) + 6) % 7)), to };
  return { from: `${to.slice(0, 7)}-01`, to };
}

/** Headline coverage numbers for a set of per-shop visit counts. */
export function summarizeCoverage(counts: Map<string, number>) {
  let visited = 0;
  let visits = 0;
  counts.forEach((n) => {
    if (n > 0) visited++;
    visits += n;
  });
  const shops = counts.size;
  return {
    shops,
    visited,
    notVisited: shops - visited,
    visits,
    coveragePct: shops === 0 ? 0 : Math.round((visited / shops) * 100),
  };
}

/** Latest visit date (yyyy-mm-dd) per shop, ignoring any date filter. */
export function lastVisitByRetailer(visits: Pick<Visit, "date" | "retailerId">[]) {
  const last = new Map<string, string>();
  visits.forEach((visit) => {
    const date = appDateKey(visit.date);
    const prev = last.get(visit.retailerId);
    if (!prev || date > prev) last.set(visit.retailerId, date);
  });
  return last;
}

export function visitCountBucket(count: number): VisitCountBucket {
  return count >= 5 ? "5+" : String(Math.max(0, count)) as VisitCountBucket;
}