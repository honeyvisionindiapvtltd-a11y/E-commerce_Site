import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Headphones,
  Mail,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import {
  addSupportTicketMessage,
  createSupportTicket,
  getMySupportTickets,
  supportEmail,
} from "../services/supportService.js";

const categories = [
  { key: "orders", title: "My Orders", description: "Track, cancel, or get help with your order", icon: Package, keywords: "order track cancel", href: "/orders" },
  { key: "delivery", title: "Delivery & Tracking", description: "Track your shipment and delivery", icon: Truck, keywords: "delivery shipment tracking delayed", href: "/track-order" },
  { key: "installation", title: "Installation Support", description: "Get help with CCTV and product installation", icon: Wrench, keywords: "installation technician setup", href: "/installation" },
  { key: "returns", title: "Returns & Refunds", description: "Request a return or check your refund", icon: RotateCcw, keywords: "return refund replace damaged", href: "/support/tickets" },
  { key: "payments", title: "Payments", description: "Payment issues and transaction support", icon: CreditCard, keywords: "payment transaction razorpay card", href: "/orders" },
  { key: "warranty", title: "Warranty & AMC", description: "Warranty information and annual maintenance", icon: ShieldCheck, keywords: "warranty amc maintenance guarantee", href: "/warranty" },
  { key: "account", title: "Account & Login", description: "Login, password, and account help", icon: User, keywords: "account login password profile", href: "/profile" },
  { key: "technical", title: "Technical Support", description: "Help with HoneyVision products", icon: Headphones, keywords: "technical camera nvr product help", href: "/contact" },
  { key: "contact", title: "Contact Support", description: "Talk to our support team about any issue", icon: Mail, keywords: "contact human agent email support", href: "/contact" },
];

const faqs = [
  { category: "Orders", question: "How can I track my order?", answer: "Open your account and go to My Orders, then choose the order you want to track. The tracking page shows the latest status, shipment timeline, and delivery updates for a live order. If the item has not started moving yet, it may still be in processing or packed for dispatch." },
  { category: "Orders", question: "Can I cancel my order?", answer: "Yes, depending on the status of your order. Cancellation is usually available before fulfilment begins. If the order has already been packed or dispatched, the option may no longer be available and you can instead raise a support ticket for the next best step." },
  { category: "Orders", question: "How do I change my delivery address?", answer: "If the order has not been fulfilled yet, the address can often be updated from the order details or by contacting support. Include your order number and the correct address details so our team can review whether the delivery can be changed before the shipment is out for delivery." },
  { category: "Delivery", question: "How long will delivery take?", answer: "Delivery times vary by product type, destination, and serviceability in your area. You can check the estimated delivery window on the order page and the live tracking timeline. For local or installation-based orders, the timeline may also depend on technician scheduling." },
  { category: "Delivery", question: "What should I do if my order is delayed?", answer: "First, check the tracking page for the latest milestone and any shipping notes. If the delivery window has passed or the status has not moved for several days, use the support flow for that order and mention the delay so the team can investigate the courier or dispatch status." },
  { category: "Delivery", question: "What happens if I miss my delivery?", answer: "Most courier partners will retry delivery based on their standard process. If the item is returned to the warehouse or you need a new delivery window, contact support with the order number and we can help coordinate the next step. For large or installed products, the support team may also advise on alternate scheduling." },
  { category: "Returns", question: "How do I return a product?", answer: "Go to the order details page and choose the return option if the product is eligible. You’ll need to provide a reason, confirm the product condition, and follow the return request flow. Once the return is approved, the courier or warehouse process will be updated and the refund or replacement timeline will be communicated." },
  { category: "Returns", question: "When will I receive my refund?", answer: "Refund timing depends on the approved return, your original payment method, and the bank or payment gateway processing schedule. In most cases, you will receive an update once the return is approved and the refund is initiated. If the status is pending beyond the usual window, open a support ticket for an update." },
  { category: "Returns", question: "Which products are eligible for return?", answer: "Eligibility depends on product type, delivery condition, and our return policy at the time of purchase. Some products, especially custom or installed items, may not be eligible. You can check your order details to see whether the return option is available or contact support for a policy check." },
  { category: "Installation", question: "How do I book installation?", answer: "Installation can be booked while placing your order or later from the installation section in your account. Choose the date, confirm your location, and provide the service details. Once the booking is created, you’ll get the status updates and can reschedule if needed." },
  { category: "Installation", question: "How can I reschedule installation?", answer: "If the booking is not yet completed, you can usually reschedule from the installation details page. If a technician is already assigned or the service window is locked, contact support with your booking details so we can coordinate the next available time with the team." },
  { category: "Installation", question: "What should I do if the technician does not arrive?", answer: "Please contact support with the booking reference, order number, and the scheduled time. Our team can review the appointment status, contact the technician, and update the service timeline if there was a missed or delayed visit." },
  { category: "Warranty", question: "How do I claim warranty?", answer: "Keep your product invoice, model number, and purchase details ready, then contact support. We will check the warranty eligibility, confirm the coverage period, and advise the next step for repair, replacement, or service support." },
  { category: "Warranty", question: "What does HoneyVision warranty cover?", answer: "Warranty coverage differs by brand and product category, but it normally includes manufacturing defects and the product's stated service terms. Your invoice and product documentation contain the specific warranty details. If you are unsure, support can help confirm what is covered and what requires a paid service call." },
  { category: "Warranty", question: "How do I purchase AMC?", answer: "Annual Maintenance Contracts are available for eligible products and services. Contact the support team with the model, installation address, and the duration you need. We can recommend the right AMC package based on your equipment and operating environment." },
];

