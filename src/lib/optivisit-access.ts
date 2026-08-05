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
      { id: "tab.reports", label: "Reports" },
      { id: "tab.visits", label: "Visits" },
      { id: "tab.retailers", label: "Retailers" },
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
    (p) => !["setting.erase", "setting.users", "setting.roles", "module.access"].includes(p)
  ),
  Agent: [
    "tab.dashboard", "tab.reports", "tab.visits", "tab.retailers",
    "module.visitLog", "module.salesmanVisitLog", "module.retailers", "module.reports",
    "visit.create", "retailer.create", "retailer.edit", "retailer.assignSalesman",
    "dashboard.drilldown",
    "status.visit", "status.outcome", "status.activity", "status.unavailable",
    "report.visitStatus", "report.outcome", "report.city", "report.filters",
  ],
  Member: [
    "tab.dashboard", "tab.reports", "tab.visits",
    "module.visitLog", "module.salesmanVisitLog", "module.reports",
    "visit.create",
    "status.visit", "status.outcome", "status.activity", "status.unavailable",
    "report.visitStatus", "report.outcome", "report.city", "report.filters",
  ],
  Guest: ["tab.dashboard", "tab.reports", "module.reports", "report.visitStatus", "report.outcome", "report.city"],
};

export type AppUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  pinHash: string;
  permissions: string[];
  createdAt: string;
};

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
  role: Role;
  pin: string;
  permissions: string[];
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
    role: input.role,
    pinHash: await hashPin(input.pin),
    permissions: input.role === "Super Admin" ? allPermissionIds() : input.permissions,
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
        ? { ...u, role, permissions: role === "Super Admin" ? allPermissionIds() : ROLE_DEFAULTS[role] }
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

export function deleteUser(userId: string): { ok: true } | { ok: false; error: string } {
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  if (target.role === "Super Admin" && superAdmins(users).length <= 1)
    return { ok: false, error: "At least one Super User must remain" };
  accessStore.setUsers(users.filter((u) => u.id !== userId));
  return { ok: true };
}

export async function signIn(username: string, pin: string): Promise<AppUser | null> {
  const users = accessStore.getUsers();
  const user = users.find((u) => u.username === username.trim().toLowerCase());
  if (!user) return null;
  const hash = await hashPin(pin);
  if (hash !== user.pinHash) return null;
  accessStore.setCurrentUserId(user.id);
  return user;
}
