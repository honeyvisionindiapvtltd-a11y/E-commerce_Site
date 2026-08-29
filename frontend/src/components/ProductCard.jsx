import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { money } from '../lib/products';
import { useCommerce } from '../context/index.js';
import { productIdOf } from '../lib/products';

export default function ProductCard({ product, onQuickView = () => {} }) {
  const { addToCart, toggleWishlist, wishlist } = useCommerce();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = Number(product.stock) <= 0;
  const supportEmail = 'support@honeyvision.in';
  const supportPhone = '919876543210';
  const requestMessage = encodeURIComponent(
    `Hi Honey Vision, I want to request the product "${product.name}". Please let me know if it is available or if you can suggest a similar alternative.`
  );

  const handleNotifySubmit = () => {
    const email = notifyEmail.trim();
    const text = encodeURIComponent(
      `Hi Honey Vision, I would like to be notified when "${product.name}" is available. ${email ? `My email is ${email}.` : ''} Please contact me.`
    );

    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(`Notify me: ${product.name}`)}&body=${text}`;
  };

  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={`absolute right-4 top-4 z-10 rounded-full p-2 ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}
      >
        <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
      </button>

      <div className="relative flex items-center justify-center bg-white h-44">
        <Link to={`/products/${product.id}`} className="w-full flex items-center justify-center">
          <img src={product.image} alt={product.name} className="max-h-36 w-full object-contain" loading="lazy" />
        </Link>
        <button onClick={() => onQuickView(product)} className="absolute top-3 right-12 rounded-full bg-white p-2 shadow-sm">
          <Star size={14} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{product.category?.name || product.categoryName || product.category || "General"}</p>
        <h3 className="mt-2 min-h-12 font-bold leading-6 text-slate-900 group-hover:text-amber-600">{product.name}</h3>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 font-semibold text-white">{product.rating} <Star size={12} fill="currentColor" /></span>
          <span className="text-slate-500">({product.reviews})</span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-xl font-extrabold text-slate-900">{money(product.price)}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="text-sm text-slate-400 line-through">{money(product.mrp)}</span>
          )}
        </div>

        <p className="mt-2 text-xs font-medium text-green-700">{product.delivery}</p>

        <div className="mt-4 flex gap-2">
          <button onClick={() => addToCart(productIdOf(product))} disabled={isOutOfStock} aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`} className="flex-1 rounded-lg bg-[#071426] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isOutOfStock ? 'Out of stock' : 'Add to cart'}</button>
          <button onClick={() => onQuickView(product)} aria-label={`Quick view ${product.name}`} className="w-12 rounded-lg border border-slate-200 bg-white">Quick</button>
        </div>

        {isOutOfStock && (
          <div className="mt-3 space-y-2">
            {!notifyOpen ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyOpen(true)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
                >
                  Notify me
                </button>
                <a
                  href={`https://wa.me/${supportPhone}?text=${requestMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-400"
                >
                  WhatsApp
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Email address</label>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(event) => setNotifyEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleNotifySubmit}
                    className="flex-1 rounded-lg bg-[#071426] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Send request
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifyOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
