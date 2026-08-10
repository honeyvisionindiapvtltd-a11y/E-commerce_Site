import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { matchesCategorySlug, slugifyCategory } from "../lib/products";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  HardDrive,
  Lock,
  Mouse,
  Network,
  Plane,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  SquareStack,
  Wrench,
  Zap,
  X,
} from "lucide-react";

const categoryIcons = {
  "CCTV & Security": ShieldCheck,
  "Computers & Laptops": Cpu,
  Networking: Network,
  Storage: HardDrive,
  "IT Accessories": Mouse,
  "Cables & Connectors": SquareStack,
  "Office Equipment": Printer,
  "Power Backup": Zap,
  "Drones & Cameras": Plane,
  "Biometric & Access Control": Lock,
  "Security & Surveillance": ShieldCheck,
};

function buildCategoryTree(products = []) {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();

  // map category -> set(subcategories)
  const subMap = {};
  products.forEach((p) => {
    const cat = p.category || null;
    const sub = p.subCategory || null;
    if (!cat) return;
    if (!subMap[cat]) subMap[cat] = new Set();
    if (sub) subMap[cat].add(sub);
  });

  const nodes = categories.map((label) => ({
    label,
    slug: slugifyCategory(label),
    icon: categoryIcons[label] || Sparkles,
    children: Array.from(subMap[label] || []).map((sub) => ({
      label: sub,
      slug: slugifyCategory(sub),
      parentSlug: slugifyCategory(label),
    })),
  }));

  return [
    {
      label: "All Products",
      slug: "all-products",
      icon: Sparkles,
      children: [],
    },
    ...nodes,
  ];
}

function buildCategoryTreeFromApi(categories = []) {
  const nodes = categories.map((category) => {
    const label = category.name || category.label || "Category";
    return {
      label,
      slug: category.slug || slugifyCategory(label),
      icon: categoryIcons[label] || Sparkles,
      children: Array.isArray(category.subcategories)
        ? category.subcategories.map((sub) => ({
            label: sub.name || sub.label || "Subcategory",
            slug: sub.slug || slugifyCategory(sub.name || sub.label || "Subcategory"),
            parentSlug: category.slug || slugifyCategory(label),
          }))
        : [],
    };
  });

  return [
    {
      label: "All Products",
      slug: "all-products",
      icon: Sparkles,
      children: [],
    },
    ...nodes,
  ];
}

const matchesCategorySelection = (productCategory, selectedSlug) => matchesCategorySlug(productCategory, selectedSlug);

