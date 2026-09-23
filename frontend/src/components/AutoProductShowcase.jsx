import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { money, normalizeProduct } from "../lib/products";

export default function AutoProductShowcase() {
  const { products } = useCommerce();
  const showcaseProducts = (Array.isArray(products) ? products : [])
    .map(normalizeProduct)
    .filter((product) => product?.id)
    .slice(0, 16);

  if (!showcaseProducts.length) return null;

  const scrollingProducts = [...showcaseProducts, ...showcaseProducts];

  return (
    <section className="overflow-hidden bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Explore the catalog</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#071426] sm:text-3xl">Popular products for every setup</h2>
          </div>
          <Link to="/products" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-amber-500 sm:text-sm">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="product-marquee" aria-label="Featured products">
          <div className="product-marquee-track">
            {scrollingProducts.map((product, index) => (
              <Link
                key={`${product.id}-${index}`}
                to={`/products/${product.id}`}
                className="group w-[180px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-1 hover:border-amber-300 hover:bg-white hover:shadow-lg sm:w-[230px] sm:p-4"
              >
                <div className="home-product-image flex h-28 items-center justify-center rounded-lg bg-white sm:h-36">
                  <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-2 transition group-hover:scale-105" />
                </div>
                <p className="mt-3 line-clamp-2 min-h-8 text-xs font-bold leading-4 text-slate-800 sm:text-sm">{product.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-[#071426]">{money(product.price)}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500"><Star size={11} fill="currentColor" /> {product.rating || "4.5"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
