import type { Retailer, Visit } from "@/lib/optivisit-store";

export const VISIT_COUNT_BUCKETS = ["0", "1", "2", "3", "4", "5+"] as const;
export type VisitCountBucket = (typeof VISIT_COUNT_BUCKETS)[number];

export const PLANNER_START_YEAR = 2026;
export const PLANNER_END_YEAR = 2040;

/** Inclusive yyyy-mm-dd range check; an empty bound means "no limit" on that side. */
export function isVisitInDateRange(visit: Pick<Visit, "date">, fromDate = "", toDate = "") {
  const date = visit.date.slice(0, 10);
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

export function visitCountBucket(count: number): VisitCountBucket {
  return count >= 5 ? "5+" : String(Math.max(0, count)) as VisitCountBucket;
}