import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import GroqChat from "@/components/GroqChat";
import { Sparkles, BarChart3, TrendingUp, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fmt } from "@/lib/currency";

export default function AIInsights() {
  const { transactions, products, services } = useApp();

  // Prepare context for AI
  const aiContext = useMemo(() => ({
    inventorySummary: products.map(p => ({ name: p.name, stock: p.stock, price: p.price })),
    recentServices: services.slice(0, 15).map(s => ({ ticket: s.ticketId, customer: s.customer, total: s.totalCost, status: s.status, date: s.createdAt })),
    recentTransactions: transactions.slice(0, 30).map(t => ({ type: t.type, amount: t.amount, date: t.createdAt, desc: t.description }))
  }), [products, services, transactions]);

  const stats = useMemo(() => {
    const totalSales = transactions.reduce((acc, t) => acc + t.amount, 0);
    const pendingServices = services.filter(s => s.status !== "Completed").length;
    const lowStock = products.filter(p => p.stock < 5).length;
    return { totalSales, pendingServices, lowStock };
  }, [transactions, services, products]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{fmt(stats.totalSales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Tickets</p>
              <p className="text-xl font-bold">{stats.pendingServices}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <p className="text-xl font-bold">{stats.lowStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Business Analyst</h2>
          </div>
          <div className="min-h-[500px]">
            <GroqChat contextData={aiContext} />
          </div>
        </div>
      </div>
    </div>
  );
}
