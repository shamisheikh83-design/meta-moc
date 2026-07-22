import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { store, uid, hashPin, VISIT_STATUSES, OUTCOMES, type Visit, type Retailer, type Salesman, type VisitStatus, type Outcome } from "@/lib/optivisit-store";
import { Eye, LayoutDashboard, ClipboardList, BarChart3, Store, Settings as SettingsIcon, Plus, Trash2, LogOut, MapPin, Phone, User, Users, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

type Tab = "dashboard" | "visits" | "reports" | "retailers" | "salesmen" | "settings";

export function OptiVisitApp({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);

  useEffect(() => {
    setVisits(store.getVisits());
    setRetailers(store.getRetailers());
    setSalesmen(store.getSalesmen());
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
          <TabsContent value="reports"><Reports visits={visits} retailers={retailers} /></TabsContent>
          <TabsContent value="retailers"><Retailers retailers={retailers} refresh={refreshRetailers} /></TabsContent>
          <TabsContent value="salesmen"><Salesmen salesmen={salesmen} refresh={refreshSalesmen} /></TabsContent>
          <TabsContent value="settings"><SettingsPanel onLock={onLock} /></TabsContent>

          <nav className="fixed bottom-0 inset-x-0 z-20 border-t bg-background/95 backdrop-blur">
            <TabsList className="max-w-3xl mx-auto w-full grid grid-cols-6 h-16 bg-transparent p-0 rounded-none">
              <NavTab value="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" />
              <NavTab value="visits" icon={<ClipboardList className="w-5 h-5" />} label="Visits" />
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
  const visitsToday = visits.filter((v) => v.date.startsWith(today)).length;
  const visitsMonth = visits.filter((v) => v.date.startsWith(thisMonth));
  const revenueMonth = visitsMonth.reduce((s, v) => s + (v.ordersValue || 0), 0);
  const successRate = visitsMonth.length
    ? Math.round((visitsMonth.filter((v) => v.outcome === "Successful" || v.outcome === "Satisfactory").length / visitsMonth.length) * 100)
    : 0;

  const recent = [...visits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const settings = typeof window !== "undefined" ? store.getSettings() : { salesmanName: "" };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Hi{settings.salesmanName ? `, ${settings.salesmanName}` : ""} 👋</h2>
        <p className="text-sm text-muted-foreground">Here's your activity snapshot</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Visits today" value={visitsToday} tone="primary" />
        <StatCard label="This month" value={visitsMonth.length} />
        <StatCard label="Success rate" value={`${successRate}%`} />
        <StatCard label="Revenue (₹)" value={revenueMonth.toLocaleString()} />
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
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "primary" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
      <div className={`text-xs ${tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
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
                    {v.ordersValue > 0 && (
                      <div className="text-xs mt-2 font-medium text-emerald-600">₹{v.ordersValue.toLocaleString()} order</div>
                    )}
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
  const [salesman, setSalesman] = useState(store.getSettings().salesmanName || "");
  const [purpose, setPurpose] = useState("");
  const [visitStatus, setVisitStatus] = useState<VisitStatus>("Visited");
  const [outcome, setOutcome] = useState<Outcome>("Successful");
  const [ordersValue, setOrdersValue] = useState("");
  const [notes, setNotes] = useState("");

  const save = () => {
    if (!retailerId) return toast.error("Please select a retailer");
    const v: Visit = {
      id: uid(),
      date: new Date().toISOString(),
      retailerId,
      salesman,
      purpose,
      visitStatus,
      outcome,
      ordersValue: Number(ordersValue) || 0,
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
        <Field label="Salesman"><Input value={salesman} onChange={(e) => setSalesman(e.target.value)} placeholder="Your name" /></Field>
        <Field label="Purpose"><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="New order, demo, follow-up..." /></Field>
        <Field label="Visit status">
          <Select value={visitStatus} onValueChange={(v) => setVisitStatus(v as VisitStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Outcome">
            <Select value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Order value (₹)"><Input type="number" value={ordersValue} onChange={(e) => setOrdersValue(e.target.value)} placeholder="0" /></Field>
        </div>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering..." rows={3} /></Field>
      </div>
      <DialogFooter><Button onClick={save} className="w-full">Save visit</Button></DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

/* ---------------- Reports ---------------- */
function Reports({ visits, retailers }: { visits: Visit[]; retailers: Retailer[] }) {
  const byOutcome = useMemo(() => {
    const acc = { successful: 0, "follow-up": 0, "no-interest": 0 } as Record<Visit["outcome"], number>;
    visits.forEach((v) => { acc[v.outcome]++; });
    return acc;
  }, [visits]);

  const byRetailer = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    visits.forEach((v) => {
      const cur = map.get(v.retailerId) ?? { count: 0, revenue: 0 };
      cur.count++; cur.revenue += v.ordersValue || 0;
      map.set(v.retailerId, cur);
    });
    return [...map.entries()]
      .map(([id, s]) => ({ retailer: retailers.find((r) => r.id === id)?.name ?? "Unknown", ...s }))
      .sort((a, b) => b.count - a.count);
  }, [visits, retailers]);

  const total = visits.length || 1;

  const exportCsv = () => {
    const header = "date,retailer,salesman,purpose,outcome,orderValue,notes";
    const rows = visits.map((v) => {
      const r = retailers.find((x) => x.id === v.retailerId)?.name ?? "";
      const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      return [v.date, r, v.salesman, v.purpose, v.outcome, v.ordersValue, v.notes].map((x) => esc(String(x))).join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports</h2>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!visits.length}>Export CSV</Button>
      </div>

      <div className="bg-card border rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">Outcomes</h3>
        <div className="space-y-2">
          {(["successful", "follow-up", "no-interest"] as const).map((o) => (
            <div key={o}>
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize">{o}</span>
                <span className="text-muted-foreground">{byOutcome[o]}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${o === "successful" ? "bg-emerald-500" : o === "follow-up" ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${(byOutcome[o] / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">Top retailers</h3>
        {byRetailer.length === 0 ? (
          <EmptyHint text="No data yet." />
        ) : (
          <ul className="divide-y">
            {byRetailer.slice(0, 8).map((r) => (
              <li key={r.retailer} className="py-2 flex justify-between text-sm">
                <span className="truncate">{r.retailer}</span>
                <span className="text-muted-foreground text-xs">{r.count} visits · ₹{r.revenue.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Retailers ---------------- */
function Retailers({ retailers, refresh }: { retailers: Retailer[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = retailers.filter((r) =>
    [r.name, r.city, r.owner].some((s) => s.toLowerCase().includes(q.toLowerCase()))
  );

  const remove = (id: string) => {
    if (!confirm("Delete this retailer?")) return;
    store.setRetailers(retailers.filter((r) => r.id !== id));
    refresh();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Retailers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
          <RetailerDialog onSaved={() => { refresh(); setOpen(false); }} />
        </Dialog>
      </div>

      <Input placeholder="Search by name, city or owner..." value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <Store className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{retailers.length ? "No matches." : "No retailers yet. Add your first."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="bg-card border rounded-2xl p-4">
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {r.owner && <div className="flex items-center gap-1.5"><User className="w-3 h-3" />{r.owner}</div>}
                    {(r.city || r.address) && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{[r.address, r.city].filter(Boolean).join(", ")}</div>}
                    {r.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{r.phone}</div>}
                  </div>
                  {r.notes && <div className="text-xs mt-2 text-muted-foreground">{r.notes}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RetailerDialog({ onSaved }: { onSaved: () => void }) {
  const [f, setF] = useState<Omit<Retailer, "id">>({ name: "", owner: "", city: "", phone: "", address: "", notes: "" });
  const save = () => {
    if (!f.name.trim()) return toast.error("Name is required");
    store.setRetailers([{ id: uid(), ...f }, ...store.getRetailers()]);
    toast.success("Retailer added");
    onSaved();
  };
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Add retailer</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Shop name"><Input value={f.name} onChange={upd("name")} placeholder="Vision Optics" /></Field>
        <Field label="Owner / contact"><Input value={f.owner} onChange={upd("owner")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={f.city} onChange={upd("city")} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={upd("phone")} /></Field>
        </div>
        <Field label="Address"><Input value={f.address} onChange={upd("address")} /></Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={upd("notes")} rows={2} /></Field>
      </div>
      <DialogFooter><Button className="w-full" onClick={save}>Save retailer</Button></DialogFooter>
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
function SettingsPanel({ onLock }: { onLock: () => void }) {
  const [newPin, setNewPin] = useState("");

  const changePin = async () => {
    if (!/^\d{4}$/.test(newPin)) return toast.error("Enter a 4-digit PIN");
    const hash = await hashPin(newPin);
    store.setSettings({ ...store.getSettings(), pinHash: hash });
    setNewPin("");
    toast.success("PIN updated");
  };
  const wipe = () => {
    if (!confirm("Erase all visits, retailers, and settings on this device?")) return;
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  };

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-semibold">Settings</h2>

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
        <p className="text-xs text-muted-foreground">This clears everything stored on this device.</p>
        <Button variant="destructive" size="sm" onClick={wipe}>Erase all data</Button>
      </section>

      <p className="text-[10px] text-center text-muted-foreground pt-2">OptiVisit · data stored locally on this device</p>
    </div>
  );
}
