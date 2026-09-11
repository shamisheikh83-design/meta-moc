import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { store, uid, hashPin, VISIT_STATUSES, OUTCOMES, VISIT_PURPOSES, SHOP_CATEGORIES, VISIT_ACTIVITIES, type Visit, type Retailer, type Salesman, type VisitStatus, type Outcome, type ShopCategory, type VisitActivity } from "@/lib/optivisit-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEME_PALETTE, THEME_PRESETS, NO_FILL, getTheme, setTheme, applyTheme, defaultTheme, type AppTheme } from "@/lib/optivisit-theme";

import { Eye, LayoutDashboard, ClipboardList, BarChart3, Store, Settings as SettingsIcon, Plus, Trash2, LogOut, MapPin, Phone, User, Users, Calendar as CalendarIcon, Check, X, Pencil, Upload, ChevronDown, Search, ArrowUpDown, TrendingUp, TrendingDown, Minus, Target, Lock, AlertTriangle, Award, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AccessControl } from "./AccessControl";
import { accessStore, can, scopedSalesmanIds, isScopedRole, type AppUser } from "@/lib/optivisit-access";


type Tab = "dashboard" | "visits" | "reports" | "retailers" | "settings";

export function OptiVisitApp({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [accessVersion, setAccessVersion] = useState(0);

  const loadUser = () => {
    const id = accessStore.getCurrentUserId();
    setCurrentUser(id ? (accessStore.getUsers().find((u) => u.id === id) ?? null) : null);
    setAccessVersion((v) => v + 1);
  };

  useEffect(() => {
    setVisits(store.getVisits());
    setRetailers(store.getRetailers());
    setSalesmen(store.getSalesmen());
    applyTheme(getTheme());
    loadUser();
  }, []);

  const allowed = (p: string) => can(currentUser, p);
  const hasUsers = typeof window !== "undefined" && accessStore.getUsers().length > 0;
  const visibleTabs: Tab[] = (["dashboard", "reports", "visits", "retailers", "settings"] as Tab[]).filter(
    (t) => t === "settings" || allowed(`tab.${t}`)
  );

  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab(visibleTabs[0] ?? "settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessVersion]);

  const scopeIds = scopedSalesmanIds(currentUser);
  const visibleRetailers = useMemo(() => {
    if (!scopeIds) return retailers;
    return retailers.filter(
      (r) =>
        (r.salesmanId && scopeIds.includes(r.salesmanId)) ||
        (!r.salesmanId && r.addedByUserId === currentUser?.id)
    );
  }, [retailers, scopeIds?.join(","), currentUser?.id]);

  const visibleRetailerIds = useMemo(() => new Set(visibleRetailers.map((r) => r.id)), [visibleRetailers]);

  const visibleVisits = useMemo(
    () => (scopeIds ? visits.filter((v) => visibleRetailerIds.has(v.retailerId)) : visits),
    [visits, visibleRetailerIds, !!scopeIds]
  );

  const visibleSalesmen = useMemo(
    () => (scopeIds ? salesmen.filter((s) => scopeIds.includes(s.id)) : salesmen),
    [salesmen, scopeIds?.join(",")]
  );

  const refreshVisits = () => setVisits(store.getVisits());
  const refreshRetailers = () => setRetailers(store.getRetailers());
  const refreshSalesmen = () => setSalesmen(store.getSalesmen());


  return (
    <div className="min-h-screen bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <header className="sticky top-0 z-20 ov-toolbar shadow-sm">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 md:h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm md:text-base font-semibold leading-none">Meta Opti Connect</div>
                <div className="text-[10px] opacity-80 mt-0.5 capitalize">{tab}</div>
              </div>
            </div>

            {/* Desktop navigation lives in the toolbar */}
            <TabsList className="hidden md:flex bg-white/10 rounded-full p-1 h-10 gap-1">
              {visibleTabs.includes("dashboard") && <TopTab value="dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Home" />}
              {visibleTabs.includes("reports") && <TopTab value="reports" icon={<BarChart3 className="w-4 h-4" />} label="Reports" />}
              {visibleTabs.includes("visits") && <TopTab value="visits" icon={<ClipboardList className="w-4 h-4" />} label="Visits" />}
              {visibleTabs.includes("retailers") && <TopTab value="retailers" icon={<Store className="w-4 h-4" />} label="Retailers" />}
              <TopTab value="settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
            </TabsList>

            <Button
              variant="ghost"
              size="sm"
              className="text-current hover:bg-white/15"
              onClick={() => { store.setSession(false); accessStore.setCurrentUserId(null); onLock(); }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
          {visibleTabs.includes("dashboard") && <TabsContent value="dashboard"><Dashboard visits={visibleVisits} retailers={visibleRetailers} currentUser={currentUser} /></TabsContent>}
          {visibleTabs.includes("reports") && <TabsContent value="reports"><Reports visits={visibleVisits} retailers={visibleRetailers} salesmen={visibleSalesmen} /></TabsContent>}
          {visibleTabs.includes("visits") && (
            <TabsContent value="visits" className="space-y-6">
              {allowed("module.visitLog") && <VisitLog visits={visibleVisits} retailers={visibleRetailers} refresh={refreshVisits} />}
              {allowed("module.salesmanVisitLog") && <SalesmanVisitLog visits={visibleVisits} retailers={visibleRetailers} salesmen={visibleSalesmen} refresh={refreshVisits} />}
            </TabsContent>
          )}
          {visibleTabs.includes("retailers") && <TabsContent value="retailers"><Retailers retailers={visibleRetailers} salesmen={visibleSalesmen} refresh={refreshRetailers} currentUser={currentUser} /></TabsContent>}
          <TabsContent value="settings">
            <SettingsPanel
              onLock={onLock}
              salesmen={salesmen}
              visits={visibleVisits}
              retailers={visibleRetailers}
              refreshSalesmen={refreshSalesmen}
              currentUser={currentUser}
              hasUsers={hasUsers}
              onAccessChanged={loadUser}
            />
          </TabsContent>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <TabsList
            className="max-w-3xl mx-auto w-full grid h-[4.25rem] bg-transparent p-0 rounded-none"
            style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
          >
            {visibleTabs.includes("dashboard") && <NavTab value="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" />}
            {visibleTabs.includes("reports") && <NavTab value="reports" icon={<BarChart3 className="w-5 h-5" />} label="Reports" />}
            {visibleTabs.includes("visits") && <NavTab value="visits" icon={<ClipboardList className="w-5 h-5" />} label="Visits" />}
            {visibleTabs.includes("retailers") && <NavTab value="retailers" icon={<Store className="w-5 h-5" />} label="Retailers" />}
            <NavTab value="settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
          </TabsList>
        </nav>
      </Tabs>
    </div>
  );
}

function TopTab({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium text-[color:var(--ov-toolbar-foreground)] opacity-75 data-[state=active]:opacity-100 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
}

function NavTab({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="relative flex min-w-0 flex-col items-center justify-center gap-1 h-full rounded-none data-[state=active]:bg-accent/60 data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground after:absolute after:top-0 after:h-0.5 after:w-8 after:rounded-full after:bg-transparent data-[state=active]:after:bg-primary"
    >
      {icon}
      <span className="max-w-full truncate px-0.5 text-[10px] font-medium">{label}</span>
    </TabsTrigger>
  );
}


/* ---------------- Dashboard ---------------- */
function greetingFor(d: Date) {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "Good Morning";
  if (h >= 11 && h < 15) return "Good Noon";
  if (h >= 15 && h < 18) return "Good Afternoon";
  if (h >= 18 && h < 21) return "Good Evening";
  if (h >= 21 || h < 1) return "Good Night";
  return "Hello Night Rider";
}

function Dashboard({ visits, retailers, currentUser }: { visits: Visit[]; retailers: Retailer[]; currentUser?: AppUser | null }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = now.toISOString().slice(0, 7);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);

  const visitsTodayList = visits.filter((v) => v.date.startsWith(today));
  const visitsYesterdayList = visits.filter((v) => v.date.startsWith(yesterdayStr));
  const visitsMonth = visits.filter((v) => v.date.startsWith(thisMonth));
  const visitsLastMonth = visits.filter((v) => v.date.startsWith(lastMonth));

  const successList = visitsMonth.filter((v) => v.outcome === "Successful" || v.outcome === "Satisfactory");
  const successRate = visitsMonth.length ? Math.round((successList.length / visitsMonth.length) * 100) : 0;
  const successListLastMonth = visitsLastMonth.filter((v) => v.outcome === "Successful" || v.outcome === "Satisfactory");
  const successRateLastMonth = visitsLastMonth.length ? Math.round((successListLastMonth.length / visitsLastMonth.length) * 100) : 0;

  const activeRetailersThisMonth = new Set(visitsMonth.map((v) => v.retailerId)).size;

  const dayMs = 86400000;
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart.getTime() - 6 * dayMs);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * dayMs);
  const inRange = (v: Visit, start: Date, endExclusive: Date) => {
    const t = new Date(v.date).getTime();
    return t >= start.getTime() && t < endExclusive.getTime();
  };
  const visitsThisWeek = visits.filter((v) => inRange(v, weekStart, new Date(todayStart.getTime() + dayMs)));
  const visitsLastWeek = visits.filter((v) => inRange(v, prevWeekStart, weekStart));

  const isComplaint = (v: Visit) => v.outcome === "Complaints" || (v.purpose || "").toLowerCase().includes("complaint");
  const complaintsMonth = visitsMonth.filter(isComplaint);
  const complaintsLastMonth = visitsLastMonth.filter(isComplaint);

  const isRecovery = (v: Visit) => v.activity === "Recovery Visits" || (v.purpose || "").toLowerCase().includes("recovery");
  const recoveryMonth = visitsMonth.filter(isRecovery);
  const recoveryLastMonth = visitsLastMonth.filter(isRecovery);

  const lastVisitByRetailer = new Map<string, number>();
  visits.forEach((v) => {
    const t = new Date(v.date).getTime();
    const cur = lastVisitByRetailer.get(v.retailerId);
    if (!cur || t > cur) lastVisitByRetailer.set(v.retailerId, t);
  });
  const THIRTY_DAYS = 30 * dayMs;
  const staleRetailers = retailers.filter((r) => {
    const last = lastVisitByRetailer.get(r.id);
    return !last || now.getTime() - last > THIRTY_DAYS;
  });

  const [drill, setDrill] = useState<null | { title: string; kind: "visits" | "retailers"; visits?: Visit[]; retailers?: Retailer[] }>(null);

  const recent = [...visits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const settings = typeof window !== "undefined" ? store.getSettings() : { salesmanName: "" };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h2 className="text-lg font-semibold">
          {greetingFor(new Date())}{currentUser?.name ? `, ${currentUser.name}` : settings.salesmanName ? `, ${settings.salesmanName}` : ""} 👋
        </h2>
        <p className="text-sm text-muted-foreground">Here's your activity snapshot · tap a card for details</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          label="Visits today"
          value={visitsTodayList.length}
          icon={<ClipboardList className="w-4 h-4" />}
          tone="primary"
          trend={trendOf(visitsTodayList.length, visitsYesterdayList.length)}
          trendCaption="vs yesterday"
          onClick={() => setDrill({ title: "Visits today", kind: "visits", visits: visitsTodayList })}
        />
        <StatCard
          label="This week"
          value={visitsThisWeek.length}
          icon={<Clock className="w-4 h-4" />}
          trend={trendOf(visitsThisWeek.length, visitsLastWeek.length)}
          trendCaption="vs last week"
          onClick={() => setDrill({ title: "Visits this week", kind: "visits", visits: visitsThisWeek })}
        />
        <StatCard
          label="This month"
          value={visitsMonth.length}
          icon={<CalendarIcon className="w-4 h-4" />}
          trend={trendOf(visitsMonth.length, visitsLastMonth.length)}
          trendCaption="vs last month"
          onClick={() => setDrill({ title: "Visits this month", kind: "visits", visits: visitsMonth })}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          icon={<Target className="w-4 h-4" />}
          trend={trendOf(successRate, successRateLastMonth, { suffix: "pt" })}
          trendCaption="vs last month"
          onClick={() => setDrill({ title: "Successful / satisfactory visits", kind: "visits", visits: successList })}
        />
        <StatCard
          label="Retailers"
          value={retailers.length}
          icon={<Store className="w-4 h-4" />}
          caption={`${activeRetailersThisMonth} active this month`}
          onClick={() => setDrill({ title: "Retailers", kind: "retailers", retailers })}
        />
        <StatCard
          label="Recovery visits"
          value={recoveryMonth.length}
          icon={<RotateCcw className="w-4 h-4" />}
          trend={trendOf(recoveryMonth.length, recoveryLastMonth.length)}
          trendCaption="vs last month"
          onClick={() => setDrill({ title: "Recovery visits this month", kind: "visits", visits: recoveryMonth })}
        />
        <StatCard
          label="Complaints"
          value={complaintsMonth.length}
          icon={<AlertCircle className="w-4 h-4" />}
          trend={trendOf(complaintsMonth.length, complaintsLastMonth.length)}
          trendCaption="vs last month"
          goodDirection="down"
          onClick={() => setDrill({ title: "Complaints this month", kind: "visits", visits: complaintsMonth })}
        />
        <StatCard
          label="Needs attention"
          value={staleRetailers.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          caption="not visited in 30+ days"
          onClick={() => setDrill({ title: "Not visited in 30+ days", kind: "retailers", retailers: staleRetailers })}
        />
      </div>
      <div className="bg-card rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Recent visits</h3>
          <Badge variant="secondary">{visits.length} total</Badge>
        </div>
        {recent.length === 0 ? (
          <EmptyHint text="No visits logged yet. Add your first visit from the Visits tab." />
        ) : (
          <ul className="divide-y">
            {recent.map((v) => {
              const r = retailers.find((x) => x.id === v.retailerId);
              return (
                <li key={v.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{r?.name ?? "Unknown retailer"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(v.date).toLocaleDateString()} · {v.purpose || "Visit"}
                    </div>
                  </div>
                  <OutcomeBadge outcome={v.outcome} />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{drill?.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {drill?.kind === "visits" ? (
              (drill.visits ?? []).length === 0 ? (
                <EmptyHint text="No entries behind this count yet." />
              ) : (
                <ul className="divide-y">
                  {[...(drill.visits ?? [])].sort((a, b) => b.date.localeCompare(a.date)).map((v) => {
                    const r = retailers.find((x) => x.id === v.retailerId);
                    return (
                      <li key={v.id} className="py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{r?.name ?? "Unknown retailer"}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(v.date).toLocaleString()} · {v.salesman || "—"}
                            </div>
                            {v.purpose && <div className="text-[11px] mt-0.5">{v.purpose}</div>}
                          </div>
                          <OutcomeBadge outcome={v.outcome} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (drill?.retailers ?? []).length === 0 ? (
              <EmptyHint text="No retailers added yet." />
            ) : (
              <ul className="divide-y">
                {[...(drill?.retailers ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((r) => (
                  <li key={r.id} className="py-2.5">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[r.owner, r.city, r.phone].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Trend = { direction: "up" | "down" | "flat"; label: string };

function trendOf(current: number, previous: number, opts?: { suffix?: string }): Trend {
  const diff = current - previous;
  const suffix = opts?.suffix ? opts.suffix : "";
  if (diff === 0) return { direction: "flat", label: `0${suffix}` };
  const sign = diff > 0 ? "+" : "";
  return { direction: diff > 0 ? "up" : "down", label: `${sign}${diff}${suffix}` };
}

function StatCard({
  label,
  value,
  icon,
  tone,
  trend,
  trendCaption,
  /** Which trend direction should read as "good" (green). Defaults to "up" — pass "down" for metrics like complaints where fewer is better. */
  goodDirection = "up",
  caption,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "primary";
  trend?: Trend;
  trendCaption?: string;
  goodDirection?: "up" | "down";
  caption?: string;
  onClick?: () => void;
}) {
  const primary = tone === "primary";
  const isGood = trend && trend.direction !== "flat" && trend.direction === goodDirection;
  const isBad = trend && trend.direction !== "flat" && trend.direction !== goodDirection;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-center rounded-2xl border p-4 transition active:scale-[0.98] hover:shadow-md ${primary ? "bg-primary text-primary-foreground" : "bg-card"}`}
    >
      {icon && (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            primary ? "bg-white/15" : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </span>
      )}
      <div className="text-3xl font-bold tabular-nums mt-3 leading-none">{value}</div>
      <div className={`text-xs mt-1.5 ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</div>
      {trend && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium mt-2 ${
            trend.direction === "flat"
              ? primary
                ? "bg-white/15 text-primary-foreground/80"
                : "bg-muted text-muted-foreground"
              : isGood
                ? primary
                  ? "bg-white/20 text-primary-foreground"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : isBad
                  ? primary
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  : ""
          }`}
          title={trendCaption}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="w-3 h-3" />
          ) : trend.direction === "down" ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {trend.label}
        </span>
      )}
      {caption && (
        <div className={`text-[10px] mt-1.5 ${primary ? "text-primary-foreground/70" : "text-muted-foreground/80"}`}>{caption}</div>
      )}
    </button>
  );
}


const OUTCOME_COLORS: Record<Outcome, string> = {
  Satisfactory: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  Successful: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "Not Interested": "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "Meeting unsuccessful": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "Not Met": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Complaints: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  "Linked to Other Company": "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

const STATUS_COLORS: Record<VisitStatus, string> = {
  Visited: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "Not Visited": "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "No Update": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Holiday: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${OUTCOME_COLORS[outcome]}`}>{outcome}</span>;
}

function StatusBadge({ status }: { status: VisitStatus }) {
  return <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>{status}</span>;
}

const CATEGORY_COLORS: Record<ShopCategory, string> = {
  "A+": "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  B: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  C: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function CategoryBadge({ category }: { category: ShopCategory }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-aqua/15 text-aqua",
  "bg-maroon/10 text-maroon",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
];

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function InitialAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${toneFor(name)} ${className ?? "h-10 w-10 text-sm"}`}
    >
      {initialsOf(name)}
    </span>
  );
}

/* ---------------- Visit Log ---------------- */
function VisitLog({ visits, retailers, refresh }: { visits: Visit[]; retailers: Retailer[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "retailer" | "salesman">("newest");
  const [salesmanFilter, setSalesmanFilter] = useState<string>("all");

  const salesmanNames = useMemo(
    () => Array.from(new Set(visits.map((v) => v.salesman).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [visits]
  );

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nameOf = (v: Visit) => retailers.find((r) => r.id === v.retailerId)?.name ?? "";
    let list = visits.filter((v) => {
      if (salesmanFilter !== "all" && v.salesman !== salesmanFilter) return false;
      if (!q) return true;
      const r = retailers.find((x) => x.id === v.retailerId);
      return [nameOf(v), v.salesman, v.purpose, v.notes, v.outcome, v.visitStatus, r?.city, r?.area]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return b.date.localeCompare(a.date);
      if (sort === "oldest") return a.date.localeCompare(b.date);
      if (sort === "retailer") return nameOf(a).localeCompare(nameOf(b));
      return (a.salesman || "").localeCompare(b.salesman || "");
    });
    return list;
  }, [visits, retailers, query, sort, salesmanFilter]);

  const remove = (id: string) => {
    if (!confirm("Delete this visit?")) return;
    store.setVisits(visits.filter((v) => v.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="text-lg font-semibold">Visit log</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="min-h-10"><Plus className="w-4 h-4 mr-1" /> New visit</Button>
          </DialogTrigger>
          {open && <VisitDialog retailers={retailers} onSaved={() => { refresh(); setOpen(false); }} />}
        </Dialog>
      </div>

      <div className="bg-card border rounded-2xl p-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search retailer, salesman, purpose, area..." className="pl-9 h-9" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-9 text-xs"><ArrowUpDown className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="retailer">Retailer A–Z</SelectItem>
              <SelectItem value="salesman">Salesman A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Select value={salesmanFilter} onValueChange={setSalesmanFilter}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All salesmen</SelectItem>
              {salesmanNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">No visits found</p>
          <p className="text-xs text-muted-foreground mt-1">Tap "New visit" above to log your first one.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((v) => {
            const r = retailers.find((x) => x.id === v.retailerId);
            return (
              <li
                key={v.id}
                className="bg-card border rounded-2xl p-3 sm:p-4 transition-shadow hover:shadow-md hover:border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <InitialAvatar name={r?.name ?? "?"} className="h-10 w-10 text-sm mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-sm truncate">{r?.name ?? "Unknown"}</div>
                      <StatusBadge status={v.visitStatus} />
                      <OutcomeBadge outcome={v.outcome} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-x-1.5">
                      <span>{new Date(v.date).toLocaleString()} · {v.salesman || "—"}</span>
                      {v.area && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{v.area}</span>}
                    </div>
                    {v.purpose && <div className="text-xs mt-2"><span className="text-muted-foreground">Purpose:</span> {v.purpose}</div>}
                    {v.notes && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{v.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(v.id)} aria-label="Delete visit">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function VisitDialog({
  retailers,
  onSaved,
  presetRetailer,
}: {
  retailers: Retailer[];
  onSaved: () => void;
  presetRetailer?: Retailer;
}) {
  const [retailerId, setRetailerId] = useState(presetRetailer?.id ?? "");
  const [date, setDate] = useState<string>(todayISODate());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"az" | "area">("az");
  const [purpose, setPurpose] = useState<string>("");
  const [otherPurpose, setOtherPurpose] = useState("");
  const [area, setArea] = useState(presetRetailer?.area ?? "");
  const [outcome, setOutcome] = useState<Outcome>("Successful");
  const [notes, setNotes] = useState("");

  const salesmenList = useMemo(
    () => store.getSalesmen().slice().sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const filteredRetailers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = retailers.filter((r) =>
      !q ? true : [r.name, r.owner, r.city, r.area, r.address, r.phone].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
    );
    return [...list].sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name)
        : (a.area || "").localeCompare(b.area || "") || a.name.localeCompare(b.name)
    );
  }, [retailers, search, sort]);

  const selectedRetailer = presetRetailer ?? retailers.find((r) => r.id === retailerId);
  const salesman = selectedRetailer
    ? (salesmenList.find((s) => s.id === selectedRetailer.salesmanId)?.name ?? "Unassigned")
    : "";

  useEffect(() => {
    setArea(selectedRetailer?.area ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retailerId]);

  const save = () => {
    if (!retailerId) return toast.error("Please select a retailer");
    if (!date) return toast.error("Please select a visit date");
    if (purpose === "Other" && !otherPurpose.trim()) return toast.error("Please describe the purpose");
    const finalPurpose = purpose === "Other" ? otherPurpose.trim() : purpose;
    const p = finalPurpose.toLowerCase();
    const derivedActivity: VisitActivity = p.includes("recovery")
      ? "Recovery Visits"
      : p.includes("complaint")
        ? "Complaints Visits"
        : "Visits";
    const now = new Date();
    const picked = new Date(`${date}T00:00:00`);
    picked.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    const v: Visit = {
      id: uid(),
      date: picked.toISOString(),
      retailerId,
      salesman: salesman || "Unassigned",
      purpose: finalPurpose,
      area: area.trim() || undefined,
      visitStatus: "Visited",
      activity: derivedActivity,
      outcome,
      notes,
      addedByUserId: accessStore.getCurrentUserId() ?? undefined,
    };
    store.setVisits([v, ...store.getVisits()]);
    toast.success("Visit logged");
    onSaved();
  };

  return (
    <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>{presetRetailer ? `Record visit · ${presetRetailer.name}` : "Log a visit"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Field label="Visit date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {presetRetailer ? (
          <Field label="Retailer">
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div className="font-medium">{presetRetailer.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {[presetRetailer.area, normalizeCity(presetRetailer.city || ""), presetRetailer.category].filter(Boolean).join(" · ")}
              </div>
            </div>
          </Field>
        ) : retailers.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add a retailer first in the Retailers tab.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search retailers..." className="pl-9 h-9" />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-10 w-full text-xs sm:w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">A – Z</SelectItem>
                  <SelectItem value="area">Area wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Retailer">
              <Select value={retailerId} onValueChange={setRetailerId}>
                <SelectTrigger><SelectValue placeholder="Select retailer" /></SelectTrigger>
                <SelectContent>
                  {filteredRetailers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}{r.area ? ` · ${r.area}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="Salesman">
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted/40 text-sm truncate">
              {salesman || "Select a retailer first"}
            </div>
          </Field>
          <Field label="Area">
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Gulberg" />
          </Field>
        </div>

        <Field label="Purpose">
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
            <SelectContent>
              {VISIT_PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {purpose === "Other" && (
          <Field label="Specify purpose">
            <Input value={otherPurpose} onChange={(e) => setOtherPurpose(e.target.value)} placeholder="Enter purpose" />
          </Field>
        )}
        <Field label="Outcome">
          <Select value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering..." rows={3} /></Field>
      </div>
      <DialogFooter><Button onClick={save} className="w-full">Save visit</Button></DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-aqua font-medium">{label}</Label>
      {children}
    </div>
  );
}

/* ---------------- Reports ---------------- */
type RangePreset = "weekly" | "monthly" | "quarterly" | "custom";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PERMANENT_CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Hyderabad"];

function normalizeCity(city: string) {
  const c = city.trim();
  const match = PERMANENT_CITIES.find((p) => p.toLowerCase() === c.toLowerCase());
  return match ?? c.replace(/\b\w/g, (m) => m.toUpperCase());
}

function Reports({ visits, retailers, salesmen }: { visits: Visit[]; retailers: Retailer[]; salesmen: Salesman[] }) {

  const today = new Date();
  const [preset, setPreset] = useState<RangePreset>("monthly");
  const [from, setFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return toISODate(d);
  });
  const [to, setTo] = useState<string>(toISODate(today));
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);


  const sortedSalesmen = useMemo(
    () => [...salesmen].sort((a, b) => a.name.localeCompare(b.name)),
    [salesmen]
  );

  const toggleSalesman = (name: string) => {
    setSelectedSalesmen((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    const end = new Date();
    const start = new Date();
    if (p === "weekly") start.setDate(end.getDate() - 6);
    else if (p === "monthly") start.setDate(end.getDate() - 29);
    else if (p === "quarterly") start.setDate(end.getDate() - 89);
    else return;
    setFrom(toISODate(start));
    setTo(toISODate(end));
  };

  const onFromChange = (val: string) => {
    setPreset("custom");
    setFrom(val);
    const f = new Date(val); const t = new Date(to);
    const maxTo = new Date(f); maxTo.setFullYear(maxTo.getFullYear() + 1);
    if (t > maxTo) setTo(toISODate(maxTo));
    if (t < f) setTo(val);
  };
  const onToChange = (val: string) => {
    setPreset("custom");
    setTo(val);
    const f = new Date(from); const t = new Date(val);
    const minFrom = new Date(t); minFrom.setFullYear(minFrom.getFullYear() - 1);
    if (f < minFrom) setFrom(toISODate(minFrom));
    if (f > t) setFrom(val);
  };

  const filtered = useMemo(() => {
    const f = new Date(from + "T00:00:00").getTime();
    const t = new Date(to + "T23:59:59").getTime();
    return visits.filter((v) => {
      const ts = new Date(v.date).getTime();
      if (ts < f || ts > t) return false;
      if (selectedSalesmen.length > 0 && !selectedSalesmen.includes(v.salesman)) return false;
      return true;
    });
  }, [visits, from, to, selectedSalesmen]);

  const activityCounts = useMemo(() => {
    const retailerById = new Map(retailers.map((r) => [r.id, r]));
    const cities = new Set<string>();
    const areas = new Set<string>();
    const shops = new Set<string>();
    let visits = 0, recovery = 0, complaints = 0, others = 0;
    filtered.forEach((v) => {
      const isUnavailable = !!v.unavailableReason || v.activity === "Others Reasons" || v.visitStatus === "Holiday";
      if (isUnavailable) { others++; return; }
      if (v.visitStatus === "Not Visited" || v.visitStatus === "No Update") return;
      visits++;
      const r = retailerById.get(v.retailerId);
      if (r) {
        shops.add(r.id);
        if ((r.city || "").trim()) cities.add(normalizeCity(r.city));
      }
      const area = (v.area || r?.area || (r?.address || "").split(",")[0] || "").trim();
      if (area) areas.add(area.toLowerCase());
      const p = `${v.purpose || ""} ${v.activity || ""}`.toLowerCase();
      if (p.includes("recovery")) recovery++;
      if (p.includes("complaint")) complaints++;
    });
    return {
      "Visits": visits,
      "City Visits": cities.size,
      "Areas Visited": areas.size,
      "Shops Visited": shops.size,
      "Recovery Visits": recovery,
      "Complaints Visits": complaints,
      "Others Reasons": others,
    } as Record<VisitActivity, number>;
  }, [filtered, retailers]);

  const outcomeCounts = useMemo(() => {
    const acc = OUTCOMES.reduce((o, k) => { o[k] = 0; return o; }, {} as Record<Outcome, number>);
    filtered.forEach((v) => { if (v.outcome && acc[v.outcome] !== undefined) acc[v.outcome]++; });
    return acc;
  }, [filtered]);

  const cityStats = useMemo(() => {
    const salesmanById = new Map(salesmen.map((s) => [s.id, s.name]));
    const scoped = retailers.filter((r) => {
      if (selectedSalesmen.length === 0) return true;
      const name = r.salesmanId ? salesmanById.get(r.salesmanId) : undefined;
      return !!name && selectedSalesmen.includes(name);
    });
    const visitsPerRetailer = new Map<string, number>();
    filtered.forEach((v) => {
      visitsPerRetailer.set(v.retailerId, (visitsPerRetailer.get(v.retailerId) || 0) + 1);
    });
    const acc: Record<string, { retailers: number; single: number; multiple: number; notVisited: number; visits: number }> = {};
    scoped.forEach((r) => {
      const city = (r.city || "").trim();
      if (!city) return;
      const key = normalizeCity(city);
      const row = acc[key] || (acc[key] = { retailers: 0, single: 0, multiple: 0, notVisited: 0, visits: 0 });
      const n = visitsPerRetailer.get(r.id) || 0;
      row.retailers++;
      row.visits += n;
      if (n === 0) row.notVisited++;
      else if (n === 1) row.single++;
      else row.multiple++;
    });
    return acc;
  }, [filtered, retailers, salesmen, selectedSalesmen]);

  const linkedCities = useMemo(() => {
    const set = new Map<string, string>();
    [...retailers.map((r) => r.city), ...salesmen.map((s) => s.city)].forEach((c) => {
      const city = (c || "").trim();
      if (!city) return;
      const key = normalizeCity(city);
      if (!set.has(key)) set.set(key, key);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [retailers, salesmen]);

  const selectableCities = useMemo(
    () => linkedCities.filter((c) => !PERMANENT_CITIES.includes(c) && !selectedCities.includes(c)),
    [linkedCities, selectedCities]
  );

  const EMPTY_CITY = { retailers: 0, single: 0, multiple: 0, notVisited: 0, visits: 0 };

  const cityRows = useMemo(
    () => [
      ...PERMANENT_CITIES.map((c) => ({ city: c, permanent: true, ...(cityStats[c] || EMPTY_CITY) })),
      ...selectedCities.map((c) => ({ city: c, permanent: false, ...(cityStats[c] || EMPTY_CITY) })),
    ],
    [cityStats, selectedCities]
  );



  const exportCsv = () => {
    const header = "date,retailer,salesman,purpose,visitStatus,outcome,notes";
    const rows = filtered.map((v) => {
      const r = retailers.find((x) => x.id === v.retailerId)?.name ?? "";
      const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      return [v.date, r, v.salesman, v.purpose, v.visitStatus, v.outcome, v.notes].map((x) => esc(String(x))).join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visits-${from}_to_${to}.csv`;
    a.click();
  };

  const selectionSummary =
    selectedSalesmen.length === 0
      ? `All salesmen (${sortedSalesmen.length || 0})`
      : selectedSalesmen.length === 1
        ? selectedSalesmen[0]
        : `${selectedSalesmen.length} salesmen combined`;

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="text-lg font-semibold">Visit Reports</h2>
        <Button size="sm" className="min-h-10" variant="outline" onClick={exportCsv} disabled={!filtered.length}>Export CSV</Button>
      </div>

      <div className="bg-card border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(["weekly", "monthly", "quarterly"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "default" : "outline"}
              onClick={() => applyPreset(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <Input type="date" value={from} max={to} onChange={(e) => onFromChange(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} min={from} max={toISODate(new Date())} onChange={(e) => onToChange(e.target.value)} />
          </Field>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" /> Max range: 1 year · {filtered.length} visits in range
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Salesmen</h3>
          {selectedSalesmen.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedSalesmen([])}>
              Clear
            </Button>
          )}
        </div>
        {sortedSalesmen.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add salesmen in the Salesmen tab to filter reports.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedSalesmen.map((s) => {
              const active = selectedSalesmen.includes(s.name);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSalesman(s.name)}
                  className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {selectedSalesmen.length === 0
            ? "Showing combined data for all salesmen."
            : selectedSalesmen.length === 1
              ? `Showing data for ${selectedSalesmen[0]}.`
              : `Showing combined data for ${selectedSalesmen.length} salesmen.`}
        </p>
      </div>

      <SegmentCard
        title="Visit Status"
        subtitle={selectionSummary}
        entries={VISIT_ACTIVITIES.map((a) => ({ key: a, count: activityCounts[a], color: ACTIVITY_BAR[a] }))}
        total={filtered.length}
      />


      <SegmentCard
        title="Outcome"
        subtitle={selectionSummary}
        entries={OUTCOMES.map((o) => ({ key: o, count: outcomeCounts[o], color: OUTCOME_BAR[o] }))}
        total={filtered.length}
      />

      <div className="bg-card border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold">City wise Analysis</h3>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">{selectionSummary}</p>
        <div className="space-y-2">
          {cityRows.map((row) => (
            <div key={row.city}>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  {row.city}
                  {!row.permanent && (
                    <button
                      type="button"
                      onClick={() => setSelectedCities((prev) => prev.filter((c) => c !== row.city))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${row.city}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1 text-[10px]">
                <span className="text-blue-600 dark:text-blue-400">({row.retailers})</span>
                <span className="text-yellow-600 dark:text-yellow-400">({row.single})</span>
                <span className="text-green-600 dark:text-green-400">({row.multiple})</span>
                <span className="text-red-600 dark:text-red-400">({row.notVisited})</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-yellow-500" style={{ width: `${(row.single / (row.retailers || 1)) * 100}%` }} />
                <div className="h-full bg-green-500" style={{ width: `${(row.multiple / (row.retailers || 1)) * 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${(row.notVisited / (row.retailers || 1)) * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px]">
                <span className="text-blue-600 dark:text-blue-400">Retailers</span>
                <span className="text-yellow-600 dark:text-yellow-400">Single visit</span>
                <span className="text-green-600 dark:text-green-400">Multiple visits</span>
                <span className="text-red-600 dark:text-red-400">Not visited</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Field label="Add city">
            <Select
              value=""
              onValueChange={(v) => setSelectedCities((prev) => (prev.includes(v) ? prev : [...prev, v]))}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectableCities.length ? "Select a city" : "No other linked cities"} />
              </SelectTrigger>
              <SelectContent>
                {selectableCities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}


const STATUS_BAR: Record<VisitStatus, string> = {
  Visited: "bg-emerald-500",
  "Not Visited": "bg-rose-500",
  "No Update": "bg-slate-400",
  Holiday: "bg-amber-500",
};

const ACTIVITY_BAR: Record<VisitActivity, string> = {
  "Visits": "bg-indigo-500",
  "City Visits": "bg-sky-500",
  "Areas Visited": "bg-teal-500",
  "Shops Visited": "bg-emerald-500",
  "Recovery Visits": "bg-amber-500",
  "Complaints Visits": "bg-rose-500",
  "Others Reasons": "bg-slate-400",
};

const OUTCOME_BAR: Record<Outcome, string> = {
  Satisfactory: "bg-teal-500",
  Successful: "bg-emerald-500",
  "Not Interested": "bg-rose-500",
  "Meeting unsuccessful": "bg-orange-500",
  "Not Met": "bg-slate-400",
  Complaints: "bg-red-500",
  "Linked to Other Company": "bg-violet-500",
};

function SegmentCard({
  title,
  subtitle,
  entries,
  total,
}: {
  title: string;
  subtitle?: string;
  entries: { key: string; count: number; color: string }[];
  total: number;
}) {
  const denom = total || 1;
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary">{total}</Badge>
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>}
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.key}>
            <div className="flex justify-between text-xs mb-1">
              <span>{e.key}</span>
              <span className="text-muted-foreground">{e.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${e.color}`} style={{ width: `${(e.count / denom) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Retailers ---------------- */
function Retailers({
  retailers,
  salesmen,
  refresh,
  currentUser,
}: {
  retailers: Retailer[];
  salesmen: Salesman[];
  refresh: () => void;
  currentUser?: AppUser | null;
}) {
  const isPrivileged = !currentUser || !isScopedRole(currentUser.role);
  const canSeeAddedBy = (r: Retailer) => isPrivileged || r.addedByUserId === currentUser?.id;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [salesmanFilter, setSalesmanFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Retailer | null>(null);


  const sortedSalesmen = [...salesmen].sort((a, b) => a.name.localeCompare(b.name));
  const salesmanName = (id?: string) => sortedSalesmen.find((s) => s.id === id)?.name;

  const filtered = retailers
    .filter((r) =>
      salesmanFilter === "all"
        ? true
        : salesmanFilter === "unassigned"
          ? !r.salesmanId
          : r.salesmanId === salesmanFilter
    )
    .filter((r) => [r.name, r.city, r.area, r.owner].some((s) => (s || "").toLowerCase().includes(q.toLowerCase())));

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Retailer[] }[] = [];
    sortedSalesmen.forEach((s) => {
      const items = filtered.filter((r) => r.salesmanId === s.id).sort((a, b) => a.name.localeCompare(b.name));
      if (items.length) out.push({ key: s.id, label: s.name, items });
    });
    const un = filtered.filter((r) => !r.salesmanId || !sortedSalesmen.some((s) => s.id === r.salesmanId))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (un.length) out.push({ key: "unassigned", label: "Unassigned", items: un });
    return out;
  }, [filtered, salesmen]);

  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const toggleGroup = (k: string) =>
    setOpenGroups((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const remove = (id: string) => {
    if (!confirm("Delete this retailer?")) return;
    store.setRetailers(retailers.filter((r) => r.id !== id));
    refresh();
  };

  const assign = (id: string, salesmanId: string) => {
    store.setRetailers(
      store.getRetailers().map((r) => (r.id === id ? { ...r, salesmanId: salesmanId === "none" ? undefined : salesmanId } : r))
    );
    toast.success("Salesman updated");
    refresh();
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const pick = (row: Record<string, unknown>, keys: string[]) => {
        const entry = Object.entries(row).find(([k]) =>
          keys.includes(k.trim().toLowerCase().replace(/[\s_]+/g, ""))
        );
        return entry ? String(entry[1] ?? "").trim() : "";
      };
      const salesmanByName = new Map(salesmen.map((s) => [s.name.trim().toLowerCase(), s.id]));
      const imported: Retailer[] = [];
      rows.forEach((row) => {
        const name = pick(row, ["name", "shop", "shopname", "retailer", "retailername"]);
        if (!name) return;
        const cat = pick(row, ["category", "cat"]).toUpperCase();
        const sm = pick(row, ["salesman", "salesmanname"]).toLowerCase();
        imported.push({
          id: uid(),
          name,
          owner: pick(row, ["owner", "ownername"]),
          city: pick(row, ["city"]),
          area: pick(row, ["area", "areaname", "locality", "zone", "sector"]),
          phone: pick(row, ["phone", "mobile", "contact", "phoneno", "mobileno"]),
          address: pick(row, ["address"]),
          notes: pick(row, ["notes", "note", "remarks"]),
          category: (SHOP_CATEGORIES as readonly string[]).includes(cat) ? (cat as ShopCategory) : undefined,
          salesmanId: salesmanByName.get(sm),
        });
      });
      if (!imported.length) return toast.error("No rows found. Include a 'Name' column.");
      store.setRetailers([...imported, ...store.getRetailers()]);
      toast.success(`Imported ${imported.length} retailers`);
      refresh();
    } catch {
      toast.error("Could not read that file. Use a .csv or .xlsx file.");
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="text-lg font-semibold">Retailers</h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" className="min-h-10 px-2.5 sm:px-3" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Import</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="min-h-10"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
            <RetailerDialog salesmen={sortedSalesmen} currentUser={currentUser} onSaved={() => { refresh(); setOpen(false); }} />
          </Dialog>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">
        Import columns: Name, Owner, City, Area, Phone, Address, Category, Salesman, Notes
      </p>


      <Input placeholder="Search by name, city, area or owner..." value={q} onChange={(e) => setQ(e.target.value)} />

      <Select value={salesmanFilter} onValueChange={setSalesmanFilter}>
        <SelectTrigger><SelectValue placeholder="Filter by salesman" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All salesmen</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {sortedSalesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Store className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">{retailers.length ? "No matches" : "No retailers yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {retailers.length ? "Try a different search or filter." : "Tap \"Add\" above to add your first retailer."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => {
            const isOpen = openGroups.includes(g.key);
            return (
              <li key={g.key} className="bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  className="w-full flex items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    <InitialAvatar name={g.label} className="h-7 w-7 text-[11px]" />
                    <span className="text-sm font-medium truncate">{g.label}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{g.items.length}</Badge>
                </button>

                {isOpen && (
                  <ul className="border-t divide-y">
                    {g.items.map((r) => (
                      <li key={r.id} className="px-3 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 transition-colors hover:bg-muted/30 lg:flex lg:items-center lg:py-2">
                        <div className="min-w-0 flex-1 flex items-start gap-2.5">
                          <InitialAvatar name={r.name} className="h-8 w-8 text-xs mt-0.5 sm:mt-0" />
                          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="w-full text-sm font-medium text-foreground truncate sm:w-auto sm:max-w-[40%]">{r.name}</span>
                            {r.category && <CategoryBadge category={r.category} />}
                            {r.owner && <span className="truncate">{r.owner}</span>}
                            {r.phone && <span className="truncate">{r.phone}</span>}
                            {[r.address, r.area, r.city].filter(Boolean).length > 0 && (
                              <span className="truncate">{[r.address, r.area, r.city].filter(Boolean).join(", ")}</span>
                            )}
                            {r.notes && <span className="truncate">{r.notes}</span>}
                            {r.addedByName && canSeeAddedBy(r) && <span className="truncate">Added by: {r.addedByName}</span>}
                          </div>
                        </div>

                        <div className="col-span-2 flex w-full items-center justify-end gap-2 lg:col-span-1 lg:w-auto">
                          <Select value={r.salesmanId ?? "none"} onValueChange={(v) => assign(r.id, v)}>
                            <SelectTrigger className="h-10 min-w-0 flex-1 text-xs sm:w-[140px] sm:flex-none"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {sortedSalesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Dialog open={editing?.id === r.id} onOpenChange={(o) => setEditing(o ? r : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label={`Edit ${r.name}`}><Pencil className="w-4 h-4" /></Button>
                            </DialogTrigger>
                            {editing?.id === r.id && (
                              <RetailerDialog salesmen={sortedSalesmen} currentUser={currentUser} initial={r} onSaved={() => { refresh(); setEditing(null); }} />
                            )}
                          </Dialog>
                          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(r.id)} aria-label={`Delete ${r.name}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}

function RetailerDialog({
  salesmen,
  onSaved,
  initial,
  currentUser,
}: {
  salesmen: Salesman[];
  onSaved: () => void;
  initial?: Retailer;
  currentUser?: AppUser | null;
}) {
  const scoped = !!currentUser && isScopedRole(currentUser.role);
  const [f, setF] = useState<Omit<Retailer, "id">>(
    initial
      ? { name: initial.name, owner: initial.owner, city: initial.city, area: initial.area ?? "", phone: initial.phone, address: initial.address, notes: initial.notes, salesmanId: initial.salesmanId, category: initial.category }
      : { name: "", owner: "", city: "", area: "", phone: "", address: "", notes: "" }
  );
  const save = () => {
    if (!f.name.trim()) return toast.error("Name is required");
    if (initial) {
      store.setRetailers(store.getRetailers().map((r) => (r.id === initial.id ? { ...r, ...f } : r)));
      toast.success("Retailer updated");
    } else {
      store.setRetailers([
        {
          id: uid(),
          ...f,
          salesmanId: scoped ? undefined : f.salesmanId,
          addedByUserId: currentUser?.id,
          addedByName: currentUser?.name,
        },
        ...store.getRetailers(),
      ]);
      toast.success("Retailer added");
    }
    onSaved();
  };
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl p-4 sm:p-6">
      <DialogHeader><DialogTitle>{initial ? "Edit retailer" : "Add retailer"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Shop name"><Input value={f.name} onChange={upd("name")} placeholder="Vision Optics" /></Field>
        <Field label="Owner / contact"><Input value={f.owner} onChange={upd("owner")} /></Field>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          <Field label="City"><Input value={f.city} onChange={upd("city")} /></Field>
          <Field label="Area"><Input value={f.area} onChange={upd("area")} placeholder="Saddar" /></Field>
        </div>
        <Field label="Phone"><Input value={f.phone} onChange={upd("phone")} /></Field>
        <Field label="Shop category">
          <Select value={f.category ?? ""} onValueChange={(v) => setF({ ...f, category: v as ShopCategory })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {SHOP_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {scoped && !initial ? (
          <p className="text-xs text-muted-foreground">
            New retailers you add are saved as <span className="font-medium">Unassigned</span> and tagged with your name.
          </p>
        ) : (
        <Field label="Assigned salesman">
          {salesmen.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add salesmen first in the Salesmen tab.</p>
          ) : (
            <Select value={f.salesmanId ?? "none"} onValueChange={(v) => setF({ ...f, salesmanId: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Select salesman" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {salesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>
        )}
        <Field label="Address"><Input value={f.address} onChange={upd("address")} /></Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={upd("notes")} rows={2} /></Field>
      </div>
      <DialogFooter><Button className="w-full" onClick={save}>{initial ? "Save changes" : "Save retailer"}</Button></DialogFooter>
    </DialogContent>
  );
}


/* ---------------- Salesmen ---------------- */
function Salesmen({
  salesmen,
  visits,
  retailers,
  refresh,
}: {
  salesmen: Salesman[];
  visits: Visit[];
  retailers: Retailer[];
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const sorted = [...salesmen].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter((s) =>
    [s.name, s.city, s.region, s.mobile].some((x) => (x || "").toLowerCase().includes(q.toLowerCase()))
  );

  const thisMonth = new Date().toISOString().slice(0, 7);

  const statsFor = (s: Salesman) => {
    const own = visits.filter((v) => v.salesman === s.name);
    const monthVisits = own.filter((v) => v.date.startsWith(thisMonth));
    const successful = monthVisits.filter((v) => v.outcome === "Successful" || v.outcome === "Satisfactory");
    const successRate = monthVisits.length ? Math.round((successful.length / monthVisits.length) * 100) : null;
    const assigned = retailers.filter((r) => r.salesmanId === s.id).length;
    return { monthCount: monthVisits.length, successRate, assigned };
  };

  const remove = (id: string) => {
    if (!confirm("Delete this salesman?")) return;
    store.setSalesmen(salesmen.filter((s) => s.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /> Salesmen data</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
          <SalesmanDialog onSaved={() => { refresh(); setOpen(false); }} />
        </Dialog>
      </div>

      <Input placeholder="Search by name, city, region or mobile..." value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">{salesmen.length ? "No matches" : "No salesmen yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{salesmen.length ? "Try a different search." : "Tap \"Add\" above to add your first salesman."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => {
            const stats = statsFor(s);
            return (
              <li key={s.id} className="bg-card border rounded-2xl p-4 transition-shadow hover:shadow-md">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <InitialAvatar name={s.name} className="h-10 w-10 text-sm mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {(s.city || s.region) && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{[s.city, s.region].filter(Boolean).join(", ")}</div>}
                        {s.mobile && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.mobile}</div>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                  <Badge variant="secondary" className="text-[10px] font-normal">{stats.assigned} retailer{stats.assigned === 1 ? "" : "s"}</Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">{stats.monthCount} visit{stats.monthCount === 1 ? "" : "s"} this month</Badge>
                  {stats.successRate !== null && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-normal ${stats.successRate >= 50 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}
                    >
                      {stats.successRate}% success
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SalesmanDialog({ onSaved }: { onSaved: () => void }) {
  const [f, setF] = useState<Omit<Salesman, "id">>({ name: "", city: "", region: "", mobile: "" });
  const save = () => {
    if (!f.name.trim()) return toast.error("Name is required");
    store.setSalesmen([{ id: uid(), ...f }, ...store.getSalesmen()]);
    toast.success("Salesman added");
    onSaved();
  };
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Add salesman</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Name"><Input value={f.name} onChange={upd("name")} placeholder="Full name" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={f.city} onChange={upd("city")} /></Field>
          <Field label="Region"><Input value={f.region} onChange={upd("region")} /></Field>
        </div>
        <Field label="Mobile"><Input value={f.mobile} onChange={upd("mobile")} placeholder="Phone number" /></Field>
      </div>
      <DialogFooter><Button className="w-full" onClick={save}>Save salesman</Button></DialogFooter>
    </DialogContent>
  );
}

/* ---------------- Settings ---------------- */
function swatchStyle(value: string): React.CSSProperties {
  if (value === NO_FILL) return { backgroundImage: "linear-gradient(135deg, transparent 45%, var(--border) 45%, var(--border) 55%, transparent 55%)" };
  if (!value) return { background: "var(--muted)" };
  return { backgroundColor: value };
}

function colorLabel(value: string) {
  if (value === NO_FILL) return "No fill";
  if (!value) return "Default";
  for (const g of THEME_PALETTE) {
    const hit = g.colors.find((c) => c.value === value);
    if (hit) return hit.name;
  }
  return "Custom";
}

function ColorPicker({
  label,
  value,
  onChange,
  allowNoFill,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowNoFill?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pick = (v: string) => { onChange(v); setOpen(false); };

  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-xs hover:bg-accent transition"
          >
            <span className="h-5 w-5 rounded-full border" style={swatchStyle(value)} />
            <span className="text-muted-foreground">{colorLabel(value)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pick("")}
              className={`flex-1 h-7 rounded-md border text-[11px] ${value === "" ? "ring-2 ring-ring" : ""}`}
            >
              Default
            </button>
            {allowNoFill && (
              <button
                type="button"
                onClick={() => pick(NO_FILL)}
                className={`flex-1 h-7 rounded-md border text-[11px] ${value === NO_FILL ? "ring-2 ring-ring" : ""}`}
              >
                No fill
              </button>
            )}
          </div>
          {THEME_PALETTE.map((g) => (
            <div key={g.group} className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{g.group}</div>
              <div className="grid grid-cols-8 gap-1.5">
                {g.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => pick(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`h-6 w-6 rounded-full border ${value === c.value ? "ring-2 ring-ring ring-offset-1" : ""}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ThemePanel() {
  const [theme, setLocalTheme] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    setLocalTheme(getTheme());
  }, []);

  const update = (patch: Partial<AppTheme>) => {
    const next = { ...theme, ...patch };
    setLocalTheme(next);
    setTheme(next);
  };

  return (
    <section className="bg-card border rounded-2xl overflow-hidden">
      <div className="ov-toolbar px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-current">Appearance</h3>
          <p className="text-[11px] opacity-85">Toolbar, tickets, tokens, fonts and background</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-current hover:bg-white/15"
          onClick={() => update({ preset: "", background: "", card: "", font: "", accent: "" })}
        >
          Reset
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Theme</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <ThemeCard
              name="Classic"
              mood="App default"
              swatches={["linear-gradient(100deg, oklch(0.34 0.11 258), oklch(0.46 0.13 226))", "oklch(0.975 0.004 220)", "oklch(0.33 0.10 255)", "oklch(1 0 0)"]}
              active={!theme.preset}
              onClick={() => update({ preset: "" })}
            />
            {THEME_PRESETS.map((p) => (
              <ThemeCard
                key={p.id}
                name={p.name}
                mood={p.mood}
                swatches={p.swatches}
                active={theme.preset === p.id}
                onClick={() => update({ preset: p.id })}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Fine tuning</Label>
            <span className="text-[10px] text-muted-foreground">Applies on top of the theme</span>
          </div>
          <ColorPicker label="Accent / toolbar" value={theme.accent} onChange={(v) => update({ accent: v })} />
          <ColorPicker label="Background" value={theme.background} onChange={(v) => update({ background: v })} allowNoFill />
          <ColorPicker label="Ticket / token" value={theme.card} onChange={(v) => update({ card: v })} allowNoFill />
          <ColorPicker label="Font" value={theme.font} onChange={(v) => update({ font: v })} />
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="ov-toolbar px-3 py-2 text-xs font-semibold">Live preview</div>
          <div className="p-3 bg-background space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 bg-card border rounded-xl p-2">
                <div className="text-[10px] text-muted-foreground">Visits today</div>
                <div className="text-lg font-semibold">12</div>
              </div>
              <div className="flex-1 bg-card border rounded-xl p-2">
                <div className="text-[10px] text-muted-foreground">Retailers</div>
                <div className="text-lg font-semibold">48</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-xs">Primary</Button>
              <Badge variant="secondary" className="text-[10px]">Token</Badge>
              <span className="text-xs ov-subheading font-medium">Sub heading</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThemeCard({
  name,
  mood,
  swatches,
  active,
  onClick,
}: {
  name: string;
  mood: string;
  swatches: readonly string[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border overflow-hidden transition hover:shadow-md ${active ? "ring-2 ring-ring border-transparent" : ""}`}
    >
      <div className="h-8 w-full" style={{ backgroundImage: swatches[0], backgroundColor: swatches[0] }} />
      <div className="p-2 space-y-1.5" style={{ backgroundColor: swatches[1] }}>
        <div className="flex gap-1">
          {swatches.slice(1).map((c, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div>
          <div className="text-xs font-semibold" style={{ color: swatches[2] }}>{name}</div>
          <div className="text-[10px] opacity-70" style={{ color: swatches[2] }}>{mood}</div>
        </div>
      </div>
    </button>
  );
}

function SettingsPanel({
  onLock,
  salesmen,
  visits,
  retailers,
  refreshSalesmen,
  currentUser,
  hasUsers,
  onAccessChanged,
}: {
  onLock: () => void;
  salesmen: Salesman[];
  visits: Visit[];
  retailers: Retailer[];
  refreshSalesmen: () => void;
  currentUser: AppUser | null;
  hasUsers: boolean;
  onAccessChanged: () => void;
}) {
  const allow = (p: string) => !hasUsers || can(currentUser, p);


  const [newPin, setNewPin] = useState("");
  const [wipePin, setWipePin] = useState("");
  const [wipeOpen, setWipeOpen] = useState(false);

  const changePin = async () => {
    if (!/^\d{4}$/.test(newPin)) return toast.error("Enter a 4-digit PIN");
    const hash = await hashPin(newPin);
    store.setSettings({ ...store.getSettings(), pinHash: hash });
    setNewPin("");
    toast.success("PIN updated");
  };

  const confirmWipe = async () => {
    const settings = store.getSettings();
    if (!settings.pinHash) {
      toast.error("No PIN is set on this device");
      return;
    }
    if (!/^\d{4}$/.test(wipePin)) {
      toast.error("Enter your 4-digit PIN");
      return;
    }
    const hash = await hashPin(wipePin);
    if (hash !== settings.pinHash) {
      toast.error("Incorrect PIN");
      return;
    }
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  };


  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-semibold">Settings</h2>

      <section className="bg-card border rounded-2xl p-4">
        <AccessControl currentUser={currentUser} onChanged={onAccessChanged} />
      </section>

      {allow("setting.theme") && <ThemePanel />}

      {allow("setting.salesmen") && (
        <section className="bg-card border rounded-2xl p-4">
          <Salesmen salesmen={salesmen} visits={visits} retailers={retailers} refresh={refreshSalesmen} />
        </section>
      )}

      <section className="bg-card border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Lock className="w-4 h-4 text-muted-foreground" /> Security</h3>
        {allow("setting.pin") && (
          <>
            <Field label="Change PIN">
              <Input inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="New 4-digit PIN" />
            </Field>
            <div className="flex gap-2">
              <Button size="sm" onClick={changePin}>Update PIN</Button>
              <Button size="sm" variant="outline" onClick={() => { store.setSession(false); accessStore.setCurrentUserId(null); onLock(); }}>Lock app</Button>
            </div>
          </>
        )}
        {!allow("setting.pin") && (
          <Button size="sm" variant="outline" onClick={() => { store.setSession(false); accessStore.setCurrentUserId(null); onLock(); }}>Lock app</Button>
        )}
      </section>

      {allow("setting.erase") && (
      <section className="bg-card border border-destructive/20 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Danger zone</h3>
        <p className="text-xs text-muted-foreground">This clears everything stored on this device. Requires your PIN to confirm.</p>
        <Dialog open={wipeOpen} onOpenChange={(o) => { setWipeOpen(o); if (!o) setWipePin(""); }}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">Erase all data</Button>
          </DialogTrigger>

          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Confirm with PIN</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter your 4-digit PIN to erase all visits, retailers, salesmen and settings on this device. This cannot be undone.
              </p>
              <Field label="PIN">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={wipePin}
                  onChange={(e) => setWipePin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  autoFocus
                />
              </Field>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setWipeOpen(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmWipe}>Erase everything</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      )}


      <p className="text-[10px] text-center text-muted-foreground pt-2">OptiVisit · data stored locally on this device</p>
    </div>
  );
}

/* ---------------- Salesman Visit Log (city-wise) ---------------- */
function SalesmanVisitLog({
  visits,
  retailers,
  salesmen,
  refresh,
}: {
  visits: Visit[];
  retailers: Retailer[];
  salesmen: Salesman[];
  refresh: () => void;
}) {
  // "all" = All Salesmen (exclusive). Otherwise a multi-select of salesman ids + "unassigned".
  const [selected, setSelected] = useState<string[]>(["unassigned"]);
  const [target, setTarget] = useState<Retailer | null>(null);
  const [openCities, setOpenCities] = useState<string[]>([]);
  const toggleCity = (c: string) =>
    setOpenCities((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const sortedSalesmen = useMemo(
    () => [...salesmen].sort((a, b) => a.name.localeCompare(b.name)),
    [salesmen]
  );
  const isAll = selected.includes("all");
  const toggleSel = (key: string) => {
    if (key === "all") return setSelected(["all"]);
    setSelected((prev) => {
      const base = prev.filter((k) => k !== "all");
      const next = base.includes(key) ? base.filter((k) => k !== key) : [...base, key];
      return next.length === 0 ? ["unassigned"] : next;
    });
  };

  const scopedRetailers = useMemo(
    () =>
      isAll
        ? retailers
        : retailers.filter((r) =>
            r.salesmanId ? selected.includes(r.salesmanId) : selected.includes("unassigned")
          ),
    [retailers, selected, isAll]
  );

  const scopedVisits = useMemo(() => {
    if (isAll) return visits;
    const ids = new Set(scopedRetailers.map((r) => r.id));
    const names = new Set(
      sortedSalesmen.filter((s) => selected.includes(s.id)).map((s) => s.name)
    );
    return visits.filter((v) => ids.has(v.retailerId) || names.has(v.salesman));
  }, [visits, scopedRetailers, sortedSalesmen, selected, isAll]);


  const visitsPerRetailer = useMemo(() => {
    const m = new Map<string, number>();
    scopedVisits.forEach((v) => m.set(v.retailerId, (m.get(v.retailerId) || 0) + 1));
    return m;
  }, [scopedVisits]);

  const cityGroups = useMemo(() => {
    const groups = new Map<string, Retailer[]>();
    scopedRetailers.forEach((r) => {
      const key = normalizeCity((r.city || "").trim() || "Unassigned city");
      const list = groups.get(key) || [];
      list.push(r);
      groups.set(key, list);
    });
    return Array.from(groups.entries())
      .map(([city, list]) => {
        let single = 0, multiple = 0, notVisited = 0;
        list.forEach((r) => {
          const n = visitsPerRetailer.get(r.id) || 0;
          if (n === 0) notVisited++;
          else if (n === 1) single++;
          else multiple++;
        });
        return {
          city,
          list: [...list].sort((a, b) => a.name.localeCompare(b.name)),
          total: list.length,
          single,
          multiple,
          notVisited,
        };
      })
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [scopedRetailers, visitsPerRetailer]);

  const recent = useMemo(
    () => [...scopedVisits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [scopedVisits]
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visit Log</h2>
        <Badge variant="secondary">{scopedRetailers.length} shops</Badge>
      </div>

      <div className="bg-card border rounded-2xl p-4">
        <Field label="Salesman">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => toggleSel("unassigned")}
              className={`px-2.5 py-1 rounded-full border text-xs ${selected.includes("unassigned") ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
            >
              Unassigned
            </button>
            {sortedSalesmen.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSel(s.id)}
                className={`px-2.5 py-1 rounded-full border text-xs ${selected.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
              >
                {s.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => toggleSel("all")}
              className={`px-2.5 py-1 rounded-full border text-xs ${isAll ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
            >
              All Salesmen
            </button>
          </div>
        </Field>
        <p className="text-[10px] text-muted-foreground mt-2">
          {isAll
            ? "Showing all shops, grouped city wise."
            : `Showing linked shops for ${selected.length} selection${selected.length === 1 ? "" : "s"}, grouped city wise.`}
        </p>

      </div>

      {cityGroups.length === 0 ? (
        <EmptyHint text="No shops linked yet. Assign retailers to this salesman in the Retailers tab." />
      ) : (
        cityGroups.map((g) => {
          const isOpen = openCities.includes(g.city);
          return (
          <div key={g.city} className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3">
            <button type="button" onClick={() => toggleCity(g.city)} className="w-full grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm gap-2 min-h-10 text-left">
              <span className="min-w-0 font-semibold flex items-center gap-1">
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{g.city}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className="text-blue-600 dark:text-blue-400">({g.total})</span>
                <span className="text-yellow-600 dark:text-yellow-400">({g.single})</span>
                <span className="text-green-600 dark:text-green-400">({g.multiple})</span>
                <span className="text-red-600 dark:text-red-400">({g.notVisited})</span>
              </span>
            </button>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-yellow-500" style={{ width: `${(g.single / (g.total || 1)) * 100}%` }} />
              <div className="h-full bg-green-500" style={{ width: `${(g.multiple / (g.total || 1)) * 100}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${(g.notVisited / (g.total || 1)) * 100}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
              <span className="text-blue-600 dark:text-blue-400">Retailers ({g.total})</span>
              <span className="text-yellow-600 dark:text-yellow-400">Single visit ({g.single})</span>
              <span className="text-green-600 dark:text-green-400">Multiple visits ({g.multiple})</span>
              <span className="text-red-600 dark:text-red-400">Not visited ({g.notVisited})</span>
            </div>

            {isOpen && (
            <ul className="divide-y border-t">
              {g.list.map((r) => {
                const n = visitsPerRetailer.get(r.id) || 0;
                const dot = n === 0 ? "bg-red-500" : n === 1 ? "bg-yellow-500" : "bg-green-500";
                const salesmanName = sortedSalesmen.find((s) => s.id === r.salesmanId)?.name ?? "Unassigned";
                const line = [
                  r.owner,
                  r.phone,
                  r.area,
                  normalizeCity(r.city || ""),
                  r.address,
                  r.category,
                  salesmanName,
                  `${n} visit${n === 1 ? "" : "s"}`,
                ].filter(Boolean).join(" · ");
                return (
                  <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="min-w-0 flex items-center gap-2 flex-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 sm:truncate">{line}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-10 px-2.5 text-xs shrink-0" onClick={() => setTarget(r)}>
                      <Plus className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Record</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
            )}
          </div>
          );
        })
      )}

      {recent.length > 0 && (
        <div className="bg-card border rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-2">Recent entries</h3>
          <ul className="space-y-2">
            {recent.map((v) => {
              const r = retailers.find((x) => x.id === v.retailerId);
              return (
                <li key={v.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{r?.name ?? "Unknown"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(v.date).toLocaleString()} · {v.salesman || "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1 shrink-0">
                    <StatusBadge status={v.visitStatus} />
                    <OutcomeBadge outcome={v.outcome} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        {target && (
          <VisitDialog
            retailers={retailers}
            presetRetailer={target}
            onSaved={() => { refresh(); setTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
