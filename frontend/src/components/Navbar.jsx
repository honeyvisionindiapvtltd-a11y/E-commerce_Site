import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  GitCompareArrows,
  Headphones,
  Heart,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

const logo = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269504/logo.png_tun5nq.png";
import MegaMenu from "./MegaMenu";

const navLinks = [
  ["Services", "/services"],
  ["AI Tools", "/ai-tools"],
  ["Categories", "/categories"],
  ["Blogs", "/blogs"],
  ["Compare", "/compare"],
  ["Delivery", "/delivery"],
  ["Request Demo", "/request-demo"],
  ["About", "/about"],
  ["Contact Us", "/contact"],
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { cart, wishlist, deliveryPin, isLoggedIn, user, products } = useCommerce();

  const popularSearches = useMemo(() => {
    const fallback = ["AI Camera", "CCTV", "Networking", "Drones", "Router", "UPS"];
    if (!Array.isArray(products) || products.length === 0) return fallback;

    const labels = products
      .map((product) => product.name)
      .filter(Boolean)
      .slice(0, 8);

    return [...new Set([...labels, ...fallback])].slice(0, 8);
  }, [products]);

  const suggestions = useMemo(() => {
    const searchValue = query.trim().toLowerCase();
    if (!searchValue) return [];

    const possibleMatches = products.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.subCategory,
        product.brand,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchValue);
    });

    return possibleMatches.slice(0, 6).map((product) => ({
      type: 'product',
      label: product.name,
      meta: `${product.category || 'Product'} • ${product.brand || 'HoneyVision'}`,
      to: `/products?search=${encodeURIComponent(product.name)}`,
    }));
  }, [products, query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowCategories(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      navigate('/products');
      setShowSuggestions(false);
      setMenuOpen(false);
      return;
    }

    navigate({ pathname: '/products', search: `?search=${encodeURIComponent(trimmed)}` });
    setShowSuggestions(false);
    setMenuOpen(false);
  };

  const handleSuggestionClick = (value) => {
    setQuery(value);
    setShowSuggestions(false);
    setShowCategories(false);
    navigate({ pathname: '/products', search: `?search=${encodeURIComponent(value)}` });
  };

  const handleCategorySelect = ({ categorySlug, subCategorySlug } = {}) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (subCategorySlug) params.set('subCategory', subCategorySlug);
    setShowCategories(false);
    setShowSuggestions(false);
    navigate({ pathname: '/products', search: params.toString() ? `?${params.toString()}` : '' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#071426] text-white shadow-lg">
      {/* Top header */}
      <div className="border-b border-white/10">
        <div className="flex h-11 w-full items-center justify-between px-3 text-xs sm:px-6 sm:text-sm">
          <Link
            to="/delivery"
            className="flex items-center gap-2 hover:text-yellow-400"
          >
            <MapPin size={16} className="shrink-0 text-yellow-400" />
            <span className="hidden text-gray-300 sm:inline">Deliver to</span>
            <span className="font-semibold">PIN {deliveryPin}</span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <Link
              to="/order-tracking"
              className="flex items-center gap-2 hover:text-yellow-400"
            >
              <Truck size={17} />
              Track Order
            </Link>

            <Link
              to="/support"
              className="flex items-center gap-2 hover:text-yellow-400"
            >
              <Headphones size={17} />
              Support
            </Link>

            <Link to="/dealer-locator" className="hover:text-yellow-400">
              Dealer Locator
            </Link>
          </div>
        </div>
      </div>

      {/* Logo, search and icons */}
      <div className="flex w-full items-center gap-4 px-3 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={logo}
            alt="Honey Vision"
            className="h-12 w-auto object-contain sm:h-14"
          />

          <div className="hidden sm:block">
            <h1 className="text-xl font-bold leading-none">
              HONEY <span className="text-yellow-400">VISION</span>
            </h1>
            <p className="mt-1 text-[10px] text-gray-400">
              AI Powered IT Solutions
            </p>
          </div>
        </Link>

        {/* Desktop search */}
        <div ref={searchRef} className="relative hidden flex-1 lg:block">
          <form onSubmit={submitSearch} className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-yellow-400 bg-white shadow-[0_8px_24px_rgba(251,191,36,0.18)] ring-1 ring-yellow-200">
            <button
              type="button"
              onClick={() => {
                setShowCategories((value) => !value);
                setShowSuggestions(false);
              }}
              className="flex min-w-42.5 items-center justify-between border-r border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <span className="truncate">All Categories</span>
              <ChevronDown size={17} className={`ml-2 shrink-0 transition-transform ${showCategories ? "rotate-180" : "rotate-0"}`} />
            </button>

            <div className="flex min-w-0 flex-1 items-center">
              <Search size={18} className="ml-4 mr-2 text-slate-400" />
              <input
                type="search"
                placeholder="Search for products, brands and more..."
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full border-0 bg-transparent px-0 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="grid h-full w-14 place-items-center bg-linear-to-b from-yellow-400 to-yellow-500 text-slate-950 transition hover:from-yellow-300 hover:to-yellow-400"
              aria-label="Search"
            >
              <Search size={22} />
            </button>
          </form>

          {showCategories && (
            <div className="absolute left-0 top-[calc(100%+10px)] z-60 w-205 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Browse Categories</p>
                <button type="button" onClick={() => setShowCategories(false)} className="text-[11px] text-slate-500 hover:text-slate-700">Close</button>
              </div>
              <MegaMenu onSelect={(data) => handleCategorySelect(data)} />
            </div>
          )}

          {showSuggestions && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Sparkles size={12} className="text-yellow-500" />
                  Smart Search
                </span>
                <button type="button" onClick={() => setShowSuggestions(false)} className="text-[11px] text-slate-500 hover:text-slate-700">Close</button>
              </div>

              {query.trim() ? (
                suggestions.length > 0 ? (
                  <div className="space-y-1">
                    {suggestions.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          setShowCategories(false);
                          navigate(item.to);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-slate-500">{item.meta}</p>
                        </div>
                        <span className="rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-700">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 px-2 pb-2">
                    <p className="text-sm text-slate-600">No products matched your search.</p>
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="rounded-lg bg-[#071426] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Search all products
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSuggestionClick(term)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:border-yellow-300 hover:bg-yellow-50 hover:text-slate-900"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <NavIcon icon={GitCompareArrows} label="Compare" to="/compare" />
          <NavIcon icon={Heart} label="Wishlist" to="/wishlist" count={wishlist.length} />
          <NavIcon icon={ShoppingCart} label="Cart" to="/cart" count={cart.reduce((total, item) => total + item.quantity, 0)} />
          <NavIcon
            icon={isLoggedIn && user?.role === 'admin' ? LayoutDashboard : User}
            label={isLoggedIn && user?.role === 'admin' ? 'Admin' : isLoggedIn ? 'Profile' : 'Login'}
            to={isLoggedIn && user?.role === 'admin' ? '/admin/dashboard' : isLoggedIn ? '/profile' : '/login'}
          />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="ml-auto p-2 hover:text-yellow-400 lg:hidden"
          aria-label="Open navigation menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile search */}
      <div ref={searchRef} className="relative mx-3 mb-3 sm:mx-6 lg:hidden">
        <form onSubmit={submitSearch} className="flex h-11 items-center overflow-hidden rounded-xl border border-yellow-400 bg-white shadow-[0_8px_22px_rgba(251,191,36,0.12)]">
          <Search size={18} className="ml-3 mr-2 text-slate-400" />
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            className="grid h-full w-12 place-items-center bg-linear-to-b from-yellow-400 to-yellow-500 text-slate-950"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>

        {showSuggestions && query.trim() && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {suggestions.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setShowCategories(false);
                  navigate(item.to);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.meta}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="border-t border-white/10">
        <div className="w-full px-3 sm:px-6">
          <ul className="hidden h-14 items-center gap-8 text-sm font-medium lg:flex">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "inline-flex h-14 items-center border-b-2 border-yellow-400 text-yellow-400"
                    : "inline-flex h-14 items-center hover:text-yellow-400"
                }
              >
                Home
              </NavLink>
            </li>

            <li className="group relative h-14">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive
                    ? "flex h-14 items-center gap-1 text-yellow-400"
                    : "flex h-14 items-center gap-1 hover:text-yellow-400"
                }
              >
                Products
                <ChevronDown size={16} />
              </NavLink>

              <div className="absolute left-0 top-12 z-50 hidden w-225 gap-4 rounded-lg bg-white p-2 text-slate-800 shadow-xl group-hover:block">
                <MegaMenu />
              </div>
            </li>

            {navLinks.map(([label, path]) => (
              <li key={label}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    isActive
                      ? "inline-flex h-14 items-center border-b-2 border-yellow-400 text-yellow-400"
                      : "inline-flex h-14 items-center hover:text-yellow-400"
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile navigation */}
          {menuOpen && (
            <div className="space-y-4 border-t border-white/10 py-5 lg:hidden">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "block text-yellow-400" : "block hover:text-yellow-400"
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive ? "block text-yellow-400" : "block hover:text-yellow-400"
                }
              >
                Products
              </NavLink>

              <NavLink
                to="/blogs"
                className={({ isActive }) =>
                  isActive ? "block text-yellow-400" : "block hover:text-yellow-400"
                }
              >
                Blogs
              </NavLink>

              {navLinks
                .filter(([label]) => label !== "Blogs")
                .map(([label, path]) => (
                  <NavLink
                    key={label}
                    to={path}
                    className={({ isActive }) =>
                      isActive ? "block text-yellow-400" : "block hover:text-yellow-400"
                    }
                  >
                    {label}
                  </NavLink>
                ))}

              <div className="flex gap-5 border-t border-white/10 pt-4">
                <Link to="/wishlist" className="hover:text-yellow-400">
                  Wishlist
                </Link>

                <Link to="/cart" className="hover:text-yellow-400">
                  Cart
                </Link>

                <Link
                  to={isLoggedIn && user?.role === 'admin' ? '/admin/dashboard' : isLoggedIn ? '/profile' : '/login'}
                  className="hover:text-yellow-400"
                >
                  {isLoggedIn && user?.role === 'admin' ? 'Admin' : isLoggedIn ? 'Profile' : 'Login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavIcon({ icon: Icon, label, to, count }) {
  return (
    <Link
      to={to}
      className="relative flex flex-col items-center gap-1 text-xs hover:text-yellow-400"
    >
      <Icon size={21} />
      <span>{label}</span>

      {count && (
        <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-yellow-500 text-[10px] font-bold text-slate-950">
          {count}
        </span>
      )}
    </Link>
  );
}