const orderIssues = [
  { key: "tracking", label: "Where is my order?" },
  { key: "delay", label: "Delivery is delayed" },
  { key: "missing", label: "Product not received" },
  { key: "cancel", label: "Cancel my order" },
  { key: "return", label: "Return or replace product" },
  { key: "payment", label: "Payment issue" },
  { key: "installation", label: "Installation issue" },
  { key: "damaged", label: "Product damaged" },
  { key: "other", label: "Other issue" },
];

const quickSuggestions = ["Track my order", "Cancel an order", "Installation help", "Return & refund", "Warranty", "Payment issue"];

const smartSuggestions = [
  { match: /not arriv|where.*order|track|delay|late/i, title: "Delivery help", text: "Check the latest delivery timeline before opening a ticket.", action: "Track Order", href: "/orders" },
  { match: /pay|charged|refund|transaction/i, title: "Payment help", text: "Payment status and refund timing are available in your order details.", action: "View Orders", href: "/orders" },
  { match: /install|technician|setup/i, title: "Installation help", text: "Find booking details or request assistance from our service team.", action: "Installation", href: "/installation/history" },
  { match: /warrant|camera|nvr|dvr|lock|technical/i, title: "Product support", text: "Have your model and invoice details ready for faster technical support.", action: "Product Support", href: "#categories" },
];

const faqCategoryByKey = {
  orders: "Orders",
  delivery: "Delivery",
  installation: "Installation",
  returns: "Returns",
  warranty: "Warranty",
};

const formatMoney = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount || 0));
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Date unavailable";

