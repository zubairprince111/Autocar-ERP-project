import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmt } from "@/lib/currency";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Wrench,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { products, services, addService, consumeStock } = useApp();
  const [saleOpen, setSaleOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState("");

  const revenue = services.reduce((a, s) => a + s.totalCost, 0);
  const lowStock = products.filter((p) => p.stock < 15);
  const inProgress = services.filter((s) => s.status === "In Progress").length;
  const completed = services.filter((s) => s.status === "Completed").length;

  const product = products.find((p) => p.id === selectedProduct);
  const totalSale = product ? product.price * quantity : 0;

  const handleSale = () => {
    if (!product) {
      toast.error("Please select a product");
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items in stock`);
      return;
    }

    consumeStock(product.name, quantity);
    addService({
      carPlate: "SALE",
      customer: customer || "Walk-in Customer",
      issue: `Direct Sale: ${product.name} (x${quantity})`,
      status: "Completed",
      partsUsed: [{ name: product.name, qty: quantity, price: product.price }],
      laborCost: 0,
      totalCost: totalSale,
    });

    toast.success("Sale completed successfully");
    setSaleOpen(false);
    setSelectedProduct("");
    setQuantity(1);
    setCustomer("");
  };

  // simple revenue by date
  const byDate = services.reduce<Record<string, number>>((acc, s) => {
    acc[s.createdAt] = (acc[s.createdAt] || 0) + s.totalCost;
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();
  const max = Math.max(...Object.values(byDate), 1);

  const stats = [
    { label: "Total Revenue", value: fmt(revenue), icon: TrendingUp, accent: "text-primary", bg: "bg-primary/10" },
    { label: "Active Products", value: String(products.length), icon: Package, accent: "text-foreground", bg: "bg-secondary" },
    { label: "Low Stock Alerts", value: String(lowStock.length), icon: AlertTriangle, accent: "text-warning", bg: "bg-warning/10" },
    { label: "Tickets Completed", value: String(completed), icon: CheckCircle2, accent: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 relative min-h-[calc(100vh-8rem)]">
      <div>
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">Welcome back, Admin</h2>
        <p className="text-xs lg:text-sm text-muted-foreground mt-1">
          Here's what's happening at your service center today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 lg:p-5 border-border/60 hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <div className={`flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg ${s.bg} ${s.accent}`}>
                <s.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </div>
            </div>
            <p className="mt-3 lg:mt-4 text-2xl lg:text-3xl font-semibold tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Revenue by day</h2>
              <p className="text-xs text-muted-foreground">Last {dates.length} working days</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{fmt(revenue)}</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48">
            {dates.map((d) => {
              const v = byDate[d];
              const h = (v / max) * 100;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-primary/90 hover:bg-primary transition-colors"
                      style={{ height: `${h}%`, minHeight: "4px" }}
                      title={fmt(v)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.slice(5)}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Workshop status</h2>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <StatusRow icon={Clock} label="In progress" value={inProgress} accent="text-primary bg-primary/10" />
            <StatusRow icon={CheckCircle2} label="Completed" value={completed} accent="text-success bg-success/10" />
            <StatusRow icon={AlertTriangle} label="Low stock" value={lowStock.length} accent="text-warning bg-warning/10" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Transactions</h2>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {services.slice(-5).reverse().map((s) => (
              <div key={s.ticketId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{s.carPlate} · <span className="text-muted-foreground font-normal">{s.customer}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.issue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(s.totalCost)}</p>
                  <p className="text-xs text-muted-foreground">{s.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Low stock items</h2>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="divide-y divide-border">
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-md object-cover bg-secondary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <p className="text-sm font-semibold text-destructive">{p.stock} left</p>
              </div>
            ))}
            {lowStock.length === 0 && <p className="py-6 text-sm text-muted-foreground">All stock healthy.</p>}
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl lg:bottom-8 lg:right-8 group transition-all duration-300 hover:w-36 overflow-hidden flex items-center justify-center gap-2"
        onClick={() => setSaleOpen(true)}
      >
        <ShoppingBag className="h-6 w-6 shrink-0" />
        <span className="hidden group-hover:inline text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Product Sale
        </span>
      </Button>

      {/* Sale Dialog */}
      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Direct Product Sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.stock} in stock)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={product?.stock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Unit</Label>
                <div className="h-10 flex items-center px-3 bg-secondary rounded-md text-sm font-medium">
                  {product ? fmt(product.price) : "—"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer Name (Optional)</Label>
              <Input
                placeholder="Walk-in Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>
            <div className="mt-2 p-4 bg-primary text-primary-foreground rounded-lg flex items-center justify-between">
              <span className="text-sm opacity-80">Total Amount</span>
              <span className="text-xl font-bold">{fmt(totalSale)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSale} disabled={!selectedProduct}>
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusRow({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
