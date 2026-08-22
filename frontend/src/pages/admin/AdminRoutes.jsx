import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import DashboardPage from "./dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Coupons from "./pages/Coupons";
import Reviews from "./pages/Reviews";
import Delivery from "./pages/Delivery";
import Payments from "./pages/Payments";
import Blogs from "./pages/Blogs";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";
import Settings from "./pages/Settings";
import DeliveryAgents from "./pages/DeliveryAgents";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="delivery-agents" element={<DeliveryAgents />} />
        <Route path="payments" element={<Payments />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin-users" element={<AdminUsers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}