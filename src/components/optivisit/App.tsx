import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { store, uid, hashPin, VISIT_STATUSES, OUTCOMES, VISIT_PURPOSES, SHOP_CATEGORIES, VISIT_ACTIVITIES, UNAVAILABLE_REASONS, type Visit, type Retailer, type Salesman, type VisitStatus, type Outcome, type ShopCategory, type VisitActivity, type UnavailableReason } from "@/lib/optivisit-store";
import { THEME_COLORS, NO_FILL, getTheme, setTheme, applyTheme, defaultTheme, type AppTheme } from "@/lib/optivisit-theme";

import { Eye, LayoutDashboard, ClipboardList, BarChart3, Store, Settings as SettingsIcon, Plus, Trash2, LogOut, MapPin, Phone, User, Users, Calendar as CalendarIcon, Check, X, NotebookPen, Pencil } from "lucide-react";
import { toast } from "sonner";

type Tab = "dashboard" | "visits" | "visitlog" | "reports" | "retailers" | "salesmen" | "settings";

export function OptiVisitApp({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);

  useEffect(() => {
    setVisits(store.getVisits());
    setRetailers(store.getRetailers());
    setSalesmen(store.getSalesmen());
    applyTheme(getTheme());

  }, []);

  const refreshVisits = () => setVisits(store.getVisits());
  const refreshRetailers = () => setRetailers(store.getRetailers());
  const refreshSalesmen = () => setSalesmen(store.getSalesmen());

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">OptiVisit</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{tab}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { store.setSession(false); onLock(); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsContent value="dashboard"><Dashboard visits={visits} retailers={retailers} /></TabsContent>
          <TabsContent value="visits"><VisitLog visits={visits} retailers={retailers} refresh={refreshVisits} /></TabsContent>
          <TabsContent value="visitlog"><SalesmanVisitLog visits={visits} retailers={retailers} salesmen={salesmen} refresh={refreshVisits} /></TabsContent>
          <TabsContent value="reports"><Reports visits={visits} retailers={retailers} salesmen={salesmen} /></TabsContent>
          <TabsContent value="retailers"><Retailers retailers={retailers} salesmen={salesmen} refresh={refreshRetailers} /></TabsContent>
          <TabsContent value="salesmen"><Salesmen salesmen={salesmen} refresh={refreshSalesmen} /></TabsContent>
          <TabsContent value="settings"><SettingsPanel onLock={onLock} /></TabsContent>

          <nav className="fixed bottom-0 inset-x-0 z-20 border-t bg-background/95 backdrop-blur">
            <TabsList className="max-w-3xl mx-auto w-full grid grid-cols-7 h-16 bg-transparent p-0 rounded-none">
              <NavTab value="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" />
              <NavTab value="visits" icon={<ClipboardList className="w-5 h-5" />} label="Visits" />
              <NavTab value="visitlog" icon={<NotebookPen className="w-5 h-5" />} label="Visit Log" />
              <NavTab value="reports" icon={<BarChart3 className="w-5 h-5" />} label="Reports" />
              <NavTab value="retailers" icon={<Store className="w-5 h-5" />} label="Retailers" />
              <NavTab value="salesmen" icon={<Users className="w-5 h-5" />} label="Salesmen" />
              <NavTab value="settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
            </TabsList>
          </nav>
        </Tabs>
      </main>
    </div>
  );
}

