import { X } from 'lucide-react';
import { money } from '../lib/products';
import { useCommerce } from '../context/CommerceContext';

export default function QuickView({ product, onClose }) {
  const { addToCart } = useCommerce();
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="col-span-1 flex items-center justify-center">
            <img src={product.image} alt={product.name} className="h-44 object-contain" />
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-600">{product.description}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold">{money(product.price)}</span>
              {product.mrp && Number(product.mrp) > Number(product.price) && (
                <span className="text-sm line-through text-slate-400">{money(product.mrp)}</span>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => addToCart(product.id)} className="rounded-2xl bg-amber-500 px-4 py-2 font-semibold">Add to cart</button>
              <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2">View details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
