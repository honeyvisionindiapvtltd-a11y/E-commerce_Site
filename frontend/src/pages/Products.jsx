import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import ProductSidebar from "../components/ProductSidebar";
import CategoryLandingHero from "../components/CategoryLandingHero";
import ProductGrid from "../components/ProductGrid";
import SkeletonGrid from "../components/SkeletonGrid";
import FilterChips from "../components/FilterChips";
import { categoryFromSlug, matchesCategorySlug, slugifyCategory } from "../lib/products";

const normalizeProduct = (product) => {
  const category = product.category && typeof product.category === "object" ? product.category.name : product.category || "General";
  const subCategory = product.subCategory && typeof product.subCategory === "object" ? product.subCategory.name : product.subCategory || "";

  return {
    id: product._id || product.id || product.slug || `${category}-${product.name}`,
    name: product.name || "Product",
    category,
    subCategory,
    brand: product.brand || "HoneyVision",
    price: Number(product.price ?? product.salePrice ?? 0),
    mrp: Number(product.mrp ?? product.originalPrice ?? product.price ?? 0),
    rating: Number(product.rating ?? product.averageRating ?? 4.5),
    reviews: Number(product.reviewCount ?? product.reviews ?? 0),
    stock: Number(product.stock ?? 0),
    delivery: product.delivery || "Delivery available",
    image: product.thumbnail || product.image || product.images?.[0] || "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png",
    description: product.shortDescription || product.description || "",
    features: Array.isArray(product.features) ? product.features : [],
    installationEligible: Boolean(product.installationEligible),
  };

};

