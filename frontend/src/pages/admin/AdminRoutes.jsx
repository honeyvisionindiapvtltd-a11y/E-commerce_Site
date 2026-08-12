import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Reviews from './pages/Reviews'
import Coupons from './pages/Coupons'
import Categories from './pages/Categories'
import Blogs from './pages/Blogs'
import AdminUsers from './pages/AdminUsers'

export default function AdminRoutes() {
  return (
    <div className="admin-shell flex min-h-screen">
      <aside className="w-56 border-r border-slate-200 bg-white p-4">
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/admin" className="font-semibold">Dashboard</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/inventory">Inventory</Link>
          <Link to="/admin/customers">Customers</Link>
          <Link to="/admin/payments">Payments</Link>
          <Link to="/admin/reports">Reports</Link>
          <Link to="/admin/settings">Settings</Link>
          <Link to="/admin/reviews">Reviews</Link>
          <Link to="/admin/coupons">Coupons</Link>
          <Link to="/admin/categories">Categories</Link>
          <Link to="/admin/blogs">Blogs</Link>
          <Link to="/admin/admin-users">Admin Users</Link>
        </nav>
      </aside>

      <main className="flex-1 bg-[#f5f7fa]">
        <Routes>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/reviews" element={<Reviews />} />
          <Route path="/admin/coupons" element={<Coupons />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/blogs" element={<Blogs />} />
          <Route path="/admin/admin-users" element={<AdminUsers />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}
