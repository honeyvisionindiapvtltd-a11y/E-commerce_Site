import React from 'react'

export default function Toolbar({ search = '', setSearch = () => {}, filter = '', setFilter = () => {}, options = [] }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-44 rounded-md border border-slate-200 px-3 py-1 text-sm outline-none"
      />

      {options && options.length ? (
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-sm">
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
