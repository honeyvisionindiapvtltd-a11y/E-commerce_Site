import { useState } from 'react';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import { money } from '../lib/products';

export default function ProductGrid({ products = [], gridView = true }) {
  const [quickProduct, setQuickProduct] = useState(null);

  const onQuickView = (product) => setQuickProduct(product);
  const closeQuick = () => setQuickProduct(null);

  return (
    <div>
      {gridView ? (
        <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3`}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} role="article" tabIndex={0} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <img src={p.image} alt={p.name} loading="lazy" className="h-28 w-28 flex-shrink-0 object-contain" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{p.category}</p>
                    <h3 className="mt-1 font-bold text-slate-900 line-clamp-2">{p.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">{money(p.price)}</div>
                    {p.mrp && Number(p.mrp) > Number(p.price) && <div className="text-sm text-slate-400 line-through">{money(p.mrp)}</div>}
                    <div className="mt-2 flex flex-col gap-2">
                      <button onClick={() => onQuickView(p)} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Quick view</button>
                      <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">Add to cart</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {quickProduct ? <QuickView product={quickProduct} onClose={closeQuick} /> : null}
    </div>
  );
}
