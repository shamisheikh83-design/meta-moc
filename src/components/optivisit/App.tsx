import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { store, uid, hashPin, VISIT_STATUSES, OUTCOMES, VISIT_PURPOSES, SHOP_CATEGORIES, VISIT_ACTIVITIES, LENS_MAIN_CATEGORIES, LENS_MATERIALS, LENS_COATINGS, type Visit, type Retailer, type Salesman, type Product, type VisitPlan, type VisitStatus, type Outcome, type ShopCategory, type VisitActivity, type LensCoating, type CustomCategories } from "@/lib/optivisit-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEME_PALETTE, THEME_PRESETS, NO_FILL, getTheme, setTheme, applyTheme, defaultTheme, type AppTheme, ICON_PACKS, DEFAULT_ICON_PACK, getIconPack, type IconPack } from "@/lib/optivisit-theme";
import { Switch } from "@/components/ui/switch";
import { startPresence, getPresenceCount, PRESENCE_EVENT } from "@/lib/optivisit-presence";

import { Eye, LayoutDashboard, ClipboardList, BarChart3, Store, Settings as SettingsIcon, Plus, Trash2, LogOut, MapPin, Phone, User, Users, Calendar as CalendarIcon, Check, X, Pencil, Upload, ChevronDown, Search, ArrowUpDown, TrendingUp, TrendingDown, Minus, Target, Lock, AlertTriangle, Clock, AlertCircle, RotateCcw, Package, ChevronsUpDown, Building2, Map as MapIcon, ThumbsUp, Repeat2, CalendarDays, Download, Sparkles, ListChecks, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AccessControl } from "./AccessControl";
import { accessStore, can, scopedSalesmanIds, isScopedRole, matchSuperUserPin, type AppUser } from "@/lib/optivisit-access";


type Tab = "dashboard" | "visits" | "planner" | "retailers" | "products" | "settings";

