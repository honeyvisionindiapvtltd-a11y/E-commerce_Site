import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Plus,
  Search,
  Scale,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { money, products as catalogProducts } from "../lib/products";

const comparePool = catalogProducts.slice(0, 8).map((product) => ({
  ...product,
  oldPrice: product.mrp,
  discount: `${Math.max(8, Math.round(((product.mrp - product.price) / product.mrp) * 100))}% OFF`,
  specs: {
    Brand: product.brand,
    Category: product.category,
    Price: money(product.price),
    MRP: money(product.mrp),
    Rating: `${product.rating} / 5`,
    Reviews: `${product.reviews} reviews`,
    Delivery: product.delivery,
    Stock: `${product.stock} in stock`,
    Features: product.features.join(", "),
    Description: product.description,
    Installation: product.installationEligible ? "Eligible" : "Not eligible",
  },
}));

export default function CompareProducts() {
  const { addToCart, toggleWishlist, wishlist } = useCommerce();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState([]);

  const urlSelectedIds = useMemo(() => {
    const urlIds = searchParams.getAll("compare");
    const fallbackId = searchParams.get("product");
    return [...new Set([...urlIds, fallbackId].filter(Boolean))].slice(0, 3);
  }, [searchParams]);

  const selectedIds = useMemo(
    () => [...new Set([...urlSelectedIds, ...localSelectedIds])].slice(0, 3),
    [localSelectedIds, urlSelectedIds]
  );

  const selectedProducts = useMemo(
    () => selectedIds.map((id) => comparePool.find((product) => product.id === id)).filter(Boolean),
    [selectedIds]
  );

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return comparePool.filter((product) => !selectedIds.includes(product.id));
    }

    return comparePool.filter(
      (product) =>
        !selectedIds.includes(product.id) &&
        (product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term))
    );
  }, [searchTerm, selectedIds]);

  const specKeys = useMemo(() => {
    if (!selectedProducts.length) return [];

    const keys = new Set();
    selectedProducts.forEach((product) =>
      Object.keys(product.specs).forEach((key) => keys.add(key))
    );

    return Array.from(keys);
  }, [selectedProducts]);

  const syncSelectionToUrl = (nextIds) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compare");
    params.delete("product");

    nextIds.forEach((id) => params.append("compare", id));

    const search = params.toString();
    navigate({ pathname: "/compare", search: search ? `?${search}` : "" }, { replace: true });
  };

  const addProduct = (product) => {
    if (selectedIds.length >= 3) {
      alert("You can compare up to 3 products at a time.");
      return;
    }

    if (selectedIds.includes(product.id)) return;

    const nextIds = [...new Set([...selectedIds, product.id])];
    setLocalSelectedIds(nextIds.filter((id) => !urlSelectedIds.includes(id)));
    syncSelectionToUrl(nextIds);
    setSearchTerm("");
  };

  const removeProduct = (productId) => {
    const nextIds = selectedIds.filter((id) => id !== productId);
    setLocalSelectedIds([]);
    syncSelectionToUrl(nextIds);
  };

  const clearAll = () => {
    setLocalSelectedIds([]);
    syncSelectionToUrl([]);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm text-slate-500">Comparison</p>
              <h1 className="text-3xl font-bold text-slate-950">Compare Products</h1>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          )}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products to compare..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            />

            {searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {filteredProducts.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-amber-50"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-500">
                            {product.brand}
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">
                            {money(product.price)}
                          </p>
                        </div>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                          <Plus size={18} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No matching products found.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {selectedProducts.length > 0 ? (
            selectedProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative bg-slate-100 p-4">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className={`absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full ${
                        isWishlisted ? "bg-red-50 text-red-500" : "bg-white text-slate-500 hover:text-red-500"
                      }`}
                      aria-label={`Toggle wishlist for ${product.name}`}
                    >
                      <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                    <Link to={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="mx-auto h-44 w-full object-contain"
                      />
                    </Link>
                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      {product.discount}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                      {product.brand}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="mt-2 block text-lg font-bold text-slate-900 hover:text-amber-600"
                    >
                      {product.name}
                    </Link>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                        <Star size={12} fill="currentColor" className="text-green-700" />
                        {product.rating}
                      </div>
                      <span className="text-xs text-slate-500">({product.reviews} reviews)</span>
                    </div>

                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-950">
                        {money(product.price)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        {money(product.mrp)}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <ShoppingCart size={16} />
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:text-red-500"
                        aria-label={`Remove ${product.name}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Scale size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">No products selected</h2>
              <p className="mt-2 text-slate-500">
                Choose at least two products to compare features, pricing, and delivery details.
              </p>
            </div>
          )}
        </div>

        {selectedProducts.length > 1 && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Specification comparison</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="min-w-55 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Feature
                    </th>
                    {selectedProducts.map((product) => (
                      <th
                        key={product.id}
                        className="min-w-55 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-700"
                      >
                        {product.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specKeys.map((key) => (
                    <tr key={key} className="border-t border-slate-200">
                      <td className="bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
                        {key}
                      </td>
                      {selectedProducts.map((product) => (
                        <td key={`${product.id}-${key}`} className="px-5 py-4 text-sm text-slate-700">
                          {product.specs[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selectedProducts.length > 0 && selectedProducts.length < 3 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>
              {3 - selectedProducts.length} more slot{3 - selectedProducts.length === 1 ? "" : "s"} available for comparison.
            </span>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="font-semibold text-amber-800 underline underline-offset-2"
            >
              Add another product
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
