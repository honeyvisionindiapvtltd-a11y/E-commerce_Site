
import { useEffect, useMemo, useState } from "react";
import { Eye, ImageIcon, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { adminCreate, adminDelete, adminListCategoryTree, adminListProducts, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const PAGE_SIZE = 10;
const FILTER_OPTIONS = [
  "All",
  "Active",
  "Inactive",
  "In Stock",
  "Low Stock",
  "Out of Stock",
  "Featured",
  "Best Seller",
  "New Arrival",
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const makeSlug = (value = "") => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ensureArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
  return [];
};

const sanitizeImageUrls = (value) => [...new Set(ensureArray(value).filter((url) => /^https?:\/\//i.test(url)))];

const parseJsonValue = (value, fallback, fieldName) => {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) return fallback;
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`Invalid ${fieldName} format. Please check the JSON structure.`);
  }
};

const getProductStatus = (product) => (product.isActive === false ? "Inactive" : "Active");

const getStockStatus = (product) => {
  const stock = Number(product.stock ?? 0);
  const threshold = Number(product.lowStockThreshold ?? 5);
  if (stock <= 0) return "Out of Stock";
  if (stock <= threshold) return "Low Stock";
  return "In Stock";
};

const getDiscountPercent = (mrp, price) => {
  const safeMrp = Number(mrp || 0);
  const safePrice = Number(price || 0);
  if (!safeMrp || safeMrp <= 0) return 0;
  return Math.max(0, Math.round(((safeMrp - safePrice) / safeMrp) * 100));
};

const toProductRow = (product) => ({
  ...product,
  id: product._id || product.id,
  categoryId: product.category?._id || product.category || "",
  subCategoryId: product.subCategory?._id || product.subCategory || "",
  category: product.category?.name || product.category || "Uncategorized",
  subCategory: product.subCategory?.name || product.subCategory || "",
  price: Number(product.price ?? 0),
  mrp: Number(product.mrp ?? product.price ?? 0),
  stock: Number(product.stock ?? 0),
  lowStockThreshold: Number(product.lowStockThreshold ?? 5),
  status: getProductStatus(product),
  stockStatus: getStockStatus(product),
  discountPercent: getDiscountPercent(product.mrp, product.price),
});

const toProductRows = (products = []) => products.map((product, index) => ({ ...toProductRow(product), serialNo: index + 1 }));

const toFormValues = (product = null) => ({
  name: product?.name || "",
  sku: product?.sku || "",
  slug: product?.slug || "",
  category: product?.categoryId || product?.category?._id || product?.category || "",
  subCategory: product?.subCategoryId || product?.subCategory?._id || product?.subCategory || "",
  brand: product?.brand || "Honey Vision",
  productType: product?.productType || "physical",
  shortDescription: product?.shortDescription || "",
  description: product?.description || "",
  price: product?.price ?? "",
  mrp: product?.mrp ?? "",
  gstPercentage: product?.gstPercentage ?? 18,
  stock: product?.stock ?? "",
  lowStockThreshold: product?.lowStockThreshold ?? 5,
  rating: product?.rating ?? 0,
  reviewCount: product?.reviewCount ?? 0,
  warranty: product?.warranty || "",
  videoUrl: product?.videoUrl || "",
  tags: Array.isArray(product?.tags) ? product.tags.join(", ") : "",
  specifications: JSON.stringify(product?.specifications || {}, null, 2),
  variants: JSON.stringify(product?.variants || [], null, 2),
  relatedProducts: Array.isArray(product?.relatedProducts) ? product.relatedProducts.map((item) => item?._id || item).join(", ") : "",
  installationAvailable: Boolean(product?.installationAvailable),
  installationPrice: product?.installationPrice ?? 0,
  installationDescription: product?.installationDescription || "",
  metaTitle: product?.metaTitle || "",
  metaDescription: product?.metaDescription || "",
  featured: Boolean(product?.featured),
  bestSeller: Boolean(product?.bestSeller),
  newArrival: Boolean(product?.newArrival),
  recommended: Boolean(product?.recommended),
  status: getProductStatus(product),
  imageUrls: sanitizeImageUrls([product?.thumbnail, ...(product?.images || []), product?.image]),
});

const blankForm = {
  name: "",
  sku: "",
  slug: "",
  category: "",
  subCategory: "",
  brand: "Honey Vision",
  productType: "physical",
  shortDescription: "",
  description: "",
  price: "",
  mrp: "",
  gstPercentage: 18,
  stock: "",
  lowStockThreshold: 5,
  rating: 0,
  reviewCount: 0,
  warranty: "",
  videoUrl: "",
  tags: "",
  specifications: "{}",
  variants: "[]",
  relatedProducts: "",
  installationAvailable: false,
  installationPrice: 0,
  installationDescription: "",
  metaTitle: "",
  metaDescription: "",
  featured: false,
  bestSeller: false,
  newArrival: false,
  recommended: false,
  status: "Active",
  imageUrls: [],
};

const categoryMatch = (category, id) => category?._id === id || category?.id === id;

export default function Products() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(blankForm);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminListProducts({ page: 1, limit: 100, all: true });
      const productRows = toProductRows(result.products || []);
      setRows(productRows);
      setTotalProducts(Number(result.totalProducts ?? productRows.length));
    } catch (loadError) {
      setError(loadError.message || "Failed to load products.");
      setRows([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [productResult, categoryResult] = await Promise.all([
          adminListProducts({ page: 1, limit: 100, all: true }),
          adminListCategoryTree(),
        ]);

        if (!mounted) return;

        const productRows = toProductRows(productResult.products || []);
        setRows(productRows);
        setTotalProducts(Number(productResult.totalProducts ?? productRows.length));
        setCategories(categoryResult || []);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Failed to load product data.");
          setRows([]);
          setTotalProducts(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const categoryOptions = useMemo(() => categories || [], [categories]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((category) => categoryMatch(category, form.category)) || null,
    [categoryOptions, form.category]
  );

  const subCategories = useMemo(
    () => (selectedCategory?.subcategories || []).map((subcategory) => ({ ...subcategory, id: subcategory._id || subcategory.id })),
    [selectedCategory]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...rows];

    if (query) {
      list = list.filter((product) => {
        const searchable = [
          product.name,
          product.sku,
          product.brand,
          product.category,
          product.subCategory,
          product.stockStatus,
          product.status,
        ].join(" ").toLowerCase();
        return searchable.includes(query);
      });
    }

    if (filter !== "All") {
      list = list.filter((product) => {
        switch (filter) {
          case "Active":
            return product.status === "Active";
          case "Inactive":
            return product.status === "Inactive";
          case "In Stock":
            return product.stockStatus === "In Stock";
          case "Low Stock":
            return product.stockStatus === "Low Stock";
          case "Out of Stock":
            return product.stockStatus === "Out of Stock";
          case "Featured":
            return Boolean(product.featured);
          case "Best Seller":
            return Boolean(product.bestSeller);
          case "New Arrival":
            return Boolean(product.newArrival);
          default:
            return true;
        }
      });
    }

    switch (sort) {
      case "Oldest":
        list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "Price: Low → High":
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "Price: High → Low":
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "Stock: Low → High":
        list.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
        break;
      case "Stock: High → Low":
        list.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
        break;
      case "Name A → Z":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "Name Z → A":
        list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "Newest":
      default:
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [rows, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNewForm = () => {
    setEdit(null);
    setForm({ ...blankForm, category: categoryOptions[0]?._id || categoryOptions[0]?.id || "" });
    setOpen(true);
    setError("");
  };

  const openEditForm = (product) => {
    setEdit(product);
    setForm({ ...toFormValues(product) });
    setOpen(true);
    setError("");
  };

  const validateForm = () => {
    const requiredFields = [
      [form.name, "Product name is required"],
      [form.sku, "SKU is required"],
      [form.category, "Category is required"],
    ];

    for (const [value, message] of requiredFields) {
      if (!String(value || "").trim()) {
        throw new Error(message);
      }
    }

    const price = toNumber(form.price, 0);
    const mrp = toNumber(form.mrp, 0);
    const stock = toNumber(form.stock, 0);
    const gst = toNumber(form.gstPercentage, 0);
    const installPrice = toNumber(form.installationPrice, 0);
    const rating = toNumber(form.rating, 0);
    const reviewCount = toNumber(form.reviewCount, 0);
    const lowStockThreshold = toNumber(form.lowStockThreshold, 0);

    if (price < 0 || mrp < 0 || stock < 0 || gst < 0 || installPrice < 0 || lowStockThreshold < 0 || reviewCount < 0) {
      throw new Error("Price, MRP, stock, GST, installation price, low stock threshold and review count must be valid non-negative values.");
    }

    if (price > mrp && mrp > 0) {
      throw new Error("Selling price cannot exceed MRP.");
    }

    if (rating < 0 || rating > 5) {
      throw new Error("Rating must be between 0 and 5.");
    }

    if (!form.imageUrls.length) {
      return;
    }

    for (const url of form.imageUrls) {
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid image URL: ${url}`);
      }
    }
  };

  const buildProductPayload = (product) => {
    const parsedSpecifications = parseJsonValue(form.specifications, {}, "specifications");
    const parsedVariants = parseJsonValue(form.variants, [], "variants");
    const imageList = sanitizeImageUrls(form.imageUrls);

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      slug: (form.slug || "").trim() || makeSlug(form.name),
      category: form.category,
      subCategory: form.subCategory || null,
      brand: form.brand.trim() || "Honey Vision",
      productType: form.productType,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      price: toNumber(form.price, 0),
      mrp: toNumber(form.mrp, 0),
      gstPercentage: toNumber(form.gstPercentage, 0),
      stock: toNumber(form.stock, 0),
      lowStockThreshold: toNumber(form.lowStockThreshold, 0),
      rating: toNumber(form.rating, 0),
      reviewCount: toNumber(form.reviewCount, 0),
      warranty: form.warranty.trim(),
      videoUrl: form.videoUrl.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      thumbnail: imageList[0] || (product?.thumbnail || ""),
      images: imageList.length ? imageList : product?.images || [],
      specifications: parsedSpecifications,
      variants: parsedVariants,
      relatedProducts: form.relatedProducts
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => value !== (product?._id || product?.id)),
      installationAvailable: Boolean(form.installationAvailable),
      installationPrice: toNumber(form.installationPrice, 0),
      installationDescription: form.installationDescription.trim(),
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      featured: Boolean(form.featured),
      bestSeller: Boolean(form.bestSeller),
      newArrival: Boolean(form.newArrival),
      recommended: Boolean(form.recommended),
      isActive: form.status === "Active",
    };

    if (!payload.slug) payload.slug = makeSlug(form.name);
    return payload;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaveBusy(true);

    try {
      validateForm();

      if (!form.category) {
        throw new Error("Category is required");
      }

      const selectedParent = categoryOptions.find((category) => categoryMatch(category, form.category));
      if (form.subCategory && !((selectedParent?.subcategories || []).some((subcategory) => categoryMatch(subcategory, form.subCategory)))) {
        throw new Error("Subcategory does not belong to the selected category.");
      }

      const payload = buildProductPayload(edit ? { ...edit } : null);

      if (edit) {
        await adminUpdate("products", edit.id, payload);
        setSuccess("Product updated successfully");
      } else {
        await adminCreate("products", payload);
        setSuccess("Product created successfully");
      }

      setOpen(false);
      setEdit(null);
      setForm(blankForm);
      setPage(1);
      await loadProducts();
    } catch (saveError) {
      setError(saveError.message || "Failed to save product.");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleDelete = async (product) => {
    const productName = product.name || "this product";
    const productSku = product.sku || "";
    const confirmed = window.confirm(`Delete ${productName}${productSku ? ` (${productSku})` : ""}?\n\nWarning: this product will be deleted.`);

    if (!confirmed) return;

    setDeleteBusyId(product.id);
    setError("");
    setSuccess("");

    try {
      await adminDelete("products", product.id);
      setSuccess("Product deleted successfully");
      await loadProducts();
      setPage(1);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete product.");
    } finally {
      setDeleteBusyId(null);
    }
  };

  const renderBadge = (kind, value) => {
    const shared = "rounded-full px-2 py-1 text-[10px] font-semibold";

    if (kind === "status") {
      return value === "Active"
        ? <span className={`${shared} bg-emerald-100 text-emerald-700`}>{value}</span>
        : <span className={`${shared} bg-slate-200 text-slate-700`}>{value}</span>;
    }

    const map = {
      featured: "bg-indigo-100 text-indigo-700",
      bestSeller: "bg-amber-100 text-amber-700",
      newArrival: "bg-cyan-100 text-cyan-700",
      recommended: "bg-violet-100 text-violet-700",
    };

    return <span className={`${shared} ${map[kind] || "bg-slate-100 text-slate-700"}`}>{value}</span>;
  };

  const columns = [
    { key: "serialNo", label: "S.No." },
    {
      key: "image",
      label: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {product.thumbnail || product.image || product.images?.[0] ? (
              <img src={product.thumbnail || product.image || product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={16} className="text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{product.name}</div>
            <div className="text-[10px] text-slate-500">{product.sku}</div>
          </div>
        </div>
      ),
    },
    { key: "sku", label: "SKU" },
    { key: "brand", label: "Brand" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Subcategory" },
    { key: "price", label: "Price", render: (product) => `₹${toNumber(product.price, 0).toLocaleString()}` },
    { key: "mrp", label: "MRP", render: (product) => `₹${toNumber(product.mrp, 0).toLocaleString()}` },
    { key: "stock", label: "Stock", render: (product) => <span className={Number(product.stock || 0) <= Number(product.lowStockThreshold || 5) ? "font-bold text-amber-600" : "font-medium text-slate-700"}>{product.stock ?? 0}</span> },
    { key: "status", label: "Status", render: (product) => renderBadge("status", product.status) },
    { key: "featured", label: "Featured", render: (product) => product.featured ? renderBadge("featured", "Yes") : "-" },
    { key: "bestSeller", label: "Best Seller", render: (product) => product.bestSeller ? renderBadge("bestSeller", "Yes") : "-" },
    { key: "newArrival", label: "New Arrival", render: (product) => product.newArrival ? renderBadge("newArrival", "Yes") : "-" },
    {
      key: "actions",
      label: "Actions",
      render: (product) => (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => openEditForm(product)} className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100" title="Edit product">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={() => setPreviewProduct(product) || setPreviewOpen(true)} className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100" title="View product">
            <Eye size={14} />
          </button>
          <button type="button" onClick={() => handleDelete(product)} disabled={deleteBusyId === product.id} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50" title="Delete product">
            {deleteBusyId === product.id ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" /> : <Trash2 size={14} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage the full product catalog, pricing, inventory, categories, and media assets."
        action={
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!categoryOptions.length}
          >
            <Plus size={15} />
            Add Product
          </button>
        }
      >
        <span className="self-center text-xs font-semibold text-slate-500">{totalProducts.toLocaleString()} total</span>
      </PageHeader>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => loadProducts()} className="font-semibold underline">Retry</button>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{success}</div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, SKU, brand, category..."
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none">
            {FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none">
            {[
              "Newest",
              "Oldest",
              "Price: Low → High",
              "Price: High → Low",
              "Stock: Low → High",
              "Stock: High → Low",
              "Name A → Z",
              "Name Z → A",
            ].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 text-xs text-slate-500">
        Showing {(filteredRows.length ? (page - 1) * PAGE_SIZE + 1 : 0)}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} products
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading products...</div>
      ) : (
        <>
          <Table columns={columns} rows={currentPageRows} empty="No products found." />

          {filteredRows.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-600">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      <Modal open={open} title={edit ? "Edit Product" : "Add Product"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product Name">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Enter product name" />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={inputClass} placeholder="SKU" />
            </Field>
            <Field label="Brand">
              <input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className={inputClass} placeholder="Honey Vision" />
            </Field>
            <Field label="Product Type">
              <select value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} className={inputClass}>
                {['physical', 'combo', 'service', 'software', 'subscription'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setForm({ ...form, category: nextCategory, subCategory: "" });
                }}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory">
              <select value={form.subCategory} onChange={(event) => setForm({ ...form, subCategory: event.target.value })} className={inputClass}>
                <option value="">No subcategory</option>
                {(subCategories || []).map((subcategory) => (
                  <option key={subcategory._id || subcategory.id} value={subcategory._id || subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Short Description">
              <textarea value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} rows={3} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className={inputClass} />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing</div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="MRP">
                <input type="number" min="0" step="0.01" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Selling Price">
                <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} />
              </Field>
              <Field label="GST %">
                <input type="number" min="0" step="0.01" value={form.gstPercentage} onChange={(event) => setForm({ ...form, gstPercentage: event.target.value })} className={inputClass} />
              </Field>
            </div>
            <div className="mt-3 text-[11px] text-slate-600">
              Discount: {getDiscountPercent(form.mrp, form.price)}%  •  MRP: ₹{toNumber(form.mrp, 0).toLocaleString()}  •  Selling Price: ₹{toNumber(form.price, 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Inventory</div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Stock">
                <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Low Stock Threshold">
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Status Metadata">
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  {Number(form.stock || 0) <= 0 ? "Out of Stock" : Number(form.stock || 0) <= Number(form.lowStockThreshold || 0) ? "Low Stock" : "In Stock"}
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Images</div>
            <div className="space-y-3">
              <textarea
                value={form.imageUrls.join("\n")}
                onChange={(event) => setForm({ ...form, imageUrls: sanitizeImageUrls(event.target.value) })}
                rows={4}
                className={inputClass}
                placeholder="Add one image URL per line"
              />

              {form.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {form.imageUrls.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img src={image} alt={`Product image ${index + 1}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrls: form.imageUrls.filter((_, itemIndex) => itemIndex !== index) })}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-700"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Warranty">
              <input value={form.warranty} onChange={(event) => setForm({ ...form, warranty: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Video URL">
              <input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Tags">
              <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className={inputClass} placeholder="tag1, tag2" />
            </Field>
            <Field label="Rating">
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Review Count">
              <input type="number" min="0" value={form.reviewCount} onChange={(event) => setForm({ ...form, reviewCount: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Installation Price">
              <input type="number" min="0" step="0.01" value={form.installationPrice} onChange={(event) => setForm({ ...form, installationPrice: event.target.value })} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Installation Description">
              <textarea value={form.installationDescription} onChange={(event) => setForm({ ...form, installationDescription: event.target.value })} rows={3} className={inputClass} />
            </Field>
            <Field label="Related Products">
              <input value={form.relatedProducts} onChange={(event) => setForm({ ...form, relatedProducts: event.target.value })} className={inputClass} placeholder="Related product ids or SKUs" />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Specifications</div>
            <Field label="Structured specification JSON">
              <textarea value={form.specifications} onChange={(event) => setForm({ ...form, specifications: event.target.value })} rows={5} className={inputClass} placeholder='{"Resolution": "5MP"}' />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Variants</div>
            <Field label="Variant JSON">
              <textarea value={form.variants} onChange={(event) => setForm({ ...form, variants: event.target.value })} rows={5} className={inputClass} placeholder='[{"name":"Black","sku":"SKU-1","price":999,"mrp":1299,"stock":20}]' />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta Title">
              <input value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className={inputClass} placeholder="auto-generated if blank" />
            </Field>
            <Field label="Meta Description" className="md:col-span-2">
              <textarea value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} rows={3} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["installationAvailable", "Installation Available"],
              ["featured", "Featured"],
              ["bestSeller", "Best Seller"],
              ["newArrival", "New Arrival"],
              ["recommended", "Recommended"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} />
                {label}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={saveBusy} className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {saveBusy ? "Saving Product..." : edit ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={previewOpen} title="Product Preview" onClose={() => setPreviewOpen(false)}>
        {previewProduct ? (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={previewProduct.thumbnail || previewProduct.image || previewProduct.images?.[0]} alt={previewProduct.name} className="h-52 w-full object-cover" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">{previewProduct.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {renderBadge("status", previewProduct.status)}
                  {previewProduct.featured && renderBadge("featured", "Featured")}
                  {previewProduct.bestSeller && renderBadge("bestSeller", "Best Seller")}
                  {previewProduct.newArrival && renderBadge("newArrival", "New Arrival")}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><span className="font-semibold">Brand:</span> {previewProduct.brand}</div>
                  <div><span className="font-semibold">SKU:</span> {previewProduct.sku}</div>
                  <div><span className="font-semibold">Category:</span> {previewProduct.category}</div>
                  <div><span className="font-semibold">Subcategory:</span> {previewProduct.subCategory || "—"}</div>
                  <div><span className="font-semibold">MRP:</span> ₹{toNumber(previewProduct.mrp, 0).toLocaleString()}</div>
                  <div><span className="font-semibold">Price:</span> ₹{toNumber(previewProduct.price, 0).toLocaleString()}</div>
                  <div><span className="font-semibold">Stock:</span> {previewProduct.stock ?? 0}</div>
                  <div><span className="font-semibold">Discount:</span> {previewProduct.discountPercent || 0}%</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 font-semibold text-slate-800">Description</div>
              <p className="text-slate-600">{previewProduct.description || previewProduct.shortDescription || "No description provided."}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 font-semibold text-slate-800">Specifications</div>
                <pre className="whitespace-pre-wrap text-[11px] text-slate-600">{JSON.stringify(previewProduct.specifications || {}, null, 2)}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 font-semibold text-slate-800">Warranty / Rating</div>
                <div>Warranty: {previewProduct.warranty || "—"}</div>
                <div>Rating: {previewProduct.rating ?? 0}</div>
                <div>Reviews: {previewProduct.reviewCount ?? 0}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

