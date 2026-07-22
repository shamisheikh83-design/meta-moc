import { useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { store, hashPin } from "@/lib/optivisit-store";
import { Eye } from "lucide-react";

export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [mode, setMode] = useState<"loading" | "setup" | "confirm" | "enter">("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const s = store.getSettings();
    setMode(s.pinHash ? "enter" : "setup");
  }, []);

  useEffect(() => {
    if (pin.length !== 4) return;
    (async () => {
      if (mode === "setup") {
        setFirstPin(pin);
        setPin("");
        setMode("confirm");
      } else if (mode === "confirm") {
        if (pin !== firstPin) {
          setError("PINs don't match. Try again.");
          setFirstPin("");
          setPin("");
          setMode("setup");
          return;
        }
        const hash = await hashPin(pin);
        store.setSettings({ ...store.getSettings(), pinHash: hash });
        store.setSession(true);
        onUnlock();
      } else if (mode === "enter") {
        const hash = await hashPin(pin);
        if (hash === store.getSettings().pinHash) {
          store.setSession(true);
          onUnlock();
        } else {
          setError("Incorrect PIN");
          setPin("");
        }
      }
    })();
  }, [pin, mode, firstPin, onUnlock]);

  const title =
    mode === "setup" ? "Create a 4-digit PIN"
    : mode === "confirm" ? "Confirm your PIN"
    : mode === "enter" ? "Enter your PIN"
    : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-lg">
            <Eye className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OptiVisit</h1>
          <p className="text-sm text-muted-foreground mt-1">Field visits tracker for opticians</p>
        </div>
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-center mb-1">{title}</h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {mode === "enter" ? "Unlock to continue" : "Used to unlock the app on this device"}
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={pin} onChange={(v) => { setPin(v); setError(""); }}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && <p className="text-xs text-destructive text-center mt-4">{error}</p>}
          {mode === "enter" && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Reset PIN and clear all app data on this device?")) {
                    localStorage.clear();
                    location.reload();
                  }
                }}
              >
                Forgot PIN? Reset app
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