export function OptiVisitApp({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [accessVersion, setAccessVersion] = useState(0);
  const [presenceCount, setPresenceCount] = useState(1);

  const loadUser = () => {
    const id = accessStore.getCurrentUserId();
    const user = id ? (accessStore.getUsers().find((u) => u.id === id) ?? null) : null;
    setCurrentUser(user);
    applyTheme(getTheme(id));
    setAccessVersion((v) => v + 1);
  };

  useEffect(() => {
    setVisits(store.getVisits());
    setRetailers(store.getRetailers());
    setSalesmen(store.getSalesmen());
    setProducts(store.getProducts());
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUser) { setPresenceCount(1); return; }
    const stop = startPresence(currentUser.id, currentUser.name);
    const onPresence = () => setPresenceCount(Math.max(1, getPresenceCount()));
    window.addEventListener(PRESENCE_EVENT, onPresence);
    onPresence();
    return () => {
      window.removeEventListener(PRESENCE_EVENT, onPresence);
      stop();
    };
  }, [currentUser?.id, currentUser?.name]);

  const allowed = (p: string) => can(currentUser, p);
  const hasUsers = typeof window !== "undefined" && accessStore.getUsers().length > 0;
  const visibleTabs: Tab[] = (["dashboard", "visits", "planner", "retailers", "products", "settings"] as Tab[]).filter(
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

  const visibleProducts = useMemo(
    () => (scopeIds ? products.filter((p) => p.addedByUserId === currentUser?.id) : products),
    [products, !!scopeIds, currentUser?.id]
  );

  const refreshVisits = () => setVisits(store.getVisits());
  const refreshRetailers = () => setRetailers(store.getRetailers());
  const refreshSalesmen = () => setSalesmen(store.getSalesmen());
  const refreshProducts = () => setProducts(store.getProducts());


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
              {visibleTabs.includes("visits") && <TopTab value="visits" icon={<ClipboardList className="w-4 h-4" />} label="Visits" />}
              {visibleTabs.includes("planner") && <TopTab value="planner" icon={<CalendarDays className="w-4 h-4" />} label="Planner" />}
              {visibleTabs.includes("retailers") && <TopTab value="retailers" icon={<Store className="w-4 h-4" />} label="Retailers" />}
              {visibleTabs.includes("products") && <TopTab value="products" icon={<Package className="w-4 h-4" />} label="Products" />}
              <TopTab value="settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
            </TabsList>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentUser?.name && (
                <div className="hidden sm:flex items-center gap-1.5 max-w-[140px] text-xs font-medium text-current/90">
                  <User className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{currentUser.name}</span>
                </div>
              )}
              <div
                className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium text-current"
                title={`${presenceCount} user${presenceCount === 1 ? "" : "s"} currently signed in`}
              >
                <Eye className="w-3.5 h-3.5" />
                {presenceCount}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-current hover:bg-white/15"
                onClick={() => { store.setSession(false); accessStore.setCurrentUserId(null); onLock(); }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
          {visibleTabs.includes("dashboard") && (
            <TabsContent value="dashboard">
              <Dashboard visits={visibleVisits} retailers={visibleRetailers} salesmen={visibleSalesmen} currentUser={currentUser} allowed={allowed} />
            </TabsContent>
          )}
          {visibleTabs.includes("visits") && (
            <TabsContent value="visits" className="space-y-6">
              {allowed("module.visitLog") && <VisitLog visits={visibleVisits} retailers={visibleRetailers} refresh={refreshVisits} />}
              {allowed("module.salesmanVisitLog") && <SalesmanVisitLog visits={visibleVisits} retailers={visibleRetailers} salesmen={visibleSalesmen} refresh={refreshVisits} />}
            </TabsContent>
          )}
          {visibleTabs.includes("planner") && (
            <TabsContent value="planner">
              <Planner retailers={visibleRetailers} salesmen={visibleSalesmen} currentUser={currentUser} allowed={allowed} />
            </TabsContent>
          )}
          {visibleTabs.includes("retailers") && <TabsContent value="retailers"><Retailers retailers={visibleRetailers} salesmen={visibleSalesmen} refresh={refreshRetailers} currentUser={currentUser} allowed={allowed} /></TabsContent>}
          {visibleTabs.includes("products") && (
            <TabsContent value="products">
              <Products products={visibleProducts} currentUser={currentUser} allowed={allowed} refresh={refreshProducts} />
            </TabsContent>
          )}
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
            {visibleTabs.includes("visits") && <NavTab value="visits" icon={<ClipboardList className="w-5 h-5" />} label="Visits" />}
            {visibleTabs.includes("planner") && <NavTab value="planner" icon={<CalendarDays className="w-5 h-5" />} label="Planner" />}
            {visibleTabs.includes("retailers") && <NavTab value="retailers" icon={<Store className="w-5 h-5" />} label="Retailers" />}
            {visibleTabs.includes("products") && <NavTab value="products" icon={<Package className="w-5 h-5" />} label="Products" />}
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
      className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold text-[color:var(--ov-toolbar-foreground)] opacity-75 data-[state=active]:opacity-100 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
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
      <span className="max-w-full truncate px-0.5 text-[10px] font-bold">{label}</span>
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

function Dashboard({
  visits,
  retailers,
  salesmen,
  currentUser,
  allowed,
}: {
  visits: Visit[];
  retailers: Retailer[];
  salesmen: Salesman[];
  currentUser?: AppUser | null;
  allowed: (p: string) => boolean;
}) {
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

  const retailerById = new Map(retailers.map((r) => [r.id, r]));
  const citiesFor = (list: Visit[]) => {
    const set = new Set<string>();
    list.forEach((v) => {
      const r = retailerById.get(v.retailerId);
      if (r?.city?.trim()) set.add(normalizeCity(r.city));
    });
    return set.size;
  };
  const areasFor = (list: Visit[]) => {
    const set = new Set<string>();
    list.forEach((v) => {
      const r = retailerById.get(v.retailerId);
      const area = (v.area || r?.area || (r?.address || "").split(",")[0] || "").trim();
      if (area) set.add(area.toLowerCase());
    });
    return set.size;
  };
  const citiesMonth = citiesFor(visitsMonth);
  const citiesLastMonth = citiesFor(visitsLastMonth);
  const areasMonth = areasFor(visitsMonth);
  const areasLastMonth = areasFor(visitsLastMonth);

  const satisfactoryMonth = visitsMonth.filter((v) => v.outcome === "Satisfactory");
  const satisfactoryLastMonth = visitsLastMonth.filter((v) => v.outcome === "Satisfactory");
  const notMetMonth = visitsMonth.filter((v) => v.outcome === "Not Met");
  const notMetLastMonth = visitsLastMonth.filter((v) => v.outcome === "Not Met");

  const [drill, setDrill] = useState<null | { title: string; kind: "visits" | "retailers"; visits?: Visit[]; retailers?: Retailer[] }>(null);

  const settings = store.getSettings();

  // Per-user "show only the cards I picked" preference, kept on this device.
  const cardPrefKey = `ov_dash_cards_${currentUser?.id ?? "owner"}`;
  const [pickMode, setPickMode] = useState(false);
  const [pickedCards, setPickedCards] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cardPrefKey);
      const saved = raw ? (JSON.parse(raw) as { on?: boolean; ids?: string[] }) : null;
      setPickMode(!!saved?.on);
      setPickedCards(Array.isArray(saved?.ids) ? saved.ids : null);
    } catch {
      setPickMode(false);
      setPickedCards(null);
    }
  }, [cardPrefKey]);
  const savePickPref = (on: boolean, ids: string[] | null) => {
    setPickMode(on);
    setPickedCards(ids);
    try {
      localStorage.setItem(cardPrefKey, JSON.stringify({ on, ids }));
    } catch {
      /* preference just won't persist */
    }
  };

  const dashboardCards: { id: string; label: string; el: React.ReactNode }[] = [
    { id: "visits-today", label: "Visits today", el: (
              <StatCard
              label="Visits today"
              value={visitsTodayList.length}
              icon={<ClipboardList />}
              trend={trendOf(visitsTodayList.length, visitsYesterdayList.length)}
              trendCaption="vs yesterday"
              onClick={() => setDrill({ title: "Visits today", kind: "visits", visits: visitsTodayList })}
            />
    ) },
    { id: "this-week", label: "This week", el: (
              <StatCard
              label="This week"
              value={visitsThisWeek.length}
              icon={<Clock />}
              trend={trendOf(visitsThisWeek.length, visitsLastWeek.length)}
              trendCaption="vs last week"
              onClick={() => setDrill({ title: "Visits this week", kind: "visits", visits: visitsThisWeek })}
            />
    ) },
    { id: "this-month", label: "This month", el: (
              <StatCard
              label="This month"
              value={visitsMonth.length}
              icon={<CalendarIcon />}
              trend={trendOf(visitsMonth.length, visitsLastMonth.length)}
              trendCaption="vs last month"
              onClick={() => setDrill({ title: "Visits this month", kind: "visits", visits: visitsMonth })}
            />
    ) },
    { id: "cities", label: "Cities", el: (
              <StatCard
              label="Cities"
              value={citiesMonth}
              icon={<Building2 />}
              trend={trendOf(citiesMonth, citiesLastMonth)}
              trendCaption="vs last month"
            />
    ) },
    { id: "areas", label: "Areas", el: (
              <StatCard
              label="Areas"
              value={areasMonth}
              icon={<MapIcon />}
              trend={trendOf(areasMonth, areasLastMonth)}
              trendCaption="vs last month"
            />
    ) },
    { id: "retailers", label: "Retailers", el: (
              <StatCard
              label="Retailers"
              value={retailers.length}
              icon={<Store />}
              caption={`${activeRetailersThisMonth} active this month`}
              onClick={() => setDrill({ title: "Retailers", kind: "retailers", retailers })}
            />
    ) },
    { id: "recovery-visits", label: "Recovery visits", el: (
              <StatCard
              label="Recovery visits"
              value={recoveryMonth.length}
              icon={<RotateCcw />}
              trend={trendOf(recoveryMonth.length, recoveryLastMonth.length)}
              trendCaption="vs last month"
              onClick={() => setDrill({ title: "Recovery visits this month", kind: "visits", visits: recoveryMonth })}
            />
    ) },
    { id: "complaints", label: "Complaints", el: (
              <StatCard
              label="Complaints"
              value={complaintsMonth.length}
              icon={<AlertCircle />}
              trend={trendOf(complaintsMonth.length, complaintsLastMonth.length)}
              trendCaption="vs last month"
              goodDirection="down"
              onClick={() => setDrill({ title: "Complaints this month", kind: "visits", visits: complaintsMonth })}
            />
    ) },
    { id: "needs-attention", label: "Needs attention", el: (
              <StatCard
              label="Needs attention"
              value={staleRetailers.length}
              icon={<AlertTriangle />}
              accent="orange"
              caption="not visited in 30+ days"
              onClick={() => setDrill({ title: "Not visited in 30+ days", kind: "retailers", retailers: staleRetailers })}
            />
    ) },
    { id: "success-rate", label: "Success rate", el: (
              <StatCard
              label="Success rate"
              value={`${successRate}%`}
              icon={<Target />}
              trend={trendOf(successRate, successRateLastMonth, { suffix: "pt" })}
              trendCaption="vs last month"
              onClick={() => setDrill({ title: "Successful / satisfactory visits", kind: "visits", visits: successList })}
            />
    ) },
    { id: "satisfactory", label: "Satisfactory", el: (
              <StatCard
              label="Satisfactory"
              value={satisfactoryMonth.length}
              icon={<ThumbsUp />}
              trend={trendOf(satisfactoryMonth.length, satisfactoryLastMonth.length)}
              trendCaption="vs last month"
              onClick={() => setDrill({ title: "Satisfactory visits this month", kind: "visits", visits: satisfactoryMonth })}
            />
    ) },
    { id: "not-met-visit-again", label: "Not Met / Visit Again", el: (
              <StatCard
              label="Not Met / Visit Again"
              value={notMetMonth.length}
              icon={<Repeat2 />}
              trend={trendOf(notMetMonth.length, notMetLastMonth.length)}
              trendCaption="vs last month"
              goodDirection="down"
              onClick={() => setDrill({ title: "Not Met / Visit Again this month", kind: "visits", visits: notMetMonth })}
            />
    ) },
  ];

  const chartViews = useChartViews();
  const range = useReportRange();
  const salesmanFilter = useSalesmanFilter();
  // Ignore saved names of salesmen that no longer exist so they can't silently empty the reports.
  const activeSalesmen = salesmanFilter.selected.filter((n) => salesmen.some((s) => s.name === n));
  const [adjustOpen, setAdjustOpen] = useState(false);

  const allCardIds = dashboardCards.map((c) => c.id);
  const pickedIds = (pickedCards ?? allCardIds).filter((id) => allCardIds.includes(id));
  const shownCards = pickMode ? dashboardCards.filter((c) => pickedIds.includes(c.id)) : dashboardCards;
  const togglePicked = (id: string) =>
    savePickPref(true, pickedIds.includes(id) ? pickedIds.filter((x) => x !== id) : [...pickedIds, id]);

  return (
    <div className="space-y-3 sm:space-y-4 pt-1.5 sm:pt-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold">
          {greetingFor(new Date())}{currentUser?.name ? `, ${currentUser.name}` : settings.salesmanName ? `, ${settings.salesmanName}` : ""} 👋
        </h2>
        <button
          type="button"
          onClick={() => setAdjustOpen((o) => !o)}
          aria-expanded={adjustOpen}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium transition hover:bg-muted"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Adjust View
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adjustOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {adjustOpen && (
        <AdjustViewPanel
          cards={dashboardCards.map((c) => ({ id: c.id, label: c.label }))}
          pickMode={pickMode}
          pickedIds={pickedIds}
          onPickMode={(on) => savePickPref(on, pickedCards)}
          onPick={togglePicked}
          onPickAll={() => savePickPref(true, allCardIds)}
          onPickNone={() => savePickPref(true, [])}
          showReports={allowed("module.reports")}
          chartViews={chartViews}
          range={range}
          salesmen={salesmen}
          selectedSalesmen={activeSalesmen}
          onToggleSalesman={salesmanFilter.toggle}
          onClearSalesmen={salesmanFilter.clear}
          onDone={() => setAdjustOpen(false)}
        />
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {shownCards.map((c) => (
          <Fragment key={c.id}>{c.el}</Fragment>
        ))}
      </div>

      {allowed("module.reports") && <ReportsPanels visits={visits} retailers={retailers} salesmen={salesmen} views={chartViews.views} from={range.from} to={range.to} selectedSalesmen={activeSalesmen} />}

      <RecentVisitsSection
        visits={visits}
        retailers={retailers}
        days={settings.recentVisitsDays ?? 3}
        limit={settings.recentVisitsLimit ?? 30}
      />

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

function RecentVisitsSection({
  visits,
  retailers,
  days,
  limit,
}: {
  visits: Visit[];
  retailers: Retailer[];
  days: number;
  limit: number;
}) {
  const [open, setOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  const windowed = useMemo(() => {
    const cutoff = Date.now() - days * 86400000;
    return [...visits]
      .filter((v) => new Date(v.date).getTime() >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }, [visits, days, limit]);

  const shown = windowed.slice(0, visibleCount);
  const canLoadMore = visibleCount < windowed.length;

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 text-left transition-colors hover:bg-muted/40"
      >
        <div>
          <h3 className="font-semibold text-sm">Recent visits</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Last {days} day{days === 1 ? "" : "s"} · up to {limit}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{windowed.length}</Badge>
          <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        </div>
      </button>
      {open && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 -mt-1">
          {shown.length === 0 ? (
            <EmptyHint text="No visits logged in this window yet." />
          ) : (
            <>
              <ul className="divide-y">
                {shown.map((v) => {
                  const r = retailers.find((x) => x.id === v.retailerId);
                  return (
                    <li key={v.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r?.name ?? "Unknown retailer"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(v.date).toLocaleDateString()} · {v.purpose || "Visit"}
                        </div>
                      </div>
                      <OutcomeBadge outcome={v.outcome} />
                    </li>
                  );
                })}
              </ul>
              {canLoadMore && (
                <div className="pt-3 text-center">
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => Math.min(c + 10, windowed.length))}>
                    Show more ({windowed.length - visibleCount} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
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
  accent,
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
  /** Optional accent tint for the icon + value (e.g. "orange" for attention-needed metrics). */
  accent?: "orange";
  trend?: Trend;
  trendCaption?: string;
  goodDirection?: "up" | "down";
  caption?: string;
  onClick?: () => void;
}) {
  const isGood = trend && trend.direction !== "flat" && trend.direction === goodDirection;
  const isBad = trend && trend.direction !== "flat" && trend.direction !== goodDirection;
  const isOrange = accent === "orange";
  const theme = getTheme(accessStore.getCurrentUserId());
  const iconPack = getIconPack(theme.iconPack);
  const iconChipClass = theme.iconPackEnabled ? iconPack.chipClass : "rounded-lg bg-primary/10 text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center text-center rounded-xl border bg-card p-2 sm:p-3 transition active:scale-[0.98] hover:shadow-sm"
    >
      {icon && (
        <span
          className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4 ${
            isOrange ? "rounded-md sm:rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" : iconChipClass
          }`}
        >
          {icon}
        </span>
      )}
      <div
        className={`text-lg sm:text-2xl md:text-3xl font-bold tabular-nums mt-1 sm:mt-2 leading-none ${
          isOrange ? "text-orange-600 dark:text-orange-400" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-xs leading-tight mt-1 text-muted-foreground line-clamp-2">{label}</div>
      {trend && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-medium mt-1 sm:mt-1.5 ${
            trend.direction === "flat"
              ? "bg-muted text-muted-foreground"
              : isGood
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : isBad
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  : ""
          }`}
          title={trendCaption}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
          ) : trend.direction === "down" ? (
            <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3" />
          ) : (
            <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
          )}
          {trend.label}
        </span>
      )}
      {caption && (
        <div className="text-[8px] sm:text-[10px] leading-tight mt-1 text-muted-foreground/80 line-clamp-2">{caption}</div>
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

/* ---------------- Shared CSV export (column picker) ---------------- */
const VISIT_EXPORT_COLUMNS: { key: string; label: string; get: (v: Visit, r?: Retailer) => string }[] = [
  { key: "date", label: "Date", get: (v) => new Date(v.date).toLocaleString() },
  { key: "retailer", label: "Retailer", get: (_v, r) => r?.name ?? "" },
  { key: "city", label: "City", get: (_v, r) => r?.city ?? "" },
  { key: "area", label: "Area", get: (v, r) => v.area || r?.area || "" },
  { key: "salesman", label: "Salesman", get: (v) => v.salesman ?? "" },
  { key: "purpose", label: "Purpose", get: (v) => v.purpose ?? "" },
  { key: "visitStatus", label: "Visit Status", get: (v) => v.visitStatus ?? "" },
  { key: "outcome", label: "Outcome", get: (v) => v.outcome ?? "" },
  { key: "activity", label: "Activity", get: (v) => v.activity ?? "" },
  { key: "notes", label: "Notes", get: (v) => v.notes ?? "" },
];

function ExportCsvDialog({
  visits,
  retailers,
  filenameHint,
}: {
  visits: Visit[];
  retailers: Retailer[];
  filenameHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<string[]>(VISIT_EXPORT_COLUMNS.map((c) => c.key));
  const allSelected = cols.length === VISIT_EXPORT_COLUMNS.length;

  const toggle = (key: string) =>
    setCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const doExport = () => {
    const active = VISIT_EXPORT_COLUMNS.filter((c) => cols.includes(c.key));
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const header = active.map((c) => esc(c.label)).join(",");
    const rows = visits.map((v) => {
      const r = retailers.find((x) => x.id === v.retailerId);
      return active.map((c) => esc(c.get(v, r))).join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visits-export${filenameHint ? `-${filenameHint}` : ""}.csv`;
    a.click();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!visits.length}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Export visits to CSV</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{visits.length} visit{visits.length === 1 ? "" : "s"} will be exported</p>
            <button
              type="button"
              className="text-[10px] underline text-muted-foreground shrink-0"
              onClick={() => setCols(allSelected ? [] : VISIT_EXPORT_COLUMNS.map((c) => c.key))}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="rounded-lg border p-2 space-y-0.5 max-h-64 overflow-y-auto">
            {VISIT_EXPORT_COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm py-1.5 px-1 rounded cursor-pointer hover:bg-muted/50">
                <Checkbox checked={cols.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" className="w-full" onClick={doExport} disabled={cols.length === 0 || visits.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Export {visits.length} visit{visits.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
type VisitGroupBy = "none" | "city" | "date" | "salesman" | "outcome";

function VisitLog({ visits, retailers, refresh }: { visits: Visit[]; retailers: Retailer[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "retailer" | "salesman">("newest");
  const [salesmanFilter, setSalesmanFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<VisitGroupBy>("none");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

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

  const groups = useMemo(() => {
    if (groupBy === "none") return null;
    const keyOf = (v: Visit): string => {
      if (groupBy === "date") return v.date.slice(0, 10);
      if (groupBy === "salesman") return v.salesman || "Unassigned";
      if (groupBy === "outcome") return v.outcome;
      const r = retailers.find((x) => x.id === v.retailerId);
      return r?.city?.trim() ? normalizeCity(r.city) : "Unknown city";
    };
    const map = new Map<string, Visit[]>();
    sorted.forEach((v) => {
      const k = keyOf(v);
      const list = map.get(k) || [];
      list.push(v);
      map.set(k, list);
    });
    const entries = Array.from(map.entries());
    if (groupBy === "date") entries.sort((a, b) => b[0].localeCompare(a[0]));
    else if (groupBy === "outcome") entries.sort((a, b) => OUTCOMES.indexOf(a[0] as Outcome) - OUTCOMES.indexOf(b[0] as Outcome));
    else entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([key, items]) => ({
      key,
      label: groupBy === "date" ? new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : key,
      items,
    }));
  }, [sorted, groupBy, retailers]);

  const toggleGroup = (k: string) =>
    setOpenGroups((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const remove = (id: string) => {
    if (!confirm("Delete this visit?")) return;
    store.setVisits(visits.filter((v) => v.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="text-lg font-semibold">Visit log</h2>
        <div className="flex items-center gap-2">
          <ExportCsvDialog visits={sorted} retailers={retailers} filenameHint="log" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="min-h-10"><Plus className="w-4 h-4 mr-1" /> New visit</Button>
            </DialogTrigger>
            {open && <VisitDialog retailers={retailers} onSaved={() => { refresh(); setOpen(false); }} />}
          </Dialog>
        </div>
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
        <Select value={groupBy} onValueChange={(v) => { setGroupBy(v as VisitGroupBy); setOpenGroups([]); }}>
          <SelectTrigger className="h-9 text-xs"><Building2 className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="city">Group by city</SelectItem>
            <SelectItem value="date">Group by date</SelectItem>
            <SelectItem value="salesman">Group by salesman</SelectItem>
            <SelectItem value="outcome">Group by outcome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">No visits found</p>
          <p className="text-xs text-muted-foreground mt-1">Tap "New visit" above to log your first one.</p>
        </div>
      ) : groups ? (
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
                  <span className="flex items-center gap-2 min-w-0">
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    <span className="text-sm font-medium truncate">{g.label}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{g.items.length}</Badge>
                </button>
                {isOpen && (
                  <ul className="border-t divide-y">
                    {g.items.map((v) => (
                      <li key={v.id} className="px-3 sm:px-4 py-3">
                        <VisitRowContent v={v} r={retailers.find((x) => x.id === v.retailerId)} onDelete={() => remove(v.id)} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">
          {sorted.map((v) => (
            <li
              key={v.id}
              className="bg-card border rounded-2xl p-3 sm:p-4 transition-shadow hover:shadow-md hover:border-primary/20"
            >
              <VisitRowContent v={v} r={retailers.find((x) => x.id === v.retailerId)} onDelete={() => remove(v.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VisitRowContent({ v, r, onDelete }: { v: Visit; r?: Retailer; onDelete: () => void }) {
  return (
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
      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={onDelete} aria-label="Delete visit">
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </Button>
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

function CollapsibleSection({
  title,
  badge,
  subtitle,
  defaultOpen = true,
  compact = false,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Tighter header and body padding for dense report cards. */
  compact?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-colors hover:bg-muted/40 ${
          compact ? "px-3 py-2" : "p-3 sm:p-4"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {badge !== undefined && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
          </div>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground" />
      </button>
      {open && <div className={compact ? "px-3 pb-2.5" : "px-3 sm:px-4 pb-3 sm:pb-4 -mt-1"}>{children}</div>}
    </div>
  );
}

type ChartKey = "status" | "outcome" | "city";
const CHART_KEYS: ChartKey[] = ["status", "outcome", "city"];
const DEFAULT_VIEWS: Record<ChartKey, ChartView> = {
  status: { tiles: true, bars: true, opacity: 100 },
  outcome: { tiles: true, bars: true, opacity: 100 },
  city: { tiles: true, bars: true, opacity: 100 },
};
const REPORT_VIEWS_KEY = "ov_report_chart_views";

const RANGE_KEY = "ov_report_range";
type ReportRange = { preset: RangePreset; from: string; to: string };

function presetRange(p: Exclude<RangePreset, "custom">) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (p === "weekly" ? 6 : p === "monthly" ? 29 : 89));
  return { from: toISODate(start), to: toISODate(end) };
}

/** Report date range (weekly / monthly / quarterly / custom), remembered on this device. */
function useReportRange() {
  const [range, setRange] = useState<ReportRange>(() => ({ preset: "monthly", ...presetRange("monthly") }));
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RANGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<ReportRange>;
      if (saved.preset === "weekly" || saved.preset === "monthly" || saved.preset === "quarterly") {
        setRange({ preset: saved.preset, ...presetRange(saved.preset) });
      } else if (saved.preset === "custom" && saved.from && saved.to) {
        setRange({ preset: "custom", from: saved.from, to: saved.to });
      }
    } catch {
      /* keep the monthly default */
    }
  }, []);
  const commit = (next: ReportRange) => {
    setRange(next);
    try {
      localStorage.setItem(RANGE_KEY, JSON.stringify(next));
    } catch {
      /* preference just won't persist */
    }
  };
  const applyPreset = (p: RangePreset) => {
    if (p !== "custom") commit({ preset: p, ...presetRange(p) });
  };
  const onFromChange = (val: string) => {
    if (!val) return;
    const f = new Date(val);
    const t = new Date(range.to);
    const maxTo = new Date(f);
    maxTo.setFullYear(maxTo.getFullYear() + 1);
    commit({ preset: "custom", from: val, to: t > maxTo ? toISODate(maxTo) : t < f ? val : range.to });
  };
  const onToChange = (val: string) => {
    if (!val) return;
    const f = new Date(range.from);
    const t = new Date(val);
    const minFrom = new Date(t);
    minFrom.setFullYear(minFrom.getFullYear() - 1);
    commit({ preset: "custom", from: f > t ? val : f < minFrom ? toISODate(minFrom) : range.from, to: val });
  };
  return { ...range, applyPreset, onFromChange, onToChange };
}

const SALESMEN_KEY = "ov_report_salesmen";

/** Which salesmen the reports are limited to (none = all), remembered on this device. */
function useSalesmanFilter() {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SALESMEN_KEY);
      const saved = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(saved)) setSelected(saved.filter((n): n is string => typeof n === "string"));
    } catch {
      /* start with all salesmen */
    }
  }, []);
  const commit = (next: string[]) => {
    setSelected(next);
    try {
      localStorage.setItem(SALESMEN_KEY, JSON.stringify(next));
    } catch {
      /* preference just won't persist */
    }
  };
  const toggle = (name: string) => commit(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  const clear = () => commit([]);
  return { selected, toggle, clear };
}

/** Which chart views (tiles / bars) and how much colour opacity each report card uses; kept on this device. */
function useChartViews() {
  const [views, setViews] = useState<Record<ChartKey, ChartView>>(DEFAULT_VIEWS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REPORT_VIEWS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Record<ChartKey, Partial<ChartView>>>;
        // Merge per card so choices saved before opacity (or a newer card) existed still get a default.
        setViews(
          Object.fromEntries(
            CHART_KEYS.map((k) => {
              const v = { ...DEFAULT_VIEWS[k], ...saved[k] };
              return [k, { ...v, opacity: Math.min(100, Math.max(MIN_OPACITY, Number(v.opacity) || 100)) }];
            })
          ) as Record<ChartKey, ChartView>
        );
      }
    } catch {
      /* fall back to both views on */
    }
  }, []);
  const apply = (next: Record<ChartKey, ChartView>) => {
    setViews(next);
    try {
      localStorage.setItem(REPORT_VIEWS_KEY, JSON.stringify(next));
    } catch {
      /* preference just won't persist */
    }
  };
  // A card always keeps at least one view on.
  const withView = (cur: ChartView, which: ChartToggle, on: boolean): ChartView => {
    const next = { ...cur, [which]: on };
    if (!next.tiles && !next.bars) next[which === "tiles" ? "bars" : "tiles"] = true;
    return next;
  };
  const toggleView = (chart: ChartKey, which: ChartToggle) =>
    apply({ ...views, [chart]: withView(views[chart], which, !views[chart][which]) });
  const setOpacity = (chart: ChartKey, opacity: number) => apply({ ...views, [chart]: { ...views[chart], opacity } });
  const setAllOpacity = (opacity: number) =>
    apply(Object.fromEntries(CHART_KEYS.map((k) => [k, { ...views[k], opacity }])) as Record<ChartKey, ChartView>);
  const allOpacity = Math.round(CHART_KEYS.reduce((n, k) => n + views[k].opacity, 0) / CHART_KEYS.length);
  const toggleAll = (which: ChartToggle) => {
    const on = !CHART_KEYS.every((k) => views[k][which]);
    apply(Object.fromEntries(CHART_KEYS.map((k) => [k, withView(views[k], which, on)])) as Record<ChartKey, ChartView>);
  };
  return { views, toggleView, setOpacity, setAllOpacity, allOpacity, toggleAll };
}

const CHART_LABELS: Record<ChartKey, string> = { status: "Visit Status", outcome: "Outcome", city: "City Wise" };

/** One dropdown for everything that tunes the Dashboard: cards, date range, chart views and opacity. */
function AdjustViewPanel({
  cards,
  pickMode,
  pickedIds,
  onPickMode,
  onPick,
  onPickAll,
  onPickNone,
  showReports,
  chartViews,
  range,
  salesmen,
  selectedSalesmen,
  onToggleSalesman,
  onClearSalesmen,
  onDone,
}: {
  cards: { id: string; label: string }[];
  pickMode: boolean;
  pickedIds: string[];
  onPickMode: (on: boolean) => void;
  onPick: (id: string) => void;
  onPickAll: () => void;
  onPickNone: () => void;
  showReports: boolean;
  chartViews: ReturnType<typeof useChartViews>;
  range: ReturnType<typeof useReportRange>;
  salesmen: Salesman[];
  selectedSalesmen: string[];
  onToggleSalesman: (name: string) => void;
  onClearSalesmen: () => void;
  onDone: () => void;
}) {
  const { views, toggleView, setOpacity, setAllOpacity, allOpacity, toggleAll } = chartViews;
  const sortedSalesmen = [...salesmen].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div
      className="rounded-xl border bg-card p-3 space-y-3 shadow-sm"
      onKeyDown={(e) => { if (e.key === "Escape") onDone(); }}
    >
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold">Cards</h3>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            Show Only Selected Cards
            <Switch checked={pickMode} onCheckedChange={onPickMode} aria-label="Show only the cards I select" />
          </label>
        </div>
        {pickMode && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{pickedIds.length} Of {cards.length} Selected</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onPickAll}>All</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onPickNone}>None</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cards.map((c) => {
                const active = pickedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPick(c.id)}
                    aria-pressed={active}
                    className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition ${
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {c.label}
                  </button>
                );
              })}
            </div>
            {pickedIds.length === 0 && <p className="text-[10px] text-muted-foreground">No cards selected - pick at least one to see it on the Dashboard.</p>}
          </>
        )}
      </section>

      {showReports && (
        <>
          <section className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold">Salesmen</h3>
              {selectedSalesmen.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClearSalesmen}>Clear</Button>
              )}
            </div>
            {sortedSalesmen.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add salesmen in Settings to filter reports.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {sortedSalesmen.map((sm) => {
                  const active = selectedSalesmen.includes(sm.name);
                  return (
                    <button
                      key={sm.id}
                      type="button"
                      onClick={() => onToggleSalesman(sm.name)}
                      aria-pressed={active}
                      className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition ${
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {sm.name}
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
          </section>

          <section className="space-y-2 border-t pt-3">
            <h3 className="text-xs font-semibold">Date Range</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "quarterly"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={range.preset === p ? "default" : "outline"}
                  onClick={() => range.applyPreset(p)}
                  className="capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From">
                <Input type="date" value={range.from} max={range.to} onChange={(e) => range.onFromChange(e.target.value)} />
              </Field>
              <Field label="To">
                <Input type="date" value={range.to} min={range.from} max={toISODate(new Date())} onChange={(e) => range.onToChange(e.target.value)} />
              </Field>
            </div>
            <p className="text-[10px] text-muted-foreground">Max range: 1 year.</p>
          </section>

          <section className="space-y-2 border-t pt-3">
            <h3 className="text-xs font-semibold">Charts</h3>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="w-24 text-xs font-medium">All Charts</span>
              <OpacitySlider value={allOpacity} onChange={setAllOpacity} />
              <span className="flex items-center gap-1.5">
                <ViewChip label="Tiles" on={CHART_KEYS.every((k) => views[k].tiles)} onClick={() => toggleAll("tiles")} />
                <ViewChip label="Bars" on={CHART_KEYS.every((k) => views[k].bars)} onClick={() => toggleAll("bars")} />
              </span>
            </div>
            {CHART_KEYS.map((k) => (
              <div key={k} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="w-24 text-xs text-muted-foreground">{CHART_LABELS[k]}</span>
                <OpacitySlider value={views[k].opacity} onChange={(v) => setOpacity(k, v)} />
                <span className="flex items-center gap-1.5">
                  <ViewChip label="Tiles" on={views[k].tiles} onClick={() => toggleView(k, "tiles")} />
                  <ViewChip label="Bars" on={views[k].bars} onClick={() => toggleView(k, "bars")} />
                </span>
              </div>
            ))}
          </section>
        </>
      )}

      <div className="flex justify-end border-t pt-2">
        <Button size="sm" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

/* ---------------- Reports (embedded in Dashboard) ---------------- */
function ReportsPanels({
  visits,
  retailers,
  salesmen,
  views,
  from,
  to,
  selectedSalesmen,
}: {
  visits: Visit[];
  retailers: Retailer[];
  salesmen: Salesman[];
  views: Record<ChartKey, ChartView>;
  from: string;
  to: string;
  selectedSalesmen: string[];
}) {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);


  const sortedSalesmen = useMemo(
    () => [...salesmen].sort((a, b) => a.name.localeCompare(b.name)),
    [salesmen]
  );

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



  // Recovery and complaint visits are counted inside "Visits", so split them out to make the parts add up.
  const visitSegments = [
    {
      key: "Regular Visits",
      count: Math.max(0, activityCounts["Visits"] - activityCounts["Recovery Visits"] - activityCounts["Complaints Visits"]),
      bg: "bg-indigo-500",
    },
    { key: "Recovery Visits", count: activityCounts["Recovery Visits"], bg: "bg-amber-500" },
    { key: "Complaint Visits", count: activityCounts["Complaints Visits"], bg: "bg-rose-500" },
    { key: "Others Reasons", count: activityCounts["Others Reasons"], bg: "bg-slate-500" },
  ];

  const selectionSummary =
    selectedSalesmen.length === 0
      ? `All salesmen (${sortedSalesmen.length || 0})`
      : selectedSalesmen.length === 1
        ? selectedSalesmen[0]
        : `${selectedSalesmen.length} salesmen combined`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Reports &amp; Analysis</h3>
        <ExportCsvDialog visits={filtered} retailers={retailers} filenameHint={`${from}_to_${to}`} />
      </div>
      <div className="-mt-1 space-y-0.5 text-[10px] text-muted-foreground">
        <p className="flex items-start gap-1">
          <Users className="w-3 h-3 mt-px shrink-0" />
          <span>
            Salesmen:{" "}
            <b className="text-foreground">
              {selectedSalesmen.length ? selectedSalesmen.join(", ") : `All (${sortedSalesmen.length})`}
            </b>
          </span>
        </p>
        <p className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 shrink-0" /> {from} to {to} · {filtered.length} visits in range · change in Adjust View
        </p>
      </div>

      <CollapsibleSection compact title="Visit Status" badge={filtered.length} subtitle={selectionSummary}>
        <SegmentViews
          segments={visitSegments}
          view={views.status}
          footer={
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1.5 border-t text-[10px] text-muted-foreground">
              <span><b className="text-foreground tabular-nums">{activityCounts["City Visits"]}</b> Cities</span>
              <span><b className="text-foreground tabular-nums">{activityCounts["Areas Visited"]}</b> Areas</span>
              <span><b className="text-foreground tabular-nums">{activityCounts["Shops Visited"]}</b> Shops</span>
            </div>
          }
        />
      </CollapsibleSection>

      <CollapsibleSection compact title="Outcome" badge={filtered.length} subtitle={selectionSummary}>
        <SegmentViews
          segments={OUTCOMES.map((o) => ({ key: o, count: outcomeCounts[o], ...OUTCOME_SEG[o] }))}
          view={views.outcome}
        />
      </CollapsibleSection>

      <CollapsibleSection compact title="City wise Analysis" badge={filtered.length} subtitle={selectionSummary}>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" />Single Visit</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" />Multiple Visits</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-300" />Not Visited</span>
          <span className="text-muted-foreground">· Numbers: Retailers / Single / Multiple / Not Visited</span>
        </div>
        <CityViews
          rows={cityRows}
          view={views.city}
          onRemove={(city) => setSelectedCities((prev) => prev.filter((c) => c !== city))}
        />
        <div className="mt-2">
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
      </CollapsibleSection>
    </div>
  );
}


const STATUS_BAR: Record<VisitStatus, string> = {
  Visited: "bg-emerald-500",
  "Not Visited": "bg-rose-300",
  "No Update": "bg-slate-400",
  Holiday: "bg-amber-500",
};

// Full class names (not built from strings) so Tailwind picks them up.
const OUTCOME_SEG: Record<Outcome, { bg: string }> = {
  Satisfactory: { bg: "bg-teal-500" },
  Successful: { bg: "bg-emerald-600" },
  "Not Interested": { bg: "bg-pink-500" },
  "Meeting unsuccessful": { bg: "bg-orange-500" },
  "Not Met": { bg: "bg-slate-500" },
  Complaints: { bg: "bg-red-500" },
  "Linked to Other Company": { bg: "bg-violet-500" },
};

type ChartSegment = { key: string; count: number; bg: string };
/** Which views a report card shows, and how opaque the tile / bar colours are (percent). */
type ChartView = { tiles: boolean; bars: boolean; opacity: number };
type ChartToggle = "tiles" | "bars";
const MIN_OPACITY = 20;

function OpacitySlider({ value, onChange, label = "Opacity" }: { value: number; onChange: (v: number) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      {label}
      <input
        type="range"
        min={MIN_OPACITY}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} of chart colours`}
        className="h-1 w-20 cursor-pointer accent-primary"
      />
      <span className="w-7 tabular-nums text-foreground">{value}%</span>
    </label>
  );
}

function ViewChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
        on ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {on && <Check className="w-2.5 h-2.5" />}
      {label}
    </button>
  );
}

/**
 * Tiles (sized by share) and ranked bars for the same segments. Each can be switched off; when both
 * are on they split the width 50:50 (stacked on phones). Hovering either highlights the segment in both.
 */
function SegmentViews({
  segments,
  view,
  footer,
}: {
  segments: ChartSegment[];
  view: ChartView;
  footer?: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = segments.reduce((n, s) => n + s.count, 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const max = Math.max(1, ...segments.map((s) => s.count));
  const hover = (key: string | null) => ({ onPointerEnter: () => setActive(key), onPointerLeave: () => setActive(null) });
  const dim = (key: string) => (active !== null && active !== key ? "opacity-40" : "");

  const tiles = (
    <div className="flex flex-wrap content-start gap-1">
      {total === 0 && <p className="text-xs text-muted-foreground py-2">No visits in this range.</p>}
      {segments.filter((s) => s.count > 0).map((s) => (
        <div
          key={s.key}
          {...hover(s.key)}
          onClick={() => setActive((k) => (k === s.key ? null : s.key))}
          title={`${s.key}: ${s.count} (${pct(s.count)}%)`}
          style={{ flex: `${s.count} 1 76px` }}
          className={`relative isolate flex min-h-[46px] cursor-pointer flex-col justify-between overflow-hidden rounded-lg px-2 py-1.5 transition ${
            view.opacity >= 75 ? "text-white" : "text-foreground"
          } ${dim(s.key)} ${active === s.key ? "ring-2 ring-foreground/40" : ""}`}
        >
          <span aria-hidden className={`absolute inset-0 -z-10 ${s.bg}`} style={{ opacity: view.opacity / 100 }} />
          <span className="text-[10px] leading-tight">{s.key}</span>
          <span className="text-sm font-semibold leading-none tabular-nums">
            {s.count} <span className="text-[10px] font-normal opacity-90">{pct(s.count)}%</span>
          </span>
        </div>
      ))}
    </div>
  );

  const bars = (
    <ul className="space-y-1.5">
      {[...segments].sort((x, y) => y.count - x.count).map((s) => (
        <li key={s.key} {...hover(s.key)} className={`rounded px-1 transition ${dim(s.key)} ${active === s.key ? "bg-muted" : ""}`}>
          <div className="flex items-baseline justify-between gap-2 text-[11px] leading-4">
            <span className="min-w-0 truncate">{s.key}</span>
            <span className="shrink-0">
              <b className="font-semibold tabular-nums">{s.count}</b>{" "}
              <span className="text-muted-foreground tabular-nums">{pct(s.count)}%</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${s.bg}`} style={{ width: `${(s.count / max) * 100}%`, opacity: view.opacity / 100 }} />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-1.5">
      <div className={`grid gap-3 ${view.tiles && view.bars ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {view.tiles && tiles}
        {view.bars && bars}
      </div>
      {footer}
    </div>
  );
}

type CityRow = { city: string; permanent: boolean; retailers: number; single: number; multiple: number; notVisited: number };

/**
 * City wise tiles (sized by retailer count) and ranked bars (longest = most retailers), each split into
 * single / multiple / not-visited retailers. Same 50:50 layout, toggles and opacity as the other report cards.
 */
function CityViews({ rows, view, onRemove }: { rows: CityRow[]; view: ChartView; onRemove: (city: string) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const ranked = [...rows].sort((a, b) => b.retailers - a.retailers);
  const max = Math.max(1, ...rows.map((r) => r.retailers));
  const hover = (key: string) => ({ onPointerEnter: () => setActive(key), onPointerLeave: () => setActive(null) });
  const dim = (key: string) => (active !== null && active !== key ? "opacity-40" : "");
  const detail = (r: CityRow) => `${r.city}: ${r.retailers} retailers · ${r.single} single · ${r.multiple} multiple · ${r.notVisited} not visited`;
  const share = (n: number, r: CityRow) => `${(n / (r.retailers || 1)) * 100}%`;

  const split = (r: CityRow) => (
    <>
      <div className="h-full bg-yellow-400" style={{ width: share(r.single, r) }} />
      <div className="h-full bg-green-400" style={{ width: share(r.multiple, r) }} />
      <div className="h-full bg-red-300" style={{ width: share(r.notVisited, r) }} />
    </>
  );
  const removeBtn = (r: CityRow) =>
    !r.permanent && (
      <button
        type="button"
        onClick={() => onRemove(r.city)}
        className="shrink-0 opacity-70 hover:opacity-100"
        aria-label={`Remove ${r.city}`}
      >
        <X className="w-3 h-3" />
      </button>
    );

  const tiles = (
    <div className="flex flex-wrap content-start gap-1">
      {ranked.map((r) => (
        <div
          key={r.city}
          {...hover(r.city)}
          onClick={() => setActive((k) => (k === r.city ? null : r.city))}
          title={detail(r)}
          style={{ flex: `${Math.max(r.retailers, 0.5)} 1 76px` }}
          className={`relative isolate flex min-h-[58px] cursor-pointer flex-col justify-between overflow-hidden rounded-lg px-2 py-1.5 transition ${
            view.opacity >= 75 ? "text-white" : "text-foreground"
          } ${dim(r.city)} ${active === r.city ? "ring-2 ring-foreground/40" : ""}`}
        >
          <span aria-hidden className={`absolute inset-0 -z-10 ${r.retailers ? "bg-sky-600" : "bg-slate-400"}`} style={{ opacity: view.opacity / 100 }} />
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] leading-tight">{r.city}</span>
            {removeBtn(r)}
          </div>
          <span className="text-sm font-semibold leading-none tabular-nums">
            {r.retailers} <span className="text-[10px] font-normal opacity-90">retailers</span>
          </span>
          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-foreground/10">{split(r)}</div>
        </div>
      ))}
    </div>
  );

  const bars = (
    <ul className="space-y-1.5">
      {ranked.map((r) => (
        <li key={r.city} {...hover(r.city)} title={detail(r)} className={`rounded px-1 transition ${dim(r.city)} ${active === r.city ? "bg-muted" : ""}`}>
          <div className="flex items-baseline justify-between gap-2 text-[11px] leading-4">
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate">{r.city}</span>
              {removeBtn(r)}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums">
              <b className="text-blue-600 dark:text-blue-400">{r.retailers}</b>
              <span className="text-yellow-600 dark:text-yellow-400">{r.single}</span>/
              <span className="text-green-600 dark:text-green-400">{r.multiple}</span>/
              <span className="text-red-600 dark:text-red-400">{r.notVisited}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(r.retailers / max) * 100}%`, opacity: view.opacity / 100 }}>
              {split(r)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`grid gap-3 ${view.tiles && view.bars ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      {view.tiles && tiles}
      {view.bars && bars}
    </div>
  );
}

/* ---------------- Planner ---------------- */
function toISODateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Planner({
  retailers,
  salesmen,
  currentUser,
  allowed,
}: {
  retailers: Retailer[];
  salesmen: Salesman[];
  currentUser?: AppUser | null;
  allowed: (p: string) => boolean;
}) {
  const isScoped = !!currentUser && isScopedRole(currentUser.role);
  const linkedSalesmen = isScoped
    ? salesmen.filter((s) => (currentUser?.salesmanIds ?? []).includes(s.id))
    : salesmen;

  const [salesmanId, setSalesmanId] = useState<string>(linkedSalesmen[0]?.id ?? "");
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<"create" | "view" | "past-empty">("create");
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPlans(store.getPlans());
  }, []);

  useEffect(() => {
    if (!salesmanId && linkedSalesmen[0]) setSalesmanId(linkedSalesmen[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedSalesmen.map((s) => s.id).join(",")]);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const selectedDateStr = toISODateStr(selectedDate);
  const isPast = selectedDate < todayStart;

  const salesmanRetailers = useMemo(
    () => retailers.filter((r) => r.salesmanId === salesmanId).sort((a, b) => a.name.localeCompare(b.name)),
    [retailers, salesmanId]
  );

  const filteredRetailers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salesmanRetailers;
    return salesmanRetailers.filter((r) => [r.name, r.city, r.area].some((s) => (s || "").toLowerCase().includes(q)));
  }, [salesmanRetailers, search]);

  const planFor = (date: string, sId: string, list: VisitPlan[] = plans) => list.find((p) => p.date === date && p.salesmanId === sId);

  const modeFor = (dateStr: string, sId: string, past: boolean, list: VisitPlan[] = plans): typeof mode => {
    const existing = planFor(dateStr, sId, list);
    if (existing) return "view";
    return past ? "past-empty" : "create";
  };

  const applyDateSelection = (d: Date | undefined, sId: string) => {
    if (!d) return;
    const dateStr = toISODateStr(d);
    if (dateStr === toISODateStr(selectedDate) && sId === salesmanId) return;
    setSelectedDate(d);
    setDraftIds([]);
    setSearch("");
    const past = d < todayStart;
    setMode(modeFor(dateStr, sId, past));
  };

  const handleSelectDate = (d: Date | undefined) => applyDateSelection(d, salesmanId);

  const handleSelectSalesman = (id: string) => {
    setSalesmanId(id);
    setDraftIds([]);
    setMode(modeFor(selectedDateStr, id, isPast));
  };

  const toggleRetailer = (retailerId: string) => {
    if (mode !== "create" || isPast || !salesmanId) return;
    const next = draftIds.includes(retailerId) ? draftIds.filter((id) => id !== retailerId) : [...draftIds, retailerId];
    setDraftIds(next);

    const all = store.getPlans();
    const existingIdx = all.findIndex((p) => p.date === selectedDateStr && p.salesmanId === salesmanId);
    let nextAll: VisitPlan[];
    if (next.length === 0) {
      nextAll = existingIdx === -1 ? all : all.filter((_, i) => i !== existingIdx);
    } else if (existingIdx === -1) {
      nextAll = [
        { id: uid(), date: selectedDateStr, salesmanId, retailerIds: next, status: {}, createdAt: new Date().toISOString(), createdByUserId: currentUser?.id },
        ...all,
      ];
    } else {
      nextAll = all.map((p, i) => (i === existingIdx ? { ...p, retailerIds: next } : p));
    }
    store.setPlans(nextAll);
    setPlans(nextAll);
  };

  /** Mutates the currently-selected plan (date + salesman). Removes the plan entirely if it ends up with no retailers. */
  const updateCurrentPlan = (updater: (p: VisitPlan) => VisitPlan | null) => {
    const all = store.getPlans();
    const idx = all.findIndex((p) => p.date === selectedDateStr && p.salesmanId === salesmanId);
    if (idx === -1) return;
    const updated = updater(all[idx]);
    const nextAll = updated ? all.map((p, i) => (i === idx ? updated : p)) : all.filter((_, i) => i !== idx);
    store.setPlans(nextAll);
    setPlans(nextAll);
    if (!updated) setMode(isPast ? "past-empty" : "create");
  };

  const markDone = (retailerId: string) =>
    updateCurrentPlan((p) => ({ ...p, status: { ...p.status, [retailerId]: { doneAt: new Date().toISOString() } } }));

  const markMissed = (retailerId: string) =>
    updateCurrentPlan((p) => ({ ...p, status: { ...p.status, [retailerId]: { missed: true } } }));

  const deleteFromPlan = (retailerId: string) =>
    updateCurrentPlan((p) => {
      const nextIds = p.retailerIds.filter((id) => id !== retailerId);
      if (nextIds.length === 0) return null;
      const nextStatus = { ...p.status };
      delete nextStatus[retailerId];
      return { ...p, retailerIds: nextIds, status: nextStatus };
    });

  const currentPlan = mode === "view" ? planFor(selectedDateStr, salesmanId) : undefined;

  const plannedDates = useMemo(
    () => new Set(plans.filter((p) => p.salesmanId === salesmanId).map((p) => p.date)),
    [plans, salesmanId]
  );

  if (!allowed("module.planner")) return null;

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-semibold flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-muted-foreground" /> Visit Planner
      </h2>

      {linkedSalesmen.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">No salesman linked</p>
          <p className="text-xs text-muted-foreground mt-1">Ask an administrator to link a salesman to your account.</p>
        </div>
      ) : (
        <>
          {linkedSalesmen.length > 1 && (
            <Field label="Salesman">
              <Select value={salesmanId} onValueChange={handleSelectSalesman}>
                <SelectTrigger><SelectValue placeholder="Select salesman" /></SelectTrigger>
                <SelectContent>
                  {linkedSalesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="bg-card border rounded-2xl p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={(d) => d < todayStart && !plannedDates.has(toISODateStr(d))}
              className="w-full"
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full",
                table: "w-full",
                month_grid: "w-full border-collapse",
                weekdays: "flex w-full",
                week: "flex w-full mt-0.5",
              }}
              style={{ ["--cell-size" as string]: "2.75rem" }}
              modifiers={{ planned: (d) => plannedDates.has(toISODateStr(d)) }}
              modifiersClassNames={{ planned: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
            />
          </div>

          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold">
                {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </h3>
              {mode === "view" && <Badge variant="secondary" className="text-[10px]">Saved</Badge>}
            </div>

            {mode === "past-empty" ? (
              <p className="text-xs text-muted-foreground py-6 text-center">This date has passed — no plan was set.</p>
            ) : mode === "view" && currentPlan ? (
              <>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {currentPlan.retailerIds.length} retailer{currentPlan.retailerIds.length === 1 ? "" : "s"} planned
                  {isPast ? " · this date has passed" : " · check off as you complete each visit"}
                </p>
                <ul className="divide-y">
                  {currentPlan.retailerIds.map((id) => {
                    const r = retailers.find((x) => x.id === id);
                    const st = currentPlan.status?.[id];
                    const overduePending = isPast && !st?.doneAt && !st?.missed;
                    return (
                      <li key={id} className="py-2.5">
                        <div className="flex items-center gap-3">
                          {st?.doneAt ? (
                            <Checkbox checked disabled />
                          ) : st?.missed ? (
                            <span className="flex h-4 w-4 items-center justify-center shrink-0">
                              <X className="w-4 h-4 text-rose-500" />
                            </span>
                          ) : overduePending ? (
                            <span className="w-4 shrink-0" />
                          ) : (
                            <Checkbox checked={false} onCheckedChange={() => markDone(id)} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{r?.name ?? "Unknown retailer"}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{[r?.area, r?.city].filter(Boolean).join(" · ")}</div>
                          </div>
                          {st?.doneAt && (
                            <div className="text-[10px] text-muted-foreground text-right shrink-0 leading-tight">
                              {new Date(st.doneAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}<br />{new Date(st.doneAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            </div>
                          )}
                          {st?.missed && (
                            <div className="text-[10px] text-rose-500 text-right shrink-0">Missed</div>
                          )}
                        </div>
                        {overduePending && (
                          <div className="flex items-center gap-1.5 mt-2 pl-7 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" onClick={() => markDone(id)}>Check now</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-[11px] text-rose-600 hover:text-rose-600" onClick={() => markMissed(id)}>Missed</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-[11px] text-destructive hover:text-destructive" onClick={() => deleteFromPlan(id)}>Delete</Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : salesmanRetailers.length === 0 ? (
              <EmptyHint text="No retailers assigned to this salesman yet." />
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Check the retailers to visit on this date — saved automatically as you go.
                </p>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search retailers..." className="pl-9 h-9" />
                </div>
                <ul className="divide-y max-h-96 overflow-y-auto">
                  {filteredRetailers.map((r) => (
                    <li key={r.id}>
                      <label className="py-2.5 flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox checked={draftIds.includes(r.id)} onCheckedChange={() => toggleRetailer(r.id)} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{[r.area, r.city].filter(Boolean).join(" · ")}</div>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
                {draftIds.length > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {draftIds.length} selected · plan saved
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Retailers ---------------- */
const MAX_PIN_ATTEMPTS = 3;

/** Asks for a Super User PIN twice in a row (the same Super User both times) before calling onConfirmed. */
function SuperUserPinDialog({
  open,
  title,
  description,
  onCancel,
  onConfirmed,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [firstMatch, setFirstMatch] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) return;
    setStep(1);
    setPin("");
    setFirstMatch(null);
    setError("");
    setAttempts(0);
  }, [open]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const match = await matchSuperUserPin(pin, store.getSettings().pinHash);
    setBusy(false);
    const ok = match !== null && (step === 1 || match === firstMatch);
    if (!ok) {
      const used = attempts + 1;
      if (used >= MAX_PIN_ATTEMPTS) {
        toast.error("Too many wrong PIN attempts. Nothing was deleted.");
        onCancel();
        return;
      }
      setAttempts(used);
      setPin("");
      setError(
        step === 2 && match !== null
          ? "That PIN belongs to a different Super User. Use the same one."
          : `Wrong Super User PIN. ${MAX_PIN_ATTEMPTS - used} attempt${MAX_PIN_ATTEMPTS - used === 1 ? "" : "s"} left.`
      );
      return;
    }
    setError("");
    setPin("");
    if (step === 1) {
      setFirstMatch(match);
      setStep(2);
    } else {
      onConfirmed();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2">
          <Label htmlFor="su-pin" className="text-xs">
            {step === 1 ? "Step 1 of 2 - Enter Super User PIN" : "Step 2 of 2 - Enter Super User PIN Again To Confirm"}
          </Label>
          <Input
            key={step}
            id="su-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 4) void submit(); }}
            placeholder="4-digit PIN"
            className="text-center tracking-[0.5em]"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant={step === 2 ? "destructive" : "default"} disabled={pin.length !== 4 || busy} onClick={() => void submit()}>
            {step === 1 ? "Continue" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Retailers({
  retailers,
  salesmen,
  refresh,
  currentUser,
  allowed,
}: {
  retailers: Retailer[];
  salesmen: Salesman[];
  refresh: () => void;
  currentUser?: AppUser | null;
  allowed: (p: string) => boolean;
}) {
  const isPrivileged = !currentUser || !isScopedRole(currentUser.role);
  const canBulkDelete = allowed("retailer.bulkDelete");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    store.setRetailers(store.getRetailers().filter((r) => r.id !== id));
    refresh();
  };

  // Only retailers this user can actually see may be selected or deleted.
  const visibleIds = useMemo(() => new Set(retailers.map((r) => r.id)), [retailers]);
  const selectedIds = selected.filter((id) => visibleIds.has(id));
  const filteredIds = filtered.map((r) => r.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleMany = (ids: string[], on: boolean) =>
    setSelected((prev) => (on ? Array.from(new Set([...prev, ...ids])) : prev.filter((x) => !ids.includes(x))));
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const bulkDelete = () => {
    const ids = new Set(selectedIds);
    store.setRetailers(store.getRetailers().filter((r) => !ids.has(r.id)));
    toast.success(`Deleted ${ids.size} retailer${ids.size === 1 ? "" : "s"}`);
    setConfirmOpen(false);
    exitSelectMode();
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
          {canBulkDelete && (
            <Button
              size="sm"
              className="min-h-10 px-2.5 sm:px-3"
              variant={selectMode ? "secondary" : "outline"}
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? <X className="w-4 h-4 sm:mr-1" /> : <ListChecks className="w-4 h-4 sm:mr-1" />}
              <span className="hidden sm:inline">{selectMode ? "Cancel" : "Select"}</span>
            </Button>
          )}
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

      {selectMode && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card p-2.5 shadow-sm">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => toggleMany(filteredIds, !allFilteredSelected)}>
            {allFilteredSelected ? "Deselect All" : `Select All (${filteredIds.length})`}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="ml-auto h-8"
            disabled={selectedIds.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}

      <SuperUserPinDialog
        open={confirmOpen}
        title={`Delete ${selectedIds.length} Retailer${selectedIds.length === 1 ? "" : "s"}?`}
        description="This permanently removes the selected retailers and cannot be undone. A Super User must enter their PIN twice to authorize it."
        onCancel={() => setConfirmOpen(false)}
        onConfirmed={bulkDelete}
      />

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
            const groupIds = g.items.map((r) => r.id);
            const groupSelected = groupIds.filter((id) => selectedIds.includes(id)).length;
            return (
              <li key={g.key} className="bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex items-center transition-colors hover:bg-muted/50">
                  {selectMode && (
                    <Checkbox
                      className="ml-3 shrink-0"
                      aria-label={`Select all retailers of ${g.label}`}
                      checked={groupSelected === groupIds.length ? true : groupSelected > 0 ? "indeterminate" : false}
                      onCheckedChange={(c) => toggleMany(groupIds, c === true)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.key)}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 p-3 text-left"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      <InitialAvatar name={g.label} className="h-7 w-7 text-[11px]" />
                      <span className="text-sm font-medium truncate">{g.label}</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{g.items.length}</Badge>
                  </button>
                </div>

                {isOpen && (
                  <ul className="border-t divide-y">
                    {g.items.map((r) => (
                      <li key={r.id} className="px-3 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 transition-colors hover:bg-muted/30 lg:flex lg:items-center lg:py-2">
                        <div className="min-w-0 flex-1 flex items-start gap-2.5">
                          {selectMode && (
                            <Checkbox
                              className="mt-2.5 shrink-0"
                              aria-label={`Select ${r.name}`}
                              checked={selectedIds.includes(r.id)}
                              onCheckedChange={() => toggleOne(r.id)}
                            />
                          )}
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


/* ---------------- Products ---------------- */
/** Capitalises the first letter of every word ("lens type" -> "Lens Type"), leaving the rest as typed. */
function titleCase(s: string) {
  return s.trim().replace(/\s+/g, " ").replace(/(^|[\s/(-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());
}

/** Built-in categories first, then user-added ones, then any a product already uses (e.g. synced from another device). */
function mergeCategories(defaults: readonly string[], custom: string[], used: string[]) {
  const out = [...defaults];
  [...custom, ...used].forEach((c) => {
    if (c && !out.some((x) => x.toLowerCase() === c.toLowerCase())) out.push(c);
  });
  return out;
}

const ADD_NEW_CATEGORY = "__add_new_category__";

function CategorySelect({
  label,
  value,
  options,
  onChange,
  onAdd,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  /** Persists a new category and returns the name to select (an existing match if it was a duplicate). */
  onAdd: (name: string) => string;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // The Select hands focus back to its trigger as it closes, so focus the input after that.
  useEffect(() => {
    if (!adding) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [adding]);

  const commit = () => {
    const clean = titleCase(name);
    if (!clean) return toast.error("Enter a category name");
    onChange(onAdd(clean));
    setName("");
    setAdding(false);
  };

  return (
    <Field label={label}>
      <Select value={value} onValueChange={(v) => (v === ADD_NEW_CATEGORY ? setAdding(true) : onChange(v))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          <SelectItem value={ADD_NEW_CATEGORY} className="font-medium text-primary">
            <span className="inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add New Category</span>
          </SelectItem>
        </SelectContent>
      </Select>
      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder="New Category Name"
          />
          <Button type="button" size="sm" onClick={commit}>Add</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setName(""); }}>Cancel</Button>
        </div>
      )}
    </Field>
  );
}

function Products({
  products,
  currentUser,
  allowed,
  refresh,
}: {
  products: Product[];
  currentUser?: AppUser | null;
  allowed: (p: string) => boolean;
  refresh: () => void;
}) {
  const isPrivileged = !currentUser || !isScopedRole(currentUser.role);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>(LENS_MAIN_CATEGORIES.slice(0, 1));
  const [custom, setCustom] = useState<CustomCategories>(() => store.getCustomCategories());
  const mainCategories = useMemo(
    () => mergeCategories(LENS_MAIN_CATEGORIES, custom.main, products.map((p) => p.mainCategory)),
    [custom.main, products]
  );
  const subCategories = useMemo(
    () => mergeCategories(LENS_MATERIALS, custom.sub, products.map((p) => p.subCategory)),
    [custom.sub, products]
  );
  const saveCustom = (next: CustomCategories) => {
    store.setCustomCategories(next);
    setCustom(next);
  };

  const canCreate = allowed("product.create");
  const canEdit = (p: Product) => allowed("product.edit") || (isPrivileged === false && p.addedByUserId === currentUser?.id);
  const canDelete = (p: Product) => allowed("product.delete") || (isPrivileged === false && p.addedByUserId === currentUser?.id);

  const filtered = products
    .filter((p) => (categoryFilter === "all" ? true : p.mainCategory === categoryFilter))
    .filter((p) =>
      [p.name, p.brand, p.sku, p.subCategory, p.normalCategory].some((s) => (s || "").toLowerCase().includes(q.toLowerCase()))
    );

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Product[] }[] = [];
    mainCategories.forEach((cat) => {
      const items = filtered.filter((p) => p.mainCategory === cat).sort((a, b) => a.name.localeCompare(b.name));
      if (items.length) out.push({ key: cat, label: cat, items });
    });
    return out;
  }, [filtered, mainCategories]);

  const toggleGroup = (k: string) =>
    setOpenGroups((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const remove = (id: string) => {
    if (!confirm("Delete this product?")) return;
    store.setProducts(store.getProducts().filter((p) => p.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-1.5"><Package className="w-4 h-4 text-muted-foreground" /> Products</h2>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="min-h-10"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
            <ProductDialog
              currentUser={currentUser}
              mainCategories={mainCategories}
              subCategories={subCategories}
              custom={custom}
              onCustomChange={saveCustom}
              onSaved={() => { refresh(); setOpen(false); }}
            />
          </Dialog>
        )}
      </div>

      <Input placeholder="Search by name, brand, SKU, material or coating..." value={q} onChange={(e) => setQ(e.target.value)} />

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger><SelectValue placeholder="Filter by Lens Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lens Types</SelectItem>
          {mainCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      {groups.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">{products.length ? "No matches" : "No products yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {products.length ? "Try a different search or filter." : "Tap \"Add\" above to record your first lens product."}
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
                  <span className="flex items-center gap-2 min-w-0">
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    <span className="text-sm font-medium truncate">{g.label}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{g.items.length}</Badge>
                </button>

                {isOpen && (
                  <ul className="border-t divide-y">
                    {g.items.map((p) => {
                      const isExp = expanded.includes(p.id);
                      return (
                        <li key={p.id} className="transition-colors hover:bg-muted/30">
                          <button
                            type="button"
                            onClick={() => toggleExpand(p.id)}
                            className="w-full px-3 py-3 flex items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-medium truncate">{p.name}</span>
                                {p.brand && <span className="text-xs text-muted-foreground truncate">{p.brand}</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <Badge variant="secondary" className="text-[10px]">{p.subCategory}</Badge>
                                <Badge variant="secondary" className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">{p.normalCategory}</Badge>
                                {p.price !== undefined && <span className="text-xs font-medium">Rs {p.price}</span>}
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 shrink-0 mt-1 text-muted-foreground transition-transform ${isExp ? "rotate-180" : ""}`} />
                          </button>

                          {isExp && (
                            <div className="px-3 pb-3 -mt-1">
                              <div className="rounded-xl border bg-muted/30 p-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                {p.index && <Detail label="Index" value={p.index} />}
                                {p.powerRange && <Detail label="Power Range" value={p.powerRange} />}
                                {p.baseCurve && <Detail label="Base Curve" value={p.baseCurve} />}
                                {p.diameter && <Detail label="Diameter" value={p.diameter} />}
                                {p.color && <Detail label="Color / Tint" value={p.color} />}
                                {p.sku && <Detail label="SKU" value={p.sku} />}
                                {p.stock !== undefined && <Detail label="Stock" value={String(p.stock)} />}
                                {p.supplier && <Detail label="Supplier" value={p.supplier} />}
                                {p.warranty && <Detail label="Warranty" value={p.warranty} />}
                                {p.addedByName && <Detail label="Added By" value={p.addedByName} />}
                                {p.notes && (
                                  <div className="col-span-2">
                                    <div className="text-muted-foreground">Notes</div>
                                    <div className="mt-0.5">{p.notes}</div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {canEdit(p) && (
                                  <Dialog open={editing?.id === p.id} onOpenChange={(o) => setEditing(o ? p : null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 text-xs"><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                                    </DialogTrigger>
                                    {editing?.id === p.id && (
                                      <ProductDialog
                                        currentUser={currentUser}
                                        initial={p}
                                        mainCategories={mainCategories}
                                        subCategories={subCategories}
                                        custom={custom}
                                        onCustomChange={saveCustom}
                                        onSaved={() => { refresh(); setEditing(null); }}
                                      />
                                    )}
                                  </Dialog>
                                )}
                                {canDelete(p) && (
                                  <Button variant="outline" size="sm" className="h-8 text-xs text-destructive" onClick={() => remove(p.id)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ProductDialog({
  onSaved,
  initial,
  currentUser,
  mainCategories,
  subCategories,
  custom,
  onCustomChange,
}: {
  onSaved: () => void;
  initial?: Product;
  currentUser?: AppUser | null;
  mainCategories: string[];
  subCategories: string[];
  custom: CustomCategories;
  onCustomChange: (next: CustomCategories) => void;
}) {
  const [f, setF] = useState<Omit<Product, "id" | "createdAt" | "addedByUserId" | "addedByName">>(
    initial
      ? {
          name: initial.name,
          brand: initial.brand,
          mainCategory: initial.mainCategory,
          subCategory: initial.subCategory,
          normalCategory: initial.normalCategory,
          index: initial.index ?? "",
          powerRange: initial.powerRange ?? "",
          baseCurve: initial.baseCurve ?? "",
          diameter: initial.diameter ?? "",
          color: initial.color ?? "",
          price: initial.price,
          stock: initial.stock,
          sku: initial.sku ?? "",
          supplier: initial.supplier ?? "",
          warranty: initial.warranty ?? "",
          notes: initial.notes ?? "",
        }
      : {
          name: "",
          brand: "",
          mainCategory: "Single Vision",
          subCategory: "CR-39",
          normalCategory: "Regular (No Coating)",
          index: "",
          powerRange: "",
          baseCurve: "",
          diameter: "",
          color: "",
          price: undefined,
          stock: undefined,
          sku: "",
          supplier: "",
          warranty: "",
          notes: "",
        }
  );

  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const addCategory = (kind: "main" | "sub") => (name: string) => {
    const existing = (kind === "main" ? mainCategories : subCategories).find((c) => c.toLowerCase() === name.toLowerCase());
    if (existing) {
      toast.info(`"${existing}" already exists`);
      return existing;
    }
    onCustomChange({ ...custom, [kind]: [...custom[kind], name] });
    toast.success(`Category "${name}" added`);
    return name;
  };

  const save = () => {
    if (!f.name.trim()) return toast.error("Product name is required");
    if (initial) {
      store.setProducts(store.getProducts().map((p) => (p.id === initial.id ? { ...p, ...f } : p)));
      toast.success("Product updated");
    } else {
      store.setProducts([
        {
          id: uid(),
          ...f,
          createdAt: new Date().toISOString(),
          addedByUserId: currentUser?.id,
          addedByName: currentUser?.name,
        },
        ...store.getProducts(),
      ]);
      toast.success("Product added");
    }
    onSaved();
  };

  return (
    <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit Product" : "Add Lens Product"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Field label="Product Name"><Input value={f.name} onChange={upd("name")} placeholder="e.g. Varilux Comfort" /></Field>
        <Field label="Brand"><Input value={f.brand} onChange={upd("brand")} placeholder="e.g. Essilor" /></Field>

        <CategorySelect
          label="Main Category - Lens Type"
          value={f.mainCategory}
          options={mainCategories}
          onChange={(v) => setF((prev) => ({ ...prev, mainCategory: v }))}
          onAdd={addCategory("main")}
        />
        <CategorySelect
          label="Sub Category - Material"
          value={f.subCategory}
          options={subCategories}
          onChange={(v) => setF((prev) => ({ ...prev, subCategory: v }))}
          onAdd={addCategory("sub")}
        />
        <Field label="Normal Category - Coating">
          <Select value={f.normalCategory} onValueChange={(v) => setF({ ...f, normalCategory: v as LensCoating })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LENS_COATINGS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Refractive Index"><Input value={f.index} onChange={upd("index")} placeholder="1.56" /></Field>
          <Field label="Base Curve"><Input value={f.baseCurve} onChange={upd("baseCurve")} placeholder="e.g. 6" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Power Range"><Input value={f.powerRange} onChange={upd("powerRange")} placeholder="-6.00 to +4.00" /></Field>
          <Field label="Diameter (mm)"><Input value={f.diameter} onChange={upd("diameter")} placeholder="70" /></Field>
        </div>
        <Field label="Color / Tint"><Input value={f.color} onChange={upd("color")} placeholder="Clear, Brown, Grey..." /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (Rs)">
            <Input
              type="number"
              value={f.price ?? ""}
              onChange={(e) => setF({ ...f, price: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </Field>
          <Field label="Stock Quantity">
            <Input
              type="number"
              value={f.stock ?? ""}
              onChange={(e) => setF({ ...f, stock: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU / Code"><Input value={f.sku} onChange={upd("sku")} /></Field>
          <Field label="Warranty"><Input value={f.warranty} onChange={upd("warranty")} placeholder="e.g. 1 year" /></Field>
        </div>
        <Field label="Supplier"><Input value={f.supplier} onChange={upd("supplier")} /></Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={upd("notes")} rows={2} /></Field>
      </div>
      <DialogFooter><Button className="w-full" onClick={save}>{initial ? "Save Changes" : "Save Product"}</Button></DialogFooter>
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

const THEME_GROUPS = [
  { id: "all", label: "All themes" },
  { id: "light", label: "Light themes" },
  { id: "dark", label: "Dark themes" },
] as const;

const CLASSIC_VALUE = "classic";

function ThemePanel() {
  const userId = accessStore.getCurrentUserId();
  const [theme, setLocalTheme] = useState<AppTheme>(defaultTheme);
  const [themeGroup, setThemeGroup] = useState<string>("all");

  useEffect(() => {
    setLocalTheme(getTheme(userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const update = (patch: Partial<AppTheme>) => {
    const next = { ...theme, ...patch };
    setLocalTheme(next);
    setTheme(userId, next);
  };

  const visiblePresets = THEME_PRESETS.filter((p) => themeGroup === "all" || p.mode === themeGroup);

  return (
    <section className="bg-card border rounded-2xl overflow-hidden">
      <div className="ov-toolbar px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-current">Appearance</h3>
          <p className="text-[11px] opacity-85">Your own theme &amp; icon pack — independent of other users</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-current hover:bg-white/15"
          onClick={() => update({ preset: "", background: "", card: "", font: "", accent: "", iconPack: DEFAULT_ICON_PACK, iconPackEnabled: true })}
        >
          Reset
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium">Theme</Label>
            <Select value={themeGroup} onValueChange={setThemeGroup}>
              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEME_GROUPS.map((g) => <SelectItem key={g.id} value={g.id} className="text-xs">{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={theme.preset || CLASSIC_VALUE}
            onValueChange={(v) => update({ preset: v === CLASSIC_VALUE ? "" : v })}
          >
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select a theme" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={CLASSIC_VALUE} className="text-xs">Classic · App default</SelectItem>
              {THEME_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} · {p.mood}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(themeGroup === "all" || themeGroup === "light") && (
              <ThemeCard
                name="Classic"
                mood="App default"
                swatches={["linear-gradient(100deg, oklch(0.34 0.11 258), oklch(0.46 0.13 226))", "oklch(0.975 0.004 220)", "oklch(0.33 0.10 255)", "oklch(1 0 0)"]}
                active={!theme.preset}
                onClick={() => update({ preset: "" })}
              />
            )}
            {visiblePresets.map((p) => (
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Label className="text-xs font-medium">Icon pack</Label>
              <p className="text-[11px] text-muted-foreground">Icon color and style, independent of the theme above</p>
            </div>
            <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
              <span className="text-[11px] text-muted-foreground">{theme.iconPackEnabled ? "On" : "Off"}</span>
              <Switch checked={theme.iconPackEnabled} onCheckedChange={(v) => update({ iconPackEnabled: v })} />
            </label>
          </div>
          {theme.iconPackEnabled && (
            <>
              <Select value={theme.iconPack || DEFAULT_ICON_PACK} onValueChange={(v) => update({ iconPack: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select an icon pack" /></SelectTrigger>
                <SelectContent>
                  {ICON_PACKS.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id} className="text-xs">{pack.name} · {pack.mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {ICON_PACKS.map((pack) => (
                  <IconPackCard
                    key={pack.id}
                    pack={pack}
                    active={(theme.iconPack || DEFAULT_ICON_PACK) === pack.id}
                    onClick={() => update({ iconPack: pack.id })}
                  />
                ))}
              </div>
            </>
          )}
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

function IconPackCard({
  pack,
  active,
  onClick,
}: {
  pack: IconPack;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={pack.mood}
      className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition hover:shadow-md ${active ? "ring-2 ring-ring border-transparent" : ""}`}
    >
      <span className={`flex h-7 w-7 items-center justify-center ${pack.chipClass}`}>
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <span className="text-[10px] font-medium leading-tight text-center truncate w-full">{pack.name}</span>
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
  const [recentDays, setRecentDays] = useState(String(store.getSettings().recentVisitsDays ?? 3));
  const [recentLimit, setRecentLimit] = useState(String(store.getSettings().recentVisitsLimit ?? 30));

  const saveRecentVisitsConfig = () => {
    const days = Math.max(1, Math.min(90, Number(recentDays) || 3));
    const limit = Math.max(1, Math.min(200, Number(recentLimit) || 30));
    store.setSettings({ ...store.getSettings(), recentVisitsDays: days, recentVisitsLimit: limit });
    setRecentDays(String(days));
    setRecentLimit(String(limit));
    toast.success("Recent visits window updated");
  };

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

      {allow("setting.recentVisits") && (
        <section className="bg-card border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> Recent visits window</h3>
          <p className="text-xs text-muted-foreground">
            Controls the Dashboard's Recent Visits list for every user: shows visits from the last N days, capped at a
            maximum quantity — whichever limit is hit first.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Days">
              <Input inputMode="numeric" type="number" min={1} max={90} value={recentDays} onChange={(e) => setRecentDays(e.target.value)} />
            </Field>
            <Field label="Max quantity">
              <Input inputMode="numeric" type="number" min={1} max={200} value={recentLimit} onChange={(e) => setRecentLimit(e.target.value)} />
            </Field>
          </div>
          <Button size="sm" onClick={saveRecentVisitsConfig}>Save</Button>
        </section>
      )}

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
