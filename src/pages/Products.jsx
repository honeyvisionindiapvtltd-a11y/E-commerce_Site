import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { products as allProducts, slugifyCategory, categoryFromSlug } from "../lib/products";

const categories = [
  "Computers & Laptops",
  "Components",
  "Networking",
  "Storage",
  "Peripherals",
  "Software",
  "Mobiles & Tablets",
  "IT Accessories",
  "Gaming",
  "Display",
  "Security & Surveillance",
  "Office Equipment",
  "Power Backup",
  "Electronics",
  "Drones & Cameras",
  "Smart Home",
  "Cooling Solutions",
  "Tools & Maintenance",
  "Biometric & Access Control",
];

export default function Products() {
  const [gridView, setGridView] = useState(true);
  const [searchParams] = useSearchParams();
  const { wishlist, toggleWishlist } = useCommerce();
  const categorySlug = searchParams.get("category");
  const selectedCategory = categorySlug ? categoryFromSlug(categorySlug) : null;
  const products = selectedCategory
    ? allProducts.filter((product) => slugifyCategory(product.category) === categorySlug)
    : allProducts;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Home</span>
              <ChevronRight size={14} />
              <span>Products</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold text-slate-950">{selectedCategory || "Products"}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {selectedCategory
                ? `Browse ${products.length} product${products.length === 1 ? "" : "s"} in ${selectedCategory}.`
                : "Browse categories, compare offers, and find the best IT products for your setup."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
              <option>Popularity</option>
              <option>Latest</option>
              <option>Price Low</option>
              <option>Price High</option>
            </select>
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
              <option>24 per page</option>
              <option>48 per page</option>
              <option>96 per page</option>
            </select>
            <button
              type="button"
              onClick={() => setGridView(true)}
              className={`h-12 w-12 rounded-2xl transition ${gridView ? "bg-amber-500 text-slate-950" : "bg-white text-slate-700 border border-slate-200"}`}
            >
              <LayoutGrid />
            </button>
            <button
              type="button"
              onClick={() => setGridView(false)}
              className={`h-12 w-12 rounded-2xl transition ${!gridView ? "bg-amber-500 text-slate-950" : "bg-white text-slate-700 border border-slate-200"}`}
            >
              <List />
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              <div className="mt-5 space-y-3">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/products/category/${slugifyCategory(category)}`}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{category}</span>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <div className="mt-5 space-y-5 text-sm text-slate-700">
                <div>
                  <p className="font-semibold">Price range</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <span className="rounded-2xl bg-slate-100 px-3 py-2">?0</span>
                    <span className="rounded-2xl bg-slate-100 px-3 py-2">?50,000+</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Brand</p>
                  <select className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                    <option>All Brands</option>
                    <option>Dell</option>
                    <option>HP</option>
                    <option>Lenovo</option>
                    <option>Asus</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`grid gap-6 ${gridView ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {products.map((product) => (
                  <article key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-yellow-100 shadow-sm transition hover:-translate-y-1 transition hover:border-amber-300 hover:shadow-lg">
                    <div className="overflow-hidden rounded-3xl bg-white p-6">
                      <img src={product.image} alt={product.name} className="mx-auto h-44 w-full object-contain" />
                    </div>
                    <div className="p-6">
                      <span className="text-sm uppercase tracking-[0.2em] text-amber-500">{product.category}</span>
                      <h3 className="mt-3 text-xl font-semibold text-slate-950">{product.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">{product.brand}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-950">?{product.price.toLocaleString()}</span>
                        {product.mrp && (
                          <span className="text-sm line-through text-slate-400">?{product.mrp.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link to={`/products/${product.id}`} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {wishlist.includes(product.id) ? "Remove" : "Wishlist"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">1 - {products.length}</span> of <span className="font-semibold text-slate-900">{products.length}</span> products
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100">Previous</button>
                <button className="w-11 rounded-2xl bg-yellow-500 px-0 py-3 text-sm font-semibold text-slate-950">1</button>
                <button className="w-11 rounded-2xl border border-slate-200 px-0 py-3 text-sm text-slate-600 transition hover:bg-slate-100">2</button>
                <button className="w-11 rounded-2xl border border-slate-200 px-0 py-3 text-sm text-slate-600 transition hover:bg-slate-100">3</button>
                <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100">Next</button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
