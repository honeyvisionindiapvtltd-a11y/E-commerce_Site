
export default function Table({columns,rows,empty="No records found."}) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full min-w-[760px] text-left">
      <thead><tr className="border-b bg-slate-50">{columns.map(c=><th key={c.key} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wide text-slate-500">{c.label}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((r,i)=><tr key={r.id||i} className="border-b border-slate-100 hover:bg-slate-50">{columns.map(c=><td key={c.key} className="px-4 py-3 text-xs">{c.render?c.render(r):r[c.key]}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-slate-400">{empty}</td></tr>}</tbody>
    </table>
  </div>
}
