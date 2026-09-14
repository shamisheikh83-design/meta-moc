// Live "who's online" presence for OptiVisit, backed by Supabase Realtime Presence.
// Counts distinct signed-in users currently connected, across every device/tab.

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const PRESENCE_EVENT = "ov-presence";

type PresenceUser = { userId: string; name: string };

let channel: RealtimeChannel | null = null;
let currentUsers: PresenceUser[] = [];

function notify() {
  window.dispatchEvent(new CustomEvent(PRESENCE_EVENT));
}

export function getPresenceCount(): number {
  return currentUsers.length;
}

export function getPresenceUsers(): PresenceUser[] {
  return currentUsers;
}

export function stopPresence() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  currentUsers = [];
}

/** Start broadcasting this session's presence and tracking everyone else's. Call once per signed-in session. */
export function startPresence(userId: string, name: string): () => void {
  if (typeof window === "undefined") return () => {};
  stopPresence();

  const key = `${userId}:${Math.random().toString(36).slice(2)}`;
  const ch = supabase.channel("ov_presence", { config: { presence: { key } } });
  channel = ch;

  ch.on("presence", { event: "sync" }, () => {
    const state = ch.presenceState<PresenceUser>();
    const seen = new Map<string, PresenceUser>();
    Object.values(state).forEach((entries) => {
      entries.forEach((e) => seen.set(e.userId, { userId: e.userId, name: e.name }));
    });
    currentUsers = Array.from(seen.values());
    notify();
  }).subscribe(async (status) => {
    if (status === "SUBSCRIBED") await ch.track({ userId, name });
  });

  return stopPresence;
}
