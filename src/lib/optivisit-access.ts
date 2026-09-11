// Access level control for OptiVisit (local, device-side)

import { hashPin, uid } from "./optivisit-store";

export const ROLES = ["Super Admin", "Admin", "Agent", "Member", "Guest"] as const;
export type Role = (typeof ROLES)[number];

export const MAX_SUPER_ADMINS = 2;

export type PermissionItem = { id: string; label: string };
export type PermissionGroup = { id: string; label: string; items: PermissionItem[] };

/** Full catalog of tabs, modules, features, statuses, reports and settings. */
export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    id: "tabs",
    label: "Tabs",
    items: [
      { id: "tab.dashboard", label: "Home (Dashboard)" },
      { id: "tab.visits", label: "Visits" },
      { id: "tab.retailers", label: "Retailers" },
      { id: "tab.products", label: "Products" },
      { id: "tab.settings", label: "Settings" },
    ],
  },
  {
    id: "modules",
    label: "Modules",
    items: [
      { id: "module.visitLog", label: "Visit log" },
      { id: "module.salesmanVisitLog", label: "Salesman visit record" },
      { id: "module.retailers", label: "Retailer data" },
      { id: "module.salesmen", label: "Salesmen data" },
      { id: "module.products", label: "Product data" },
      { id: "module.reports", label: "Visit reports" },
      { id: "module.access", label: "Access level control" },
    ],
  },
  {
    id: "features",
    label: "Features",
    items: [
      { id: "visit.create", label: "Add visit" },
      { id: "visit.delete", label: "Delete visit" },
      { id: "retailer.create", label: "Add retailer" },
      { id: "retailer.edit", label: "Edit retailer" },
      { id: "retailer.delete", label: "Delete retailer" },
      { id: "retailer.assignSalesman", label: "Assign / change salesman" },
      { id: "retailer.import", label: "Import retailers (Excel / CSV)" },
      { id: "salesman.create", label: "Add salesman" },
      { id: "salesman.delete", label: "Delete salesman" },
      { id: "product.create", label: "Add product" },
      { id: "product.edit", label: "Edit product" },
      { id: "product.delete", label: "Delete product" },
      { id: "dashboard.drilldown", label: "Dashboard token drill-down" },
    ],
  },
  {
    id: "statuses",
    label: "Statuses & outcomes",
    items: [
      { id: "status.visit", label: "Visit statuses" },
      { id: "status.outcome", label: "Outcomes" },
      { id: "status.activity", label: "Visit activities (1–7)" },
      { id: "status.unavailable", label: "Unavailable reasons" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      { id: "report.visitStatus", label: "Visit status counters" },
      { id: "report.outcome", label: "Outcome report" },
      { id: "report.city", label: "City wise analysis" },
      { id: "report.filters", label: "Date & salesman filters" },
      { id: "report.export", label: "Export / share reports" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { id: "setting.theme", label: "Color theme" },
      { id: "setting.salesmen", label: "Salesmen management" },
      { id: "setting.pin", label: "Change PIN" },
      { id: "setting.recovery", label: "Recovery email" },
      { id: "setting.users", label: "Create / manage users" },
      { id: "setting.roles", label: "Change access levels" },
      { id: "setting.recentVisits", label: "Recent visits window (days / quantity)" },
      { id: "setting.erase", label: "Erase all data" },
    ],
  },
];

export function allPermissionIds(): string[] {
  return PERMISSION_CATALOG.flatMap((g) => g.items.map((i) => i.id));
}

export function permissionLabel(id: string): string {
  for (const g of PERMISSION_CATALOG) {
    const found = g.items.find((i) => i.id === id);
    if (found) return found.label;
  }
  return id;
}

/** What each level can do by default (Super Admin always gets everything). */
export const ROLE_DEFAULTS: Record<Role, string[]> = {
  "Super Admin": allPermissionIds(),
  Admin: allPermissionIds().filter(
    (p) => !["setting.erase", "setting.users", "setting.roles", "module.access", "setting.recentVisits"].includes(p)
  ),
  Agent: [
    "tab.dashboard", "tab.visits", "tab.retailers", "tab.products",
    "module.visitLog", "module.salesmanVisitLog", "module.retailers", "module.products", "module.reports",
    "visit.create", "retailer.create", "retailer.edit", "retailer.assignSalesman",
    "product.create", "product.edit",
    "dashboard.drilldown",
    "status.visit", "status.outcome", "status.activity", "status.unavailable",
    "report.visitStatus", "report.outcome", "report.city", "report.filters",
  ],
  Member: [
    "tab.dashboard", "tab.visits", "tab.products",
    "module.visitLog", "module.salesmanVisitLog", "module.products", "module.reports",
    "visit.create", "product.create",
    "status.visit", "status.outcome", "status.activity", "status.unavailable",
    "report.visitStatus", "report.outcome", "report.city", "report.filters",
  ],
  Guest: ["tab.dashboard", "module.reports", "module.products", "report.visitStatus", "report.outcome", "report.city"],
};

export type AppUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  pinHash: string;
  permissions: string[];
  /** For Agent / Member / Guest: which salesmen's data this user may see. Empty = none restricted set chosen. */
  salesmanIds?: string[];
  createdAt: string;
  /** Set when this user submits a "forgot my PIN" request. Cleared once a Super User resolves it. */
  pinResetRequestedAt?: string;
  /** The User ID or email the requester typed in, for the Super User to cross-check against the email on file. */
  pinResetRequestIdentifier?: string;
};


