import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Accounting from "@/pages/Accounting";
import Branches from "@/pages/Branches";
import Customers from "@/pages/Customers";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import ForgotPassword from "@/pages/ForgotPassword";
import Inventory from "@/pages/Inventory";
import InvoiceDetails from "@/pages/InvoiceDetails";
import Invoices from "@/pages/Invoices";
import Login from "@/pages/Login";
import NewInvoice from "@/pages/NewInvoice";
import Notifications from "@/pages/Notifications";
import Payments from "@/pages/Payments";
import Products from "@/pages/Products";
import Purchases from "@/pages/Purchases";
import Quotations from "@/pages/Quotations";
import Register from "@/pages/Register";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Suppliers from "@/pages/Suppliers";
import Users from "@/pages/Users";

function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="text-6xl font-bold">404</div>
      <p className="mt-2 text-muted-foreground">That page does not exist.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<NewInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="users" element={<Users />} />
            <Route path="branches" element={<Branches />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>
      </Routes>

      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
