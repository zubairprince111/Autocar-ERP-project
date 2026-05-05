import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

export default function Login() {
  const { login } = useApp();
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(u, p)) {
      toast.error("Invalid credentials", { description: "Use admin / admin to sign in." });
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 bg-cover bg-center relative"
      style={{ backgroundImage: 'url("/landing.jpg")' }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl ring-4 ring-white/10">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">AutoCore ERP</h1>
          <p className="mt-2 text-sm text-white/80 font-medium">
            Sign in to manage inventory & service.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-white/20 bg-background/80 p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="space-y-2">
            <Label htmlFor="u" className="text-foreground/80">Username</Label>
            <Input id="u" value={u} onChange={(e) => setU(e.target.value)} placeholder="admin" autoFocus className="bg-white/50 border-white/30" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p" className="text-foreground/80">Password</Label>
            <Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="admin" className="bg-white/50 border-white/30" />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
            Sign in
          </Button>
          <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Demo credentials: <span className="text-primary underline decoration-primary/30">admin / admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}
