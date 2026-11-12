// Access level control for OptiVisit (local, device-side)

import { hashPin, uid } from "./optivisit-store";

export const ROLES = ["Super Admin", "Admin", "Agent", "Member", "Guest"] as const;
export type Role = (typeof ROLES)[number];

export const MAX_SUPER_ADMINS = 2;

export type PermissionItem = {
  id: string;
  /** The name the app shows for this tab, section, button or setting. */
  label: string;
  /** Where to find it inside the tab, when it is not the tab itself. */
  where?: string;
};
export type PermissionGroup = { id: string; label: string; items: PermissionItem[] };

/**
 * Every tab, section, action and setting, grouped by the tab it lives in and listed in
 * the order it appears on screen. Ids are stored on each user, so they never change —
 * only labels and grouping follow the app's layout.
 */
export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    id: "home",
    label: "Home tab",
    items: [
      { id: "tab.dashboard", label: "Open the Home tab" },
      { id: "dashboard.drilldown", label: "Open the list behind a summary card", where: "Summary cards" },
      { id: "module.reports", label: "Reports", where: "Reports section" },
      { id: "report.visitStatus", label: "Visit Status report", where: "Reports section" },
      { id: "report.outcome", label: "Outcome report", where: "Reports section" },
      { id: "report.city", label: "City wise Analysis report", where: "Reports section" },
      { id: "report.filters", label: "Adjust View: cards, salesmen, date range, charts", where: "Reports section" },
      { id: "report.export", label: "Export CSV", where: "Reports section and Visits › History" },
    ],
  },
  {
    id: "visits",
    label: "Visits tab",
    items: [
      { id: "tab.visits", label: "Open the Visits tab" },
      { id: "module.salesmanVisitLog", label: "Shops view and coverage numbers", where: "Shops" },
      { id: "module.visitLog", label: "History view", where: "History" },
      { id: "visit.create", label: "New visit and Record visit", where: "Header and Shops rows" },
      { id: "visit.delete", label: "Delete visit", where: "History rows" },
      { id: "status.visit", label: "Visit statuses", where: "Visit form and badges" },
      { id: "status.outcome", label: "Outcomes", where: "Visit form and badges" },
      { id: "status.activity", label: "Visit activities (1–7)", where: "Visit form" },
      { id: "status.unavailable", label: "Unavailable reasons", where: "Visit form" },
    ],
  },
  {
    id: "planner",
    label: "Planner tab",
    items: [
      { id: "tab.planner", label: "Open the Planner tab" },
      { id: "module.planner", label: "Visit Planner calendar and day plans", where: "Whole tab" },
    ],
  },
  {
    id: "team",
    label: "Team tab",
    items: [
      { id: "tab.retailers", label: "Open the Team tab" },
      { id: "module.retailers", label: "Retailers list", where: "Retailers" },
      { id: "retailer.create", label: "Add retailer", where: "Retailers" },
      { id: "retailer.edit", label: "Edit retailer", where: "Retailers" },
      { id: "retailer.delete", label: "Delete retailer", where: "Retailers" },
      { id: "retailer.bulkDelete", label: "Multi-select delete retailers (Super User PIN twice)", where: "Retailers" },
      { id: "retailer.assignSalesman", label: "Assign or change salesman", where: "Retailers" },
      { id: "retailer.import", label: "Import retailers (Excel / CSV)", where: "Retailers" },
      { id: "setting.salesmen", label: "Salesmen list", where: "Salesmen" },
      { id: "module.salesmen", label: "Salesman details and monthly stats", where: "Salesmen" },
      { id: "salesman.create", label: "Add salesman", where: "Salesmen" },
      { id: "salesman.delete", label: "Delete salesman", where: "Salesmen" },
    ],
  },
  {
    id: "products",
    label: "Products tab",
    items: [
      { id: "tab.products", label: "Open the Products tab" },
      { id: "module.products", label: "Product list", where: "Whole tab" },
      { id: "product.create", label: "Add product", where: "Product list" },
      { id: "product.edit", label: "Edit product", where: "Product list" },
      { id: "product.delete", label: "Delete product", where: "Product list" },
    ],
  },
  {
    id: "settings",
    label: "Settings tab",
    items: [
      { id: "tab.settings", label: "Open the Settings tab (always available)" },
      { id: "module.access", label: "Access level control", where: "Access level control" },
      { id: "setting.users", label: "Create and manage users", where: "Access level control" },
      { id: "setting.roles", label: "Change access levels and custom profiles", where: "Access level control" },
      { id: "setting.theme", label: "Color theme and icons", where: "Appearance" },
      { id: "setting.recentVisits", label: "Recent visits window (days / quantity)", where: "Recent visits window" },
      { id: "setting.pin", label: "Change PIN", where: "Security" },
      { id: "setting.recovery", label: "Recovery email", where: "Security" },
      { id: "setting.erase", label: "Erase all data", where: "Danger zone" },
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
    (p) =>
      !["setting.erase", "setting.users", "setting.roles", "module.access", "setting.recentVisits", "retailer.bulkDelete"].includes(p)
  ),
  Agent: [
    "tab.dashboard", "tab.visits", "tab.planner", "tab.retailers", "tab.products",
    "module.visitLog", "module.salesmanVisitLog", "module.retailers", "module.products", "module.planner", "module.reports",
    "visit.create", "retailer.create", "retailer.edit", "retailer.assignSalesman",
    "product.create", "product.edit",
    "dashboard.drilldown",
    "status.visit", "status.outcome", "status.activity", "status.unavailable",
    "report.visitStatus", "report.outcome", "report.city", "report.filters",
  ],
  Member: [
    "tab.dashboard", "tab.visits", "tab.planner", "tab.products",
    "module.visitLog", "module.salesmanVisitLog", "module.products", "module.planner", "module.reports",
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
  /**
   * Whether this user may open the Access Level Control view-only panel (their own
   * permission browser). Super Users always can. Missing = enabled (previous behavior).
   */
  accessViewOnly?: boolean;
  /** Custom access level profile this user follows. Cleared when their access is edited by hand. */
  profileId?: string;
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
const K_PROFILES = "ov_access_profiles";
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
  profileId?: string;
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
    profileId: input.role === "Super Admin" ? undefined : input.profileId,
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
            profileId: undefined,
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
    accessStore.getUsers().map((u) => (u.id === userId ? { ...u, permissions, profileId: undefined } : u))
  );
}

