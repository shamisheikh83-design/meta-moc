import { useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { store, hashPin, startSession } from "@/lib/optivisit-store";
import { Eye, Mail, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { accessStore, signIn } from "@/lib/optivisit-access";

type Mode =
  | "loading"
  | "collect-email"       // first-time: capture email before setting PIN
  | "setup"               // choose new PIN (first time OR reset flow)
  | "confirm"             // confirm new PIN
  | "prompt-email"        // existing user, one-time prompt to save email
  | "enter"               // normal unlock
  | "forgot"              // send recovery code via mailto
  | "verify-recovery";    // paste recovery code to unlock reset

const RECOVERY_TTL_MS = 30 * 60 * 1000;

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function generateCode() {
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
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [userId, setUserId] = useState("");
  const [remember, setRemember] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);
  const [recoveryTarget, setRecoveryTarget] = useState("");

  useEffect(() => {
    setHasUsers(accessStore.getUsers().length > 0);
    const s = store.getSettings();
    if (!s.pinHash) setMode("collect-email");
    else if (!s.email) setMode("prompt-email");
    else setMode("enter");
  }, []);

  useEffect(() => {
    if (pin.length !== 4 || busy) return;
    (async () => {
      setBusy(true);
      try {
        if (mode === "setup") {
          setFirstPin(pin);
          setPin("");
          setMode("confirm");
        } else if (mode === "confirm") {
          if (pin !== firstPin) {
            setError("The PINs you entered don't match. Please start again.");
            setFirstPin("");
            setPin("");
            setMode("setup");
            return;
          }
          const hash = await hashPin(pin);
          const s = store.getSettings();
          store.setSettings({ ...s, pinHash: hash, recoveryHash: null, recoveryExpiresAt: null, recoveryUserId: null });
          startSession(null, remember);
          onUnlock();
        } else if (mode === "enter") {
          if (hasUsers) {
            if (!userId.trim()) {
              setError("Please enter your User ID.");
              setPin("");
              return;
            }
            const user = await signIn(userId.trim(), pin);
            if (user) {
              startSession(user.id, remember);
              onUnlock();
            } else {
              setError("That User ID or PIN is not correct.");
              setPin("");
            }
            return;
          }
          const hash = await hashPin(pin);
          if (hash === store.getSettings().pinHash) {
            startSession(null, remember);
            onUnlock();
          } else {
            setError("That PIN is not correct. Please try again.");
            setPin("");
          }
        }
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, mode, firstPin, hasUsers, userId, remember]);

  const clearMessages = () => { setError(""); setNotice(""); };

  const title =
    mode === "collect-email" ? "Set your recovery email"
    : mode === "prompt-email" ? "Add a recovery email"
    : mode === "setup" ? (resetting ? "Set a new 4-digit PIN" : "Create your 4-digit PIN")
    : mode === "confirm" ? "Confirm your PIN"
    : mode === "enter" ? "Sign in"
    : mode === "forgot" ? "Reset your PIN"
    : mode === "verify-recovery" ? "Enter your reset code"
    : "";

  const subtitle =
    mode === "collect-email" ? "We use it only to help you reset your PIN."
    : mode === "prompt-email" ? "A one-time setup so you can reset your PIN later."
    : mode === "enter" ? (hasUsers ? "Enter your User ID and PIN to continue." : "Enter your PIN to continue.")
    : mode === "forgot" ? "We'll prepare an email containing a reset code."
    : mode === "verify-recovery" ? "Paste the code from the reset email. It expires in 30 minutes."
    : "Choose a PIN you'll remember.";

  const handleSaveEmailAndContinue = () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address, e.g. name@company.com.");
      return;
    }
    const s = store.getSettings();
    store.setSettings({ ...s, email: email.trim() });
    clearMessages();
    setMode(mode === "collect-email" ? "setup" : "enter");
    if (mode === "prompt-email") setNotice("Recovery email saved.");
  };

  const startForgot = () => {
    clearMessages();
    const s = store.getSettings();
    let target = s.email ?? "";
    if (hasUsers) {
      const u = accessStore.getUsers().find((x) => x.username === userId.trim().toLowerCase());
      if (!u) {
        setError("Enter your User ID first so we know where to send the reset code.");
        return;
      }
      if (!u.email) {
        setError("No email is registered for this User ID. Ask an administrator to reset your PIN.");
        return;
      }
      target = u.email;
    }
    if (!target) {
      setError("No recovery email is saved yet. Add one to enable PIN reset.");
      setMode("prompt-email");
      return;
    }
    setRecoveryTarget(target);
    setMode("forgot");
  };

  const handleSendRecovery = async () => {
    const s = store.getSettings();
    if (!recoveryTarget) return;
    const code = generateCode();
    const codeHash = await hashPin(code);
    const user = hasUsers ? accessStore.getUsers().find((x) => x.username === userId.trim().toLowerCase()) : null;
    store.setSettings({
      ...s,
      recoveryHash: codeHash,
      recoveryExpiresAt: Date.now() + RECOVERY_TTL_MS,
      recoveryUserId: user?.id ?? null,
    });
    const subject = encodeURIComponent("Meta Opti Connect — PIN reset code");
    const body = encodeURIComponent(
      `Your PIN reset code is:\n\n${code}\n\nOpen the app and paste this code to set a new PIN. The code expires in 30 minutes.\nIf you didn't request this, you can ignore this email.`
    );
    window.location.href = `mailto:${recoveryTarget}?subject=${subject}&body=${body}`;
    clearMessages();
    setNotice(`Reset code prepared for ${recoveryTarget}.`);
    setMode("verify-recovery");
  };

  const handleVerifyRecovery = async () => {
    const s = store.getSettings();
    if (!s.recoveryHash) {
      setError("No reset code was requested. Please start again.");
      return;
    }
    if (s.recoveryExpiresAt && Date.now() > s.recoveryExpiresAt) {
      store.setSettings({ ...s, recoveryHash: null, recoveryExpiresAt: null, recoveryUserId: null });
      setError("This reset code has expired. Please request a new one.");
      setMode("forgot");
      return;
    }
    const inputHash = await hashPin(recoveryInput.trim().toUpperCase());
    if (inputHash !== s.recoveryHash) {
      setError("That reset code is not valid. Check it and try again.");
      return;
    }
    clearMessages();
    setRecoveryInput("");
    setResetting(true);
    setPin("");
    setFirstPin("");
    setNotice("Code verified. Choose your new PIN.");
    setMode("setup");
  };

  const showPinPad = mode === "setup" || mode === "confirm" || mode === "enter";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_minmax(0,420px)] gap-10 items-center">
        {/* Brand panel — desktop only */}
        <div className="hidden lg:flex flex-col gap-6 pr-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-none">Meta Opti Connect</h1>
              <p className="text-sm text-muted-foreground mt-1">Field visit management for opticians</p>
            </div>
          </div>
          <p className="text-base text-muted-foreground max-w-md leading-relaxed">
            Record salesman visits, track retailers by city and area, and review performance reports — on desktop and on the road.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Access is protected by your personal User ID and PIN.
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="flex lg:hidden flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-lg">
              <Eye className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Meta Opti Connect</h1>
            <p className="text-xs text-muted-foreground mt-1">Field visit management for opticians</p>
          </div>

          <div className="bg-card rounded-2xl border shadow-lg p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>

            {(mode === "collect-email" || mode === "prompt-email") && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEmailAndContinue()}
                  />
                </div>
                <Button className="w-full h-11" onClick={handleSaveEmailAndContinue}>
                  {mode === "collect-email" ? "Continue" : "Save email"}
                </Button>
                {mode === "prompt-email" && (
                  <Button variant="ghost" className="w-full" onClick={() => { clearMessages(); setMode("enter"); }}>
                    Not now
                  </Button>
                )}
              </div>
            )}

            {mode === "enter" && hasUsers && (
              <div className="space-y-1.5 mb-5">
                <Label htmlFor="userid">User ID</Label>
                <Input
                  id="userid"
                  autoFocus
                  autoCapitalize="none"
                  autoComplete="username"
                  className="h-11"
                  placeholder="Your user ID"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); clearMessages(); }}
                />
              </div>
            )}

            {showPinPad && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="block text-center">
                    {mode === "enter" ? "4-digit PIN" : mode === "confirm" ? "Re-enter PIN" : "New 4-digit PIN"}
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={4} value={pin} onChange={(v) => { setPin(v); clearMessages(); }}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {mode === "enter" && (
                  <label className="flex items-center gap-2 justify-center text-sm text-muted-foreground cursor-pointer select-none">
                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                    Keep me logged in for 30 days
                  </label>
                )}

                {busy && (
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
                  </p>
                )}
              </div>
            )}

            {mode === "forgot" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">A reset code will be emailed to</span>
                  <div className="mt-1 font-medium break-all">{recoveryTarget}</div>
                </div>
                <Button className="w-full h-11" onClick={handleSendRecovery}>
                  <Mail className="w-4 h-4 mr-2" /> Send reset code
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { clearMessages(); setMode("enter"); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </div>
            )}

            {mode === "verify-recovery" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Reset code</Label>
                  <Input
                    id="code"
                    autoFocus
                    className="h-11 tracking-widest"
                    placeholder="e.g. K3P9XA2M"
                    value={recoveryInput}
                    onChange={(e) => { setRecoveryInput(e.target.value.toUpperCase()); clearMessages(); }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyRecovery()}
                  />
                </div>
                <Button className="w-full h-11" onClick={handleVerifyRecovery} disabled={recoveryInput.trim().length < 4}>
                  Verify code
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { clearMessages(); setMode("enter"); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-5 rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2 text-center">
                {error}
              </p>
            )}
            {!error && notice && (
              <p className="mt-5 rounded-lg bg-primary/10 text-primary text-sm px-3 py-2 text-center">{notice}</p>
            )}

            {mode === "enter" && (
              <div className="mt-6 text-center border-t pt-4">
                <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={startForgot}>
                  Forgot your PIN?
                </Button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Meta Opti Connect · Secure field visit tracking
          </p>
        </div>
      </div>
    </div>
  );
}
