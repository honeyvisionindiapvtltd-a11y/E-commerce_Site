import { BellRing, Lock, ShieldCheck, UserCog } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const settings = [
  { title: "Profile Settings", description: "Update your name, contact details, address, and profile information.", icon: UserCog, to: "/edit-profile", action: "Edit profile" },
  { title: "Security Settings", description: "Review account verification and security alerts in your notification preferences.", icon: ShieldCheck, to: "/notifications", action: "Review security" },
  { title: "Password & Access", description: "Manage your password and recovery options.", icon: Lock, to: "/forgot-password", action: "Manage" },
  { title: "Alerts & Activity", description: "Manage notification preferences and review recent account activity.", icon: BellRing, to: "/notifications", action: "Manage alerts" },
];

export default function AccountSettings() {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-[#F5F7FA] py-10"><div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p><h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">Account Settings</h1></div><div className="grid gap-5 md:grid-cols-2">{settings.map(({ title, description, icon: Icon, to, action }) => <section key={title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7DB] text-[#D99D00]"><Icon size={22} /></div><h2 className="mt-5 text-xl font-bold text-[#071426]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><button type="button" onClick={() => navigate(to)} className="mt-5 rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]">{action}</button></section>)}</div><p className="mt-6 text-sm text-slate-500">Notification delivery preferences are managed in <Link className="font-semibold text-[#0B4162] underline" to="/notifications">Notifications</Link>.</p></div></main>;
}
