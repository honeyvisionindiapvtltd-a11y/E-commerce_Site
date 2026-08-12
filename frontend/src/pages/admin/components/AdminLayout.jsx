
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCommerce } from "../../../context/CommerceContext";
import {
  Activity, BarChart3, Bell, Box, ChevronDown, ClipboardList,
  CreditCard, FileText, HelpCircle, LayoutDashboard, LogOut, Menu,
  Package, Percent, Settings, ShieldCheck, ShoppingCart, Star, Truck,
  User, Users, X
} from "lucide-react";

const groups = [
  {title:"", items:[["Dashboard", "/admin", LayoutDashboard]]},
  {title:"STORE MANAGEMENT", items:[
    ["Products","/admin/products",Package],["Categories","/admin/categories",ClipboardList],
    ["Orders","/admin/orders",ShoppingCart],["Customers","/admin/customers",Users],
    ["Inventory","/admin/inventory",Box]
  ]},
  {title:"MARKETING", items:[["Coupons & Offers","/admin/coupons",Percent],["Reviews","/admin/reviews",Star]]},
  {title:"OPERATIONS", items:[["Delivery","/admin/delivery",Truck],["Payments","/admin/payments",CreditCard]]},
  {title:"CONTENT & REPORTS", items:[["Website & Blogs","/admin/blogs",FileText],["Reports","/admin/reports",BarChart3]]},
  {title:"ADMINISTRATION", items:[["Admin Users","/admin/admin-users",ShieldCheck],["Settings","/admin/settings",Settings]]}
];

export default function AdminLayout() {
  const [open,setOpen]=useState(false);
  const [profile,setProfile]=useState(false);
  const [notifications,setNotifications]=useState(false);
  const [searchTerm,setSearchTerm]=useState("");
  const location=useLocation();
  const navigate = useNavigate();
  const { logout } = useCommerce();

  const navItems = useMemo(() => groups.flatMap((group) => group.items), []);
  const activeTitle = useMemo(() => {
    const match = navItems.find(([, path]) => path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path));
    return match?.[0] || "Dashboard";
  }, [location.pathname, navItems]);

  const handleLogout = () => {
    logout();
    setProfile(false);
    setNotifications(false);
    navigate("/login", { replace: true });
  };

  const handleSearch = (event) => {
    if (event.key !== "Enter") return;

    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return;

    const match = navItems.find(([name]) =>
      name.toLowerCase().includes(normalized) || name.toLowerCase().replace(/[^a-z]/g, "").includes(normalized.replace(/\s+/g, ""))
    );

    if (match) {
      navigate(match[1], { replace: false });
      setSearchTerm("");
      setOpen(false);
      return;
    }

    navigate("/admin", { replace: false });
    setSearchTerm("");
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={()=>setOpen(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[235px] flex-col bg-[#031426] text-white transition-transform lg:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-amber-400 text-amber-400">✦</div>
        <div className="ml-3"><b className="text-sm">HONEY<span className="text-amber-400">VISION</span></b><p className="text-[8px] tracking-[3px] text-slate-400">ADMIN PANEL</p></div>
        <button className="ml-auto lg:hidden" onClick={()=>setOpen(false)}><X size={18}/></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g,i)=><div key={i} className={i?"mt-5":""}>
          {g.title && <p className="mb-2 px-3 text-[9px] font-semibold tracking-widest text-slate-500">{g.title}</p>}
          <div className="space-y-1">{g.items.map(([name,path,Icon])=>(
            <NavLink
              key={path}
              to={path}
              end={path === "/admin"}
              onClick={()=>setOpen(false)}
              className={({ isActive }) => {
                const active = isActive || (path !== "/admin" && location.pathname.startsWith(path));
                return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${active ? "bg-amber-400 font-semibold text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`;
              }}
            >
              <Icon size={16}/><span>{name}</span>
            </NavLink>
          ))}</div>
        </div>)}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-500"><User size={16}/></div>
          <div><p className="text-xs font-semibold">Admin</p><p className="text-[9px] text-slate-400">Super Administrator</p></div>
        </div>
        <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><LogOut size={15}/>Logout</button>
      </div>
    </aside>

    <div className="lg:pl-[235px] min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={()=>setOpen(true)}><Menu size={20}/></button><h1 className="text-lg font-semibold">{activeTitle}</h1></div>
        <div className="hidden w-72 md:flex items-center rounded-lg border bg-slate-50 px-3 py-2"><Activity size={15} className="text-slate-400"/><input value={searchTerm} onChange={(event)=>setSearchTerm(event.target.value)} onKeyDown={handleSearch} className="ml-2 w-full bg-transparent text-xs outline-none" placeholder="Search admin panel..."/></div>
        <div className="flex items-center gap-2">
          <button className="relative rounded-lg p-2 hover:bg-slate-100" onClick={()=>setNotifications(!notifications)}><Bell size={18}/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"/></button>
          <button className="hidden rounded-lg p-2 hover:bg-slate-100 sm:block"><HelpCircle size={18}/></button>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100" onClick={()=>setProfile(!profile)}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-500"><User size={16}/></div><span className="hidden text-xs font-semibold sm:block">Admin</span><ChevronDown size={14}/>
            </button>
            {profile && <div className="absolute right-0 top-11 w-44 rounded-xl border bg-white p-2 shadow-xl">
              <NavLink className="block rounded-lg px-3 py-2 text-xs hover:bg-slate-100" to="/admin/settings" onClick={()=>setProfile(false)}>Settings</NavLink>
              <button onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Logout</button>
            </div>}
          </div>
        </div>
      </header>
      {notifications && <div className="fixed right-4 top-20 z-40 w-72 rounded-xl border bg-white p-4 shadow-xl">
        <b className="text-sm">Notifications</b>
        <div className="mt-3 space-y-2 text-xs text-slate-600"><p className="rounded-lg bg-slate-50 p-3">New order received.</p><p className="rounded-lg bg-slate-50 p-3">7 products are low in stock.</p></div>
      </div>}
      <main className="p-4 sm:p-6"><Outlet/></main>
    </div>
  </div>;
}
