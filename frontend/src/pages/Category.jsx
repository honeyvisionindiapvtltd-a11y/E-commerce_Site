import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { useCommerce } from "../context/CommerceContext";
import { products as allProducts, categoryFromSlug, slugifyCategory } from "../lib/products";

export default function Category() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [gridView, setGridView] = useState(true);
  const { wishlist, toggleWishlist } = useCommerce();
  const categoryName = categoryFromSlug(categorySlug || "") || "Category";
  const products = allProducts.filter((product) => slugifyCategory(product.category) === categorySlug);

  if (!categoryName || !products.length) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Category not found</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-950">No products available</h1>
            <p className="mt-4 text-slate-600">
              We could not find any products for this category. Check other categories or browse all products.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Browse Products
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                Back
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-yellow-500">Home</Link>
              <ChevronRight size={14} />
              <Link to="/products" className="hover:text-yellow-500">Products</Link>
              <ChevronRight size={14} />
              <span>{categoryName}</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold text-slate-950">{categoryName}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Explore {products.length} product{products.length === 1 ? "" : "s"} in this category.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

        <div className="grid gap-8">
          <div className={`grid gap-6 ${gridView ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
            {products.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1">
                <div className="overflow-hidden rounded-3xl bg-slate-950 p-6">
                  <img src={product.image} alt={product.name} className="mx-auto h-44 w-full object-contain" />
                </div>
                <div className="p-6">
                  <span className="text-sm uppercase tracking-[0.2em] text-amber-500">{product.category}</span>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{product.brand}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-950">₹{product.price.toLocaleString()}</span>
                    {product.mrp && (
                      <span className="text-sm line-through text-slate-400">₹{product.mrp.toLocaleString()}</span>
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-900">1 - {products.length}</span> of <span className="font-semibold text-slate-900">{products.length}</span> products in {categoryName}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
