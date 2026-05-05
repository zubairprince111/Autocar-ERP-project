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
  const { services, updateService, deleteService } = useApp();
  const [filter, setFilter] = useState<"All" | "Services" | "Sales">("All");
  const [query, setQuery] = useState("");
  
  // Security state
  const [authAction, setAuthAction] = useState<{ type: "edit" | "delete"; ticket: ServiceTicket } | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  // Edit state
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);
  const [editForm, setEditForm] = useState({
    issue: "",
    status: "" as ServiceStatus,
    customer: "",
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...services].reverse().filter((s) => {
      const isSale = s.carPlate === "SALE";
      const matchesFilter = 
        filter === "All" || 
        (filter === "Services" && !isSale) || 
        (filter === "Sales" && isSale);
      
      const matchesQuery = 
        s.ticketId.toLowerCase().includes(q) ||
        s.carPlate.toLowerCase().includes(q) ||
        (s.customer || "").toLowerCase().includes(q) ||
        s.issue.toLowerCase().includes(q);
        
      return matchesFilter && matchesQuery;
    });
  }, [services, filter, query]);

  const handleAuth = () => {
    if (password === "admin") {
      setIsAuthed(true);
      const action = authAction;
      setAuthAction(null);
      setPassword("");

      if (action?.type === "delete") {
        deleteService(action.ticket.ticketId);
        toast.success("Transaction deleted");
        setIsAuthed(false);
      } else if (action?.type === "edit") {
        setEditingTicket(action.ticket);
        setEditForm({
          issue: action.ticket.issue,
          status: action.ticket.status,
          customer: action.ticket.customer || "",
        });
      }
    } else {
      toast.error("Incorrect password");
    }
  };

  const handleSaveEdit = () => {
    if (editingTicket) {
      updateService(editingTicket.ticketId, editForm);
      toast.success("Transaction updated");
      setEditingTicket(null);
      setIsAuthed(false);
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
              {filtered.map((s) => {
                const isSale = s.carPlate === "SALE";
                return (
                  <tr key={s.ticketId} className="hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium">{s.ticketId}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.createdAt}</p>
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
                      <p className="font-medium">{s.customer || "Walk-in"}</p>
                      {!isSale && <p className="text-[10px] text-muted-foreground">{s.carPlate}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <p className="truncate" title={s.issue}>{s.issue}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt(s.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button 
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setAuthAction({ type: "edit", ticket: s })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setAuthAction({ type: "delete", ticket: s })}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
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

      {/* Password Prompt Dialog */}
      <Dialog open={!!authAction} onOpenChange={(o) => { if (!o) { setAuthAction(null); setPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Admin Verification
            </DialogTitle>
            <DialogDescription>
              Please enter the admin password to {authAction?.type} this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs">Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter admin password"
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAuthAction(null); setPassword(""); }}>Cancel</Button>
            <Button onClick={handleAuth}>Verify & Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTicket} onOpenChange={(o) => { if (!o) setEditingTicket(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaction Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input 
                value={editForm.customer} 
                onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description / Issue</Label>
              <Input 
                value={editForm.issue} 
                onChange={(e) => setEditForm({ ...editForm, issue: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(v) => setEditForm({ ...editForm, status: v as ServiceStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTicket(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
