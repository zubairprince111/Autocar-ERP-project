import { createContext, useContext, useMemo, useState, ReactNode } from "react";

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

type AppContextType = {
  authed: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  products: Product[];
  addProduct: (p: Omit<Product, "id"> & { id?: string }) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkAddProducts: (rows: Omit<Product, "id" | "imageUrl">[]) => void;
  services: ServiceTicket[];
  addService: (s: Omit<ServiceTicket, "ticketId" | "createdAt">) => void;
  updateService: (id: string, s: Partial<ServiceTicket>) => void;
  deleteService: (id: string) => void;
  consumeStock: (productName: string, qty: number) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=400&q=80`;

const initialProducts: Product[] = [
  { id: "P101", name: "Brake Pads (Ceramic)", category: "Brakes", brand: "Bosch", stock: 45, price: 1200, imageUrl: img("photo-1486006920555-c77dcf18193c") },
  { id: "P102", name: "Synthetic Engine Oil 5W-30", category: "Fluids", brand: "Mobil 1", stock: 12, price: 3500, imageUrl: img("photo-1635764857616-3a8a52aef0c8") },
  { id: "P103", name: "Spark Plugs (Set of 4)", category: "Ignition", brand: "NGK", stock: 8, price: 800, imageUrl: img("photo-1632823471565-1ec2c1d2f0cf") },
  { id: "P104", name: "Air Filter", category: "Filters", brand: "K&N", stock: 32, price: 950, imageUrl: img("photo-1605164599901-db7f68c4b3a4") },
  { id: "P105", name: "Cabin Filter", category: "Filters", brand: "Mann", stock: 5, price: 1100, imageUrl: img("photo-1581235720704-06d3acfcb36f") },
  { id: "P106", name: "Wiper Blades (Pair)", category: "Exterior", brand: "Bosch", stock: 27, price: 1450, imageUrl: img("photo-1617886322207-6f504e7472c5") },
  { id: "P107", name: "Car Battery 12V 60Ah", category: "Electrical", brand: "Amaron", stock: 9, price: 11500, imageUrl: img("photo-1619725002198-6a689b72f41d") },
  { id: "P108", name: "Headlight Bulb H4", category: "Lighting", brand: "Philips", stock: 22, price: 650, imageUrl: img("photo-1485463611174-f302f6a5c1c9") },
  { id: "P109", name: "Coolant 1L", category: "Fluids", brand: "Prestone", stock: 18, price: 850, imageUrl: img("photo-1632823469850-1b7b1be9a4c4") },
  { id: "P110", name: "Brake Fluid DOT 4", category: "Fluids", brand: "ATE", stock: 14, price: 700, imageUrl: img("photo-1486262715619-67b85e0b08d3") },
  { id: "P111", name: "Timing Belt Kit", category: "Engine", brand: "Gates", stock: 4, price: 6800, imageUrl: img("photo-1632823471406-4c5b1e3aa1bb") },
  { id: "P112", name: "Shock Absorber (Front)", category: "Suspension", brand: "Monroe", stock: 11, price: 5400, imageUrl: img("photo-1486006920555-c77dcf18193c") },
  { id: "P113", name: "Alloy Wheel 16\"", category: "Wheels", brand: "Enkei", stock: 6, price: 14500, imageUrl: img("photo-1626668893632-6f3a4466d22f") },
  { id: "P114", name: "Tire 195/65 R15", category: "Tires", brand: "Michelin", stock: 24, price: 8900, imageUrl: img("photo-1449965408869-eaa3f722e40d") },
  { id: "P115", name: "Clutch Plate Kit", category: "Transmission", brand: "Exedy", stock: 3, price: 9200, imageUrl: img("photo-1632823469850-1b7b1be9a4c4") },
  { id: "P116", name: "Fuel Pump", category: "Engine", brand: "Denso", stock: 7, price: 4200, imageUrl: img("photo-1632823471565-1ec2c1d2f0cf") },
];

const initialServices: ServiceTicket[] = [
  { ticketId: "S001", carPlate: "DHA-11-2233", customer: "Rahim Uddin", phone: "01711-223344", issue: "Oil Change & Inspection", status: "Completed", mechanic: "Imran K.", partsUsed: [{ name: "Synthetic Engine Oil 5W-30", qty: 1, price: 3500 }], laborCost: 1000, totalCost: 4500, createdAt: "2026-04-28" },
  { ticketId: "S002", carPlate: "DHA-22-9911", customer: "Sadia Khan", phone: "01911-887766", issue: "Front brake pads replacement", status: "Completed", mechanic: "Anwar H.", partsUsed: [{ name: "Brake Pads (Ceramic)", qty: 2, price: 1200 }, { name: "Brake Fluid DOT 4", qty: 1, price: 700 }], laborCost: 1500, totalCost: 4600, createdAt: "2026-04-30" },
  { ticketId: "S003", carPlate: "CTG-14-5621", customer: "Tanvir Ahmed", phone: "01611-445566", issue: "Engine misfire — replace plugs & filters", status: "In Progress", mechanic: "Imran K.", partsUsed: [{ name: "Spark Plugs (Set of 4)", qty: 1, price: 800 }, { name: "Air Filter", qty: 1, price: 950 }], laborCost: 1800, totalCost: 3550, createdAt: "2026-05-02" },
  { ticketId: "S004", carPlate: "DHA-31-7788", customer: "Mehedi Hasan", phone: "01511-998877", issue: "Battery dead — replace", status: "Completed", mechanic: "Karim S.", partsUsed: [{ name: "Car Battery 12V 60Ah", qty: 1, price: 11500 }], laborCost: 800, totalCost: 12300, createdAt: "2026-05-03" },
  { ticketId: "S005", carPlate: "SYL-09-3344", customer: "Nusrat J.", phone: "01811-112233", issue: "Headlight not working", status: "Completed", mechanic: "Anwar H.", partsUsed: [{ name: "Headlight Bulb H4", qty: 2, price: 650 }], laborCost: 500, totalCost: 1800, createdAt: "2026-05-03" },
  { ticketId: "S006", carPlate: "DHA-44-1100", customer: "Faisal R.", phone: "01711-334455", issue: "Suspension noise — check & replace", status: "Pending", mechanic: "Karim S.", partsUsed: [], laborCost: 0, totalCost: 0, createdAt: "2026-05-04" },
  { ticketId: "S007", carPlate: "DHA-77-2244", customer: "Ayesha Siddika", phone: "01911-665544", issue: "AC not cooling — cabin filter", status: "Completed", mechanic: "Imran K.", partsUsed: [{ name: "Cabin Filter", qty: 1, price: 1100 }], laborCost: 700, totalCost: 1800, createdAt: "2026-05-04" },
  { ticketId: "S008", carPlate: "DHA-55-9988", customer: "Rezwan A.", phone: "01611-776655", issue: "Tire replacement (all 4)", status: "In Progress", mechanic: "Karim S.", partsUsed: [{ name: "Tire 195/65 R15", qty: 4, price: 8900 }], laborCost: 2000, totalCost: 37600, createdAt: "2026-05-05" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [services, setServices] = useState<ServiceTicket[]>(initialServices);

  const value = useMemo<AppContextType>(() => {
    const nextProductId = () =>
      "P" + (200 + products.length + Math.floor(Math.random() * 90)).toString();
    const nextTicketId = () =>
      "S" + String(services.length + 1).padStart(3, "0");
    const today = () => new Date().toISOString().slice(0, 10);

    return {
      authed,
      login: (u, p) => {
        if (u === "admin" && p === "admin") { setAuthed(true); return true; }
        return false;
      },
      logout: () => setAuthed(false),
      products,
      addProduct: (p) =>
        setProducts((prev) => [...prev, { id: p.id || nextProductId(), ...p } as Product]),
      updateProduct: (id, patch) =>
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      deleteProduct: (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
      bulkAddProducts: (rows) =>
        setProducts((prev) => [
          ...prev,
          ...rows.map((r, i) => ({
            id: "P" + (300 + prev.length + i).toString(),
            imageUrl: img("photo-1486006920555-c77dcf18193c"),
            ...r,
          })),
        ]),
      services,
      addService: (s) =>
        setServices((prev) => [...prev, { ticketId: nextTicketId(), createdAt: today(), ...s }]),
      updateService: (id, patch) =>
        setServices((prev) => prev.map((s) => (s.ticketId === id ? { ...s, ...patch } : s))),
      deleteService: (id) =>
        setServices((prev) => prev.filter((s) => s.ticketId !== id)),
      consumeStock: (name, qty) =>
        setProducts((prev) =>
          prev.map((p) => (p.name === name ? { ...p, stock: Math.max(0, p.stock - qty) } : p))
        ),
    };
  }, [authed, products, services]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
