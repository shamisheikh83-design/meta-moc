import { useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { store, hashPin, startSession } from "@/lib/optivisit-store";
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  User,
  MapPin,
  ClipboardList,
  BarChart3,
  Lock,
  KeyRound,
} from "lucide-react";
import { accessStore, signIn, requestPinReset } from "@/lib/optivisit-access";

/** Brand mark: a pair of spectacles, standing in for opticians/lenses. */
function GlassesMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="6.75" cy="13" r="4.25" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.25" cy="13" r="4.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 13h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M2.5 12.2c0-1.9 1.1-3.4 2.6-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M21.5 12.2c0-1.9-1.1-3.4-2.6-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Decorative line-art sketch of an opticians' shopfront, with spectacles in the window. */
function OpticalShopSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 145h220M18 55l14-15 14 15-14 15zM46 55l14-15 14 15-14 15zM74 55l14-15 14 15-14 15zM102 55l14-15 14 15-14 15zM130 55l14-15 14 15-14 15zM158 55l14-15 14 15-14 15zM186 55l14-15 14 15-14 15z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="24" y="55" width="192" height="90" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="40" y="70" width="58" height="46" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="142" y="70" width="58" height="46" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M169 82h34M186 70v46" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <g transform="translate(50,84)">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="29" cy="9" r="8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M17 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M1 7.5C1 4.5 3 2 5.5 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M37 7.5c0-3-2-5.5-4.5-6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <rect x="106" y="96" width="28" height="49" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="128" cy="121" r="1.6" fill="currentColor" />
    </svg>
  );
}

