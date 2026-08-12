import React from 'react'

export const inputClass = "w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none";

export function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold text-slate-600">{label}</div>
      <div>{children}</div>
    </label>
  );
}

export default Field;
