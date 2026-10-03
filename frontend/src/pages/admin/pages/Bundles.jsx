import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  adminDeleteBundle,
  adminListBundles,
  adminListCategoryTree,
  adminSaveBundle,
  adminSearchBundleProducts,
  adminSetBundleActive,
} from "../api";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";

const blankBundle = () => ({
  name: "",
  description: "",
  mainProduct: "",
  products: [],
  discountType: "percentage",
  discountValue: 10,
  startDate: "",
  endDate: "",
  displayPriority: 1,
});

const idOf = (value) => String(value?._id || value?.id || value || "");
const productOf = (entry) => entry?.productId && typeof entry.productId === "object" ? entry.productId : null;
const categoryIdOf = (value) => idOf(value);
const categoryNameOf = (value) => value && typeof value === "object" ? value.name || value.slug || "" : String(value || "");
const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const dateValue = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString().slice(0, 10) : "";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function getBundleTotals(products, discountType, discountValue) {
  const individualTotal = products.reduce((sum, entry) => sum + Number(entry.product?.price || 0) * Number(entry.quantity || 0), 0);
  const requestedDiscount = discountType === "percentage"
    ? individualTotal * Number(discountValue || 0) / 100
    : Number(discountValue || 0);
  const discountAmount = Math.min(individualTotal, Math.max(0, requestedDiscount));
  return { individualTotal, discountAmount, bundlePrice: Math.max(0, individualTotal - discountAmount) };
}

function getBundleStatus(bundle) {
  const now = Date.now();
  if (!bundle.active) return "Draft";
  if (bundle.endDate && new Date(bundle.endDate).getTime() < now) return "Expired";
  if (bundle.startDate && new Date(bundle.startDate).getTime() > now) return "Scheduled";
  return "Active";
}

