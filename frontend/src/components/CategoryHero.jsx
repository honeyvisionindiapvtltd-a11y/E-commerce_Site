import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategoryHero({ title = 'Products', subtitle = '', image = '' }) {
  return (
    <div className="mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 to-white p-6 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <span>{title}</span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-600 max-w-2xl">{subtitle}</p>}
          <div className="mt-4 flex gap-3">
            <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Shop now</button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">View offers</button>
          </div>
        </div>
        {image ? (
          <div className="hidden sm:block">
            <img src={image} alt={title} className="h-28 w-48 object-contain" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
