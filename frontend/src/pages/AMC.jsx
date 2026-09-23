import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, CreditCard, ShieldCheck, ShieldEllipsis, Wrench } from 'lucide-react';
import { useCommerce } from '../context/index.js';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatDisplayName = (value) => String(value || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AMC() {
  const navigate = useNavigate();
  const { requestJson, orders = [], authToken } = useCommerce();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/amc/plans')
      .then((data) => {
        if (!active) return;
        const orderedPlans = [...(data.plans || [])].sort((firstPlan, secondPlan) => Number(firstPlan.displayOrder || 0) - Number(secondPlan.displayOrder || 0));
        setPlans(orderedPlans);
        setError('');
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || 'Unable to load AMC plans.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [requestJson]);

  const eligibleOrders = useMemo(() => orders.filter((order) => String(order.paymentStatus || '').toUpperCase() === 'PAID' && !['CANCELLED', 'RETURNED', 'REFUNDED'].includes(String(order.status || '').toUpperCase())), [orders]);
  const eligibleItems = selectedOrder?.items?.filter((item) => item.product?.installationAvailable !== false) || [];

  const comparisonData = useMemo(() => {
    const entries = [
      { label: 'Duration', values: plans.map((plan) => `${plan.durationMonths || 12} months`) },
      { label: 'Service Visits', values: plans.map((plan) => `${plan.serviceVisits || 0}`) },
      { label: 'Response Time', values: plans.map((plan) => plan.responseTime || 'Standard') },
      { label: 'Support', values: plans.map((plan) => plan.supportHours || 'Business hours') },
      { label: 'Preventive Maintenance', values: plans.map((plan) => (plan.coveredServices?.includes('Preventive maintenance') || plan.coveredServices?.includes('Preventive inspection')) ? 'Included' : 'Essential') },
      { label: 'Technical Support', values: plans.map(() => 'Included') },
      { label: 'Priority Service', values: plans.map((plan) => (plan.isFeatured || plan.responseTime?.toLowerCase().includes('same') || plan.responseTime?.toLowerCase().includes('24')) ? 'Priority' : 'Standard') },
      { label: 'Eligible Products', values: plans.map((plan) => (plan.eligibleCategories?.length ? plan.eligibleCategories.map(formatDisplayName).slice(0, 2).join(', ') : 'HoneyVision systems')) },
      { label: 'Renewal', values: plans.map(() => 'Annual') },
    ];
    return entries;
  }, [plans]);

  const startPayment = async () => {
    if (!selectedPlan || !selectedOrder || !selectedProductId) return setPaymentError('Select a plan, order, and eligible product.');
    if (!authToken) return setPaymentError('Please sign in to continue.');
    setProcessing(true); setPaymentError('');
    try {
      const payload = await requestJson('/amc/payment/create', { method: 'POST', body: JSON.stringify({ planId: selectedPlan._id, orderId: selectedOrder.orderNumber || selectedOrder._id, productId: selectedProductId, clientRequestId: window.crypto?.randomUUID?.() || `amc-${Date.now()}` }) });
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = resolve; script.onerror = () => reject(new Error('Unable to load payment checkout.')); document.body.appendChild(script); });
      }
      await new Promise((resolve, reject) => {
        let finished = false;
        const checkout = new window.Razorpay({ key: payload.data.keyId, amount: payload.data.razorpayOrder.amount, currency: payload.data.razorpayOrder.currency, name: 'Honey Vision', description: `${selectedPlan.name} AMC`, order_id: payload.data.razorpayOrder.id, handler: async (response) => { finished = true; try { const verified = await requestJson('/amc/payment/verify', { method: 'POST', body: JSON.stringify({ ...response, planId: selectedPlan._id, orderId: selectedOrder.orderNumber || selectedOrder._id, productId: selectedProductId }) }); navigate(`/my-amc/${encodeURIComponent(verified.data.contract.contractNumber)}`); resolve(); } catch (verifyError) { reject(verifyError); } }, modal: { ondismiss: () => { if (!finished) reject(new Error('Payment was cancelled. You can retry this AMC purchase.')); } } });
        checkout.on('payment.failed', () => { if (!finished) { finished = true; reject(new Error('AMC payment failed.')); } });
        checkout.open();
      });
    } catch (paymentFailure) { setPaymentError(paymentFailure.message || 'Your AMC payment could not be completed.'); } finally { setProcessing(false); }
  };

  const planTitles = plans.length ? plans.map((plan) => plan.name) : ['AMC Basic', 'AMC Standard', 'AMC Premium'];

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071426]">
      <section className="bg-[#071426] px-4 pb-12 pt-8 text-white sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f4b400]">HoneyVision Service Care</p>
            <h1 className="mt-4 text-4xl font-black leading-none sm:text-5xl lg:text-6xl">Annual Maintenance Contracts</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Protect your HoneyVision security and technology systems with reliable maintenance, technical support, and professional service.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#plans" className="rounded-xl bg-[#f4b400] px-5 py-3 text-sm font-black text-[#071426] shadow-sm shadow-[#f4b400]/30 transition hover:brightness-105">Choose AMC Plan</a>
              <Link to="/my-amc" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:border-white/70 hover:bg-white/5">View My AMC</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#12233d] to-[#071426] p-5 shadow-[0_32px_70px_rgba(2,8,23,0.35)] sm:p-6">
            <div className="flex min-h-[260px] flex-col justify-between rounded-[22px] border border-[#f4b400]/20 bg-[radial-gradient(circle_at_top,rgba(244,180,0,0.2),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-5">
              <div className="flex items-center justify-between text-[#f4b400]">
                <ShieldCheck size={36} />
                <span className="rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">Trusted upkeep</span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-300">HoneyVision AMC</p>
                <h2 className="mt-3 text-3xl font-black text-white">Preventive care for critical systems</h2>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Response</p>
                  <p className="mt-2 text-lg font-black text-white">24-48h</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Coverage</p>
                  <p className="mt-2 text-lg font-black text-white">CCTV + IT</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Support</p>
                  <p className="mt-2 text-lg font-black text-white">Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">Professional AMC Plans</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose the right maintenance plan for your system</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f4b400]/30 bg-[#FFF7DB] px-3 py-2 text-sm font-bold text-[#071426]">
            <Wrench size={16} className="text-[#b17b00]" />
            Database-backed coverage
          </div>
        </div>

        {loading && <p className="rounded-2xl bg-white p-6 text-base font-medium text-slate-600 shadow-sm">Loading AMC plans...</p>}
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-base font-medium text-red-700">{error}</p>}
        {!loading && !error && !plans.length && <p className="rounded-2xl bg-white p-6 text-base font-medium text-slate-600 shadow-sm">No AMC plans are currently available.</p>}

        {!loading && !error && plans.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan?._id === plan._id;
              const cardClass = plan.isFeatured
                ? 'border-[#f4b400] bg-[#fffdf6] shadow-[0_18px_42px_rgba(244,180,0,0.14)]'
                : 'border-slate-200 bg-white shadow-sm';

              return (
                <article key={plan._id} className={`relative flex h-full flex-col rounded-[26px] border p-6 transition duration-200 ${cardClass} ${isSelected ? 'ring-2 ring-[#f4b400]/25' : ''}`}>
                  {plan.isFeatured && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#f4b400] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#071426]">Most Popular</span>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b17b00]">{plan.slug ? plan.slug.replace(/-/g, ' ').toUpperCase() : 'AMC PLAN'}</span>
                    {isSelected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">Selected ✓</span>}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-2xl font-black text-[#071426]">{plan.name}</h3>
                    <p className="mt-2 min-h-[68px] text-[15px] leading-6 text-slate-600">{plan.description}</p>
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight text-[#071426]">{money(plan.price)}</span>
                    <span className="pb-1 text-sm font-semibold text-slate-500">/Year</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">{plan.durationMonths || 12} months</p>
                    <p>{plan.serviceVisits || 0} service visits</p>
                    <p>{plan.responseTime || 'Standard response'}</p>
                    <p>{plan.supportHours || 'Business hours support'}</p>
                  </div>

                  <div className="mt-5 space-y-2.5 text-sm text-slate-700">
                    {(plan.features || []).slice(0, 5).map((feature) => (
                      <p key={feature} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</p>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Coverage:</span> {(plan.eligibleCategories || []).length ? plan.eligibleCategories.map(formatDisplayName).join(', ') : 'HoneyVision eligible systems'}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-black transition ${isSelected ? 'bg-[#071426] text-white' : 'bg-[#f4b400] text-[#071426] hover:brightness-105'}`}
                  >
                    {isSelected ? 'Selected Plan' : 'Get AMC'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!selectedPlan && !loading && !error && plans.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-6 text-center shadow-sm sm:px-7">
            <h2 className="text-xl font-black text-[#071426]">Choose an AMC plan to continue</h2>
            <p className="mt-2 text-sm text-slate-600">Select a maintenance plan above to view eligible products and continue to payment.</p>
          </div>
        </section>
      )}

      {selectedPlan && (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">Complete your AMC purchase</p>
                <h2 className="mt-2 text-2xl font-black">Selected plan: {selectedPlan.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{money(selectedPlan.price)} / Year · {selectedPlan.durationMonths || 12} months</p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#FFF7DB] px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#071426]">
                <ShieldCheck size={15} className="text-[#b17b00]" />
                Selected ✓
              </div>
            </div>

            {!authToken ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">Please sign in to continue.</div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Select a paid order
                      <select
                        value={selectedOrder?.orderNumber || selectedOrder?._id || ''}
                        onChange={(event) => {
                          const next = eligibleOrders.find((order) => String(order.orderNumber || order._id) === event.target.value);
                          setSelectedOrder(next || null);
                          setSelectedProductId('');
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 focus:border-[#f4b400] focus:outline-none focus:ring-2 focus:ring-[#f4b400]/20"
                      >
                        <option value="">Choose an order</option>
                        {eligibleOrders.map((order) => (
                          <option key={order._id} value={order.orderNumber || order._id}>{order.orderNumber || order._id}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {selectedOrder && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-800">Select an eligible product</p>

                      {eligibleItems.length ? (
                        <div className="mt-3 space-y-3">
                          {eligibleItems.map((item, index) => {
                            const productId = item.product?._id || item.productId || item.product?.id || index;
                            const productName = item.product?.name || item.name || 'Order product';
                            const orderNumber = selectedOrder.orderNumber || selectedOrder._id || 'Order';
                            const purchasedDate = item.product?.createdAt || selectedOrder.createdAt || null;
                            const isSelected = String(productId) === String(selectedProductId);

                            return (
                              <button
                                key={productId || index}
                                type="button"
                                onClick={() => setSelectedProductId(String(productId))}
                                className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? 'border-[#f4b400] bg-[#fffdf6]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{productName}</p>
                                    <p className="mt-1 text-xs text-slate-600">Order: {orderNumber}</p>
                                    <p className="mt-1 text-xs text-slate-500">Purchased: {purchasedDate ? new Date(purchasedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {isSelected ? 'Selected' : 'Select'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                          <p className="font-bold text-slate-800">No eligible products found.</p>
                          <p className="mt-2">AMC can be purchased for eligible HoneyVision products from your completed and paid orders.</p>
                          <Link to="/orders" className="mt-4 inline-flex rounded-xl bg-[#071426] px-4 py-2.5 text-xs font-bold text-white">View My Orders</Link>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedOrder && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      No eligible purchased products found for your account yet.
                    </div>
                  )}
                </div>

                <aside className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">AMC Summary</p>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>AMC Plan</span>
                      <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>Coverage period</span>
                      <span className="font-medium">{selectedPlan.durationMonths || 12} months</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>Service visits</span>
                      <span className="font-medium">{selectedPlan.serviceVisits || 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>Response time</span>
                      <span className="font-medium text-right">{selectedPlan.responseTime || 'Standard response'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>Price</span>
                      <span className="font-bold text-slate-900">{money(selectedPlan.price)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                      <span>Payment method</span>
                      <span className="font-medium">Razorpay</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-base font-black text-slate-900">Total</span>
                      <span className="text-base font-black text-[#071426]">{money(selectedPlan.price)}</span>
                    </div>
                  </div>

                  {paymentError && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{paymentError}</div>}

                  <button
                    type="button"
                    onClick={startPayment}
                    disabled={processing || !selectedPlan || !selectedOrder || !selectedProductId}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4b400] px-4 py-3 text-sm font-black text-[#071426] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <CreditCard size={18} />
                    {processing ? 'Opening secure payment...' : selectedProductId ? 'Proceed to Secure Payment' : 'Select a product to continue'}
                  </button>
                </aside>
              </div>
            )}
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <>
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">What’s included</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">What’s Included With Your AMC</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {[
                { title: 'Preventive Maintenance', description: 'Regular checks to keep your systems operating reliably.', icon: Wrench },
                { title: 'Technical Support', description: 'Professional troubleshooting and technical assistance.', icon: ShieldEllipsis },
                { title: 'System Inspection', description: 'Inspection of eligible security and technology equipment.', icon: ShieldCheck },
                { title: 'Priority Service', description: 'Higher-tier plans receive faster service response.', icon: ArrowRight },
                { title: 'Professional Assistance', description: 'HoneyVision service support for covered equipment.', icon: Check },
              ].map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 inline-flex w-fit rounded-xl bg-[#FFF7DB] p-3 text-[#b17b00]"><Icon size={20} /></div>
                  <h3 className="text-lg font-black text-[#071426]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">Coverage</p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">Compare AMC Plans</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left text-sm shadow-sm">
                  <thead className="bg-[#071426] text-white">
                    <tr>
                      <th className="px-5 py-4 text-left font-bold">Feature</th>
                      {planTitles.map((planName, index) => (
                        <th key={planName || index} className="px-5 py-4 text-center font-bold">{planName || ['AMC Basic', 'AMC Standard', 'AMC Premium'][index]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row) => (
                      <tr key={row.label} className="border-t border-slate-200">
                        <td className="px-5 py-4 font-semibold text-slate-700">{row.label}</td>
                        {row.values.map((value, index) => (
                          <td key={`${row.label}-${index}`} className="px-5 py-4 text-center text-slate-700">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b17b00]">How AMC works</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Simple, reliable service coverage</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-5">
              {['Choose Your Plan', 'Select Your Product', 'Complete Payment', 'Receive AMC Contract', 'Request Service When Needed'].map((step, index) => (
                <div key={step} className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#FFF7DB] text-sm font-black text-[#b17b00]">{index + 1}</div>
                  <h3 className="text-base font-black text-[#071426]">{step}</h3>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#071426] py-12 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f4b400]">Frequently asked questions</p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">Common AMC questions</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['What is a HoneyVision AMC?', 'A HoneyVision AMC is an annual maintenance contract that covers preventive maintenance, technical support, and priority service for eligible security and technology systems.'],
                  ['Which products are eligible?', 'AMC eligibility is based on the selected plan and the purchased HoneyVision product or order. Coverage is verified on the backend before any payment is created.'],
                  ['How long is the AMC valid?', 'AMC plans are annual contracts, typically valid for 12 months from the activation date. The exact period is defined by the selected AMC plan in the database.'],
                  ['How many service visits are included?', 'Each AMC plan includes a specific number of service visits. The exact count is set by the AMC plan and displayed on the plan card and in your contract.'],
                  ['Can I purchase AMC for an existing product?', 'Yes, if the product was purchased and is eligible, and belongs to the authenticated customer’s paid order history.'],
                  ['What happens when my AMC expires?', 'When the AMC expires, the contract becomes inactive and new included service requests are no longer available until the plan is renewed or reactivated.'],
                  ['How do I request service?', 'After purchasing an AMC, go to My AMC, open the contract, and submit a service request. The request is then processed through the AMC service flow.'],
                ].map(([question, answer]) => (
                  <div key={question} className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-sm">
                    <h3 className="text-lg font-black text-white">{question}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-[28px] bg-gradient-to-r from-[#f4b400] to-[#f7d767] p-8 text-center text-[#071426] shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Ready for reliable support?</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Keep your HoneyVision systems protected year-round.</h2>
              <Link to="#plans" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-5 py-3 text-sm font-black text-white">Choose your AMC <ChevronRight size={18} /></Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
