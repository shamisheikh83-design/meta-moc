import { useEffect, useMemo, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, hashPin } from "@/lib/optivisit-store";
import { Eye, Mail } from "lucide-react";
import { accessStore, signIn } from "@/lib/optivisit-access";

type Mode =
  | "loading"
  | "collect-email"       // first-time: capture email before setting PIN
  | "setup"               // choose new PIN (first time OR reset flow)
  | "confirm"             // confirm new PIN
  | "prompt-email"        // existing user, one-time prompt to save email
  | "enter"               // normal unlock
  | "forgot"              // show/send recovery code via mailto
  | "verify-recovery";    // paste recovery code to unlock reset

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function generateCode() {
  // 8-char alphanumeric, easy to type
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false); // true after successful recovery verify
  const [userId, setUserId] = useState("");
  const [hasUsers, setHasUsers] = useState(false);

  useEffect(() => {
    setHasUsers(accessStore.getUsers().length > 0);
    const s = store.getSettings();
    if (!s.pinHash) {
      setMode("collect-email");
    } else if (!s.email) {
      setMode("prompt-email");
    } else {
      setMode("enter");
    }
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
        const s = store.getSettings();
        store.setSettings({ ...s, pinHash: hash, recoveryHash: null });
        store.setSession(true);
        onUnlock();
      } else if (mode === "enter") {
        if (hasUsers) {
          if (!userId.trim()) {
            setError("Enter your User ID");
            setPin("");
            return;
          }
          const user = await signIn(userId.trim(), pin);
          if (user) {
            store.setSession(true);
            onUnlock();
          } else {
            setError("Invalid User ID or PIN");
            setPin("");
          }
          return;
        }
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
  }, [pin, mode, firstPin, onUnlock, hasUsers, userId]);

  const savedEmail = useMemo(() => store.getSettings().email ?? "", [mode]);

  const title =
    mode === "collect-email" ? "Set your recovery email"
    : mode === "prompt-email" ? "Add a recovery email"
    : mode === "setup" ? (resetting ? "Set a new 4-digit PIN" : "Create a 4-digit PIN")
    : mode === "confirm" ? "Confirm your PIN"
    : mode === "enter" ? "Enter your PIN"
    : mode === "forgot" ? "Reset PIN by email"
    : mode === "verify-recovery" ? "Enter recovery code"
    : "";

  const subtitle =
    mode === "collect-email" ? "Used to reset your PIN if you forget it"
    : mode === "prompt-email" ? "One-time setup so you can reset your PIN later"
    : mode === "enter" ? (hasUsers ? "Enter your User ID and PIN to continue" : "Unlock to continue")
    : mode === "forgot" ? "We'll open your mail app with a recovery code"
    : mode === "verify-recovery" ? "Paste the code from the email you sent yourself"
    : "Used to unlock the app on this device";

  const handleSaveEmailAndContinue = () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    const s = store.getSettings();
    store.setSettings({ ...s, email: email.trim() });
    setError("");
    if (mode === "collect-email") setMode("setup");
    else setMode("enter");
  };

  const handleSkipPromptEmail = () => {
    setError("");
    setMode("enter");
  };

  const handleSendRecovery = async () => {
    const s = store.getSettings();
    if (!s.email) return;
    const code = generateCode();
    const codeHash = await hashPin(code);
    store.setSettings({ ...s, recoveryHash: codeHash });
    const subject = encodeURIComponent("OptiVisit PIN reset code");
    const body = encodeURIComponent(
      `Your OptiVisit PIN reset code is:\n\n${code}\n\nOpen the app and paste this code to set a new PIN. If you didn't request this, ignore this email.`
    );
    window.location.href = `mailto:${s.email}?subject=${subject}&body=${body}`;
    setMode("verify-recovery");
  };

  const handleVerifyRecovery = async () => {
    const s = store.getSettings();
    const inputHash = await hashPin(recoveryInput.trim().toUpperCase());
    if (!s.recoveryHash || inputHash !== s.recoveryHash) {
      setError("Invalid recovery code");
      return;
    }
    setError("");
    setRecoveryInput("");
    setResetting(true);
    setPin("");
    setFirstPin("");
    setMode("setup");
  };

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
          <p className="text-xs text-muted-foreground text-center mb-6">{subtitle}</p>

          {(mode === "collect-email" || mode === "prompt-email") && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                />
              </div>
              <Button className="w-full" onClick={handleSaveEmailAndContinue}>
                {mode === "collect-email" ? "Continue" : "Save email"}
              </Button>
              {mode === "prompt-email" && (
                <Button variant="ghost" size="sm" className="w-full" onClick={handleSkipPromptEmail}>
                  Not now
                </Button>
              )}
            </div>
          )}

          {mode === "enter" && hasUsers && (
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="userid" className="text-xs">User ID</Label>
              <Input
                id="userid"
                autoFocus
                autoCapitalize="none"
                placeholder="Your user ID"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setError(""); }}
              />
            </div>
          )}

          {(mode === "setup" || mode === "confirm" || mode === "enter") && (
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
          )}

          {mode === "forgot" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                A recovery code will be emailed to:
                <div className="mt-1 font-medium text-foreground break-all">{savedEmail || "(no email saved)"}</div>
              </div>
              <Button className="w-full" onClick={handleSendRecovery} disabled={!savedEmail}>
                <Mail className="w-4 h-4 mr-2" /> Open mail app with code
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setError(""); setMode("enter"); }}>
                Back
              </Button>
            </div>
          )}

          {mode === "verify-recovery" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs">Recovery code</Label>
                <Input
                  id="code"
                  autoFocus
                  placeholder="e.g. K3P9XA2M"
                  value={recoveryInput}
                  onChange={(e) => { setRecoveryInput(e.target.value.toUpperCase()); setError(""); }}
                />
              </div>
              <Button className="w-full" onClick={handleVerifyRecovery} disabled={recoveryInput.trim().length < 4}>
                Verify code
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setError(""); setMode("enter"); }}>
                Cancel
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-destructive text-center mt-4">{error}</p>}

          {mode === "enter" && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const s = store.getSettings();
                  if (!s.email) {
                    setError("Add a recovery email first to enable reset.");
                    setMode("prompt-email");
                    return;
                  }
                  setError("");
                  setMode("forgot");
                }}
              >
                Forgot PIN?
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
