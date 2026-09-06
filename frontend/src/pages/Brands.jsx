import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { money, normalizeProduct } from "../lib/products";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const brandLogos = {
  Honeywell: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/Honeywell-Logo_cdkjfy.svg",
  Prizor: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/prizor-logo_x0zxl2.jpg",
  "CP Plus": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/cp_plus-logo_asuqmb.png",
  Dahua: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172595/Dahua_Technology_logo_veja1o.jpg",
  Dell: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172601/Dell_Logo_lmfwhj.png",
  Prama: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/prama-logo_pqskkz.png",
  Hikvision: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172596/Hikvision_logo_joawjl.png",
  HP: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172600/HP_LOGO_xkbqb1.png",
  DJI: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172591/DJI_logo_s90zht.png",
  "TP-Link": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172593/Tp-Link_logo_2016_tlbnnn.png",
  Samsung: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172590/Samsung_logo_nqxgxw.svg",
  Seagate: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172589/Seagate_logo_saaft5.svg",
  Lenovo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172599/Lenovo_logo__2015_onwards_z586id.png",
  ASUS: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172597/ASUS_Logo_pdifp0.svg",
};

const fallbackBrandLogo = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadBrands = async () => {
      try {
        let currentPage = 1;
        let allProducts = [];

        while (true) {
          const response = await fetch(`${API_BASE}/products?page=${currentPage}&limit=100`);
          if (!response.ok) {
            throw new Error("Failed to fetch brands");
          }

          const data = await response.json();
          const pageProducts = Array.isArray(data?.products) ? data.products : [];

          if (!pageProducts.length) break;

          allProducts = allProducts.concat(pageProducts);
          setProducts(pageProducts.map(normalizeProduct).slice(0, 4));

          const totalPages = Number(data?.totalPages || currentPage);
          if (currentPage >= totalPages) break;
          currentPage += 1;
        }

        const uniqueBrands = [...new Set(
          allProducts
            .map((product) => String(product?.brand || "").trim())
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));

        if (!ignore) {
          setBrands(
            uniqueBrands.map((name) => ({
              name,
              logo: brandLogos[name] || fallbackBrandLogo,
            }))
          );

          const normalizedProducts = allProducts
            .map(normalizeProduct)
            .filter(Boolean)
            .slice(0, 8);

          setProducts(normalizedProducts);
        }
      } catch (loadError) {
        console.error("Failed to load all brands:", loadError);
        if (!ignore) {
          setError("Unable to load brands right now.");
          setBrands([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBrands();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredBrands = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return brands;
    }

    return brands.filter((brand) => brand.name.toLowerCase().includes(normalized));
  }, [brands, query]);

  const brandCount = filteredBrands.length;
  const highlightProducts = products.slice(0, 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-800 to-[#1f2937] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.28),transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.22),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Trusted by modern buyers</p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Shop the brands you trust.</h1>
            <p className="mt-4 max-w-xl text-sm text-slate-200 sm:text-base">
              Discover premium technology, security, networking, and lifestyle brands curated for every need.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div className="text-2xl font-black text-amber-300">{loading ? "--" : brands.length}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">Brands</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div className="text-2xl font-black text-sky-300">100%</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">Live data</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-300">24/7</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">Shop ready</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search brands</label>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by brand name..."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
              <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="text-lg font-semibold text-slate-700">No brands match your search.</div>
          <p className="mt-2 text-sm text-slate-500">Try a different brand name or clear the search.</p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Showing <span className="font-bold text-slate-900">{brandCount}</span> brands
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Curated collection
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.name}
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-sky-400 opacity-0 transition group-hover:opacity-100" />
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-16 w-full object-contain transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = fallbackBrandLogo;
                    }}
                  />
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-base font-bold text-slate-800">{brand.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Explore products</p>
                </div>
                <div className="mt-4 flex items-center justify-center text-sm font-semibold text-amber-600 opacity-0 transition group-hover:opacity-100">
                  Shop now →
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {!loading && highlightProducts.length > 0 && (
        <section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Featured picks</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Popular products across brands</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-slate-700 hover:text-amber-600">
              View all products →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {highlightProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group min-w-[230px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
              >
                <div className="overflow-hidden rounded-2xl bg-white p-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-40 w-full rounded-xl object-contain transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.brand}</p>
                  <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-bold text-slate-800">{product.name}</h3>

                  <div className="mt-3 flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-semibold text-slate-700">{product.rating}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">{money(product.price)}</div>
                      {product.mrp > product.price && (
                        <div className="text-xs text-slate-400 line-through">{money(product.mrp)}</div>
                      )}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      In stock
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