function filterTree(nodes, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nodes;

  return nodes
    .map((node) => {
      const labelMatch = node.label.toLowerCase().includes(normalizedQuery);
      const children = node.children?.length ? filterTree(node.children, query) : [];
      if (labelMatch || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean);
}

function getCountForNode(node, products) {
  if (node.slug === "all-products") return products.length;

  // if node is a subcategory (has parentSlug), count products that match both
  if (node.parentSlug) {
    return products.filter(
      (product) => slugifyCategory(product.subCategory || "") === node.slug && matchesCategorySelection(product.category, node.parentSlug)
    ).length;
  }

  return products.filter((product) => matchesCategorySelection(product.category, node.slug)).length;
}

function isBranchActive(node, selectedSlug) {
  if (!selectedSlug) return false;
  if (selectedSlug === node.slug) return true;
  return !!node.children?.some((child) => isBranchActive(child, selectedSlug));
}

function getInitialOpenNodes(nodes, selectedSlug) {
  const nextOpen = {};
  const walk = (items) => {
    items.forEach((item) => {
      if (item.children?.length) {
        const shouldOpen = isBranchActive(item, selectedSlug);
        if (shouldOpen) nextOpen[item.slug] = true;
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return nextOpen;
}

export default function ProductSidebar({ products = [], selectedCategorySlug = null, selectedSubCategorySlug = null, drawerOnly = false, isOpen = false, onClose = () => {} }) {
  const [apiCategories, setApiCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const categoryTree = useMemo(
    () => (apiCategories.length ? buildCategoryTreeFromApi(apiCategories) : buildCategoryTree(products)),
    [apiCategories, products]
  );
  const [search, setSearch] = useState("");
  const activeSlug = selectedSubCategorySlug || selectedCategorySlug;
  const [openNodes, setOpenNodes] = useState(() => getInitialOpenNodes(categoryTree, activeSlug));
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(isOpen);

  const uniqueBrands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products]);
  const minPriceAll = useMemo(() => Math.min(...products.map((p) => Number(p.price || 0))), [products]);
  const maxPriceAll = useMemo(() => Math.max(...products.map((p) => Number(p.price || 0))), [products]);

  const [brand, setBrand] = useState(searchParams.get('brand') || "");
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories/tree');
        if (!response.ok) throw new Error('Unable to load categories');

        const data = await response.json();
        const apiCategories = Array.isArray(data.categories) ? data.categories : [];
        if (!ignore) setApiCategories(apiCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        if (!ignore) setApiCategories([]);
      } finally {
        if (!ignore) setCategoryLoading(false);
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    setOpenNodes(getInitialOpenNodes(categoryTree, activeSlug));
  }, [categoryTree, activeSlug, selectedCategorySlug, selectedSubCategorySlug]);

  useEffect(() => {
    setBrand(searchParams.get('brand') || "");
    setMinPrice(searchParams.get('minPrice') || "");
    setMaxPrice(searchParams.get('maxPrice') || "");
    setInStockOnly(searchParams.get('inStock') === 'true');
  }, [searchParams]);

  const filteredTree = useMemo(() => filterTree(categoryTree, search), [categoryTree, search]);

  const toggleNode = (slug) => {
    setOpenNodes((current) => ({ ...current, [slug]: !current[slug] }));
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = !!node.children?.length;
    const isOpen = openNodes[node.slug];
    const count = getCountForNode(node, products);
    let isActive = false;
    if (node.parentSlug) {
      isActive = selectedSubCategorySlug === node.slug;
    } else {
      isActive = selectedCategorySlug === node.slug || isBranchActive(node, activeSlug);
    }
    const Icon = node.icon;

    // build link depending on whether this is a subcategory
    const to = node.slug === "all-products" ? "/products" : node.parentSlug ? `/products?category=${node.parentSlug}&subCategory=${node.slug}` : `/products?category=${node.slug}`;

    return (
      <div key={node.slug} className="space-y-2">
        <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${isActive ? "border-sky-400 bg-sky-50 shadow-sm" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"}`}>
          <Link
            to={to}
            className="flex flex-1 items-center justify-between gap-3 text-sm font-medium text-slate-700"
            onClick={() => {
              setIsMobileOpen(false);
              onClose();
            }}
          >
            <span className="flex items-center gap-2">
              {Icon ? <Icon size={16} className={isActive ? "text-sky-600" : "text-slate-500"} /> : <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
              <span className={isActive ? "text-slate-950" : "text-slate-700"}>{node.label}</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"}`}>
              {count}
            </span>
          </Link>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(node.slug)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : null}
        </div>
        {hasChildren && isOpen ? (
              <div className="ml-3 space-y-2 border-l border-slate-200 pl-3" style={{ paddingTop: 4 }}>
                  {node.children.map((child) => renderNode(child, depth + 1))}
                </div>
        ) : null}
      </div>
    );
  };

  const applyFilters = (e) => {
    e?.preventDefault?.();
    const params = new URLSearchParams(Object.fromEntries([...searchParams]));
    if (brand) params.set('brand', brand); else params.delete('brand');
    if (minPrice) params.set('minPrice', String(minPrice)); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', String(maxPrice)); else params.delete('maxPrice');
    if (inStockOnly) params.set('inStock', 'true'); else params.delete('inStock');

    navigate({ pathname: '/products', search: params.toString() });
    setIsMobileOpen(false);
    onClose();
  };

  const clearFilters = () => {
    const params = new URLSearchParams(Object.fromEntries([...searchParams]));
    params.delete('brand'); params.delete('minPrice'); params.delete('maxPrice'); params.delete('inStock'); params.delete('sort');
    navigate({ pathname: '/products', search: params.toString() });
    setIsMobileOpen(false);
    onClose();
  };

  return (
    <>
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm lg:hidden"
      >
        <Search size={16} />
        Open category filters
      </button>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {!drawerOnly && (
          <div className={`hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-24px_rgba(2,8,23,0.28)] lg:block ${collapsed ? 'w-20' : ''}`}> 
            <div className="flex items-center justify-between">
              <div>
              {!collapsed && (
                <>
                  <p className="text-sm font-semibold text-slate-900">Category navigation</p>
                  <p className="text-sm text-slate-500">Browse premium products by department</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCollapsed((c) => !c)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
                {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              </button>
              {!collapsed && <div className="rounded-2xl bg-sky-50 p-2 text-sky-600"><Search size={16} /></div>}
            </div>
          </div>

            {!collapsed && (
              <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                <Search size={15} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
            )}

            <div className="mt-5 space-y-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  {filteredTree.map((node) => {
                    const Icon = node.icon || Sparkles;
                    return (
                      <div key={node.slug} className={`transition ${collapsed ? 'flex items-center justify-center py-3' : ''}`}>
                        {collapsed ? (
                          <button title={node.label} onClick={() => navigate(node.slug === 'all-products' ? '/products' : `/products?category=${node.slug}`)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
                            <Icon size={16} />
                          </button>
                        ) : (
                          renderNode(node)
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`fixed inset-0 z-50 bg-slate-950/60 transition ${isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => { setIsMobileOpen(false); onClose(); }}>
          <div className={`absolute right-0 top-0 h-full w-[92%] max-w-sm bg-white p-4 shadow-2xl transition ${isMobileOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button
                type="button"
                onClick={() => {
                  setIsMobileOpen(false);
                  onClose();
                }}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={applyFilters} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700">Brand</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                      <option value="">All brands</option>
                      {uniqueBrands.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700">Price</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={String(minPriceAll)} className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                    <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={String(maxPriceAll)} className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input id="instock" type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  <label htmlFor="instock" className="text-sm text-slate-700">In stock only</label>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button type="submit" className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Apply</button>
                  <button type="button" onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">Clear</button>
                </div>
              </div>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Active filter</span>
                <span className="font-semibold text-slate-900">{selectedCategorySlug ? selectedCategorySlug.replaceAll("-", " ") : "All products"}</span>
              </div>
              <Link
                to="/products"
                className="mt-3 inline-flex rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                onClick={() => setIsMobileOpen(false)}
              >
                Clear filters
              </Link>
            </div>

            <div className="hide-scrollbar mt-4 max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
              {filteredTree.map((node) => renderNode(node))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <Link
                to="/products"
                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={() => setIsMobileOpen(false)}
              >
                Clear filters
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
