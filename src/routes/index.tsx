import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PinGate } from "@/components/optivisit/PinGate";
import { OptiVisitApp } from "@/components/optivisit/App";
import { store } from "@/lib/optivisit-store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meta Opti Connect" },
      { name: "description", content: "Salesmen to Opticians Visit Recorder - Log salesmen visits to optician shops for engagement, complaints, marketing jobs, getting orders and awareness." },
      { property: "og:title", content: "Meta Opti Connect" },
      { property: "og:description", content: "Salesmen to Opticians Visit Recorder - Log salesmen visits to optician shops for engagement, complaints, marketing jobs, getting orders and awareness." },
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
