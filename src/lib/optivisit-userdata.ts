// Data owned by a user: export, transfer to another user, or delete.
// Used by Super User account management in Settings.

import { store, type Retailer, type Visit } from "./optivisit-store";

export type DateRange = { from: string; to: string }; // yyyy-mm-dd, both optional-empty

export type UserDataBundle = {
  visits: Visit[];
  retailers: Retailer[];
};

function inRange(iso: string, range?: DateRange) {
  if (!range || (!range.from && !range.to)) return true;
  const d = iso.slice(0, 10);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

/** Everything created by this user, optionally limited to a date range. */
export function collectUserData(userId: string, range?: DateRange): UserDataBundle {
  const visits = store.getVisits().filter((v) => v.addedByUserId === userId && inRange(v.date, range));
  const visitRetailerIds = new Set(visits.map((v) => v.retailerId));
  const retailers = store
    .getRetailers()
    .filter((r) => r.addedByUserId === userId || (range && visitRetailerIds.has(r.id) && r.addedByUserId === userId));
  return { visits, retailers };
}

export function countUserData(userId: string, range?: DateRange) {
  const d = collectUserData(userId, range);
  return { visits: d.visits.length, retailers: d.retailers.length };
}

/** Move a user's data (within an optional date range) to another user. */
export function transferUserData(fromUserId: string, toUserId: string, toName: string, range?: DateRange) {
  const bundle = collectUserData(fromUserId, range);
  const visitIds = new Set(bundle.visits.map((v) => v.id));
  const retailerIds = new Set(bundle.retailers.map((r) => r.id));

  store.setVisits(
    store.getVisits().map((v) => (visitIds.has(v.id) ? { ...v, addedByUserId: toUserId, addedByName: toName } : v))
  );
  store.setRetailers(
    store
      .getRetailers()
      .map((r) => (retailerIds.has(r.id) ? { ...r, addedByUserId: toUserId, addedByName: toName } : r))
  );
  return { visits: visitIds.size, retailers: retailerIds.size };
}

/** Permanently remove a user's data (within an optional date range). */
export function deleteUserData(userId: string, range?: DateRange) {
  const bundle = collectUserData(userId, range);
  const visitIds = new Set(bundle.visits.map((v) => v.id));
  const retailerIds = new Set(bundle.retailers.map((r) => r.id));

  store.setVisits(store.getVisits().filter((v) => !visitIds.has(v.id)));
  store.setRetailers(store.getRetailers().filter((r) => !retailerIds.has(r.id)));
  return { visits: visitIds.size, retailers: retailerIds.size };
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Download a user's data as CSV (visits + retailers) for safe keeping. */
export function exportUserDataCsv(userLabel: string, userId: string, range?: DateRange) {
  const { visits, retailers } = collectUserData(userId, range);
  const retailerName = (id: string) => store.getRetailers().find((r) => r.id === id)?.name ?? id;

  const lines: string[] = [];
  lines.push("VISITS");
  lines.push(["date", "retailer", "salesman", "purpose", "visit status", "activity", "outcome", "notes"].join(","));
  for (const v of visits)
    lines.push(
      [v.date, retailerName(v.retailerId), v.salesman, v.purpose, v.visitStatus, v.activity ?? "", v.outcome, v.notes]
        .map(csvCell)
        .join(",")
    );
  lines.push("");
  lines.push("RETAILERS");
  lines.push(["name", "owner", "city", "phone", "address", "category", "notes"].join(","));
  for (const r of retailers)
    lines.push([r.name, r.owner, r.city, r.phone, r.address, r.category ?? "", r.notes].map(csvCell).join(","));

  download(`${userLabel}-data.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  return { visits: visits.length, retailers: retailers.length };
}

/** Download a user's data as JSON (full fidelity backup). */
export function exportUserDataJson(userLabel: string, userId: string, range?: DateRange) {
  const bundle = collectUserData(userId, range);
  download(`${userLabel}-data.json`, JSON.stringify(bundle, null, 2), "application/json");
  return { visits: bundle.visits.length, retailers: bundle.retailers.length };
}