export default function Products() {
  const [gridView, setGridView] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const categorySlug = searchParams.get("category");
  const subCategorySlug = searchParams.get("subCategory");
  const selectedCategory = categorySlug ? categoryFromSlug(categorySlug) : null;
  const [filterOpen, setFilterOpen] = useState(false);
  const limit = Number(searchParams.get('limit') || '24');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const query = new URLSearchParams();
        if (categorySlug) query.set("category", categorySlug);
        if (subCategorySlug) query.set("subCategory", subCategorySlug);

        const page = searchParams.get('page');
        const limit = searchParams.get('limit') || '24';
        const brand = searchParams.get('brand');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const inStock = searchParams.get('inStock');
        const sort = searchParams.get('sort');

        if (brand) query.set('brand', brand);
        if (minPrice) query.set('minPrice', minPrice);
        if (maxPrice) query.set('maxPrice', maxPrice);
        if (inStock) query.set('inStock', inStock);
        if (sort) query.set('sort', sort);
        if (page) query.set('page', page);
        if (limit) query.set('limit', limit);

        const response = await fetch(`/api/products?${query.toString()}`);
        if (!response.ok) throw new Error("Unable to load products");

        const data = await response.json();
        const apiProducts = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.data)
              ? data.data
              : [];

        const normalized = apiProducts.map(normalizeProduct);
        if (isMounted) setProducts(normalized);
      } catch (error) {
        console.error("Failed to load products:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, subCategorySlug, searchParams]);

  const filteredProducts = useMemo(() => {
    if (!categorySlug && !subCategorySlug && !searchParams.get('brand') && !searchParams.get('minPrice') && !searchParams.get('maxPrice')) return products;

    let filtered = products;

    if (categorySlug) {
      filtered = filtered.filter((product) => matchesCategorySlug(product.category, categorySlug));
    }

    if (subCategorySlug) {
      filtered = filtered.filter((product) => slugifyCategory(product.subCategory || "") === subCategorySlug);
    }

    const brand = searchParams.get('brand');
    if (brand) {
      filtered = filtered.filter((p) => (p.brand || '').toLowerCase().includes(brand.toLowerCase()));
    }

    const minP = Number(searchParams.get('minPrice') || 0);
    if (minP) filtered = filtered.filter((p) => Number(p.price || 0) >= minP);

    const maxP = Number(searchParams.get('maxPrice') || 0);
    if (maxP) filtered = filtered.filter((p) => Number(p.price || 0) <= maxP);

    if (searchParams.get('inStock') === 'true') {
      filtered = filtered.filter((p) => Number(p.stock || 0) > 0);
    }

    const sort = searchParams.get('sort');
    if (sort === 'price_low') filtered = filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price_high') filtered = filtered.sort((a, b) => b.price - a.price);

    return filtered;
  }, [products, categorySlug, subCategorySlug, searchParams]);

  // build filter chips from search params
  const chips = useMemo(() => {
    const list = [];
    if (categorySlug) list.push({ key: 'category', label: `Category: ${selectedCategory}` });
    if (subCategorySlug) list.push({ key: 'subCategory', label: `Sub: ${subCategorySlug.replaceAll('-', ' ')}` });
    if (searchParams.get('brand')) list.push({ key: 'brand', label: `Brand: ${searchParams.get('brand')}` });
    if (searchParams.get('minPrice')) list.push({ key: 'minPrice', label: `Min: ${searchParams.get('minPrice')}` });
    if (searchParams.get('maxPrice')) list.push({ key: 'maxPrice', label: `Max: ${searchParams.get('maxPrice')}` });
    if (searchParams.get('inStock') === 'true') list.push({ key: 'inStock', label: 'In stock' });
    if (searchParams.get('sort')) list.push({ key: 'sort', label: `Sort: ${searchParams.get('sort')}` });
    return list;
  }, [searchParams, categorySlug, selectedCategory, subCategorySlug]);

  const handleRemoveChip = (chip) => {
    const p = new URLSearchParams(Object.fromEntries([...searchParams]));
    p.delete(chip.key);
    if (chip.key === 'category' || chip.key === 'subCategory') {
      p.delete('category'); p.delete('subCategory');
    }
    navigate({ pathname: '/products', search: p.toString() });
  };

  const handleClearChips = () => {
    navigate('/products');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Home</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-1">
          <section className="min-w-0 space-y-6">
            <CategoryLandingHero title={selectedCategory || 'Products'} subtitle={selectedCategory ? `Browse ${filteredProducts.length} items in ${selectedCategory}` : 'Explore our catalog'} />

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">Sort</div>
                  <button type="button" onClick={() => setFilterOpen(true)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">Filters</button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setGridView(true)} className={`h-10 w-9 rounded-2xl transition ${gridView ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-700 border border-slate-200'}`}><LayoutGrid /></button>
                  <button onClick={() => setGridView(false)} className={`h-10 w-9 rounded-2xl transition ${!gridView ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-700 border border-slate-200'}`}><List /></button>
                </div>
              </div>

              <FilterChips chips={chips} onRemove={handleRemoveChip} onClear={handleClearChips} />

              {loading ? (
                <SkeletonGrid gridView={gridView} count={limit} />
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No products found for this category. Try a different category or browse all products.
                </div>
              ) : (
                <ProductGrid products={filteredProducts} gridView={gridView} />
              )}
              {!loading && filteredProducts.length >= limit && (
                <div className="mt-6 flex justify-center">
                  <button aria-label="Load more products" onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); const page=Number(searchParams.get('page')||'1'); p.set('page', String(page+1)); navigate({ pathname: '/products', search: p.toString() }); }} className="rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-slate-950">Load more</button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{filteredProducts.length ? 1 : 0} - {filteredProducts.length}</span> of <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); const page=Number(searchParams.get('page')||'1'); if(page>1) p.set('page', String(page-1)); navigate({ pathname: '/products', search: p.toString() }); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100">Previous</button>
                <button onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); p.set('page','1'); navigate({ pathname: '/products', search: p.toString() }); }} className="w-11 rounded-2xl bg-yellow-500 px-0 py-3 text-sm font-semibold text-slate-950">1</button>
                <button onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); p.set('page','2'); navigate({ pathname: '/products', search: p.toString() }); }} className="w-11 rounded-2xl border border-slate-200 px-0 py-3 text-sm text-slate-600 transition hover:bg-slate-100">2</button>
                <button onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); p.set('page','3'); navigate({ pathname: '/products', search: p.toString() }); }} className="w-11 rounded-2xl border border-slate-200 px-0 py-3 text-sm text-slate-600 transition hover:bg-slate-100">3</button>
                <button onClick={() => { const p=new URLSearchParams(Object.fromEntries([...searchParams])); const page=Number(searchParams.get('page')||'1'); p.set('page', String(page+1)); navigate({ pathname: '/products', search: p.toString() }); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100">Next</button>
              </div>
            </div>
          </section>
        </div>
        <ProductSidebar
          key={categorySlug ?? "all-products"}
          products={products}
          selectedCategorySlug={categorySlug}
          selectedSubCategorySlug={subCategorySlug}
          drawerOnly
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />
      </section>
    </main>
  );
}
