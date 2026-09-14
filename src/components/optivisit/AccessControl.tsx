import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Trash2, UserPlus, LogOut, KeyRound, Pencil, ArrowRightLeft, Download, ArrowLeft, AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  ROLES,
  MAX_SUPER_ADMINS,
  PERMISSION_CATALOG,
  ROLE_DEFAULTS,
  allPermissionIds,
  accessStore,
  effectivePermissions,
  superAdmins,
  createUser,
  changeRole,
  setPermissions,
  deleteUser,
  updateUser,
  verifyPin,
  signIn,
  requestPinReset,
  resolvePinReset,
  isScopedRole,
  setSalesmanIds,
  type AppUser,
  type Role,
} from "@/lib/optivisit-access";
import { store, type Salesman } from "@/lib/optivisit-store";
import {
  countUserData,
  deleteUserData,
  exportUserDataCsv,
  exportUserDataJson,
  transferUserData,
  type DateRange,
} from "@/lib/optivisit-userdata";

export function AccessControl({
  currentUser,
  onChanged,
}: {
  currentUser: AppUser | null;
  onChanged: () => void;
}) {
  const users = accessStore.getUsers();
  const isSuper = currentUser?.role === "Super Admin";

  if (users.length === 0) return <FirstSuperUser onChanged={onChanged} />;
  if (!currentUser) return <SignInPanel onChanged={onChanged} users={users} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Access level control
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Signed in as <span className="font-medium">{currentUser.name}</span> · {currentUser.role}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            accessStore.setCurrentUserId(null);
            onChanged();
          }}
        >
          <LogOut className="w-3.5 h-3.5 mr-1" /> Sign out
        </Button>
      </div>

      {!isSuper ? (
        <div className="space-y-2">
          <div className="rounded-xl border p-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium">{currentUser.role}</p>
              <p className="text-[11px] text-muted-foreground">{effectivePermissions(currentUser).length} permissions</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">View only</Badge>
          </div>
          <PermissionChecklist value={effectivePermissions(currentUser)} onChange={() => {}} readOnly />
          <p className="text-[10px] text-muted-foreground">Only a Super User can change access levels.</p>
        </div>
      ) : (
        <SuperUserPanel users={users} currentUser={currentUser} onChanged={onChanged} />
      )}
    </div>
  );
}

