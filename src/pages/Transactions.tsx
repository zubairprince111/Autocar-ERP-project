import { useState, useMemo } from "react";
import { useApp, ServiceTicket, ServiceStatus } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmt } from "@/lib/currency";
import { Search, Pencil, Trash2, ShieldCheck, ReceiptText, Car, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const { transactions, deleteTransaction, checkPermission } = useApp();
  const [filter, setFilter] = useState<"All" | "Services" | "Sales">("All");
  const [query, setQuery] = useState("");
  
  const canDelete = checkPermission("transactions.delete");

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...transactions].filter((t) => {
      const matchesFilter = 
        filter === "All" || 
        (filter === "Services" && t.type === "Service") || 
        (filter === "Sales" && t.type === "Sale");
      
      const matchesQuery = 
        (t.ticketId || "").toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
        
      return matchesFilter && matchesQuery;
    });
  }, [transactions, filter, query]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      toast.success("Transaction removed from logs");
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1">
          {(["All", "Services", "Sales"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "Sales" ? "Walk-in Sales" : t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search transactions..." 
            className="pl-9 h-9 text-sm" 
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">ID & Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Customer / Plate</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const isSale = t.type === "Sale";
                return (
                  <tr key={t.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium">{t.ticketId || "N/A"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.createdAt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSale ? (
                          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs">{isSale ? "Sale" : "Service"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.customerName}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <p className="truncate" title={t.description}>{t.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Paid
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete && (
                        <Button 
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this transaction from the records? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
