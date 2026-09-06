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
    <article className="group relative rounded-none border-b border-r border-slate-200 bg-white p-2 shadow-none transition hover:shadow-lg sm:rounded-2xl sm:border sm:p-4 sm:shadow-sm sm:hover:-translate-y-1">
      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={`absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 sm:right-4 sm:top-4 sm:p-2 ${isWishlisted ? 'text-red-500' : 'text-slate-400'}`}
      >
        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} className="sm:h-[18px] sm:w-[18px]" />
      </button>

      <div className="relative flex h-52 items-center justify-center bg-white sm:h-44">
        <Link to={`/products/${product.id}`} className="flex w-full items-center justify-center">
          <img src={product.image} alt={product.name} className="max-h-48 w-full object-contain sm:max-h-36" loading="lazy" />
        </Link>
        <button onClick={() => onQuickView(product)} className="absolute right-10 top-2 rounded-full bg-white p-1.5 shadow-sm sm:right-12 sm:top-3 sm:p-2">
          <Star size={12} className="sm:h-[14px] sm:w-[14px]" />
        </button>
      </div>

      <div className="pt-2 sm:p-4">
        <p className="hidden text-[10px] font-semibold uppercase tracking-wide text-amber-600 sm:block sm:text-xs">{product.category?.name || product.categoryName || product.category || "General"}</p>
        <h3 className="mt-1 min-h-10 truncate text-sm font-normal leading-5 text-slate-900 group-hover:text-amber-600 sm:mt-2 sm:min-h-12 sm:font-bold sm:text-base sm:leading-6">{product.name}</h3>

        <div className="mt-1 flex items-center gap-2 text-xs sm:mt-3 sm:text-sm">
          <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 font-semibold text-white">{product.rating} <Star size={10} fill="currentColor" className="sm:h-3 sm:w-3" /></span>
          <span className="text-slate-500">({product.reviews})</span>
        </div>

        <div className="mt-2 flex items-end gap-2 sm:mt-3">
          <span className="text-lg font-extrabold text-slate-900 sm:text-xl">{money(product.price)}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="text-xs text-slate-400 line-through sm:text-sm">{money(product.mrp)}</span>
          )}
        </div>

        <p className="mt-1 text-[10px] font-medium text-green-700 sm:mt-2 sm:text-xs">{product.delivery}</p>

        <div className="mt-4 flex gap-2">
          <button onClick={() => addToCart(productIdOf(product))} disabled={isOutOfStock} aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`} className="flex-1 rounded-lg bg-[#071426] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-4 sm:py-2 sm:text-sm">{isOutOfStock ? 'Out of stock' : 'Add to cart'}</button>
          <button onClick={() => onQuickView(product)} aria-label={`Quick view ${product.name}`} className="w-11 rounded-lg border border-slate-200 bg-white px-1 py-2 text-[10px] font-semibold sm:w-12 sm:text-xs">Quick</button>
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
