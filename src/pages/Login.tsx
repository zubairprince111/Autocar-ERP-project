import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench } from "lucide-react";

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
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
            <Label htmlFor="email" className="text-foreground/80">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@autocore.com" 
              autoFocus 
              className="bg-white/50 border-white/30" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/80">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="bg-white/50 border-white/30" 
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-white/40">
              <span className="bg-transparent px-2">Workflow Shortcut</span>
            </div>
          </div>

          <Link to="/services" className="block w-full">
            <Button variant="outline" type="button" className="w-full h-11 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Wrench className="h-4 w-4 mr-2" />
              Public Service Entry
            </Button>
          </Link>

          <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Real-time Database Connection Active
          </p>
        </form>
      </div>
    </div>
  );
}
