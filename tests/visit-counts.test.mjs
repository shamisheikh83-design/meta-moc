import assert from "node:assert/strict";
import { describe, test } from "bun:test";
import { appDateKey, appTimestampOnDate } from "../src/lib/app-time.ts";
import { countVisitsByRetailer, isVisitInDateRange, lastVisitByRetailer, PLANNER_END_YEAR, PLANNER_START_YEAR, summarizeCoverage, visitCountBucket, visitRangeForPreset } from "../src/lib/visit-counts.ts";

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

  test("builds quick date presets with Monday-start weeks and month-to-date", () => {
    const friday = new Date("2026-11-13T10:00:00+05:00"); // Fri 13 Nov 2026, PKT
    assert.deepEqual(visitRangeForPreset("today", friday), { from: "2026-11-13", to: "2026-11-13" });
    assert.deepEqual(visitRangeForPreset("week", friday), { from: "2026-11-09", to: "2026-11-13" });
    assert.deepEqual(visitRangeForPreset("month", friday), { from: "2026-11-01", to: "2026-11-13" });
    assert.deepEqual(visitRangeForPreset("all", friday), { from: "", to: "" });
    const sunday = new Date("2026-11-01T10:00:00+05:00"); // Sun 1 Nov 2026 -> week began Mon 26 Oct
    assert.deepEqual(visitRangeForPreset("week", sunday), { from: "2026-10-26", to: "2026-11-01" });
  });

  test("files every visit and 'today' on the app clock (PKT, GMT+5)", () => {
    // 20:30 UTC on 2 Jan is already 01:30 on 3 Jan in Pakistan.
    const lateNight = { date: "2026-01-02T20:30:00.000Z" };
    assert.equal(appDateKey(lateNight.date), "2026-01-03");
    assert.equal(isVisitInDateRange(lateNight, "2026-01-03", "2026-01-03"), true);
    assert.equal(appDateKey("2026-01-02T18:59:59.000Z"), "2026-01-02");
    assert.equal(appDateKey("2026-05-09"), "2026-05-09");
    assert.equal(visitRangeForPreset("today", new Date("2026-01-02T20:30:00.000Z")).from, "2026-01-03");
    // A visit logged for 3 Jan while the app clock reads 01:30 keeps that day and time.
    assert.equal(appTimestampOnDate("2026-01-03", new Date("2026-01-02T20:30:00.000Z")), "2026-01-02T20:30:00.000Z");
    assert.equal(appDateKey(appTimestampOnDate("2026-06-15", new Date("2026-01-02T20:30:00.000Z"))), "2026-06-15");
  });

  test("summarizes coverage and handles an empty shop list", () => {
    assert.deepEqual(summarizeCoverage(new Map([["a", 3], ["b", 0], ["c", 1]])), {
      shops: 3, visited: 2, notVisited: 1, visits: 4, coveragePct: 67,
    });
    assert.equal(summarizeCoverage(new Map()).coveragePct, 0);
  });

  test("finds each shop's latest visit date", () => {
    const last = lastVisitByRetailer([visit("a", "2026-01-01"), visit("a", "2026-01-03"), visit("b", "2026-01-02")]);
    assert.equal(last.get("a"), "2026-01-03");
    assert.equal(last.get("b"), "2026-01-02");
    assert.equal(last.get("c"), undefined);
  });

  test("limits Planner years to 2026 through 2040", () => {
    assert.equal(PLANNER_START_YEAR, 2026);
    assert.equal(PLANNER_END_YEAR, 2040);
  });
});