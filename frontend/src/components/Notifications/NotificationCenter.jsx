import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationCenter() {
  return <Link to="/notifications" aria-label="Open notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600"><Bell size={18} /></Link>;
}