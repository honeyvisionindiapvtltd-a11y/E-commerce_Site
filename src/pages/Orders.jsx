import { Link } from "react-router-dom";
import { ArrowRight, Box, CreditCard, PackageCheck } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Orders() {
  const { orders } = useCommerce();

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

        {!orders.length ? (
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
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Order #{order.id}</p>
                    <h2 className="mt-2 text-xl font-bold text-[#071426]">{order.status}</h2>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-full bg-[#FFF7DB] px-3 py-1 font-semibold text-[#9A7100]">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
                          <img src={item.product.image} alt={item.product.name} className="h-12 object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#071426]">{item.product.name}</p>
                          <p className="mt-1 text-sm text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-[#071426]">{money(item.product.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-[#F9FAFB] p-5">
                    <div className="flex items-center gap-2 text-[#071426]">
                      <CreditCard size={18} className="text-[#F4B400]" />
                      <h3 className="font-bold">Order Summary</h3>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>{money(order.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span>{order.shipping === 0 ? "Free" : money(order.shipping)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Install</span>
                        <span>{order.installationFee ? money(order.installationFee) : "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold text-[#071426]">
                        <span>Total</span>
                        <span>{money(order.total)}</span>
                      </div>
                    </div>

                    <Link
                      to={`/order-tracking?order=${order.id}`}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]"
                    >
                      <Box size={16} />
                      Track Order
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
