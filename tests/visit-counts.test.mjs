import assert from "node:assert/strict";
import { describe, test } from "bun:test";
import { countVisitsByRetailer, isVisitInDateRange, PLANNER_END_YEAR, PLANNER_START_YEAR, visitCountBucket } from "../src/lib/visit-counts.ts";

const retailer = (id) => ({ id, name: id });
const visit = (retailerId, date) => ({ id: `${retailerId}-${date}`, retailerId, date });

describe("Visits and Planner rules", () => {
  test("counts visits only inside the inclusive date range and retains zero-visit shops", () => {
    const counts = countVisitsByRetailer(
      [retailer("a"), retailer("b")],
      [visit("a", "2026-01-01"), visit("a", "2026-01-03"), visit("b", "2026-01-05")],
      "2026-01-02",
      "2026-01-04",
    );
    assert.equal(counts.get("a"), 1);
    assert.equal(counts.get("b"), 0);
  });

  test("treats both date-range bounds as inclusive and empty bounds as open", () => {
    const v = { date: "2026-01-03T10:00:00.000Z" };
    assert.equal(isVisitInDateRange(v), true);
    assert.equal(isVisitInDateRange(v, "2026-01-03", "2026-01-03"), true);
    assert.equal(isVisitInDateRange(v, "2026-01-04", ""), false);
    assert.equal(isVisitInDateRange(v, "", "2026-01-02"), false);
  });

  test("maps zero, exact values, and five-or-more visits to the count buckets", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5, 8].map(visitCountBucket), ["0", "1", "2", "3", "4", "5+", "5+"]);
  });

  test("limits Planner years to 2026 through 2040", () => {
    assert.equal(PLANNER_START_YEAR, 2026);
    assert.equal(PLANNER_END_YEAR, 2040);
  });
});