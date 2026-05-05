import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Login from "./Login";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import Services from "./Services";
import Transactions from "./Transactions";

const Index = () => {
  const { authed } = useApp();
  if (!authed) return <Login />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/services" element={<Services />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;
