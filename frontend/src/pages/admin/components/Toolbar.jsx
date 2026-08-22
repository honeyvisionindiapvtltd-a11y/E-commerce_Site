import { Search } from "lucide-react";
export default function Toolbar({search,setSearch,filter,setFilter,options=[]}) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row">
    <div className="flex flex-1 items-center rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={15} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="ml-2 w-full text-xs outline-none"/></div>
    {options.length>0 && <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"><option>All</option>{options.map(o=><option key={o}>{o}</option>)}</select>}
  </div>
}