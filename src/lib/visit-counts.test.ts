import { describe, expect, it } from "vitest";
import type { Retailer, Visit } from "@/lib/optivisit-store";
import {
  countVisitsByRetailer,
  PLANNER_END_YEAR,
  PLANNER_START_YEAR,
  visitCountBucket,
} from "@/lib/visit-counts";

const retailer = (id: string): Retailer => ({
  id,
  name: id,
  owner: "",
  city: "",
  area: "",
  phone: "",
  address: "",
  notes: "",
});

const visit = (retailerId: string, date: string): Visit => ({
  id: `${retailerId}-${date}`,
  date,
  retailerId,
  salesman: "",
  purpose: "",
  visitStatus: "Visited",
  outcome: "Satisfactory",
  notes: "",
});

describe("Visits tab count filters", () => {
  it("counts only visits inside the inclusive selected date range and retains zero-visit shops", () => {
    const counts = countVisitsByRetailer(
      [retailer("a"), retailer("b")],
      [visit("a", "2026-01-01"), visit("a", "2026-01-03"), visit("b", "2026-01-05")],
      "2026-01-02",
      "2026-01-04",
    );
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(0);
  });

  it("maps zero, exact counts, and five-or-more visits to the requested filter buckets", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(visitCountBucket)).toEqual(["0", "1", "2", "3", "4", "5+", "5+"]);
  });
});

describe("Planner calendar range", () => {
  it("allows calendar years 2026 through 2040", () => {
    expect(PLANNER_START_YEAR).toBe(2026);
    expect(PLANNER_END_YEAR).toBe(2040);
  });
});