function NavTab({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="flex flex-col items-center justify-center gap-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </TabsTrigger>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ visits, retailers }: { visits: Visit[]; retailers: Retailer[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const visitsTodayList = visits.filter((v) => v.date.startsWith(today));
  const visitsMonth = visits.filter((v) => v.date.startsWith(thisMonth));
  const successList = visitsMonth.filter((v) => v.outcome === "Successful" || v.outcome === "Satisfactory");
  const successRate = visitsMonth.length ? Math.round((successList.length / visitsMonth.length) * 100) : 0;

  const [drill, setDrill] = useState<null | { title: string; kind: "visits" | "retailers"; visits?: Visit[]; retailers?: Retailer[] }>(null);

  const recent = [...visits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const settings = typeof window !== "undefined" ? store.getSettings() : { salesmanName: "" };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Hi{settings.salesmanName ? `, ${settings.salesmanName}` : ""} 👋</h2>
        <p className="text-sm text-muted-foreground">Here's your activity snapshot · tap a card for details</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Visits today"
          value={visitsTodayList.length}
          tone="primary"
          onClick={() => setDrill({ title: "Visits today", kind: "visits", visits: visitsTodayList })}
        />
        <StatCard
          label="This month"
          value={visitsMonth.length}
          onClick={() => setDrill({ title: "Visits this month", kind: "visits", visits: visitsMonth })}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          onClick={() => setDrill({ title: "Successful / satisfactory visits", kind: "visits", visits: successList })}
        />
        <StatCard
          label="Retailers"
          value={retailers.length}
          onClick={() => setDrill({ title: "Retailers", kind: "retailers", retailers })}
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

function StatCard({ label, value, tone, onClick }: { label: string; value: React.ReactNode; tone?: "primary"; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition active:scale-[0.98] ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-card"}`}
    >
      <div className={`text-xs ${tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
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

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

/* ---------------- Visit Log ---------------- */
function VisitLog({ visits, retailers, refresh }: { visits: Visit[]; retailers: Retailer[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date));

  const remove = (id: string) => {
    if (!confirm("Delete this visit?")) return;
    store.setVisits(visits.filter((v) => v.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visit log</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New visit</Button>
          </DialogTrigger>
          <VisitDialog retailers={retailers} onSaved={() => { refresh(); setOpen(false); }} />
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No visits yet. Tap "New visit" to log one.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((v) => {
            const r = retailers.find((x) => x.id === v.retailerId);
            return (
              <li key={v.id} className="bg-card border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-sm truncate">{r?.name ?? "Unknown"}</div>
                      <StatusBadge status={v.visitStatus} />
                      <OutcomeBadge outcome={v.outcome} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(v.date).toLocaleString()} · {v.salesman || "—"}
                    </div>
                    {v.purpose && <div className="text-xs mt-2"><span className="text-muted-foreground">Purpose:</span> {v.purpose}</div>}
                    {v.notes && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{v.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(v.id)}>
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

function VisitDialog({ retailers, onSaved }: { retailers: Retailer[]; onSaved: () => void }) {
  const [retailerId, setRetailerId] = useState("");
  const [salesman, setSalesman] = useState("");
  const [purpose, setPurpose] = useState<string>("");
  const [otherPurpose, setOtherPurpose] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("Successful");
  const [notes, setNotes] = useState("");

  const salesmenList = useMemo(
    () => store.getSalesmen().slice().sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const save = () => {
    if (!retailerId) return toast.error("Please select a retailer");
    if (!salesman) return toast.error("Please select a salesman");
    if (purpose === "Other" && !otherPurpose.trim()) return toast.error("Please describe the purpose");
    const finalPurpose = purpose === "Other" ? otherPurpose.trim() : purpose;
    const p = finalPurpose.toLowerCase();
    const derivedActivity: VisitActivity = p.includes("recovery")
      ? "Recovery Visits"
      : p.includes("complaint")
        ? "Complaints Visits"
        : "Visits";
    const v: Visit = {

      id: uid(),
      date: new Date().toISOString(),
      retailerId,
      salesman,
      purpose: purpose === "Other" ? otherPurpose.trim() : purpose,
      visitStatus: "Visited",
      activity: derivedActivity,
      outcome,
      notes,
    };
    store.setVisits([v, ...store.getVisits()]);
    toast.success("Visit logged");
    onSaved();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Log a visit</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Retailer">
          {retailers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add a retailer first in the Retailers tab.</p>
          ) : (
            <Select value={retailerId} onValueChange={setRetailerId}>
              <SelectTrigger><SelectValue placeholder="Select retailer" /></SelectTrigger>
              <SelectContent>
                {retailers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field label="Salesman">
          {salesmenList.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add a salesman first in the Salesmen tab.</p>
          ) : (
            <Select value={salesman} onValueChange={setSalesman}>
              <SelectTrigger><SelectValue placeholder="Select salesman" /></SelectTrigger>
              <SelectContent>
                {salesmenList.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>
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
        const area = (r.address || "").split(",")[0]?.trim();
        if (area) areas.add(area.toLowerCase());
      }
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visit Reports</h2>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length}>Export CSV</Button>
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
function Retailers({ retailers, salesmen, refresh }: { retailers: Retailer[]; salesmen: Salesman[]; refresh: () => void }) {
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
    .filter((r) => [r.name, r.city, r.owner].some((s) => (s || "").toLowerCase().includes(q.toLowerCase())));

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

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Retailers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
          <RetailerDialog salesmen={sortedSalesmen} onSaved={() => { refresh(); setOpen(false); }} />
        </Dialog>
      </div>

      <Input placeholder="Search by name, city or owner..." value={q} onChange={(e) => setQ(e.target.value)} />

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
          <Store className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{retailers.length ? "No matches." : "No retailers yet. Add your first."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="bg-card border rounded-2xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  {r.category && <Badge variant="secondary" className="text-[10px] mt-0.5">{r.category}</Badge>}
                </div>
                <div className="min-w-0 text-right">
                  {r.owner && <div className="text-xs truncate">{r.owner}</div>}
                  {r.phone && <div className="text-[11px] text-muted-foreground truncate">{r.phone}</div>}
                </div>
              </div>

              {(r.address || r.city) && (
                <div className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="min-w-0">{[r.address, r.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {r.notes && <div className="text-[11px] mt-1 text-muted-foreground">{r.notes}</div>}

              <div className="mt-2 flex items-center gap-1.5">
                <Select value={r.salesmanId ?? "none"} onValueChange={(v) => assign(r.id, v)}>
                  <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {sortedSalesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Dialog open={editing?.id === r.id} onOpenChange={(o) => setEditing(o ? r : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"><Pencil className="w-3.5 h-3.5" /></Button>
                  </DialogTrigger>
                  {editing?.id === r.id && (
                    <RetailerDialog salesmen={sortedSalesmen} initial={r} onSaved={() => { refresh(); setEditing(null); }} />
                  )}
                </Dialog>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(r.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RetailerDialog({ salesmen, onSaved, initial }: { salesmen: Salesman[]; onSaved: () => void; initial?: Retailer }) {
  const [f, setF] = useState<Omit<Retailer, "id">>(
    initial
      ? { name: initial.name, owner: initial.owner, city: initial.city, phone: initial.phone, address: initial.address, notes: initial.notes, salesmanId: initial.salesmanId, category: initial.category }
      : { name: "", owner: "", city: "", phone: "", address: "", notes: "" }
  );
  const save = () => {
    if (!f.name.trim()) return toast.error("Name is required");
    if (initial) {
      store.setRetailers(store.getRetailers().map((r) => (r.id === initial.id ? { ...r, ...f } : r)));
      toast.success("Retailer updated");
    } else {
      store.setRetailers([{ id: uid(), ...f }, ...store.getRetailers()]);
      toast.success("Retailer added");
    }
    onSaved();
  };
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{initial ? "Edit retailer" : "Add retailer"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Shop name"><Input value={f.name} onChange={upd("name")} placeholder="Vision Optics" /></Field>
        <Field label="Owner / contact"><Input value={f.owner} onChange={upd("owner")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={f.city} onChange={upd("city")} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={upd("phone")} /></Field>
        </div>
        <Field label="Shop category">
          <Select value={f.category ?? ""} onValueChange={(v) => setF({ ...f, category: v as ShopCategory })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {SHOP_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
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
        <Field label="Address"><Input value={f.address} onChange={upd("address")} /></Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={upd("notes")} rows={2} /></Field>
      </div>
      <DialogFooter><Button className="w-full" onClick={save}>{initial ? "Save changes" : "Save retailer"}</Button></DialogFooter>
    </DialogContent>
  );
}


/* ---------------- Salesmen ---------------- */
function Salesmen({ salesmen, refresh }: { salesmen: Salesman[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const sorted = [...salesmen].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter((s) =>
    [s.name, s.city, s.region, s.mobile].some((x) => (x || "").toLowerCase().includes(q.toLowerCase()))
  );

  const remove = (id: string) => {
    if (!confirm("Delete this salesman?")) return;
    store.setSalesmen(salesmen.filter((s) => s.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Salesmen data</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
          <SalesmanDialog onSaved={() => { refresh(); setOpen(false); }} />
        </Dialog>
      </div>

      <Input placeholder="Search by name, city, region or mobile..." value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{salesmen.length ? "No matches." : "No salesmen yet. Add your first."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id} className="bg-card border rounded-2xl p-4">
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {(s.city || s.region) && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{[s.city, s.region].filter(Boolean).join(", ")}</div>}
                    {s.mobile && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.mobile}</div>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
              </div>
            </li>
          ))}
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
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-aqua font-medium">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {allowNoFill && (
          <button
            type="button"
            onClick={() => onChange(NO_FILL)}
            title="No fill"
            className={`h-7 px-2 rounded-md border text-[10px] ${value === NO_FILL ? "ring-2 ring-ring" : ""}`}
          >
            No fill
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange("")}
          title="Default"
          className={`h-7 px-2 rounded-md border text-[10px] ${value === "" ? "ring-2 ring-ring" : ""}`}
        >
          Default
        </button>
        {THEME_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => onChange(c.value)}
            style={{ backgroundColor: c.value }}
            className={`h-7 w-7 rounded-md border ${value === c.value ? "ring-2 ring-ring" : ""}`}
          />
        ))}
      </div>
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
    <section className="bg-card border rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-semibold">Color theme</h3>
      <ColorPicker label="Background color" value={theme.background} onChange={(v) => update({ background: v })} allowNoFill />
      <ColorPicker label="Ticket / token background" value={theme.card} onChange={(v) => update({ card: v })} allowNoFill />
      <ColorPicker label="Font color" value={theme.font} onChange={(v) => update({ font: v })} />
      <Button size="sm" variant="outline" onClick={() => update({ background: "", card: "", font: "" })}>
        Reset theme
      </Button>
    </section>
  );
}

function SettingsPanel({ onLock }: { onLock: () => void }) {

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

      <ThemePanel />



      <section className="bg-card border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Security</h3>
        <Field label="Change PIN">
          <Input inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="New 4-digit PIN" />
        </Field>
        <div className="flex gap-2">
          <Button size="sm" onClick={changePin}>Update PIN</Button>
          <Button size="sm" variant="outline" onClick={() => { store.setSession(false); onLock(); }}>Lock app</Button>
        </div>
      </section>

      <section className="bg-card border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
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
  const [salesmanId, setSalesmanId] = useState<string>("");
  const [target, setTarget] = useState<Retailer | null>(null);

  const sortedSalesmen = useMemo(
    () => [...salesmen].sort((a, b) => a.name.localeCompare(b.name)),
    [salesmen]
  );
  const salesman = sortedSalesmen.find((s) => s.id === salesmanId) || null;

  const scopedRetailers = useMemo(
    () => (salesman ? retailers.filter((r) => r.salesmanId === salesman.id) : retailers),
    [retailers, salesman]
  );

  const scopedVisits = useMemo(
    () => (salesman ? visits.filter((v) => v.salesman === salesman.name) : visits),
    [visits, salesman]
  );

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
          {sortedSalesmen.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add salesmen in the Salesmen tab first.</p>
          ) : (
            <Select value={salesmanId} onValueChange={setSalesmanId}>
              <SelectTrigger><SelectValue placeholder="All salesmen" /></SelectTrigger>
              <SelectContent>
                {sortedSalesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>
        <p className="text-[10px] text-muted-foreground mt-2">
          {salesman
            ? `Showing ${salesman.name}'s linked shops, grouped city wise.`
            : "Showing all shops, grouped city wise. Pick a salesman to record his visits."}
        </p>
      </div>

      {cityGroups.length === 0 ? (
        <EmptyHint text="No shops linked yet. Assign retailers to this salesman in the Retailers tab." />
      ) : (
        cityGroups.map((g) => (
          <div key={g.city} className="bg-card border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{g.city}</span>
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className="text-blue-600 dark:text-blue-400">({g.total})</span>
                <span className="text-yellow-600 dark:text-yellow-400">({g.single})</span>
                <span className="text-green-600 dark:text-green-400">({g.multiple})</span>
                <span className="text-red-600 dark:text-red-400">({g.notVisited})</span>
              </span>
            </div>
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

            <ul className="divide-y border-t">
              {g.list.map((r) => {
                const n = visitsPerRetailer.get(r.id) || 0;
                const dot = n === 0 ? "bg-red-500" : n === 1 ? "bg-yellow-500" : "bg-green-500";
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {r.category ? `${r.category} · ` : ""}{n} visit{n === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => setTarget(r)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Record
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
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
          <RecordVisitDialog
            retailer={target}
            salesmanName={salesman?.name ?? ""}
            onSaved={() => { refresh(); setTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}

function RecordVisitDialog({
  retailer,
  salesmanName,
  onSaved,
}: {
  retailer: Retailer;
  salesmanName: string;
  onSaved: () => void;
}) {
  const [salesman, setSalesman] = useState(salesmanName);
  const [purpose, setPurpose] = useState("");
  const [activity, setActivity] = useState<VisitActivity>("Visits");
  const [unavailableReason, setUnavailableReason] = useState<UnavailableReason>("Holiday");
  const [outcome, setOutcome] = useState<Outcome>("Successful");
  const [notes, setNotes] = useState("");

  const isOthers = activity === "Others Reasons";

  const save = () => {
    if (!salesman.trim()) return toast.error("Enter the salesman name");
    if (!activity) return toast.error("Please select a visit record reason (1-7)");
    if (isOthers && !unavailableReason) {
      return toast.error("Please select a non-available reason: Holiday, Sick, Weather Conditions, or Leave");
    }
    const v: Visit = {
      id: uid(),
      date: new Date().toISOString(),
      retailerId: retailer.id,
      salesman: salesman.trim(),
      purpose,
      visitStatus: isOthers ? "Holiday" : "Visited",
      outcome,
      notes,
      activity,
      ...(isOthers ? { unavailableReason } : {}),
    };
    store.setVisits([v, ...store.getVisits()]);
    toast.success("Visit recorded");
    onSaved();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Record visit · {retailer.name}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {normalizeCity(retailer.city || "Unassigned city")}{retailer.category ? ` · ${retailer.category}` : ""}
        </p>
        <Field label="Salesman"><Input value={salesman} onChange={(e) => setSalesman(e.target.value)} placeholder="Salesman name" /></Field>
        <Field label="Purpose"><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="New order, demo, follow-up..." /></Field>
        <Field label="Visit record">
          <Select value={activity} onValueChange={(v) => setActivity(v as VisitActivity)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIT_ACTIVITIES.map((a, i) => <SelectItem key={a} value={a}>{i + 1}. {a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {isOthers && (
          <Field label="Non available reason">
            <Select value={unavailableReason} onValueChange={(v) => setUnavailableReason(v as UnavailableReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNAVAILABLE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
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
