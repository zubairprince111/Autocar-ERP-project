import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Login from "./Login";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import Services from "./Services";
import Transactions from "./Transactions";
import AdminSettings from "./AdminSettings";

const Index = () => {
  const { authed, loading } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Initialising AutoCore...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/services" element={<AppLayout><Services /></AppLayout>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/services" element={<Services />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/admin" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;
