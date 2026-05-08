import { useApp, Product } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Search, Upload, LayoutGrid, List, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/currency";

const empty = { name: "", category: "", brand: "", stock: 0, price: 0, imageUrl: "" };

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, bulkAddProducts, checkPermission } = useApp();
  const canEdit = checkPermission("inventory.edit");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [editing, setEditing] = useState<Product | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [bulk, setBulk] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) &&
        (category === "all" || p.category === category)
    );
  }, [products, query, category]);

  const openAdd = () => { setEditing(null); setForm(empty); setOpenForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, brand: p.brand || "", stock: p.stock, price: p.price, imageUrl: p.imageUrl });
    setOpenForm(true);
  };
  const save = () => {
    if (!form.name || !form.category) { toast.error("Name and category required"); return; }
    const payload = { ...form, imageUrl: form.imageUrl || `https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=400&q=80` };
    if (editing) { updateProduct(editing.id, payload); toast.success("Product updated"); }
    else { addProduct(payload); toast.success("Product added"); }
    setOpenForm(false);
  };
  const submitBulk = () => {
    const rows = bulk
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((line) => {
        const [name, category, stock, price] = line.split(",").map((s) => s.trim());
        return { name, category, brand: "", stock: Number(stock) || 0, price: Number(price) || 0 };
      })
      .filter((r) => r.name && r.category);
    if (!rows.length) { toast.error("No valid rows found"); return; }
    bulkAddProducts(rows);
    toast.success(`${rows.length} product${rows.length > 1 ? "s" : ""} added`);
    setBulk(""); setOpenBulk(false);
  };

  const totalValue = filtered.reduce((a, p) => a + p.price * p.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1 sm:w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-md border border-border p-0.5 shrink-0">
              <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setView("table")}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setView("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Dialog open={openBulk} onOpenChange={setOpenBulk}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"><Upload className="h-4 w-4 mr-1.5 sm:mr-2" /> Import</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk add products</DialogTitle>
                  <DialogDescription>One per line: <code>Name, Category, Stock, Price</code></DialogDescription>
                </DialogHeader>
                <Textarea
                  rows={6}
                  placeholder={"Air Filter, Filters, 30, 600\nWiper Blades, Exterior, 20, 950"}
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                />
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setOpenBulk(false)}>Cancel</Button>
                  <Button onClick={submitBulk}>Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canEdit && (
            <Dialog open={openForm} onOpenChange={setOpenForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1 sm:flex-none h-9 text-xs sm:text-sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5 sm:mr-2" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-24 w-24 rounded-lg bg-secondary overflow-hidden flex items-center justify-center shrink-0 border-2 border-dashed border-border group relative">
                      {form.imageUrl ? (
                        <>
                          <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={() => setForm({...form, imageUrl: ""})}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <Label className="text-xs font-semibold">Product Image (Max 2MB)</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="img-upload" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("File too large", { description: "Maximum size is 2MB" });
                              return;
                            }

                            const loadingToast = toast.loading("Uploading image...");
                            try {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `${Math.random()}.${fileExt}`;
                              const filePath = `products/${fileName}`;

                              const { error: uploadError } = await supabase.storage
                                .from('product-images')
                                .upload(filePath, file);

                              if (uploadError) throw uploadError;

                              const { data: { publicUrl } } = supabase.storage
                                .from('product-images')
                                .getPublicUrl(filePath);

                              setForm({ ...form, imageUrl: publicUrl });
                              toast.success("Image uploaded", { id: loadingToast });
                            } catch (err: any) {
                              toast.error("Upload failed", { description: err.message, id: loadingToast });
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full h-9 gap-2 shadow-sm"
                          onClick={() => document.getElementById('img-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {form.imageUrl ? "Change Picture" : "Upload Picture"}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Or paste URL:</span>
                        <Input 
                          value={form.imageUrl} 
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                          placeholder="https://..." 
                          className="h-7 text-[10px] flex-1 bg-white/50" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs">Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Category</Label>
                      <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Brand</Label>
                      <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Stock</Label>
                      <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Price (BDT)</Label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="h-9" />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setOpenForm(false)}>Cancel</Button>
                  <Button onClick={save}>{editing ? "Save changes" : "Add product"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-muted-foreground">
        <span>{filtered.length} item{filtered.length !== 1 && "s"}</span>
        <span>·</span>
        <span>Inventory value: <span className="font-medium text-foreground">{fmt(totalValue)}</span></span>
      </div>

      {view === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover bg-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium leading-tight truncate">{p.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                            {p.id}{p.brand ? ` · ${p.brand}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3">
                      {p.stock < 15 ? (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/10 text-[10px] px-1.5 py-0">{p.stock} low</Badge>
                      ) : (
                        <span>{p.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{fmt(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => { deleteProduct(p.id); toast.success("Product removed"); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden group">
              <div className="aspect-square bg-secondary overflow-hidden">
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.category}{p.brand ? ` · ${p.brand}` : ""}</p>
                  </div>
                  {p.stock < 15 && <Badge variant="secondary" className="bg-destructive/10 text-destructive">Low</Badge>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-semibold">{fmt(p.price)}</span>
                  <span className="text-xs text-muted-foreground">{p.stock} in stock</span>
                </div>
                {canEdit && (
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteProduct(p.id); toast.success("Removed"); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
