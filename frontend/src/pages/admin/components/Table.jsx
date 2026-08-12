import React from 'react'

export default function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[600px] text-left">
        <thead>
          <tr className="border-b bg-slate-50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-[10px] font-semibold text-slate-500">{col.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows && rows.length ? rows.map((row, idx) => (
            <tr key={row.id || idx} className="border-b hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[11px]">
                  {col.render ? col.render(row) : (row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          )) : (
            <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={columns.length}>No rows</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
