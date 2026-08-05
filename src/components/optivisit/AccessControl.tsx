import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Trash2, UserPlus, LogOut, KeyRound } from "lucide-react";
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
  signIn,
  type AppUser,
  type Role,
} from "@/lib/optivisit-access";

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
        <div className="rounded-xl border p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Your authorised access:</p>
          <div className="flex flex-wrap gap-1">
            {effectivePermissions(currentUser).map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
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
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const submit = async () => {
    const user = await signIn(username, pin);
    if (!user) return toast.error("Invalid user ID or PIN");
    toast.success(`Welcome ${user.name}`);
    onChanged();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <KeyRound className="w-4 h-4" /> Sign in
      </h3>
      <p className="text-xs text-muted-foreground">{users.length} user{users.length === 1 ? "" : "s"} registered on this device.</p>
      <Row label="User ID"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="User ID" /></Row>
      <Row label="PIN">
        <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
      </Row>
      <Button size="sm" onClick={submit}>Sign in</Button>
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {supers.length}/{MAX_SUPER_ADMINS} Super Users · {users.length} total
        </p>
        <AddUserDialog onChanged={onChanged} supersCount={supers.length} />
      </div>

      <div className="space-y-2">
        {sorted.map((u) => (
          <div key={u.id} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-[11px] text-muted-foreground">@{u.username}</div>
              </div>
              <div className="flex items-center gap-1">
                <PermissionsDialog user={u} onChanged={onChanged} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    const res = deleteUser(u.id);
                    if (!res.ok) return toast.error(res.error);
                    if (u.id === currentUser.id) accessStore.setCurrentUserId(null);
                    toast.success("User deleted");
                    onChanged();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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

function AddUserDialog({ onChanged, supersCount }: { onChanged: () => void; supersCount: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("Member");
  const [perms, setPerms] = useState<string[]>(ROLE_DEFAULTS["Member"]);

  const pickRole = (r: Role) => {
    setRole(r);
    setPerms(ROLE_DEFAULTS[r]);
  };

  const save = async () => {
    const res = await createUser({ name, username, role, pin, permissions: perms });
    if (!res.ok) return toast.error(res.error);
    toast.success("User created");
    setName(""); setUsername(""); setPin(""); pickRole("Member");
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
            <PermissionChecklist value={perms} onChange={setPerms} />
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

function PermissionChecklist({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((p) => p !== id) : [...value, id]);

  return (
    <div className="space-y-3">
      {PERMISSION_CATALOG.map((group) => (
        <div key={group.id} className="rounded-lg border p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold">{group.label}</span>
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
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-xs">
                <Checkbox checked={value.includes(item.id)} onCheckedChange={() => toggle(item.id)} />
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