/** Roles whose data visibility is limited to their linked salesmen. */
export const SCOPED_ROLES: Role[] = ["Agent", "Member", "Guest"];

export function isScopedRole(role: Role) {
  return SCOPED_ROLES.includes(role);
}

/** Returns the salesman ids this user is limited to, or null when unrestricted. */
export function scopedSalesmanIds(user: AppUser | null): string[] | null {
  if (!user) return null;
  if (!isScopedRole(user.role)) return null;
  return user.salesmanIds ?? [];
}

const K_USERS = "ov_users";
const K_CURRENT = "ov_current_user";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const accessStore = {
  getUsers: () => read<AppUser[]>(K_USERS, []),
  setUsers: (u: AppUser[]) => {
    if (typeof window !== "undefined") localStorage.setItem(K_USERS, JSON.stringify(u));
  },
  getCurrentUserId: () => (typeof window !== "undefined" ? sessionStorage.getItem(K_CURRENT) : null),
  setCurrentUserId: (id: string | null) => {
    if (typeof window === "undefined") return;
    if (id) sessionStorage.setItem(K_CURRENT, id);
    else sessionStorage.removeItem(K_CURRENT);
  },
};

/** Super Admins are always synced to every feature/module in the catalog. */
export function effectivePermissions(user: AppUser | null): string[] {
  if (!user) return allPermissionIds(); // no users configured yet → owner mode
  if (user.role === "Super Admin") return allPermissionIds();
  return user.permissions;
}

export function can(user: AppUser | null, permission: string): boolean {
  return effectivePermissions(user).includes(permission);
}

export function superAdmins(users: AppUser[]): AppUser[] {
  return users.filter((u) => u.role === "Super Admin");
}

export async function createUser(input: {
  name: string;
  username: string;
  email?: string;
  role: Role;
  pin: string;
  permissions: string[];
  salesmanIds?: string[];
}): Promise<{ ok: true; user: AppUser } | { ok: false; error: string }> {
  const users = accessStore.getUsers();
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  if (!name) return { ok: false, error: "Enter a name" };
  if (!username) return { ok: false, error: "Enter a user ID" };
  if (users.some((u) => u.username === username)) return { ok: false, error: "User ID already exists" };
  if (!/^\d{4}$/.test(input.pin)) return { ok: false, error: "Enter a 4-digit PIN" };
  if (input.role === "Super Admin" && superAdmins(users).length >= MAX_SUPER_ADMINS)
    return { ok: false, error: `Maximum ${MAX_SUPER_ADMINS} Super Users allowed` };

  const user: AppUser = {
    id: uid(),
    name,
    username,
    email: input.email?.trim() || undefined,
    role: input.role,
    pinHash: await hashPin(input.pin),
    permissions: input.role === "Super Admin" ? allPermissionIds() : input.permissions,
    salesmanIds: isScopedRole(input.role) ? (input.salesmanIds ?? []) : undefined,
    createdAt: new Date().toISOString(),
  };
  accessStore.setUsers([...users, user]);
  return { ok: true, user };
}

