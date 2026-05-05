import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Wrench, LogOut, Menu, ReceiptText, Wrench as Logo } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`
          }
        >
          <n.icon className="h-4 w-4" />
          {n.label}
        </NavLink>
      ))}
    </>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { logout } = useApp();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = nav.find((n) => n.to === pathname)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen w-full bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-background">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Logo className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">AutoCore ERP</p>
            <p className="text-xs text-muted-foreground mt-1">Parts & Service</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Logo className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">AutoCore ERP</p>
                    <p className="text-xs text-muted-foreground mt-1">Parts & Service</p>
                  </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                  <NavItems onClick={() => setOpen(false)} />
                </nav>
                <div className="border-t border-border p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold tracking-tight">{current}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">Admin</p>
              <p className="text-xs text-muted-foreground mt-1">Owner</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shrink-0">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