export function setSalesmanIds(userId: string, salesmanIds: string[]) {
  accessStore.setUsers(
    accessStore.getUsers().map((u) => (u.id === userId ? { ...u, salesmanIds } : u))
  );
}

/* ---------------- Custom access level profiles ---------------- */

/** Levels a custom profile can be built on. Super User is never a custom profile. */
export const PROFILE_BASE_ROLES = ["Admin", "Agent", "Member", "Guest"] as const;
export type ProfileBaseRole = (typeof PROFILE_BASE_ROLES)[number];

/**
 * A named, reusable set of permissions for one type of user (e.g. "Area manager").
 * There is no limit on how many exist. The base level decides data visibility:
 * Admin sees every salesman's data, the others only their linked salesmen.
 */
export type AccessProfile = {
  id: string;
  name: string;
  description?: string;
  baseRole: ProfileBaseRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export const profileStore = {
  getProfiles: () => read<AccessProfile[]>(K_PROFILES, []),
  setProfiles: (p: AccessProfile[]) => {
    if (typeof window !== "undefined") localStorage.setItem(K_PROFILES, JSON.stringify(p));
  },
};

export function usersOnProfile(profileId: string): AppUser[] {
  return accessStore.getUsers().filter((u) => u.profileId === profileId);
}

/** Create a profile, or update one and push the change to every user following it. */
export function saveProfile(input: {
  id?: string;
  name: string;
  description?: string;
  baseRole: ProfileBaseRole;
  permissions: string[];
}): { ok: true; profile: AccessProfile; usersUpdated: number } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a profile name" };
  if ((ROLES as readonly string[]).some((r) => r.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "That name is a built-in access level. Choose another name." };
  const profiles = profileStore.getProfiles();
  if (profiles.some((p) => p.id !== input.id && p.name.trim().toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "A profile with this name already exists" };

  const known = new Set(allPermissionIds());
  const permissions = [...new Set(input.permissions)].filter((p) => known.has(p));
  const now = new Date().toISOString();
  const existing = input.id ? profiles.find((p) => p.id === input.id) : undefined;
  const profile: AccessProfile = {
    id: existing?.id ?? uid(),
    name,
    description: input.description?.trim() || undefined,
    baseRole: input.baseRole,
    permissions,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  profileStore.setProfiles(existing ? profiles.map((p) => (p.id === profile.id ? profile : p)) : [...profiles, profile]);

  let usersUpdated = 0;
  if (existing) {
    const users = accessStore.getUsers();
    const next = users.map((u) => {
      if (u.profileId !== profile.id || u.role === "Super Admin") return u;
      usersUpdated++;
      return {
        ...u,
        role: profile.baseRole,
        permissions,
        salesmanIds: isScopedRole(profile.baseRole) ? (u.salesmanIds ?? []) : undefined,
      };
    });
    if (usersUpdated > 0) accessStore.setUsers(next);
  }
  return { ok: true, profile, usersUpdated };
}

/** Remove a profile. Users who followed it keep their current access as a one-off setup. */
export function deleteProfile(profileId: string): { usersDetached: number } {
  profileStore.setProfiles(profileStore.getProfiles().filter((p) => p.id !== profileId));
  const users = accessStore.getUsers();
  const usersDetached = users.filter((u) => u.profileId === profileId).length;
  if (usersDetached > 0) accessStore.setUsers(users.map((u) => (u.profileId === profileId ? { ...u, profileId: undefined } : u)));
  return { usersDetached };
}

/** Put a user on a custom profile: they take its base level and permissions. */
export function applyProfile(userId: string, profileId: string): { ok: true } | { ok: false; error: string } {
  const profile = profileStore.getProfiles().find((p) => p.id === profileId);
  if (!profile) return { ok: false, error: "Profile not found" };
  const users = accessStore.getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  if (target.role === "Super Admin" && superAdmins(users).length <= 1)
    return { ok: false, error: "At least one Super User must remain" };
  accessStore.setUsers(
    users.map((u) =>
      u.id === userId
        ? {
            ...u,
            role: profile.baseRole,
            profileId: profile.id,
            permissions: profile.permissions,
            salesmanIds: isScopedRole(profile.baseRole) ? (u.salesmanIds ?? []) : undefined,
          }
        : u
    )
  );
  return { ok: true };
}

/** Super User toggle: whether a user may see their own view-only access details. */
export function setAccessViewOnly(userId: string, enabled: boolean) {
  accessStore.setUsers(
    accessStore.getUsers().map((u) => (u.id === userId ? { ...u, accessViewOnly: enabled } : u))
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

/**
 * Finds the Super User whose PIN matches. With no users configured (owner mode) the
 * device PIN from settings is checked instead. Returns a stable id for the match so a
 * second prompt can be required to come from the same Super User.
 */
export async function matchSuperUserPin(pin: string, devicePinHash: string | null): Promise<string | null> {
  if (!/^\d{4}$/.test(pin)) return null;
  const hash = await hashPin(pin);
  const users = accessStore.getUsers();
  if (users.length === 0) return devicePinHash && hash === devicePinHash ? "device" : null;
  return superAdmins(users).find((u) => u.pinHash === hash)?.id ?? null;
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