type Mode =
  | "loading"
  | "collect-email"       // first-time: capture email before setting PIN
  | "setup"               // choose new PIN (first time OR reset flow)
  | "confirm"             // confirm new PIN
  | "prompt-email"        // existing user, one-time prompt to save email
  | "enter"               // normal unlock
  | "forgot"              // send recovery code via mailto (single-device, no users mode)
  | "verify-recovery"     // paste recovery code to unlock reset (single-device, no users mode)
  | "request-reset"       // multi-user mode: submit a PIN reset request to a Super User
  | "request-sent";       // multi-user mode: confirmation the request was submitted

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
  const [resetIdentifier, setResetIdentifier] = useState("");

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
    : mode === "request-reset" ? "Forgot your PIN?"
    : mode === "request-sent" ? "Request sent"
    : "";

  const subtitle =
    mode === "collect-email" ? "We use it only to help you reset your PIN."
    : mode === "prompt-email" ? "A one-time setup so you can reset your PIN later."
    : mode === "enter" ? (hasUsers ? "Enter your User ID or email and PIN to continue." : "Enter your PIN to continue.")
    : mode === "forgot" ? "We'll prepare an email containing a reset code."
    : mode === "verify-recovery" ? "Paste the code from the reset email. It expires in 30 minutes."
    : mode === "request-reset" ? "A Super User will verify it's you and set a new PIN."
    : mode === "request-sent" ? "Ask your Super User to confirm and reset it for you."
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
    if (hasUsers) {
      setResetIdentifier(userId.trim());
      setMode("request-reset");
      return;
    }
    const s = store.getSettings();
    const target = s.email ?? "";
    if (!target) {
      setError("No recovery email is saved yet. Add one to enable PIN reset.");
      setMode("prompt-email");
      return;
    }
    setRecoveryTarget(target);
    setMode("forgot");
  };

  const submitResetRequest = () => {
    if (!resetIdentifier.trim()) {
      setError("Enter your User ID or email.");
      return;
    }
    const res = requestPinReset(resetIdentifier);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    clearMessages();
    setMode("request-sent");
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
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Decorative background mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-aqua/25 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-maroon/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklab, var(--foreground) 100%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--foreground) 100%, transparent) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_minmax(0,420px)] gap-8 lg:gap-10 items-stretch">
          {/* Brand panel — desktop only */}
          <div className="hidden lg:flex animate-in fade-in-0 slide-in-from-left-4 duration-700">
            <div className="ov-toolbar relative flex w-full flex-col justify-between overflow-hidden rounded-3xl p-10 shadow-2xl">
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
                  backgroundSize: "28px 28px, 42px 42px",
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur flex items-center justify-center shadow-lg">
                    <GlassesMark className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight leading-none text-[color:var(--ov-toolbar-foreground)]">Meta Opti Connect</h1>
                    <p className="text-sm opacity-80 mt-1">Field visit management for opticians</p>
                  </div>
                </div>

                <p className="text-base opacity-90 max-w-md leading-relaxed mt-8">
                  Everything your field team needs to track visits, manage retailers, and report performance — in one place.
                </p>

                <ul className="mt-8 space-y-4">
                  <FeatureRow icon={<ClipboardList className="w-4 h-4" />} text="Log salesman visits in seconds, on any device" />
                  <FeatureRow icon={<MapPin className="w-4 h-4" />} text="Track retailers by city, area, and assigned salesman" />
                  <FeatureRow icon={<BarChart3 className="w-4 h-4" />} text="Review performance with real-time reports" />
                </ul>

                <OpticalShopSketch className="w-full max-w-[280px] h-auto mt-8 opacity-80" />
              </div>

              <div className="relative mt-10 flex items-center gap-2 text-xs opacity-80 border-t border-white/15 pt-5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Access is protected by your personal User ID and PIN.
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="w-full max-w-sm mx-auto lg:mx-0 flex flex-col justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex lg:hidden flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
                <GlassesMark className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Meta Opti Connect</h1>
              <p className="text-xs text-muted-foreground mt-1">Field visit management for opticians</p>
              <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-primary via-aqua to-maroon" />
              <OpticalShopSketch className="w-full max-w-[220px] h-auto mt-5 text-primary/70" />
            </div>

            <div className="bg-card/95 backdrop-blur rounded-3xl border shadow-2xl shadow-primary/5 ring-1 ring-black/[0.02] p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-1">
                <div className="hidden sm:flex w-9 h-9 rounded-full bg-primary/10 text-primary items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>

            {(mode === "collect-email" || mode === "prompt-email") && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoFocus
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-11 pl-9"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEmailAndContinue()}
                    />
                  </div>
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
                <Label htmlFor="userid">User ID or email</Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="userid"
                    autoFocus
                    autoCapitalize="none"
                    autoComplete="username"
                    className="h-11 pl-9"
                    placeholder="Your user ID or email"
                    value={userId}
                    onChange={(e) => { setUserId(e.target.value); clearMessages(); }}
                  />
                </div>
              </div>
            )}

            {showPinPad && (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <Label className="flex items-center justify-center gap-1.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <KeyRound className="w-3.5 h-3.5" />
                    {mode === "enter" ? "4-digit PIN" : mode === "confirm" ? "Re-enter PIN" : "New 4-digit PIN"}
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={4} value={pin} onChange={(v) => { setPin(v); clearMessages(); }}>
                      <InputOTPGroup className="gap-2.5">
                        <InputOTPSlot index={0} className="h-13 w-13 rounded-xl border text-lg font-semibold" />
                        <InputOTPSlot index={1} className="h-13 w-13 rounded-xl border text-lg font-semibold" />
                        <InputOTPSlot index={2} className="h-13 w-13 rounded-xl border text-lg font-semibold" />
                        <InputOTPSlot index={3} className="h-13 w-13 rounded-xl border text-lg font-semibold" />
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

            {mode === "request-reset" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-identifier">User ID or email</Label>
                  <Input
                    id="reset-identifier"
                    autoFocus
                    autoCapitalize="none"
                    className="h-11"
                    placeholder="Your user ID or registered email"
                    value={resetIdentifier}
                    onChange={(e) => { setResetIdentifier(e.target.value); clearMessages(); }}
                    onKeyDown={(e) => e.key === "Enter" && submitResetRequest()}
                  />
                </div>
                <Button className="w-full h-11" onClick={submitResetRequest}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Send request
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { clearMessages(); setMode("enter"); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </div>
            )}

            {mode === "request-sent" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 text-primary p-3 text-sm flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>A Super User will confirm it's you and set a new PIN. Ask them directly once you expect it's done.</span>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { clearMessages(); setUserId(""); setMode("enter"); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" aria-live="polite" className="mt-5 flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[11px] font-bold">!</span>
                {error}
              </p>
            )}
            {!error && notice && (
              <p aria-live="polite" className="mt-5 flex items-center gap-2 rounded-xl bg-primary/10 text-primary text-sm px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {notice}
              </p>
            )}

            {mode === "enter" && (
              <div className="mt-6 text-center border-t pt-4">
                <Button variant="link" size="sm" className="h-auto p-0 text-sm font-medium" onClick={startForgot}>
                  Forgot your PIN?
                </Button>
              </div>
            )}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center mt-4">
            <Lock className="w-3 h-3" /> Meta Opti Connect · Secure field visit tracking
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
        {icon}
      </span>
      <span className="opacity-90">{text}</span>
    </li>
  );
}
