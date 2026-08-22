import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Bell,
  RefreshCw,
  Filter,
} from 'lucide-react';
import useRealtimeUpdates from '../../hooks/useRealtimeUpdates';
import { ORDER_STATUSES, getStatusLabel } from '../../services/orderTrackingService';
import { useCommerce } from '../../context/CommerceContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Admin Dashboard - Real-time monitoring and management
 */
export default function AdminDashboard() {
  const { authToken } = useCommerce();
  const { subscribeToAdminNotifications, subscribeToAnnouncements } = useRealtimeUpdates('admin', authToken);

  // Dashboard state
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard`);
      const data = await response.json();
      if (data.success) {
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const status = filter === 'all' ? '' : `status=${filter}`;
      const response = await fetch(`${API_BASE}/admin/orders?${status}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchOrders();
  }, [fetchDashboard, fetchOrders]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeNotifications = subscribeToAdminNotifications((notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
    });

    const unsubscribeAnnouncements = subscribeToAnnouncements((announcement) => {
      setNotifications((prev) => [
        { ...announcement, type: 'announcement' },
        ...prev.slice(0, 9),
      ]);
    });

    return () => {
      unsubscribeNotifications?.();
      unsubscribeAnnouncements?.();
    };
  }, [subscribeToAdminNotifications, subscribeToAnnouncements]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          newStatus,
          description: `Status updated to ${newStatus}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.orderNumber === orderId ? { ...order, status: newStatus } : order
          )
        );
        alert('Order status updated');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time e-commerce management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Orders"
            value={dashboard?.orders?.total || 0}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <MetricCard
            title="Pending"
            value={dashboard?.orders?.pending || 0}
            icon={Clock}
            color="bg-yellow-500"
          />
          <MetricCard
            title="Delivered"
            value={dashboard?.orders?.delivered || 0}
            icon={CheckCircle2}
            color="bg-green-500"
          />
          <MetricCard
            title="Revenue"
            value={`₹${(dashboard?.revenue?.totalRevenue || 0).toLocaleString('en-IN')}`}
            icon={TrendingUp}
            color="bg-purple-500"
          />
        </div>

        {/* Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-red-500" /> Inventory Alerts
              </h2>
              <button
                onClick={fetchDashboard}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {dashboard?.inventory?.byStatus?.map((status) => (
                <div key={status._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-bold text-gray-900 capitalize">{status._id}</p>
                    <p className="text-sm text-gray-600">{status.count} products</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{status.availableStock}</p>
                    <p className="text-sm text-gray-600">available</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboard?.inventory?.lowStockCount || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboard?.inventory?.totalAlerts || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboard?.orders?.cancelled || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <div className="flex gap-2">
                {['all', ORDER_STATUSES.PROCESSING, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2 font-bold">Order ID</th>
                    <th className="text-left p-2 font-bold">Customer</th>
                    <th className="text-left p-2 font-bold">Amount</th>
                    <th className="text-left p-2 font-bold">Status</th>
                    <th className="text-left p-2 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderNumber} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{order.orderNumber}</td>
                      <td className="p-2">{order.shippingAddress?.name || order.user?.name || 'N/A'}</td>
                      <td className="p-2">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            order.status === ORDER_STATUSES.DELIVERED
                              ? 'bg-green-100 text-green-800'
                              : order.status === ORDER_STATUSES.CANCELLED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No notifications</p>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded text-sm border-l-4 ${
                      notif.level === 'error'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : notif.level === 'warning'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                        : notif.level === 'success'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'bg-blue-50 border-blue-500 text-blue-800'
                    }`}
                  >
                    <p className="font-bold">{notif.message || notif.title}</p>
                    {notif.description && (
                      <p className="text-xs mt-1 opacity-80">{notif.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateOrderStatus}
          />
        )}
      </div>
    </main>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}

/**
 * Order Details Modal
 */
function OrderDetailsModal({ order, onClose, onUpdateStatus }) {
  const statusOptions = Object.values(ORDER_STATUSES);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Customer</p>
            <p className="font-bold text-gray-900">{order.shippingAddress?.name || order.user?.name}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Amount</p>
            <p className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <p className="font-bold text-gray-900">{getStatusLabel(order.status)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Payment</p>
            <p className="font-bold text-gray-900 capitalize">{order.paymentStatus}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  onUpdateStatus(order.orderNumber, status);
                  onClose();
                }}
                className={`px-3 py-1 rounded text-sm font-bold transition ${
                  order.status === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {order.items && (
          <div>
            <p className="text-gray-600 text-sm mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-gray-600">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