export default function Support() {
  const { isLoggedIn, orders, installationBookings, requestJson } = useCommerce();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [contactMode, setContactMode] = useState(null);
  const [ordersState, setOrdersState] = useState({ status: isLoggedIn ? "loading" : "idle", message: "" });
  const [liveOrders, setLiveOrders] = useState([]);
  const [ticketsState, setTicketsState] = useState({ status: isLoggedIn ? "loading" : "idle", tickets: [] });

  const loadOrders = async () => {
    if (!isLoggedIn) {
      setOrdersState({ status: "idle", message: "" });
      setLiveOrders([]);
      return;
    }
    setOrdersState({ status: "loading", message: "" });
    try {
      const data = await requestJson("/orders/my-orders");
      const nextOrders = Array.isArray(data) ? data : data.orders || [];
      setLiveOrders(nextOrders);
      setOrdersState({ status: "success", message: "" });
    } catch {
      setOrdersState({ status: "error", message: "" });
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    requestJson("/orders/my-orders")
      .then((data) => {
        const nextOrders = Array.isArray(data) ? data : data.orders || [];
        setLiveOrders(nextOrders);
        setOrdersState({ status: "success", message: "" });
      })
      .catch(() => setOrdersState({ status: "error", message: "" }));
  }, [isLoggedIn, requestJson]);

  const loadTickets = async () => {
    if (!isLoggedIn) {
      setTicketsState({ status: "idle", tickets: [] });
      return;
    }
    setTicketsState((current) => ({ ...current, status: "loading" }));
    try {
      const data = await getMySupportTickets(requestJson);
      setTicketsState({ status: "success", tickets: data.tickets || [] });
    } catch {
      setTicketsState({ status: "error", tickets: [] });
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    getMySupportTickets(requestJson)
      .then((data) => setTicketsState({ status: "success", tickets: data.tickets || [] }))
      .catch(() => setTicketsState({ status: "error", tickets: [] }));
  }, [isLoggedIn, requestJson]);

  const recentOrders = useMemo(() => {
    const source = liveOrders.length ? liveOrders : (orders || []);
    return [...source].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)).slice(0, 5);
  }, [liveOrders, orders]);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return { categories, faqs: [] };
    return {
      categories: categories.filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(term)),
      faqs: faqs.filter((item) => `${item.category} ${item.question} ${item.answer}`.toLowerCase().includes(term)),
    };
  }, [query]);

  const visibleFaqs = useMemo(() => {
    if (activeCategory !== "all") {
      const category = categories.find((item) => item.key === activeCategory);
      return faqs.filter((item) => item.category === faqCategoryByKey[category?.key]);
    }
    return faqs;
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#071426]">
      <section className="relative overflow-hidden bg-[#071426]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_25%,rgba(244,180,0,.2),transparent_28%),linear-gradient(120deg,#071426,#0c2e4c)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-[#f4b400]"><Headphones size={17} /> HoneyVision Care</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">How can we help you?</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Find quick answers, manage your orders, or get help from the HoneyVision support team.</p>
            <div className="mt-8 flex max-w-3xl items-center rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
              <Search className="ml-3 shrink-0 text-slate-400" size={22} aria-hidden="true" />
              <label className="sr-only" htmlFor="support-search">Search support</label>
              <input id="support-search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none sm:text-base" placeholder="Search for help with orders, delivery, returns, payments..." />
              {query && <button type="button" onClick={() => setQuery("")} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Clear support search"><X size={19} /></button>}
            </div>
            <div className="mt-4 flex max-w-3xl flex-wrap gap-2" aria-label="Popular support searches">
              {quickSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:border-[#f4b400] hover:bg-[#f4b400] hover:text-[#071426]">{suggestion}</button>)}
            </div>
            {query && <SmartSuggestions query={query} />}
            {query && <SearchResults results={searchResults} onCategorySelect={(key) => { setActiveCategory(key); setQuery(""); }} />}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <section id="categories">
          <SectionHeading eyebrow="Start here" title="What do you need help with?" subtitle="Choose a topic and get to the right answer in a few clicks." />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => <CategoryCard key={category.key} category={category} active={activeCategory === category.key} onClick={() => setActiveCategory(category.key === activeCategory ? "all" : category.key)} />)}
          </div>
        </section>

        <section id="orders" className="scroll-mt-6">
          <SectionHeading eyebrow="Personalized help" title="Need help with an order?" subtitle="Select an order to get support from the right context." />
          {!isLoggedIn ? <SignInPrompt /> : ordersState.status === "loading" ? <OrderSkeleton /> : ordersState.status === "error" ? <InlineError onRetry={loadOrders} /> : recentOrders.length === 0 ? <EmptyOrders /> : <div className="mt-6 grid gap-4 lg:grid-cols-2">{recentOrders.map((order) => <OrderCard key={order.orderNumber || order._id || order.id} order={order} onHelp={() => setSelectedOrder(order)} />)}</div>}
        </section>

        <section id="faqs" className="scroll-mt-6">
          <SectionHeading eyebrow="Self-service" title="Frequently Asked Questions" subtitle="Clear answers for the moments that matter." />
          <div className="mt-6 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div className="h-fit rounded-3xl bg-[#071426] p-6 text-white sm:p-8"><CircleHelp className="text-[#f4b400]" size={30} /><h3 className="mt-8 text-2xl font-black">Fast answers, less waiting.</h3><p className="mt-3 text-sm leading-6 text-slate-300">Search above or filter the FAQ list by choosing a help category.</p><button type="button" onClick={() => { setActiveCategory("all"); document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#f4b400]">Browse categories <ArrowRight size={16} /></button></div>
            <div className="space-y-3">{visibleFaqs.map((faq) => <FAQItem key={faq.question} faq={faq} />)}</div>
          </div>
        </section>

        <ContactSupport onModeChange={setContactMode} />

        {isLoggedIn && <SupportTickets state={ticketsState} onRetry={loadTickets} requestJson={requestJson} onChanged={loadTickets} />}
      </div>

      {selectedOrder && <OrderSupportModal order={selectedOrder} installationBookings={installationBookings} requestJson={requestJson} onTicketCreated={loadTickets} onClose={() => setSelectedOrder(null)} />}
      {contactMode === "callback" && <CallbackModal onClose={() => setContactMode(null)} />}
      {contactMode === "chat" && <UnavailableModal title="Chat support" message="Live chat is not connected yet. Please email the support team and include your order number when applicable." onClose={() => setContactMode(null)} />}
    </main>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) { return <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#071426] sm:text-4xl">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p></div>; }
function CategoryCard({ category, active, onClick }) {
  const Icon = category.icon;
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
    if (category.href) {
      navigate(category.href);
    }
  };

  return <button type="button" onClick={handleClick} className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400] ${active ? "border-[#f4b400] bg-[#fff8df]" : "border-slate-200 bg-white"}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${active ? "bg-[#f4b400] text-[#071426]" : "bg-[#edf3f7] text-[#0b4162]"}`}><Icon size={22} /></span><span className="mt-5 block text-base font-extrabold">{category.title}</span><span className="mt-2 block text-sm leading-5 text-slate-500">{category.description}</span><span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#0b4162]">Explore help <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></button>;
}
function SearchResults({ results, onCategorySelect }) { if (!results.categories.length && !results.faqs.length) return <div className="mt-3 rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-lg"><p className="font-bold text-slate-900">We couldn't find an answer.</p><p className="mt-1">Try another phrase or browse help categories below.</p></div>; return <div className="mt-3 grid gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-lg sm:grid-cols-2">{results.categories.slice(0, 4).map((item) => <button type="button" key={item.key} onClick={() => onCategorySelect(item.key)} className="rounded-xl bg-slate-50 p-3 text-left hover:bg-[#fff8df]"><span className="text-sm font-extrabold">{item.title}</span><span className="mt-1 block text-xs text-slate-500">Support category</span></button>)}{results.faqs.slice(0, 4).map((item) => <a key={item.question} href="#faqs" className="rounded-xl bg-slate-50 p-3 text-left hover:bg-[#fff8df]"><span className="text-sm font-extrabold">{item.question}</span><span className="mt-1 block text-xs text-slate-500">{item.category} FAQ</span></a>)}</div>; }
function SmartSuggestions({ query }) { const suggestion = smartSuggestions.find((item) => item.match.test(query)); if (!suggestion) return null; return <div className="mt-3 max-w-3xl rounded-2xl border border-[#f4b400]/30 bg-[#fff8df] p-4 text-[#071426] shadow-lg"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-[#b27800]" size={19} /><div className="min-w-0"><p className="text-sm font-black">Suggested solution: {suggestion.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{suggestion.text}</p><Link to={suggestion.href} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#0b4162]">{suggestion.action} <ArrowRight size={13} /></Link></div></div></div>; }
function SignInPrompt() { return <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#f2d67a] bg-[#fff8df] p-6 sm:flex-row sm:items-center sm:p-8"><div><h3 className="text-lg font-black">Sign in to get help with your orders</h3><p className="mt-2 text-sm text-slate-600">Your order history and support options will appear here.</p></div><Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#071426] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0d3150]">Sign In <ArrowRight size={16} /></Link></div>; }
function OrderSkeleton() { return <div className="mt-6 grid gap-4 lg:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-slate-200" />)}</div>; }
function InlineError({ onRetry }) { return <div className="mt-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><span>We couldn't load your support information.</span><button type="button" onClick={onRetry} className="font-bold underline">Try Again</button></div>; }
function EmptyOrders() { return <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><Package className="mx-auto text-slate-300" size={35} /><h3 className="mt-3 font-black">You don't have any recent orders.</h3><Link to="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0b4162]">Continue Shopping <ArrowRight size={15} /></Link></div>; }
function OrderCard({ order, onHelp }) { const item = order.items?.[0] || {}; const image = item.product?.thumbnail || item.thumbnail || item.image; return <article className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"><div className="flex min-w-0 gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">{image ? <img src={image} alt="" className="h-full w-full object-contain" /> : <Package className="text-slate-400" size={25} />}</div><div className="min-w-0"><p className="truncate font-extrabold">{item.product?.name || item.name || "HoneyVision order"}</p><p className="mt-1 text-xs text-slate-500">Order {order.orderNumber || order.id || "Unavailable"}</p><p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)} <span className="px-1">·</span> {formatMoney(order.totalAmount ?? order.total)}</p><span className="mt-2 inline-flex rounded-full bg-[#e8f4ed] px-2.5 py-1 text-xs font-bold text-emerald-700">{String(order.status || order.paymentStatus || "In progress").replaceAll("_", " ")}</span></div></div><button type="button" onClick={onHelp} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#0d3150]">Get Help <ArrowRight size={16} /></button></article>; }
function FAQItem({ faq }) { const [open, setOpen] = useState(false); return <div className="rounded-2xl border border-slate-200 bg-white"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-5 text-left font-extrabold"><span><span className="mr-2 text-xs font-black uppercase tracking-wide text-[#b27800]">{faq.category}</span>{faq.question}</span><ChevronDown className={`shrink-0 transition ${open ? "rotate-180" : ""}`} size={19} /></button>{open && <div className="px-5 pb-5 text-sm leading-6 text-slate-600">{faq.answer}</div>}</div>; }
function ContactSupport({ onModeChange }) { return <section className="rounded-3xl bg-[#0b3150] p-6 text-white sm:p-9"><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#f4b400]">Human support</p><h2 className="mt-2 text-3xl font-black">Still need help?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Our support team is here to help you. Choose the channel that works best for your issue.</p></div><div className="grid gap-3 sm:grid-cols-3"><ContactOption icon={MessageCircle} title="Chat Support" description="Chat with our team" action="Start Chat" onClick={() => window.dispatchEvent(new Event("honeyvision:open-chat"))} /><ContactOption icon={Phone} title="Call Support" description="Request a callback" action="Request a Call" onClick={() => onModeChange("callback")} /><ContactOption icon={Mail} title="Email Support" description="Send your issue" action="Send Email" href={`mailto:${supportEmail}`} /></div></div></section>; }
function ContactOption({ icon: Icon, title, description, action, onClick, href }) { const content = <><Icon className="text-[#f4b400]" size={22} /><p className="mt-4 text-sm font-extrabold">{title}</p><p className="mt-1 text-xs text-slate-300">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f4b400]">{action} <ArrowRight size={13} /></span></>; return href ? <a href={href} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">{content}</a> : <button type="button" onClick={onClick} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10">{content}</button>; }
function SupportTickets({ state, onRetry, requestJson, onChanged }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Your support history</p><h2 className="mt-2 text-2xl font-black">My Support Requests</h2><p className="mt-2 text-sm text-slate-500">Follow replies and status updates in one place.</p></div><Link to="/support/tickets" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-[#0b4162] hover:border-[#f4b400]">View all <ArrowRight size={16} /></Link></div>{state.status === "loading" ? <div className="mt-6 h-24 animate-pulse rounded-2xl bg-slate-100" /> : state.status === "error" ? <InlineError onRetry={onRetry} /> : state.tickets.length ? <div className="mt-6 space-y-3">{state.tickets.slice(0, 3).map((ticket) => <TicketRow key={ticket.ticketNumber} ticket={ticket} requestJson={requestJson} onChanged={onChanged} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">You have no support requests yet. Choose Get Help on an order to create one.</div>}</section>; }
function TicketRow({ ticket, requestJson, onChanged }) { const [open, setOpen] = useState(false); const [message, setMessage] = useState(""); const [feedback, setFeedback] = useState(""); const submit = async (event) => { event.preventDefault(); if (!message.trim()) return; try { await addSupportTicketMessage(requestJson, ticket.ticketNumber, message); setMessage(""); setFeedback("Reply sent."); setOpen(false); onChanged(); } catch { setFeedback("We couldn't send your reply."); } }; return <article className="rounded-2xl border border-slate-200 p-4"><button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left"><span><span className="block text-xs font-black uppercase tracking-wide text-[#b27800]">{ticket.ticketNumber}</span><span className="mt-1 block font-extrabold">{ticket.subject}</span><span className="mt-1 block text-xs text-slate-500">{ticket.category} {ticket.orderNumber && `· Order ${ticket.orderNumber}`}</span></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{ticket.status}</span></button>{open && <form onSubmit={submit} className="mt-4 border-t border-slate-100 pt-4"><p className="text-sm leading-6 text-slate-600">{ticket.description}</p><label className="mt-4 grid gap-2 text-sm font-bold">Add a message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#0b4162]" /></label><button type="submit" className="mt-3 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-bold text-white">Send Reply</button>{feedback && <p className="mt-2 text-sm font-bold text-slate-600">{feedback}</p>}</form>}</article>; }

function OrderSupportModal({ order, installationBookings = [], requestJson, onTicketCreated, onClose }) {
  const [issue, setIssue] = useState(null);
  const [state, setState] = useState({ status: "idle", message: "" });
  useEffect(() => { const handler = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]);
  const orderNumber = order.orderNumber || order.id;
  const trackingUrl = `/orders/${encodeURIComponent(orderNumber)}/tracking`;
  const createTicket = async () => {
    if (!issue) return;
    setState({ status: "loading", message: "" });
    const selectedIssue = orderIssues.find((item) => item.key === issue);
    try {
      await createSupportTicket(requestJson, {
        category: issue === "tracking" || issue === "delay" || issue === "missing" ? "DELIVERY" : issue === "return" || issue === "damaged" ? "RETURNS" : issue === "installation" ? "INSTALLATION" : issue === "payment" ? "PAYMENTS" : "ORDERS",
        subject: selectedIssue?.label || "Order support request",
        description: `Customer requested help with: ${selectedIssue?.label || "Other issue"}`,
        orderNumber,
      });
      await onTicketCreated();
      setState({ status: "success", message: "Support ticket created." });
    } catch (error) {
      setState({ status: "error", message: error.message || "We couldn't create the support ticket." });
    }
  };
  const submitReturn = async () => { setState({ status: "loading", message: "" }); try { await requestJson(`/returns/${encodeURIComponent(orderNumber)}`, { method: "POST", body: JSON.stringify({ reason: "Customer requested a return or replacement" }) }); setState({ status: "success", message: "Return request submitted successfully." }); } catch (error) { setState({ status: "error", message: error.message || "We couldn't submit the return request." }); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="order-support-title"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Order support</p><h2 id="order-support-title" className="mt-2 text-2xl font-black">What can we help with?</h2><p className="mt-1 text-sm text-slate-500">Order {orderNumber}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Close order support dialog"><X size={21} /></button></div><div className="mt-6 grid gap-2 sm:grid-cols-2">{orderIssues.map((item) => <button type="button" key={item.key} onClick={() => { setIssue(item.key); setState({ status: "idle", message: "" }); }} className={`rounded-xl border p-3 text-left text-sm font-bold transition ${issue === item.key ? "border-[#f4b400] bg-[#fff8df]" : "border-slate-200 hover:border-slate-400"}`}>{item.label}</button>)}</div>{issue && <IssuePanel issue={issue} order={order} trackingUrl={trackingUrl} installationBookings={installationBookings} onReturn={submitReturn} onCreateTicket={createTicket} state={state} />}</div></div>;
}
function IssuePanel({ issue, order, trackingUrl, installationBookings, onReturn, onCreateTicket, state }) { if (issue === "tracking" || issue === "delay" || issue === "missing") return <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-black">Current order status</h3><p className="mt-2 text-sm text-slate-600">{String(order.status || order.paymentStatus || "In progress").replaceAll("_", " ")}. Delivery details and the latest timeline are available on the tracking page.</p><Link to={trackingUrl} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-bold text-white">Track Order <ArrowRight size={16} /></Link><button type="button" onClick={onCreateTicket} disabled={state.status === "loading"} className="ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border border-[#071426] px-4 py-3 text-sm font-bold text-[#071426] disabled:opacity-60">{state.status === "loading" ? "Creating..." : "Create Ticket"} <Send size={16} /></button>{state.message && <p className="mt-3 text-sm font-bold text-emerald-700">{state.message}</p>}</div>; if (issue === "return" || issue === "damaged") return <div className="mt-6 rounded-2xl bg-[#fff8df] p-5"><h3 className="font-black">Return eligibility</h3><p className="mt-2 text-sm leading-6 text-slate-600">Returns are available only for eligible delivered orders. Submit a request using the secure return service.</p><button type="button" onClick={onReturn} disabled={state.status === "loading"} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{state.status === "loading" ? "Submitting..." : "Request Return"} <RotateCcw size={16} /></button><button type="button" onClick={onCreateTicket} disabled={state.status === "loading"} className="ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border border-[#071426] px-4 py-3 text-sm font-bold text-[#071426] disabled:opacity-60">Create Ticket <Send size={16} /></button>{state.message && <p className={`mt-3 text-sm font-bold ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p>}</div>; if (issue === "installation") return <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-black">Installation support</h3><p className="mt-2 text-sm leading-6 text-slate-600">{installationBookings.length ? `You have ${installationBookings.length} installation booking(s) on record.` : "No installation booking is linked in the current session."}</p><Link to="/installation/history" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-bold text-white">Get Installation Help <Wrench size={16} /></Link><button type="button" onClick={onCreateTicket} disabled={state.status === "loading"} className="ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border border-[#071426] px-4 py-3 text-sm font-bold text-[#071426] disabled:opacity-60">Create Ticket <Send size={16} /></button>{state.message && <p className="mt-3 text-sm font-bold text-emerald-700">{state.message}</p>}</div>; if (issue === "payment") return <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-black">Payment support</h3><p className="mt-2 text-sm leading-6 text-slate-600">Payment status: {order.paymentStatus || "Not available"}. The support team can help investigate transaction issues without exposing sensitive payment data.</p><a href={`mailto:${supportEmail}?subject=Payment%20issue%20for%20${encodeURIComponent(order.orderNumber || order.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-bold text-white">Contact by Email <Mail size={16} /></a><button type="button" onClick={onCreateTicket} disabled={state.status === "loading"} className="ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border border-[#071426] px-4 py-3 text-sm font-bold text-[#071426] disabled:opacity-60">Create Ticket <Send size={16} /></button>{state.message && <p className="mt-3 text-sm font-bold text-emerald-700">{state.message}</p>}</div>; return <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-black">Let us look into it</h3><p className="mt-2 text-sm leading-6 text-slate-600">Include your order number when contacting support so the team can investigate quickly.</p><button type="button" onClick={onCreateTicket} disabled={state.status === "loading"} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{state.status === "loading" ? "Creating..." : "Create Ticket"} <Send size={16} /></button>{state.message && <p className={`mt-3 text-sm font-bold ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p>}</div>; }
function CallbackModal({ onClose }) { const [form, setForm] = useState({ name: "", phone: "", time: "", issue: "" }); const [message, setMessage] = useState(""); useEffect(() => { const handler = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]); const submit = (event) => { event.preventDefault(); if (!form.name.trim() || !/^\+?[0-9\s-]{10,}$/.test(form.phone.trim()) || !form.time || !form.issue.trim()) { setMessage("Please complete all fields with a valid phone number."); return; } setMessage("Callback requests are not connected yet. Please email support to reach the team."); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="callback-title"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Call support</p><h2 id="callback-title" className="mt-2 text-2xl font-black">Request a call</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Close callback form"><X size={21} /></button></div><div className="mt-6 grid gap-4"><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} type="tel" /><label className="grid gap-2 text-sm font-bold text-slate-700">Preferred time<select value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#0b4162]"><option value="">Choose a time</option><option>9:00 AM - 12:00 PM</option><option>12:00 PM - 3:00 PM</option><option>3:00 PM - 6:00 PM</option></select></label><Field label="Issue summary" value={form.issue} onChange={(value) => setForm({ ...form, issue: value })} textarea /></div>{message && <p className="mt-4 rounded-xl bg-[#fff8df] p-3 text-sm font-bold text-slate-700">{message}</p>}<button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#071426] px-5 py-3 font-extrabold text-white hover:bg-[#0d3150]">Check Request <Phone size={16} /></button></form></div>; }
function UnavailableModal({ title, message, onClose }) { useEffect(() => { const handler = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]); return <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="unavailable-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Support integration</p><h2 id="unavailable-title" className="mt-2 text-2xl font-black">{title}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label={`Close ${title} dialog`}><X size={21} /></button></div><p className="mt-5 text-sm leading-6 text-slate-600">{message}</p><a href={`mailto:${supportEmail}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-5 py-3 text-sm font-extrabold text-white">Email Support <Mail size={16} /></a></div></div>; }
function Field({ label, value, onChange, type = "text", textarea = false }) { const Tag = textarea ? "textarea" : "input"; return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}<Tag type={textarea ? undefined : type} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-[#0b4162]" /></label>; }
