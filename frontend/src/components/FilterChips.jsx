import { X } from 'lucide-react';

export default function FilterChips({ chips = [], onRemove = () => {}, onClear = () => {} }) {
  if (!chips.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button key={c.key} onClick={() => onRemove(c)} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
          <span>{c.label}</span>
          <X size={12} />
        </button>
      ))}
      <button onClick={onClear} aria-label="Clear all filters" className="ml-2 text-sm text-slate-500 underline">Clear all</button>
    </div>
  );
}
