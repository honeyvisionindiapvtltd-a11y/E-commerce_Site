import { Link } from 'react-router-dom';
import { money, normalizeProduct } from '../lib/products';

export default function PromotionsPanel({ products = [] }) {
  const recommended = products.slice(0, 4).map(normalizeProduct);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-rose-50 to-white p-3 shadow-sm">
          <img src="https://images.unsplash.com/photo-1526178616000-7f7b5a1f1b2d?auto=format&fit=crop&w=800&q=60" alt="promo" className="h-28 w-full object-cover" />
          <div className="mt-3 px-2">
            <h4 className="text-sm font-semibold text-slate-900">Special offer</h4>
            <p className="text-xs text-slate-600">Up to 40% off on selected items</p>
            <Link to="/offers" className="mt-3 inline-block rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950">Shop offers</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900">Recommended for you</h4>
          <div className="mt-3 grid gap-3">
            {recommended.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="h-12 w-12 object-contain" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-slate-900 line-clamp-1">{p.name}</div>
                  <div className="text-sm text-slate-700">{money(p.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