export default function Bundles() {
  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCache, setProductCache] = useState({});
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [filters, setFilters] = useState({ q: "", category: "", subCategory: "", brand: "", stock: "", status: "active", minPrice: "", maxPrice: "" });
  const [form, setForm] = useState(blankBundle());
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIds, setSuggestionIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState("");

  const cacheProducts = (items) => {
    const pairs = (items || []).filter(Boolean).map((product) => [idOf(product), product]).filter(([id]) => id);
    if (pairs.length) setProductCache((current) => ({ ...current, ...Object.fromEntries(pairs) }));
  };

  const loadBundles = async () => {
    const nextBundles = await adminListBundles();
    setBundles(nextBundles);
    cacheProducts(nextBundles.flatMap((bundle) => [
      bundle.mainProduct,
      ...(bundle.products || []).map(productOf),
    ]));
  };

  useEffect(() => {
    let active = true;
    Promise.all([adminListBundles(), adminListCategoryTree()])
      .then(([nextBundles, categoryTree]) => {
        if (!active) return;
        setBundles(nextBundles);
        setCategories(Array.isArray(categoryTree) ? categoryTree : []);
        const referencedProducts = nextBundles.flatMap((bundle) => [bundle.mainProduct, ...(bundle.products || []).map(productOf)]).filter(Boolean);
        const pairs = referencedProducts.map((product) => [idOf(product), product]).filter(([id]) => id);
        setProductCache((current) => ({ ...current, ...Object.fromEntries(pairs) }));
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load bundles."); })
      .finally(() => { if (active) setLoadingBundles(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingProducts(true);
      setProductError("");
      try {
        const result = await adminSearchBundleProducts({ ...filters, page: pagination.currentPage || 1, limit: 20 });
        if (!active) return;
        setProducts(result.products || []);
        setPagination({
          currentPage: Number(result.currentPage || 1),
          totalPages: Number(result.totalPages || 1),
          totalProducts: Number(result.totalProducts || 0),
        });
        setBrands(Array.isArray(result.brands) ? result.brands : []);
        cacheProducts(result.products || []);
      } catch (searchError) {
        if (active) setProductError(searchError.message || "Unable to load products. Please try again.");
      } finally {
        if (active) setLoadingProducts(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, pagination.currentPage, searchRetryKey]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "category" ? { subCategory: "" } : {}) }));
    setPagination((current) => ({ ...current, currentPage: 1 }));
  };

  const selectedProducts = form.products.map((entry) => ({
    ...entry,
    product: productCache[String(entry.productId)],
  }));
  const mainProduct = productCache[String(form.mainProduct)];
  const totals = useMemo(() => getBundleTotals(selectedProducts, form.discountType, form.discountValue), [selectedProducts, form.discountType, form.discountValue]);
  const subcategories = categories.find((category) => idOf(category) === filters.category)?.subcategories || [];

  const openNew = () => {
    setEditing(null);
    setForm(blankBundle());
    setSuggestions([]);
    setSuggestionIds([]);
    setError("");
    setDuplicateMessage("");
    setOpen(true);
  };

  const openEdit = (bundle) => {
    setEditing(idOf(bundle));
    const bundleProducts = (bundle.products || []).map((entry) => ({ productId: idOf(entry.productId), quantity: Number(entry.quantity || 1) }));
    setForm({
      name: bundle.name || "",
      description: bundle.description || "",
      mainProduct: idOf(bundle.mainProduct),
      products: bundleProducts,
      discountType: bundle.discountType || "percentage",
      discountValue: Number(bundle.discountValue || 0),
      startDate: dateValue(bundle.startDate),
      endDate: dateValue(bundle.endDate),
      displayPriority: Number(bundle.displayPriority || 1),
    });
    cacheProducts([bundle.mainProduct, ...(bundle.products || []).map(productOf)]);
    setSuggestions([]);
    setSuggestionIds([]);
    setError("");
    setDuplicateMessage("");
    setOpen(true);
  };

  const addProduct = (product) => {
    const productId = idOf(product);
    if (!productId) return;
    if (form.products.some((item) => String(item.productId) === productId)) {
      setDuplicateMessage("This product is already included in the bundle. Change its quantity instead.");
      return;
    }
    cacheProducts([product]);
    setDuplicateMessage("");
    setForm((current) => ({ ...current, products: [...current.products, { productId, quantity: 1 }] }));
  };

  const setMainProduct = (product) => {
    if (!product) return;
    const productId = idOf(product);
    cacheProducts([product]);
    setForm((current) => ({
      ...current,
      mainProduct: productId,
      products: current.products.some((item) => String(item.productId) === productId)
        ? current.products
        : [...current.products, { productId, quantity: 1 }],
    }));
  };

  const removeProduct = (productId) => setForm((current) => ({
    ...current,
    products: current.products.filter((item) => String(item.productId) !== String(productId)),
    mainProduct: String(current.mainProduct) === String(productId) ? "" : current.mainProduct,
  }));

  const findRelatedProducts = async () => {
    if (!mainProduct) {
      setError("Select a main product before finding suggestions.");
      return;
    }
    const subCategoryId = categoryIdOf(mainProduct.subCategory);
    const categoryId = categoryIdOf(mainProduct.category);
    const relatedFilters = [];
    if (subCategoryId) relatedFilters.push({ subCategory: subCategoryId, status: "active", page: 1, limit: 20 });
    else if (categoryId) relatedFilters.push({ category: categoryId, status: "active", page: 1, limit: 20 });
    if (mainProduct.brand) relatedFilters.push({ brand: mainProduct.brand, status: "active", page: 1, limit: 20 });
    try {
      const results = await Promise.all(relatedFilters.map((query) => adminSearchBundleProducts(query)));
      const selectedIds = new Set(form.products.map((item) => String(item.productId)));
      const candidates = [...new Map(results.flatMap((result) => result.products || [])
        .filter((product) => idOf(product) !== idOf(mainProduct) && !selectedIds.has(idOf(product)))
        .map((product) => [idOf(product), product])).values()];
      cacheProducts(candidates);
      setSuggestions(candidates);
      setSuggestionIds([]);
      setError(candidates.length ? "" : "No more products found in the main product’s category or subcategory.");
    } catch (suggestionError) {
      setError(suggestionError.message || "Unable to find related products.");
    }
  };

  const addSelectedSuggestions = () => {
    const additions = suggestions.filter((product) => suggestionIds.includes(idOf(product)));
    const existingIds = new Set(form.products.map((item) => String(item.productId)));
    const uniqueAdditions = additions.filter((product) => !existingIds.has(idOf(product)));
    cacheProducts(uniqueAdditions);
    setForm((current) => ({
      ...current,
      products: [...current.products, ...uniqueAdditions.map((product) => ({ productId: idOf(product), quantity: 1 }))],
    }));
    setSuggestions([]);
    setSuggestionIds([]);
  };

  const save = async (active) => {
    setError("");
    if (!form.name.trim()) return setError("Enter a bundle name.");
    if (!form.mainProduct || !form.products.some((item) => String(item.productId) === String(form.mainProduct))) {
      return setError("Select a main product and keep it in the bundle.");
    }
    if (active && form.products.length < 2) return setError("Add at least two products before activating this bundle.");
    if (selectedProducts.some((item) => !item.product)) return setError("One selected product is no longer available. Remove it and select an existing product.");
    if (active && selectedProducts.some((item) => item.product.isActive === false)) return setError("One selected product is inactive. Replace it before activating this bundle.");
    if (selectedProducts.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) return setError("Product quantities must be whole numbers greater than zero.");
    if (!Number.isFinite(Number(form.discountValue)) || Number(form.discountValue) < 0) return setError("Enter a valid non-negative discount.");
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) return setError("Percentage discount cannot exceed 100%.");
    if (totals.individualTotal <= 0 || totals.discountAmount >= totals.individualTotal) return setError("Discount must be less than the current individual product total.");

    setBusy(true);
    try {
      const payload = {
        ...form,
        active,
        discountValue: Number(form.discountValue),
        displayPriority: Number(form.displayPriority || 0),
        products: form.products.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) })),
      };
      await adminSaveBundle(editing, payload);
      await loadBundles();
      setOpen(false);
    } catch (saveError) {
      setError(saveError.message || "Bundle could not be saved. Please check the selected products and try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (bundle) => {
    try {
      await adminSetBundleActive(idOf(bundle), !bundle.active);
      await loadBundles();
      setError("");
    } catch (toggleError) {
      setError(toggleError.message || "Unable to update bundle status.");
    }
  };

  const remove = async (bundle) => {
    if (!window.confirm(`Delete bundle “${bundle.name}”?`)) return;
    try {
      await adminDeleteBundle(idOf(bundle));
      await loadBundles();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete bundle.");
    }
  };

  const renderProductResult = (product) => {
    const productId = idOf(product);
    const selected = form.products.some((item) => String(item.productId) === productId);
    const categoryName = categoryNameOf(product.category);
    return (
      <article key={productId} className="flex min-w-0 gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
        <img src={product.thumbnail || product.images?.[0] || ""} alt="" className="h-14 w-14 shrink-0 rounded bg-slate-50 object-contain" />
        <div className="min-w-0 flex-1">
          <b className="block line-clamp-2 text-xs text-slate-800">{product.name}</b>
          <p className="mt-1 truncate text-[10px] text-slate-500">SKU {product.sku || "—"} · {product.brand || "—"}</p>
          <p className="truncate text-[10px] text-slate-500">{categoryName}{product.subCategory ? ` · ${categoryNameOf(product.subCategory)}` : ""}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-700">{money(product.price)} · Stock {product.stock ?? 0}</p>
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-1">
          <button type="button" onClick={() => addProduct(product)} className="rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold disabled:text-emerald-700" disabled={selected}>{selected ? "Added" : "Add"}</button>
          <button type="button" onClick={() => setMainProduct(product)} className="whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50">Set main</button>
        </div>
      </article>
    );
  };

  return (
    <>
      <PageHeader title="Bundle Management" description="Build offers from existing catalog products. Product records remain unchanged." action={
        <button type="button" onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} /> Create Bundle</button>
      } />

      {error && !open && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Bundle</th><th className="p-3">Main product</th><th className="p-3">Products</th><th className="p-3">Discount</th><th className="p-3">Bundle price</th><th className="p-3">Dates</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {bundles.map((bundle) => {
              const entries = (bundle.products || []).map((entry) => ({ product: productOf(entry), quantity: Number(entry.quantity || 1) }));
              const bundleTotals = getBundleTotals(entries, bundle.discountType, bundle.discountValue);
              const status = getBundleStatus(bundle);
              return <tr key={idOf(bundle)}>
                <td className="p-3"><b>{bundle.name}</b><p className="mt-1 max-w-xs text-[10px] text-slate-500">{bundle.description}</p></td>
                <td className="p-3 text-xs">{categoryNameOf(bundle.mainProduct) || productOf({ productId: bundle.mainProduct })?.name || bundle.mainProduct?.name || "—"}</td>
                <td className="p-3 text-xs">{entries.length} products</td>
                <td className="p-3 text-xs">{bundle.discountType === "percentage" ? `${bundle.discountValue}%` : money(bundle.discountValue)}</td>
                <td className="p-3 text-xs font-bold">{money(bundleTotals.bundlePrice)}</td>
                <td className="p-3 text-[10px] text-slate-500">{bundle.startDate ? dateValue(bundle.startDate) : "No start"}<br />{bundle.endDate ? dateValue(bundle.endDate) : "No end"}</td>
                <td className="p-3">{bundle.displayPriority}</td>
                <td className="p-3"><button type="button" onClick={() => toggle(bundle)} className={status === "Active" ? "font-semibold text-emerald-700" : "text-slate-500"}>{status}</button></td>
                <td className="p-3"><div className="flex gap-3"><button type="button" onClick={() => openEdit(bundle)} aria-label={`Edit ${bundle.name}`}><Pencil size={15} /></button><button type="button" onClick={() => remove(bundle)} aria-label={`Delete ${bundle.name}`} className="text-red-600"><Trash2 size={15} /></button></div></td>
              </tr>;
            })}
            {!loadingBundles && !bundles.length && <tr><td colSpan="9" className="p-8 text-center text-sm text-slate-500">No bundles created yet.</td></tr>}
            {loadingBundles && <tr><td colSpan="9" className="p-8 text-center text-sm text-slate-500">Loading bundles…</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Edit bundle" : "Create bundle"} onClose={() => setOpen(false)} wide>
        <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-700">Bundle name<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-700">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} rows="1" /></label>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Explore existing products</h3><p className="mt-1 text-[10px] text-slate-500">Search and filter the catalog. Add each item explicitly.</p></div><span className="text-[10px] text-slate-500">{pagination.totalProducts} results</span></div>
              <div className="relative"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input value={filters.q} onChange={(event) => setFilter("q", event.target.value)} placeholder="Search name, SKU, brand, category…" className={`${inputClass} pl-9`} /></div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <select value={filters.category} onChange={(event) => setFilter("category", event.target.value)} className={inputClass}><option value="">All categories</option>{categories.map((category) => <option key={idOf(category)} value={idOf(category)}>{category.name}</option>)}</select>
                <select value={filters.subCategory} onChange={(event) => setFilter("subCategory", event.target.value)} className={inputClass} disabled={!filters.category}><option value="">All subcategories</option>{subcategories.map((category) => <option key={idOf(category)} value={idOf(category)}>{category.name}</option>)}</select>
                <select value={filters.brand} onChange={(event) => setFilter("brand", event.target.value)} className={inputClass}><option value="">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select>
                <select value={filters.stock} onChange={(event) => setFilter("stock", event.target.value)} className={inputClass}><option value="">All stock</option><option value="in-stock">In stock</option><option value="low-stock">Low stock</option><option value="out-of-stock">Out of stock</option></select>
                <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All statuses</option></select>
                <div className="flex gap-1"><input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilter("minPrice", event.target.value)} placeholder="Min ₹" className={`${inputClass} min-w-0`} /><input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilter("maxPrice", event.target.value)} placeholder="Max ₹" className={`${inputClass} min-w-0`} /></div>
              </div>

              <div className="mt-3 grid max-h-[42vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {products.map(renderProductResult)}
                {loadingProducts && <p className="col-span-full py-8 text-center text-xs text-slate-500">Searching products…</p>}
                {!loadingProducts && !productError && products.length === 0 && <p className="col-span-full py-8 text-center text-xs text-slate-500">No matching products.</p>}
                {productError && <div className="col-span-full rounded-lg bg-red-50 p-3 text-xs text-red-700"><p>{productError}</p><button type="button" onClick={() => setSearchRetryKey((current) => current + 1)} className="mt-2 font-bold underline">Try again</button></div>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span><div className="flex gap-2"><button type="button" disabled={pagination.currentPage <= 1 || loadingProducts} onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }))} className="rounded border px-2 py-1 disabled:opacity-40" aria-label="Previous product page"><ChevronLeft size={15} /></button><button type="button" disabled={pagination.currentPage >= pagination.totalPages || loadingProducts} onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage + 1 }))} className="rounded border px-2 py-1 disabled:opacity-40" aria-label="Next product page"><ChevronRight size={15} /></button></div></div>
            </section>

            <section className="min-w-0 space-y-4">
              <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold">Bundle products</h3><p className="mt-1 text-[10px] text-slate-500">{form.products.length} selected</p></div><button type="button" onClick={findRelatedProducts} className="text-[10px] font-semibold text-blue-700">Find related products</button></div>
                <label className="mt-3 grid gap-1 text-[10px] font-semibold text-slate-600">Main product<select value={form.mainProduct} onChange={(event) => setForm({ ...form, mainProduct: event.target.value })} className={inputClass}><option value="">Select from bundle products</option>{selectedProducts.map(({ product, productId }) => <option key={productId} value={productId}>{product?.name || "Unavailable product"}</option>)}</select></label>
                {mainProduct && <p className="mt-2 text-[10px] text-slate-500">Bundle appears on this product’s detail page: <b>{mainProduct.name}</b></p>}
                {duplicateMessage && <p role="status" className="mt-2 text-[10px] text-amber-700">{duplicateMessage}</p>}

                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                  {selectedProducts.map(({ product, productId, quantity }) => (
                    <div key={productId} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                      <img src={product?.thumbnail || product?.images?.[0] || ""} alt="" className="h-10 w-10 shrink-0 rounded bg-slate-50 object-contain" />
                      <div className="min-w-0 flex-1"><b className="block truncate text-[10px]">{product?.name || "Unavailable product"}</b><span className="text-[9px] text-slate-500">{money(product?.price)} · SKU {product?.sku || "—"}</span>{form.mainProduct === productId && <span className="ml-1 text-[9px] font-semibold text-blue-700">Main</span>}</div>
                      <div className="flex items-center rounded border border-slate-200"><button type="button" aria-label={`Decrease ${product?.name} quantity`} onClick={() => setForm((current) => ({ ...current, products: current.products.map((item) => String(item.productId) === productId ? { ...item, quantity: Math.max(1, Number(item.quantity) - 1) } : item) }))} className="px-2 py-1 text-xs">−</button><span className="min-w-6 text-center text-[10px]">{quantity}</span><button type="button" aria-label={`Increase ${product?.name} quantity`} onClick={() => setForm((current) => ({ ...current, products: current.products.map((item) => String(item.productId) === productId ? { ...item, quantity: Math.min(99, Number(item.quantity) + 1) } : item) }))} className="px-2 py-1 text-xs">+</button></div>
                      <button type="button" onClick={() => removeProduct(productId)} aria-label={`Remove ${product?.name} from bundle`} className="p-1 text-red-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {!selectedProducts.length && <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-[10px] text-slate-500">Add a main product and bundle items from the explorer.</p>}
                </div>

                {suggestions.length > 0 && <div className="mt-3 rounded-lg bg-blue-50 p-2.5"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold text-blue-900">Related category and brand suggestions</p><button type="button" onClick={addSelectedSuggestions} disabled={!suggestionIds.length} className="text-[10px] font-bold text-blue-700 disabled:opacity-40">Add selected</button></div><div className="mt-2 max-h-32 space-y-1 overflow-auto">{suggestions.map((product) => <label key={idOf(product)} className="flex items-center gap-2 text-[10px]"><input type="checkbox" checked={suggestionIds.includes(idOf(product))} onChange={(event) => setSuggestionIds((current) => event.target.checked ? [...current, idOf(product)] : current.filter((id) => id !== idOf(product)))} /><span className="min-w-0 flex-1 truncate">{product.name}</span><span className="text-slate-500">{money(product.price)}</span></label>)}</div><p className="mt-2 text-[9px] text-blue-800">Suggestions come from catalog category and brand data only. Review compatibility before adding.</p></div>}
              </div>

              <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <h3 className="text-sm font-bold">Bundle pricing</h3>
                <div className="mt-3 grid grid-cols-2 gap-2"><label className="grid gap-1 text-[10px] text-slate-600">Discount type<select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })} className={inputClass}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label className="grid gap-1 text-[10px] text-slate-600">Discount value<input type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className={inputClass} /></label></div>
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs"><div className="flex justify-between"><span>Individual total</span><b>{money(totals.individualTotal)}</b></div><div className="flex justify-between text-emerald-700"><span>Customer saves</span><b>{money(totals.discountAmount)}</b></div><div className="flex justify-between text-sm font-extrabold"><span>Bundle price</span><b>{money(totals.bundlePrice)}</b></div></div>
                {totals.discountAmount >= totals.individualTotal && totals.individualTotal > 0 && <p className="mt-2 text-[10px] text-red-600">Discount must be less than the individual total.</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] text-slate-600">Start date<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={inputClass} /></label>
                <label className="grid gap-1 text-[10px] text-slate-600">End date<input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={inputClass} /></label>
                <label className="grid gap-1 text-[10px] text-slate-600">Display priority<input type="number" min="0" value={form.displayPriority} onChange={(event) => setForm({ ...form, displayPriority: event.target.value })} className={inputClass} /></label>
              </div>

              {previewOpen && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-bold uppercase text-amber-800">Customer preview</p><h4 className="mt-1 text-sm font-extrabold">Bundle &amp; Save More</h4><p className="text-xs font-semibold">{form.name || "Bundle name"}</p><div className="mt-2 flex gap-2 overflow-x-auto">{selectedProducts.map(({ product, productId }) => <div key={productId} className="w-20 shrink-0 rounded border border-amber-100 bg-white p-1.5"><img src={product?.thumbnail || product?.images?.[0] || ""} alt="" className="h-12 w-full object-contain" /><p className="mt-1 line-clamp-2 text-[8px]">{product?.name}</p></div>)}</div><div className="mt-2 text-[10px]">Individual: {money(totals.individualTotal)} · Bundle: <b>{money(totals.bundlePrice)}</b> · Save {money(totals.discountAmount)}</div><button type="button" disabled className="mt-2 rounded bg-[#071426] px-3 py-1.5 text-[9px] font-bold text-white">Add bundle to cart</button></div>}
              <button type="button" onClick={() => setPreviewOpen((value) => !value)} className="text-xs font-semibold text-blue-700">{previewOpen ? "Hide preview" : "Preview bundle"}</button>
            </section>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs">Cancel</button><button type="button" disabled={busy} onClick={() => save(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save Draft"}</button><button type="button" disabled={busy} onClick={() => save(true)} className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save & Activate"}</button></div>
        </form>
      </Modal>
    </>
  );
}