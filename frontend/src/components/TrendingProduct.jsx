import { Heart, Star, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { money } from "../lib/products";

export default function TrendingProducts() {
  const { addToCart, toggleWishlist, wishlist, products } = useCommerce();
  const trendingProducts = products.slice(0, 6);

  return (
    <section className="w-full px-3 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Trending Products</h2>

        <Link
          to="/products"
          className="text-sm font-semibold text-blue-600 hover:text-amber-500"
        >
          View All Products →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {trendingProducts.map((product) => {
          const isWishlisted = wishlist.includes(product.id);
          const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

          return (
            <article
              key={product.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
            >
              <span className="absolute left-3 top-3 rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                {discount}% OFF
              </span>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute right-3 top-3 rounded-full p-2 ${isWishlisted ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400 hover:text-red-500"}`}
                aria-label={`Add ${product.name} to wishlist`}
              >
                <Heart size={19} fill={isWishlisted ? "currentColor" : "none"} />
              </button>

              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="mt-5 h-35 w-full object-contain transition group-hover:scale-105"
                />

                <h3 className="mt-4 min-h-10 text-sm font-semibold text-slate-800">
                  {product.name}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {money(product.price)}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    {money(product.mrp)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-1 text-xs text-slate-500">
                    ({product.reviews})
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => addToCart(product.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ShoppingCart size={16} />
                Add to cart
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}