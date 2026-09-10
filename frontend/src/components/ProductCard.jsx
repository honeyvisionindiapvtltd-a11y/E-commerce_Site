import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { money } from '../lib/products';
import { useCommerce } from '../context/index.js';

export default function ProductCard({ product }) {
  const { toggleWishlist, wishlist } = useCommerce();
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = Number(product.stock) <= 0;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-100 bg-[#fffaf0] p-2.5 shadow-[0_4px_16px_rgba(7,20,38,.06)] transition hover:shadow-lg sm:rounded-2xl sm:border-slate-200/80 sm:bg-white sm:p-3 sm:shadow-sm sm:hover:-translate-y-1"
      style={{ filter: isOutOfStock ? "grayscale(1)" : "none" }}
    >
      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={`absolute right-3 top-3 z-10 rounded-full border border-slate-200/80 bg-white/95 p-1.5 shadow-sm transition-colors sm:right-4 sm:top-4 sm:p-2 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
      >
        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} className="sm:h-[18px] sm:w-[18px]" />
      </button>

      <div className="home-product-image relative flex aspect-square items-center justify-center overflow-hidden rounded-xl !bg-white p-3 sm:aspect-auto sm:h-36 sm:p-0">
        {isOutOfStock && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-red-600 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:bottom-3 sm:left-3 sm:text-[10px]">
            Out of stock
          </span>
        )}
        <Link to={`/products/${product.id}`} className="flex w-full items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105 sm:max-h-32"
            style={{ filter: isOutOfStock ? "grayscale(1)" : "none" }}
            loading="lazy"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3 sm:p-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-amber-600 sm:text-xs">{product.category?.name || product.categoryName || product.category || "General"}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-[13px] font-bold leading-[1.25rem] text-slate-900 group-hover:text-amber-600 sm:mt-2 sm:min-h-10 sm:text-base sm:leading-6">{product.name}</h3>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:mt-3 sm:gap-2 sm:text-sm">
          <span className="flex items-center gap-1 rounded-md bg-green-600 px-1.5 py-1 font-bold text-white sm:px-2">{product.rating} <Star size={10} fill="currentColor" className="sm:h-3 sm:w-3" /></span>
          <span className="text-slate-500">({product.reviews || 0})</span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-3">
          <span className="text-[17px] font-extrabold text-slate-900 sm:text-xl">{money(product.price)}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="text-[11px] text-slate-400 line-through sm:text-sm">{money(product.mrp)}</span>
          )}
        </div>

        <p className="mt-auto pt-2 text-[10px] font-semibold leading-4 text-emerald-700 sm:mt-2 sm:pt-0 sm:text-xs">{product.delivery}</p>

      </div>
    </article>
  );
}
