import { useState, useEffect } from "react";
import { useApp, Role, Profile } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { 
  Shield, 
  Users, 
  Lock, 
  Check, 
  X, 
  ChevronRight, 
  AlertCircle,
  Save,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PERMISSIONS = [
  { id: "inventory.view", label: "View Inventory", description: "Can see product list and stock levels" },
  { id: "inventory.edit", label: "Edit Inventory", description: "Can add, update, or delete products" },
  { id: "services.view", label: "View Services", description: "Can see service tickets and status" },
  { id: "services.edit", label: "Edit Services", description: "Can create or update service tickets" },
  { id: "transactions.view", label: "View Transactions", description: "Can see financial reports and history" },
];

export default function AdminSettings() {
  const { profile } = useApp();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>({
    admin: ["all"],
    manager: [],
    staff: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("role_permissions").select("*"),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      
      if (permsRes.data) {
        const mapping: Record<Role, string[]> = { admin: ["all"], manager: [], staff: [] };
        permsRes.data.forEach((p) => {
          mapping[p.role as Role].push(p.permission);
        });
        setRolePermissions(mapping);
      }
    } catch (error) {
      toast.error("Failed to fetch settings data");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: Role) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success("Role updated successfully");
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
    }
  };

  const togglePermission = async (role: Role, permission: string) => {
    if (role === 'admin') return; // Admin always has all perms

    const currentPerms = rolePermissions[role];
    const hasPerm = currentPerms.includes(permission);

    if (hasPerm) {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", role)
        .eq("permission", permission);
      
      if (error) {
        toast.error("Failed to remove permission");
      } else {
        setRolePermissions({
          ...rolePermissions,
          [role]: currentPerms.filter(p => p !== permission)
        });
      }
    } else {
      const { error } = await supabase
        .from("role_permissions")
        .insert([{ role, permission }]);
      
      if (error) {
        toast.error("Failed to add permission");
      } else {
        setRolePermissions({
          ...rolePermissions,
          [role]: [...currentPerms, permission]
        });
      }
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600">
          <Shield className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          You do not have administrative privileges to access this page. Please contact your system administrator if you believe this is an error.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Manage user roles and system-wide permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* User Management */}
        <Card className="lg:col-span-2 border-primary/10 shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>Assign roles to registered team members.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.email}</span>
                        <span className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.role === 'admin' ? 'default' : p.role === 'manager' ? 'secondary' : 'outline'}>
                        {p.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={p.role} 
                        onValueChange={(val) => updateRole(p.id, val as Role)}
                        disabled={p.id === profile.id} // Cannot change own role
                      >
                        <SelectTrigger className="w-[130px] ml-auto">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card className="border-primary/10 shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-primary" />
              Role Permissions
            </CardTitle>
            <CardDescription>Customise what each role can access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(['manager', 'staff'] as const).map((role) => (
              <div key={role} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold capitalize text-primary">{role} Permissions</h3>
                  <Badge variant="outline">{rolePermissions[role].length} Active</Badge>
                </div>
                <div className="space-y-3">
                  {PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-sm font-medium leading-none">{perm.label}</span>
                        <span className="text-[10px] text-muted-foreground">{perm.description}</span>
                      </div>
                      <Switch 
                        checked={rolePermissions[role].includes(perm.id)} 
                        onCheckedChange={() => togglePermission(role, perm.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="rounded-lg bg-primary/5 p-4 text-xs text-primary-foreground/70 bg-primary/90 border border-primary/20">
              <div className="flex items-start gap-2 text-white">
                <Shield className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 text-white">Admin Privileges</p>
                  <p>Administrators have full system access ("all" permission) which cannot be modified.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
