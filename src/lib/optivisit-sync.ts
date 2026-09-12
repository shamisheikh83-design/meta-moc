// Live cross-device sync for OptiVisit.
// Mirrors the app's local data keys to a shared cloud table and keeps every
// installed device up to date in realtime. Last write wins per data set.

import { supabase } from "@/integrations/supabase/client";

/** Data sets that are shared between devices. */
export const SYNC_KEYS = [
  "ov_visits",
  "ov_retailers",
  "ov_salesmen",
  "ov_products",
  "ov_plans",
  "ov_settings",
  "ov_users",
  "ov_theme",
] as const;

const K_DEVICE = "ov_device_id";
const K_META = "ov_sync_meta";
export const SYNC_EVENT = "ov-sync";

type Meta = Record<string, string>;

let started = false;
let originalSetItem: ((k: string, v: string) => void) | null = null;
let online = false;

function deviceId(): string {
  let id = localStorage.getItem(K_DEVICE);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(K_DEVICE, id);
  }
  return id;
}

function readMeta(): Meta {
  try {
    return JSON.parse(localStorage.getItem(K_META) || "{}") as Meta;
  } catch {
    return {};
  }
}

function writeMeta(key: string, at: string) {
  const meta = readMeta();
  meta[key] = at;
  setRaw(K_META, JSON.stringify(meta));
}

function setRaw(key: string, value: string) {
  if (originalSetItem) originalSetItem.call(localStorage, key, value);
  else localStorage.setItem(key, value);
}

function notify() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function isSyncOnline() {
  return online;
}

/** Push one local data set to the cloud. */
async function push(key: string) {
  const raw = localStorage.getItem(key);
  if (raw === null) return;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return;
  }
  const at = new Date().toISOString();
  const { error } = await supabase
    .from("sync_state")
    .upsert({ key, value: value as never, device_id: deviceId(), updated_at: at }, { onConflict: "key" });
  if (!error) writeMeta(key, at);
}

const pending = new Map<string, ReturnType<typeof setTimeout>>();
function schedulePush(key: string) {
  const existing = pending.get(key);
  if (existing) clearTimeout(existing);
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      void push(key);
    }, 400)
  );
}

function applyRemote(row: { key: string; value: unknown; device_id: string | null; updated_at: string }) {
  if (!(SYNC_KEYS as readonly string[]).includes(row.key)) return false;
  const meta = readMeta();
  if (meta[row.key] && new Date(meta[row.key]).getTime() >= new Date(row.updated_at).getTime()) return false;
  setRaw(row.key, JSON.stringify(row.value));
  writeMeta(row.key, row.updated_at);
  return true;
}

/** Start syncing. Safe to call once, from the browser only. */
export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Capture every local write to a shared data set and mirror it to the cloud.
  originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function patchedSetItem(key: string, value: string) {
    originalSetItem!.call(localStorage, key, value);
    if ((SYNC_KEYS as readonly string[]).includes(key)) schedulePush(key);
  } as typeof localStorage.setItem;

  void initialSync();

  const channel = supabase
    .channel("ov_sync_state")
    .on("postgres_changes", { event: "*", schema: "public", table: "sync_state" }, (payload) => {
      const row = payload.new as {
        key: string;
        value: unknown;
        device_id: string | null;
        updated_at: string;
      } | null;
      if (!row?.key) return;
      if (row.device_id === deviceId()) return;
      if (applyRemote(row)) notify();
    })
    .subscribe((status) => {
      online = status === "SUBSCRIBED";
    });

  window.addEventListener("online", () => void initialSync());

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Pull everything from the cloud, then upload anything only this device has. */
export async function initialSync() {
  const { data, error } = await supabase.from("sync_state").select("key, value, device_id, updated_at");
  if (error) return;

  let changed = false;
  const remote = new Map(data.map((r) => [r.key, r]));

  for (const key of SYNC_KEYS) {
    const row = remote.get(key);
    if (row) {
      if (applyRemote(row)) changed = true;
      const meta = readMeta();
      // Local edits made while offline are newer -> upload them.
      if (meta[key] && new Date(meta[key]).getTime() > new Date(row.updated_at).getTime()) await push(key);
    } else if (localStorage.getItem(key) !== null) {
      // First sign-in on the cloud: upload what this device already has.
      await push(key);
    }
  }

  online = true;
  if (changed) notify();
}
