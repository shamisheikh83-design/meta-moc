import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PinGate } from "@/components/optivisit/PinGate";
import { OptiVisitApp } from "@/components/optivisit/App";
import { store } from "@/lib/optivisit-store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meta Opti Visit — Optician Visits Recorder" },
      { name: "description", content: "Log salesmen visits to optician shops, manage retailers, and view reports." },
      { property: "og:title", content: "Meta Opti Visit — Optician Visits Recorder" },
      { property: "og:description", content: "Log salesmen visits to optician shops, manage retailers, and view reports." },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(store.getSession());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      {unlocked ? <OptiVisitApp onLock={() => setUnlocked(false)} /> : <PinGate onUnlock={() => setUnlocked(true)} />}
      <Toaster position="top-center" />
    </>
  );
}
