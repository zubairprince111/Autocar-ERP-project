import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export type Role = "admin" | "manager" | "staff";

export type Profile = {
  id: string;
  email: string;
  role: Role;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  imageUrl: string;
  brand?: string;
};

export type ServicePart = { name: string; qty: number; price: number };

export type ServiceStatus = "Pending" | "In Progress" | "Completed";

export type ServiceTicket = {
  ticketId: string;
  carPlate: string;
  customer?: string;
  phone?: string;
  issue: string;
  mechanic?: string;
  status: ServiceStatus;
  partsUsed: ServicePart[];
  laborCost: number;
  totalCost: number;
  createdAt: string;
};

export type Transaction = {
  id: number;
  ticketId?: string;
  type: "Service" | "Sale";
  customerName: string;
  description: string;
  amount: number;
  createdAt: string;
};

type AppContextType = {
  user: User | null;
  profile: Profile | null;
  authed: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (p: Omit<Product, "id"> & { id?: string }) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkAddProducts: (rows: Omit<Product, "id" | "imageUrl">[]) => Promise<void>;
  services: ServiceTicket[];
  refreshServices: () => Promise<void>;
  addService: (s: Omit<ServiceTicket, "ticketId" | "createdAt">) => Promise<void>;
  updateService: (id: string, s: Partial<ServiceTicket>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  consumeStock: (productName: string, qty: number) => Promise<void>;
  transactions: Transaction[];
  refreshTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=400&q=80`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceTicket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshProducts = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error("Failed to fetch products");
    } else {
      setProducts(data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        stock: p.stock,
        price: p.price,
        imageUrl: p.image_url || img("photo-1486006920555-c77dcf18193c")
      })));
    }
  };

  const refreshServices = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error("Failed to fetch services");
    } else {
      setServices(data.map(s => ({
        ticketId: s.ticket_id,
        carPlate: s.car_plate,
        customer: s.customer,
        phone: s.phone,
        issue: s.issue,
        mechanic: s.mechanic,
        status: s.status as ServiceStatus,
        partsUsed: s.parts_used,
        laborCost: s.labor_cost,
        totalCost: s.total_cost,
        createdAt: s.created_at.slice(0, 10)
      })));
    }
  };

  const refreshTransactions = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch transactions");
    } else {
      setTransactions(data.map(t => ({
        id: t.id,
        ticketId: t.ticket_id,
        type: t.type as "Service" | "Sale",
        customerName: t.customer_name,
        description: t.description,
        amount: Number(t.amount),
        createdAt: new Date(t.created_at).toLocaleDateString()
      })));
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // Load public data for guests
        Promise.all([refreshProducts(), refreshServices()]).finally(() => setLoading(false));
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setPermissions([]);
        // Load public data for guests
        Promise.all([refreshProducts(), refreshServices()]).finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      console.warn("Profile not found or error fetching profile:", profileError);
      // Fallback: set a minimal profile if auth user exists
      if (userId) {
        setProfile({ id: userId, email: user?.email || '', role: 'staff' } as any);
      }
    } else {
      setProfile(profileData);
      
      // Fetch permissions for the role
      const { data: permData } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', profileData.role);
      
      setPermissions(permData?.map(p => p.permission) || []);
    }
    
    // Always load initial data if we have a connection
    if (supabase) {
      await Promise.all([refreshProducts(), refreshServices(), refreshTransactions()]);
    }
    setLoading(false);
  };

  const checkPermission = (permission: string) => {
    if (profile?.role === 'admin') return true;
    return permissions.includes(permission) || permissions.includes('all');
  };

  const value = useMemo<AppContextType>(() => {
    return {
      user,
      profile,
      authed: !!user,
      loading,
      login: async (email, pass) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
          toast.error("Login failed", { description: error.message });
          return false;
        }
        toast.success("Logged in successfully");
        return true;
      },
      logout: async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
      },
      checkPermission,
      products,
      refreshProducts,
      addProduct: async (p) => {
        const id = p.id || "P" + Math.floor(Math.random() * 10000);
        const { error } = await supabase.from('products').insert([{
          id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          stock: p.stock,
          price: p.price,
          image_url: p.imageUrl
        }]);
        if (error) throw error;
        await refreshProducts();
      },
      updateProduct: async (id, patch) => {
        const { error } = await supabase.from('products').update({
          name: patch.name,
          category: patch.category,
          brand: patch.brand,
          stock: patch.stock,
          price: patch.price,
          image_url: patch.imageUrl
        }).eq('id', id);
        if (error) throw error;
        await refreshProducts();
      },
      deleteProduct: async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        await refreshProducts();
      },
      bulkAddProducts: async (rows) => {
        const insertRows = rows.map((r, i) => ({
          id: "P" + (Date.now() + i),
          name: r.name,
          category: r.category,
          brand: r.brand,
          stock: r.stock,
          price: r.price,
          image_url: img("photo-1486006920555-c77dcf18193c")
        }));
        const { error } = await supabase.from('products').insert(insertRows);
        if (error) throw error;
        await refreshProducts();
      },
      services,
      refreshServices,
      addService: async (s) => {
        const ticketId = "S" + String(services.length + 1).padStart(3, "0");
        const { error } = await supabase.from('services').insert([{
          ticket_id: ticketId,
          car_plate: s.carPlate,
          customer: s.customer,
          phone: s.phone,
          issue: s.issue,
          mechanic: s.mechanic,
          status: s.status,
          parts_used: s.partsUsed,
          labor_cost: s.laborCost,
          total_cost: s.totalCost
        }]);
        if (error) throw error;

        // Auto-add to transactions table
        const { error: txError } = await supabase.from('transactions').insert([{
          ticket_id: ticketId,
          type: s.carPlate === "SALE" ? "Sale" : "Service",
          customer_name: s.customer || "Walk-in",
          description: s.issue,
          amount: s.totalCost
        }]);
        if (txError) console.error("Transaction log failed", txError);

        await refreshServices();
        await refreshTransactions();
      },
      updateService: async (id, patch) => {
        const { error } = await supabase.from('services').update({
          car_plate: patch.carPlate,
          customer: patch.customer,
          phone: patch.phone,
          issue: patch.issue,
          mechanic: patch.mechanic,
          status: patch.status,
          parts_used: patch.partsUsed,
          labor_cost: patch.laborCost,
          total_cost: patch.totalCost
        }).eq('ticket_id', id);
        if (error) throw error;

        // Sync with transactions if amount or desc changed
        if (patch.totalCost !== undefined || patch.issue || patch.customer) {
          const { error: txError } = await supabase.from('transactions').update({
            customer_name: patch.customer,
            description: patch.issue,
            amount: patch.totalCost
          }).eq('ticket_id', id);
          if (txError) console.warn("Failed to sync transaction record", txError);
          await refreshTransactions();
        }

        await refreshServices();
      },
      deleteService: async (id) => {
        const { error } = await supabase.from('services').delete().eq('ticket_id', id);
        if (error) throw error;
        await refreshServices();
      },
      consumeStock: async (name, qty) => {
        const product = products.find(p => p.name === name);
        if (product) {
          const newStock = Math.max(0, product.stock - qty);
          const { error } = await supabase.from('products').update({ stock: newStock }).eq('name', name);
          if (error) throw error;
          await refreshProducts();
        }
      },
      transactions,
      refreshTransactions,
      addTransaction: async (t) => {
        const { error } = await supabase.from('transactions').insert([{
          ticket_id: t.ticketId,
          type: t.type,
          customer_name: t.customerName,
          description: t.description,
          amount: t.amount
        }]);
        if (error) throw error;
        await refreshTransactions();
      },
      deleteTransaction: async (id) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        await refreshTransactions();
      }
    };
  }, [user, profile, loading, products, services, transactions, permissions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