/* --------------- first-run bootstrap --------------- */
function FirstSuperUser({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const create = async () => {
    const res = await createUser({ name, username, role: "Super Admin", pin, permissions: allPermissionIds() });
    if (!res.ok) return toast.error(res.error);
    accessStore.setCurrentUserId(res.user.id);
    toast.success("Super User created — all features linked");
    onChanged();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4" /> Access level control
      </h3>
      <p className="text-xs text-muted-foreground">
        Create the first Super User. Super Users are automatically linked to every tab, module, feature, status,
        report and setting.
      </p>
      <div className="grid gap-2">
        <Row label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Row>
        <Row label="User ID"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. superuser" /></Row>
        <Row label="4-digit PIN">
          <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
        </Row>
      </div>
      <Button size="sm" onClick={create}>Create Super User</Button>
    </div>
  );
}

/* --------------- sign in --------------- */
function SignInPanel({ users, onChanged }: { users: AppUser[]; onChanged: () => void }) {
  const [mode, setMode] = useState<"signin" | "forgot" | "requested">("signin");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [identifier, setIdentifier] = useState("");

  const submit = async () => {
    const user = await signIn(username, pin);
    if (!user) return toast.error("Invalid user ID/email or PIN");
    toast.success(`Welcome ${user.name}`);
    onChanged();
  };

  const submitReset = () => {
    const res = requestPinReset(identifier);
    if (!res.ok) return toast.error(res.error);
    setMode("requested");
  };

  if (mode === "forgot" || mode === "requested") {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Mail className="w-4 h-4" /> Forgot your PIN?
        </h3>
        {mode === "forgot" ? (
          <>
            <p className="text-xs text-muted-foreground">
              Enter your User ID or the email your Super User has on file. This sends a reset request — a Super
              User will verify it's you and set a new PIN.
            </p>
            <Row label="User ID or email">
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g. jdoe or jdoe@company.com" />
            </Row>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReset}>Send request</Button>
              <Button size="sm" variant="outline" onClick={() => setMode("signin")}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Request sent. A Super User will confirm it's you and set a new PIN — ask them directly once you expect it's done.
            </p>
            <Button size="sm" variant="outline" onClick={() => setMode("signin")}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in</Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <KeyRound className="w-4 h-4" /> Sign in
      </h3>
      <p className="text-xs text-muted-foreground">{users.length} user{users.length === 1 ? "" : "s"} registered on this device.</p>
      <Row label="User ID or email"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="User ID or email" /></Row>
      <Row label="PIN">
        <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
      </Row>
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={submit}>Sign in</Button>
        <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => setMode("forgot")}>Forgot your PIN?</Button>
      </div>
    </div>
  );
}

/* --------------- super user management --------------- */
function SuperUserPanel({
  users,
  currentUser,
  onChanged,
}: {
  users: AppUser[];
  currentUser: AppUser;
  onChanged: () => void;
}) {
  const supers = superAdmins(users);
  const sorted = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const pending = users.filter((u) => u.pinResetRequestedAt);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {supers.length}/{MAX_SUPER_ADMINS} Super Users · {users.length} total
        </p>
        <AddUserDialog onChanged={onChanged} supersCount={supers.length} />
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {pending.length} PIN reset request{pending.length === 1 ? "" : "s"} waiting — look for the badge below.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((u) => (
          <div key={u.id} className={`rounded-xl border p-3 space-y-2 ${u.pinResetRequestedAt ? "border-amber-300 dark:border-amber-800" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  {u.pinResetRequestedAt && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Reset requested
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">@{u.username}{u.email ? ` · ${u.email}` : ""}</div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {u.pinResetRequestedAt && <PinResetRequestDialog user={u} onChanged={onChanged} />}
                <PermissionsDialog user={u} onChanged={onChanged} />
                {isScopedRole(u.role) && <SalesmenDialog user={u} onChanged={onChanged} />}
                <EditUserDialog user={u} onChanged={onChanged} />
                <TransferDataDialog user={u} users={users} onChanged={onChanged} />
                <DeleteUserDialog user={u} users={users} currentUser={currentUser} onChanged={onChanged} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={u.role}
                onValueChange={(v) => {
                  const res = changeRole(u.id, v as Role);
                  if (!res.ok) return toast.error(res.error);
                  toast.success(`${u.name} is now ${v}`);
                  onChanged();
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-[10px]">
                {effectivePermissions(u).length} permissions
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PinResetRequestDialog({ user, onChanged }: { user: AppUser; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [newPin, setNewPin] = useState("");

  const identifier = (user.pinResetRequestIdentifier ?? "").trim().toLowerCase();
  const onFileEmail = (user.email ?? "").trim().toLowerCase();
  const matchesEmail = !!onFileEmail && identifier === onFileEmail;
  const matchesUsername = identifier === user.username.trim().toLowerCase();

  const setPin = async () => {
    const res = await resolvePinReset(user.id, newPin);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${user.name}'s PIN updated`);
    setOpen(false);
    setNewPin("");
    onChanged();
  };

  const dismiss = async () => {
    await resolvePinReset(user.id);
    toast.success("Request dismissed");
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Reset request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>PIN reset request · {user.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested</span>
              <span>{user.pinResetRequestedAt ? new Date(user.pinResetRequestedAt).toLocaleString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted as</span>
              <span className="font-medium">{user.pinResetRequestIdentifier || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email on file</span>
              <span className="font-medium">{user.email || "None on file"}</span>
            </div>
            <div className={`flex items-center gap-1.5 pt-1 ${matchesEmail || matchesUsername ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {matchesEmail ? (
                <>✓ Matches the email on file.</>
              ) : matchesUsername ? (
                <>✓ Matches their User ID — no email on file to cross-check, verify identity yourself.</>
              ) : (
                <>⚠ Doesn't match what's on file — verify this is really {user.name} before resetting.</>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Confirm this person's identity (in person or by another channel), then set their new PIN below.
          </p>
          <Row label="New 4-digit PIN">
            <Input inputMode="numeric" maxLength={4} value={newPin} autoFocus onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          </Row>
        </div>
        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" onClick={dismiss}>Dismiss request</Button>
          <Button size="sm" onClick={setPin} disabled={newPin.length !== 4}>Set PIN &amp; resolve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({ onChanged, supersCount }: { onChanged: () => void; supersCount: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("Member");
  const [perms, setPerms] = useState<string[]>(ROLE_DEFAULTS["Member"]);
  const [linkedSalesmen, setLinkedSalesmen] = useState<string[]>([]);
  const salesmenList = useMemo(
    () => store.getSalesmen().slice().sort((a, b) => a.name.localeCompare(b.name)),
    [open]
  );

  const pickRole = (r: Role) => {
    setRole(r);
    setPerms(ROLE_DEFAULTS[r]);
  };

  const save = async () => {
    if (isScopedRole(role) && linkedSalesmen.length === 0)
      return toast.error("Select at least one salesman for this user");
    const res = await createUser({ name, username, email, role, pin, permissions: perms, salesmanIds: linkedSalesmen });
    if (!res.ok) return toast.error(res.error);
    toast.success("User created");
    setName(""); setUsername(""); setEmail(""); setPin(""); setLinkedSalesmen([]); pickRole("Member");
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Add user</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Row label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row label="User ID"><Input value={username} onChange={(e) => setUsername(e.target.value)} /></Row>
          <Row label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Row>
          <Row label="4-digit PIN">
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          </Row>
          <Row label="Access level">
            <Select value={role} onValueChange={(v) => pickRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} disabled={r === "Super Admin" && supersCount >= MAX_SUPER_ADMINS}>
                    {r}{r === "Super Admin" && supersCount >= MAX_SUPER_ADMINS ? " (limit reached)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          {role === "Super Admin" ? (
            <p className="text-xs text-muted-foreground">Super Users are linked to every feature automatically.</p>
          ) : (
            <>
              <PermissionChecklist value={perms} onChange={setPerms} />
              {isScopedRole(role) && (
              <div className="space-y-1">
                <Label className="text-xs">Salesmen data access</Label>
                <p className="text-[10px] text-muted-foreground">
                  This user will only see data of the selected salesmen.
                </p>
                <SalesmenChecklist salesmen={salesmenList} value={linkedSalesmen} onChange={setLinkedSalesmen} />
              </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button size="sm" onClick={save}>Create user</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({ user, onChanged }: { user: AppUser; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<string[]>(effectivePermissions(user));
  const isSuper = user.role === "Super Admin";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setPerms(effectivePermissions(user)); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs">Access</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{user.name} · {user.role}</DialogTitle></DialogHeader>
        {isSuper ? (
          <p className="text-xs text-muted-foreground">
            Super Users are always synced with every tab, module, feature, status, report and setting.
          </p>
        ) : (
          <PermissionChecklist value={perms} onChange={setPerms} />
        )}
        {!isSuper && (
          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                setPermissions(user.id, perms);
                toast.success("Access updated");
                setOpen(false);
                onChanged();
              }}
            >
              Save access
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SalesmenDialog({ user, onChanged }: { user: AppUser; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>(user.salesmanIds ?? []);
  const salesmen = useMemo(
    () => store.getSalesmen().slice().sort((a, b) => a.name.localeCompare(b.name)),
    [open]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setIds(user.salesmanIds ?? []); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs">Salesmen</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{user.name} · linked salesmen</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">
          Only the selected salesmen's retailers, visits, logs and reports will be visible to this user.
        </p>
        <SalesmenChecklist salesmen={salesmen} value={ids} onChange={setIds} />
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              setSalesmanIds(user.id, ids);
              toast.success("Linked salesmen updated");
              setOpen(false);
              onChanged();
            }}
          >
            Save salesmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SalesmenChecklist({
  salesmen,
  value,
  onChange,
}: {
  salesmen: Salesman[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (salesmen.length === 0)
    return <p className="text-xs text-muted-foreground">No salesmen registered yet. Add them in Settings first.</p>;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="rounded-lg border p-2 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">Registered salesmen</span>
        <button
          type="button"
          className="text-[10px] underline text-muted-foreground"
          onClick={() => onChange(value.length === salesmen.length ? [] : salesmen.map((s) => s.id))}
        >
          toggle all
        </button>
      </div>
      {salesmen.map((s) => (
        <label key={s.id} className="flex items-center gap-2 text-xs">
          <Checkbox checked={value.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
          <span>{s.name}{s.city ? ` · ${s.city}` : ""}</span>
        </label>
      ))}
    </div>
  );
}

function PermissionChecklist({
  value,
  onChange,
  readOnly = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  readOnly?: boolean;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((p) => p !== id) : [...value, id]);

  return (
    <div className="space-y-3">
      {PERMISSION_CATALOG.map((group) => (
        <div key={group.id} className="rounded-lg border p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold">{group.label}</span>
            {!readOnly && (
              <button
                type="button"
                className="text-[10px] underline text-muted-foreground"
                onClick={() => {
                  const ids = group.items.map((i) => i.id);
                  const allOn = ids.every((i) => value.includes(i));
                  onChange(allOn ? value.filter((p) => !ids.includes(p)) : [...new Set([...value, ...ids])]);
                }}
              >
                toggle all
              </button>
            )}
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-2 text-xs ${readOnly ? "" : "cursor-pointer"} ${
                  readOnly && !value.includes(item.id) ? "opacity-50" : ""
                }`}
              >
                <Checkbox
                  checked={value.includes(item.id)}
                  disabled={readOnly}
                  onCheckedChange={readOnly ? undefined : () => toggle(item.id)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

/* --------------- edit profile / credentials --------------- */
function EditUserDialog({ user, onChanged }: { user: AppUser; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? "");
  const [pin, setPin] = useState("");

  const reset = () => {
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email ?? "");
    setPin("");
  };

  const save = async () => {
    const res = await updateUser(user.id, { name, username, email, pin });
    if (!res.ok) return toast.error(res.error);
    toast.success("User updated");
    setOpen(false);
    onChanged();
  };

  const resetPin = async () => {
    const fresh = String(Math.floor(1000 + Math.random() * 9000));
    const res = await updateUser(user.id, { pin: fresh });
    if (!res.ok) return toast.error(res.error);
    toast.success(`New PIN for ${user.name}: ${fresh}`, { duration: 12000 });
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit user">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Edit {user.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Row label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row label="User ID"><Input value={username} onChange={(e) => setUsername(e.target.value)} /></Row>
          <Row label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Row>
          <Row label="New PIN (optional)">
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="Leave blank to keep" />
          </Row>
          <Button size="sm" variant="outline" className="w-full" onClick={resetPin}>
            <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset PIN to a random code
          </Button>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------- date range helper --------------- */
function RangeFields({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Row label="From"><Input type="date" value={range.from} onChange={(e) => onChange({ ...range, from: e.target.value })} /></Row>
      <Row label="To"><Input type="date" value={range.to} onChange={(e) => onChange({ ...range, to: e.target.value })} /></Row>
    </div>
  );
}

/* --------------- shift data to another user --------------- */
function TransferDataDialog({ user, users, onChanged }: { user: AppUser; users: AppUser[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const counts = open ? countUserData(user.id, range) : { visits: 0, retailers: 0 };
  const others = users.filter((u) => u.id !== user.id);

  const run = () => {
    const to = others.find((u) => u.id === target);
    if (!to) return toast.error("Select the user to receive this data");
    const moved = transferUserData(user.id, to.id, to.name, range);
    toast.success(`Moved ${moved.visits} visits and ${moved.retailers} retailers to ${to.name}`);
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setTarget(""); setRange({ from: "", to: "" }); } }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="Shift data to another user">
          <ArrowRightLeft className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Shift {user.name}'s data</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Row label="Move to user">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {others.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} · {u.role}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <RangeFields range={range} onChange={setRange} />
          <p className="text-[11px] text-muted-foreground">
            Leave dates blank for all data. In range: {counts.visits} visits · {counts.retailers} retailers.
          </p>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={run}>Shift data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------- Super-User-only deletion, dual PIN --------------- */
function DeleteUserDialog({
  user,
  users,
  currentUser,
  onChanged,
}: {
  user: AppUser;
  users: AppUser[];
  currentUser: AppUser;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [keepData, setKeepData] = useState(true);
  const [transferTo, setTransferTo] = useState("");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const counts = open ? countUserData(user.id) : { visits: 0, retailers: 0 };
  const others = users.filter((u) => u.id !== user.id);
  const label = user.username || user.name;

  const reset = () => {
    setStep(1); setPin1(""); setPin2(""); setKeepData(true); setTransferTo(""); setRange({ from: "", to: "" });
  };

  const checkFirst = async () => {
    if (!(await verifyPin(currentUser, pin1))) return toast.error("Incorrect Super User PIN");
    setStep(2);
  };

  const checkSecond = async () => {
    if (!(await verifyPin(currentUser, pin2))) return toast.error("Second confirmation failed");
    setStep(3);
  };

  const finish = () => {
    if (!keepData) {
      deleteUserData(user.id);
    } else if (transferTo) {
      const to = others.find((u) => u.id === transferTo);
      if (to) transferUserData(user.id, to.id, to.name, range);
    }
    const res = deleteUser(user.id);
    if (!res.ok) return toast.error(res.error);
    if (user.id === currentUser.id) accessStore.setCurrentUserId(null);
    toast.success(keepData ? "User deleted · data kept" : "User and their data deleted");
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete user">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Delete {user.name}</DialogTitle></DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Only a Super User can delete an account, and it needs your own PIN twice. Step 1 of 2.
            </p>
            <Row label="Your Super User PIN">
              <Input inputMode="numeric" maxLength={4} value={pin1} autoFocus onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </Row>
            <DialogFooter><Button size="sm" variant="destructive" onClick={checkFirst}>Continue</Button></DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Confirm once more — enter your PIN again. Step 2 of 2.</p>
            <Row label="Re-enter your PIN">
              <Input inputMode="numeric" maxLength={4} value={pin2} autoFocus onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </Row>
            <DialogFooter><Button size="sm" variant="destructive" onClick={checkSecond}>Verify</Button></DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {user.name} has {counts.visits} visits and {counts.retailers} retailers. Keep this data or remove it?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={keepData ? "default" : "outline"} onClick={() => setKeepData(true)}>Keep data</Button>
              <Button size="sm" variant={!keepData ? "destructive" : "outline"} onClick={() => setKeepData(false)}>Delete data</Button>
            </div>

            {keepData && (
              <div className="space-y-3 rounded-lg border p-2">
                <p className="text-[11px] text-muted-foreground">Access or export the data before the account goes:</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => exportUserDataCsv(label, user.id)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => exportUserDataJson(label, user.id)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> JSON
                  </Button>
                </div>
                <Row label="Optionally hand data to">
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger><SelectValue placeholder="Nobody — leave as is" /></SelectTrigger>
                    <SelectContent>
                      {others.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} · {u.role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Row>
                {transferTo && <RangeFields range={range} onChange={setRange} />}
              </div>
            )}

            {!keepData && (
              <p className="text-[11px] text-destructive">
                All visits and retailers created by this user will be permanently removed.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={finish}>Delete user</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
