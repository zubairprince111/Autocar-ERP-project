import { useMemo, useState } from "react";
import { useApp, ServicePart, ServiceStatus } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, Wrench, Phone, User, Car, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/currency";

const statusStyles: Record<ServiceStatus, string> = {
  Pending: "bg-warning/10 text-warning hover:bg-warning/10",
  "In Progress": "bg-primary/10 text-primary hover:bg-primary/10",
  Completed: "bg-success/10 text-success hover:bg-success/10",
};

export default function Services() {
  const { services, products, addService, updateService, consumeStock } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ServiceStatus | "All">("All");
  const [query, setQuery] = useState("");

  const [carPlate, setCarPlate] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [labor, setLabor] = useState(0);
  const [parts, setParts] = useState<ServicePart[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [qty, setQty] = useState(1);

  const partsTotal = useMemo(
    () => parts.reduce((a, p) => a + p.price * p.qty, 0),
    [parts]
  );
  const total = partsTotal + Number(labor || 0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...services].reverse().filter((s) =>
      (filter === "All" || s.status === filter) &&
      (
        s.carPlate.toLowerCase().includes(q) ||
        s.ticketId.toLowerCase().includes(q) ||
        (s.customer || "").toLowerCase().includes(q) ||
        s.issue.toLowerCase().includes(q)
      )
    );
  }, [services, filter, query]);

  const counts = useMemo(() => ({
    All: services.length,
    Pending: services.filter((s) => s.status === "Pending").length,
    "In Progress": services.filter((s) => s.status === "In Progress").length,
    Completed: services.filter((s) => s.status === "Completed").length,
  }), [services]);

  const addPart = () => {
    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) { toast.error("Select a product"); return; }
    if (qty < 1) { toast.error("Quantity must be at least 1"); return; }
    if (prod.stock < qty) { toast.error(`Only ${prod.stock} in stock`); return; }
    setParts((prev) => [...prev, { name: prod.name, qty, price: prod.price }]);
    setSelectedProduct(""); setQty(1);
  };
  const removePart = (i: number) => setParts((prev) => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setCarPlate(""); setCustomer(""); setPhone(""); setIssue("");
    setMechanic(""); setLabor(0); setParts([]); setSelectedProduct(""); setQty(1);
  };

  const submit = () => {
    if (!carPlate || !issue) { toast.error("Car plate and issue are required"); return; }
    parts.forEach((p) => consumeStock(p.name, p.qty));
    addService({
      carPlate, customer, phone, issue, mechanic,
      status: parts.length ? "In Progress" : "Pending",
      partsUsed: parts,
      laborCost: Number(labor) || 0,
      totalCost: total,
    });
    toast.success("Service ticket created");
    reset();
    setOpen(false);
  };

  const advance = (id: string, current: ServiceStatus) => {
    const next: ServiceStatus = current === "Pending" ? "In Progress" : current === "In Progress" ? "Completed" : "Completed";
    updateService(id, { status: next });
    toast.success(`Ticket marked ${next}`);
  };

  const tabs: (ServiceStatus | "All")[] = ["All", "Pending", "In Progress", "Completed"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="overflow-x-auto pb-1 -mb-1">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 w-max">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-2 shrink-0 ${
                  filter === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                <span className="text-[10px] opacity-70">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="pl-9 h-9 text-sm" />
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 px-3"><Plus className="h-4 w-4 mr-1.5" /> New</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Create Service Ticket</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Car Plate</Label>
                    <Input className="h-9 text-sm" value={carPlate} onChange={(e) => setCarPlate(e.target.value.toUpperCase())} placeholder="DHA-12-3456" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mechanic</Label>
                    <Input className="h-9 text-sm" value={mechanic} onChange={(e) => setMechanic(e.target.value)} placeholder="Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Customer Name</Label>
                    <Input className="h-9 text-sm" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input className="h-9 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reported Issue</Label>
                  <Input className="h-9 text-sm" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Brake noise, oil leak..." />
                </div>

                <div className="rounded-lg border border-border p-3 sm:p-4 space-y-3 bg-surface">
                  <p className="text-xs sm:text-sm font-medium">Parts Used</p>
                  <div className="grid grid-cols-[1fr_70px_auto] sm:grid-cols-[1fr_90px_auto] gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0} className="text-xs sm:text-sm">
                            {p.name} — {fmt(p.price)} ({p.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-9 text-sm" />
                    <Button type="button" variant="secondary" size="sm" className="h-9" onClick={addPart}>Add</Button>
                  </div>

                  {parts.length > 0 && (
                    <div className="divide-y divide-border rounded-md border border-border bg-background max-h-32 overflow-y-auto">
                      {parts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[11px] sm:text-sm">
                          <div className="min-w-0">
                            <span className="font-medium truncate block">{p.name}</span>
                            <span className="text-muted-foreground">× {p.qty}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-medium">{fmt(p.price * p.qty)}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removePart(i)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Labor Cost (BDT)</Label>
                    <Input type="number" className="h-9 text-sm" value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Parts Subtotal</Label>
                    <div className="flex h-9 items-center rounded-md border border-border bg-secondary px-3 text-xs sm:text-sm">
                      {fmt(partsTotal)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-foreground px-4 sm:px-5 py-3 sm:py-4 text-background">
                  <span className="text-[10px] sm:text-sm uppercase tracking-wide opacity-70">Final Bill</span>
                  <span className="text-xl sm:text-2xl font-bold">{fmt(total)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit}>Create Ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.ticketId} className="p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{s.ticketId} · {s.createdAt}</p>
                <p className="mt-1 text-base font-semibold flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-muted-foreground" /> {s.carPlate}
                </p>
              </div>
              <Badge variant="secondary" className={statusStyles[s.status]}>{s.status}</Badge>
            </div>

            {(s.customer || s.phone) && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {s.customer && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {s.customer}</p>}
                {s.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {s.phone}</p>}
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-sm">
              <Wrench className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{s.issue}</span>
            </div>

            {s.partsUsed.length > 0 && (
              <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                {s.partsUsed.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{p.name} × {p.qty}</span>
                    <span>{fmt(p.price * p.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <div className="text-xs text-muted-foreground">
                <p>Labor: <span className="text-foreground font-medium">{fmt(s.laborCost)}</span></p>
                {s.mechanic && <p className="mt-0.5">By {s.mechanic}</p>}
              </div>
              <p className="text-lg font-bold">{fmt(s.totalCost)}</p>
            </div>

            {s.status !== "Completed" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => advance(s.ticketId, s.status)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {s.status === "Pending" ? "Start work" : "Mark completed"}
              </Button>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-12 col-span-full text-center text-sm text-muted-foreground">
            No tickets match the current filter.
          </Card>
        )}
      </div>
    </div>
  );
}
