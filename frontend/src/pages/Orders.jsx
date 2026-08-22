import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, PackageCheck, Search, Filter, ChevronRight, Loader } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import useRealtimeUpdates from '../hooks/useRealtimeUpdates';
import useNotifications from '../hooks/useNotifications';
import { ORDER_STATUSES } from '../services/orderTrackingService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Orders() {
  const { user, orders, authToken } = useCommerce();
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { subscribeToNotifications } = useRealtimeUpdates(user?.id, authToken);
  const { info } = useNotifications();

  const ownOrders = user ? orders.filter((order) => {
    const orderUserId = order.userId || order.user?._id || order.user?.id || order.user;
    return String(orderUserId || "") === String(user.id || user._id || "");
  }) : [];

  // Fetch orders from API if user exists
  useEffect(() => {
    if (!user?.id) {
      setAllOrders(ownOrders);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAllOrders(data.orders || ownOrders);
        } else {
          setAllOrders(ownOrders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setAllOrders(ownOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to real-time order updates
    const unsubscribeNotifications = subscribeToNotifications((notification) => {
      // When notification comes in, refresh orders
      fetchOrders();
      if (notification.message) {
        info(notification.message);
      }
    });

    return unsubscribeNotifications;
  }, [user?.id, authToken]);

  // Filter orders
  useEffect(() => {
    let filtered = allOrders;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.orderNumber || order.id || '').toLowerCase().includes(query) ||
          order.shippingAddress?.name?.toLowerCase().includes(query) ||
          order.items?.some((item) => item.name?.toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
  }, [allOrders, searchQuery, filterStatus]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">My Orders</h1>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071426] px-5 py-3 font-semibold text-white transition hover:bg-[#F4B400] hover:text-[#071426]"
          >
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>

        {!allOrders.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-[#F4B400]">
              <PackageCheck size={28} />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-[#071426]">No orders yet</h2>
            <p className="mt-3 text-slate-500">Your placed orders will appear here once you make a purchase.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#F4B400] px-6 py-3 font-bold text-[#071426] transition hover:bg-yellow-400"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by order ID or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Filter size={20} className="text-gray-500" />
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === 'all'
                        ? 'bg-[#F4B400] text-[#071426]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Orders
                  </button>
                  <button
                    onClick={() => setFilterStatus(ORDER_STATUSES.DELIVERED)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === ORDER_STATUSES.DELIVERED
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => setFilterStatus(ORDER_STATUSES.OUT_FOR_DELIVERY)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === ORDER_STATUSES.OUT_FOR_DELIVERY
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    In Transit
                  </button>
                  <button
                    onClick={() => setFilterStatus(ORDER_STATUSES.CANCELLED)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === ORDER_STATUSES.CANCELLED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <Loader className="animate-spin h-8 w-8 text-[#F4B400] mx-auto mb-2" />
                <p className="text-gray-600">Loading orders...</p>
              </div>
            )}

            {/* Orders List */}
            {!loading && filteredOrders.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <PackageCheck className="mx-auto text-gray-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-[#071426] mb-2">No orders found</h2>
                <p className="text-slate-500">{searchQuery ? 'No orders match your search.' : 'No orders in this category.'}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredOrders.map((order) => (
                  <article key={order.id || order.orderNumber} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <Link
                      to={`/tracking?order=${encodeURIComponent(order.orderNumber || order.id)}`}
                      className="block"
                    >
                      <div className="flex flex-col gap-5 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Order #{order.orderNumber || order.id}</p>
                          <h2 className="mt-2 text-xl font-bold text-[#071426] capitalize">{order.status?.replace(/_/g, ' ')}</h2>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="rounded-full bg-[#FFF7DB] px-3 py-1 font-semibold text-[#9A7100]">{String(order.paymentMethod || "").toUpperCase() === "COD" ? "Cash on Delivery" : "Online"}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{new Date(order.createdAt || order.orderDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                          <ChevronRight className="text-gray-400" size={20} />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
                                <img src={item.product?.image || '/placeholder.png'} alt={item.productName || item.product?.name} className="h-12 object-contain" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-[#071426]">{item.productName || item.product?.name}</p>
                                <p className="mt-1 text-sm text-slate-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-bold text-[#071426]">{money((item.price || item.product?.price || 0) * item.quantity)}</p>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl bg-[#F9FAFB] p-5">
                          <div className="flex items-center gap-2 text-[#071426]">
                            <CreditCard size={18} className="text-[#F4B400]" />
                            <h3 className="font-bold">Order Summary</h3>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex items-start justify-between gap-4">
                              <span>Tracking number</span>
                              <span className="text-right font-mono text-xs font-semibold text-[#071426]">
                                {order.trackingNumber || (order.deliveryAgent ? "Preparing" : "Not assigned")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Subtotal</span>
                              <span>{money(order.subtotal || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Shipping</span>
                              <span>{(order.shipping || 0) === 0 ? "Free" : money(order.shipping)}</span>
                            </div>
                            {order.installationFee && (
                              <div className="flex items-center justify-between">
                                <span>Install</span>
                                <span>{money(order.installationFee)}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between text-lg font-bold text-[#071426]">
                              <span>Total</span>
                              <span>{money(order.total || order.totalAmount || 0)}</span>
                            </div>
                          </div>

                          <div className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]">
                            <PackageCheck size={16} />
                            Track Order
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
