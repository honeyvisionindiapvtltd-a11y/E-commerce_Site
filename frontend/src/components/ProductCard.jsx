import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { money } from '../lib/products';
import { useCommerce } from '../context/CommerceContext';

export default function ProductCard({ product, onQuickView = () => {} }) {
  const { addToCart, toggleWishlist, wishlist } = useCommerce();
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = Number(product.stock) <= 0;

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
          <button onClick={() => addToCart(product.id)} disabled={isOutOfStock} aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`} className="flex-1 rounded-lg bg-[#071426] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isOutOfStock ? 'Out of stock' : 'Add to cart'}</button>
          <button onClick={() => onQuickView(product)} aria-label={`Quick view ${product.name}`} className="w-12 rounded-lg border border-slate-200 bg-white">Quick</button>
        </div>
      </div>
    </article>
  );
}