export function changeRole(userId: string, role: Role): { ok: true } | { ok: false; error: string } {
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  const supers = superAdmins(users);
  if (role === "Super Admin" && target.role !== "Super Admin" && supers.length >= MAX_SUPER_ADMINS)
    return { ok: false, error: `Maximum ${MAX_SUPER_ADMINS} Super Users allowed` };
  if (target.role === "Super Admin" && role !== "Super Admin" && supers.length <= 1)
    return { ok: false, error: "At least one Super User must remain" };

  accessStore.setUsers(
    users.map((u) =>
      u.id === userId
        ? {
            ...u,
            role,
            permissions: role === "Super Admin" ? allPermissionIds() : ROLE_DEFAULTS[role],
            salesmanIds: isScopedRole(role) ? (u.salesmanIds ?? []) : undefined,
          }
        : u
    )
  );
  return { ok: true };
}

export function setPermissions(userId: string, permissions: string[]) {
  accessStore.setUsers(
    accessStore.getUsers().map((u) => (u.id === userId ? { ...u, permissions } : u))
  );
}

export function setSalesmanIds(userId: string, salesmanIds: string[]) {
  accessStore.setUsers(
    accessStore.getUsers().map((u) => (u.id === userId ? { ...u, salesmanIds } : u))
  );
}

export function deleteUser(userId: string): { ok: true } | { ok: false; error: string } {
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  if (target.role === "Super Admin" && superAdmins(users).length <= 1)
    return { ok: false, error: "At least one Super User must remain" };
  accessStore.setUsers(users.filter((u) => u.id !== userId));
  return { ok: true };
}

/** Finds a user by their User ID first, falling back to a case-insensitive email match. */
export function findUserByIdentifier(identifier: string): AppUser | null {
  const id = identifier.trim().toLowerCase();
  if (!id) return null;
  const users = accessStore.getUsers();
  return (
    users.find((u) => u.username === id) ??
    users.find((u) => (u.email ?? "").trim().toLowerCase() === id) ??
    null
  );
}

export async function signIn(identifier: string, pin: string): Promise<AppUser | null> {
  const user = findUserByIdentifier(identifier);
  if (!user) return null;
  const hash = await hashPin(pin);
  if (hash !== user.pinHash) return null;
  accessStore.setCurrentUserId(user.id);
  return user;
}

/** A user (signed out) submits a "forgot my PIN" request by their User ID or email. */
export function requestPinReset(identifier: string): { ok: true } | { ok: false; error: string } {
  const user = findUserByIdentifier(identifier);
  if (!user) return { ok: false, error: "No account matches that User ID or email." };
  accessStore.setUsers(
    accessStore.getUsers().map((u) =>
      u.id === user.id
        ? { ...u, pinResetRequestedAt: new Date().toISOString(), pinResetRequestIdentifier: identifier.trim() }
        : u
    )
  );
  return { ok: true };
}

/** Super User resolves a pending reset request: optionally sets a new PIN, always clears the flag. */
export async function resolvePinReset(
  userId: string,
  newPin?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  let pinHash = target.pinHash;
  if (newPin) {
    if (!/^\d{4}$/.test(newPin)) return { ok: false, error: "Enter a 4-digit PIN" };
    pinHash = await hashPin(newPin);
  }
  accessStore.setUsers(
    users.map((u) =>
      u.id === userId ? { ...u, pinHash, pinResetRequestedAt: undefined, pinResetRequestIdentifier: undefined } : u
    )
  );
  return { ok: true };
}

/** Verify a user's own PIN (used for sensitive Super User actions). */
export async function verifyPin(user: AppUser, pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) return false;
  return (await hashPin(pin)) === user.pinHash;
}

/** Update profile fields, user ID and/or PIN of an existing user. */
export async function updateUser(
  userId: string,
  patch: { name?: string; username?: string; email?: string; pin?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };

  const next: AppUser = { ...target };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "Enter a name" };
    next.name = name;
  }
  if (patch.username !== undefined) {
    const username = patch.username.trim().toLowerCase();
    if (!username) return { ok: false, error: "Enter a user ID" };
    if (users.some((u) => u.id !== userId && u.username === username))
      return { ok: false, error: "User ID already exists" };
    next.username = username;
  }
  if (patch.email !== undefined) {
    const email = patch.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email" };
    next.email = email || undefined;
  }
  if (patch.pin !== undefined && patch.pin !== "") {
    if (!/^\d{4}$/.test(patch.pin)) return { ok: false, error: "Enter a 4-digit PIN" };
    next.pinHash = await hashPin(patch.pin);
    next.pinResetRequestedAt = undefined;
    next.pinResetRequestIdentifier = undefined;
  }

  accessStore.setUsers(users.map((u) => (u.id === userId ? next : u)));
  return { ok: true };
}
