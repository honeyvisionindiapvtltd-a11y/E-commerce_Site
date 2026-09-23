import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  CircleHelp,
  GitCompareArrows,
  Grid2X2,
  Headphones,
  Heart,
  House,
  Info,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  Moon,
  Newspaper,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import LocationSelector from "./LocationSelector.jsx";

const logo = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1788235324/logo1_fzsjda.png";
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

const mobileNavIcons = {
  Services: Wrench,
  "AI Tools": Sparkles,
  Categories: Grid2X2,
  Blogs: Newspaper,
  Compare: GitCompareArrows,
  Delivery: Truck,
  "Request Demo": CircleHelp,
  About: Info,
  "Contact Us": Mail,
};

export default function Navbar({ isDarkTheme = false, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const navRef = useRef(null);
  const {
    cart = [],
    wishlist = [],
    deliveryPin,
    selectedDeliveryAddress,
    isLoggedIn,
    user,
    products = [],
  } = useCommerce();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const cartCount = useMemo(
    () => (Array.isArray(cart) ? cart : []).filter((item) => {
      if (Number(item.quantity || 0) <= 0) return false;
      if (item.product) return true;
      const itemId = item.productId || item.id;
      return products.some((product) => String(product.id) === String(itemId));
    }).length,
    [cart, products]
  );

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
      to: `/products?q=${encodeURIComponent(product.name)}`,
    }));
  }, [products, query]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && navRef.current.contains(event.target)) {
        return;
      }

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

    navigate({ pathname: '/products', search: `?q=${encodeURIComponent(trimmed)}` });
    setShowSuggestions(false);
    setMenuOpen(false);
  };

  const handleSuggestionClick = (value) => {
    setQuery(value);
    setShowSuggestions(false);
    setShowCategories(false);
    navigate({ pathname: '/products', search: `?q=${encodeURIComponent(value)}` });
  };

  const handleCategorySelect = ({ categorySlug, subCategorySlug } = {}) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (subCategorySlug) params.set('subCategory', subCategorySlug);
    setMenuOpen(false);
    setShowCategories(false);
    setShowSuggestions(false);
    navigate(params.toString() ? `/products?${params.toString()}` : '/products');
  };

  const handleProductsNavigation = () => {
    setMenuOpen(false);
    setShowCategories(false);
  };

  return (
    <header className="relative z-50 w-full bg-[#071426] text-white shadow-lg">
      {/* Top header */}
      <div className="border-b border-white/10">
        <div className="flex h-11 w-full items-center justify-between px-3 text-xs sm:px-6 sm:text-sm">
          <button
            type="button"
            onClick={() => setShowLocationSelector(true)}
            className="flex items-center gap-2 hover:text-yellow-400"
          >
            <MapPin size={16} className="shrink-0 text-yellow-400" />
            <span className="hidden text-gray-300 sm:inline">Deliver to</span>
            <span className="font-semibold max-w-[180px] truncate text-left">
              {selectedDeliveryAddress?.city || selectedDeliveryAddress?.state ? `${selectedDeliveryAddress.city || selectedDeliveryAddress.state} ${selectedDeliveryAddress.pin || selectedDeliveryAddress.pincode || deliveryPin}` : `PIN ${deliveryPin}`}
            </span>
          </button>

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
      <div className="flex w-full items-center gap-2 px-2 py-2 sm:gap-4 sm:px-6 sm:py-3">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="order-3 shrink-0 rounded-lg p-1.5 hover:text-yellow-400 lg:hidden"
          aria-label="Open navigation menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Keep the mobile search directly beside the menu control. */}
        <div ref={searchRef} className="relative order-2 min-w-0 flex-1 lg:hidden">
          <form onSubmit={submitSearch} className="flex h-9 items-center overflow-hidden rounded-lg border border-yellow-400 bg-white shadow-[0_4px_12px_rgba(251,191,36,0.10)]">
            <Search size={14} className="ml-2 mr-1.5 shrink-0 text-slate-400" />
            <input
              type="search"
              placeholder="Search products..."
              value={query}
              onFocus={() => setShowSuggestions(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button type="submit" className="grid h-full w-8 shrink-0 place-items-center bg-yellow-400 text-slate-950" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          {showSuggestions && query.trim() && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {suggestions.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowSuggestions(false);
                    setShowCategories(false);
                  }}
                  className="block rounded-lg px-3 py-2 text-left hover:bg-slate-100"
                >
                  <p className="truncate text-xs font-medium text-slate-800">{item.label}</p>
                  <p className="truncate text-[10px] text-slate-500">{item.meta}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/" className="order-1 flex shrink-0 items-center gap-2 lg:order-none">
          <img
            src={logo}
            alt="Honey Vision"
            className="h-9 w-auto object-contain sm:h-14"
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
          <form onSubmit={submitSearch} className="flex h-10 w-full items-center overflow-hidden rounded-lg border border-yellow-400 bg-white shadow-[0_6px_16px_rgba(251,191,36,0.12)] ring-1 ring-yellow-200">
            <button
              type="button"
              onClick={() => {
                setShowCategories((value) => !value);
                setShowSuggestions(false);
              }}
              className="flex min-w-[110px] items-center justify-between border-r border-slate-200 bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
              aria-expanded={showCategories}
              aria-haspopup="true"
            >
              <span className="truncate">All Categories</span>
              <ChevronDown size={17} className={`ml-2 shrink-0 transition-transform ${showCategories ? "rotate-180" : "rotate-0"}`} />
            </button>

            <div className="flex min-w-0 flex-1 items-center">
              <Search size={15} className="ml-2.5 mr-2 text-slate-400" />
              <input
                type="search"
                placeholder="Search for products, brands and more..."
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full border-0 bg-transparent px-0 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/scan-product')}
              className="grid h-full w-11 place-items-center border-l border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="Scan product"
              title="Scan Product"
            >
              <Camera size={18} />
            </button>
            <button
              type="submit"
              className="grid h-full w-11 place-items-center bg-linear-to-b from-yellow-400 to-yellow-500 text-slate-950 transition hover:from-yellow-300 hover:to-yellow-400"
              aria-label="Search"
            >
              <Search size={22} />
            </button>
          </form>

          {showCategories && (
            <div className="absolute left-0 top-[calc(100%+10px)] z-60 max-h-[calc(100vh-8rem)] w-[min(820px,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl [scrollbar-width:thin]">
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
                      <Link
                        key={item.to}
                        to={item.to}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setShowSuggestions(false);
                          setShowCategories(false);
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
                      </Link>
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
                        onMouseDown={(event) => event.preventDefault()}
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
          <NavIcon icon={ShoppingCart} label="Cart" to="/cart" count={cartCount} />
          <NavIcon
            icon={isLoggedIn && user?.role === 'admin' ? LayoutDashboard : User}
            label={isLoggedIn && user?.role === 'admin' ? 'Admin' : isLoggedIn ? 'Profile' : 'Login'}
            to={isLoggedIn && user?.role === 'admin' ? '/admin/dashboard' : isLoggedIn ? '/profile' : '/login'}
          />
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-yellow-400 transition hover:bg-white/10 hover:text-yellow-300 lg:static lg:ml-0"
          aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          title={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
        </button>

      </div>

      {/* Mobile search */}
      <div className="hidden">
        <form onSubmit={submitSearch} className="flex h-10 items-center overflow-hidden rounded-lg border border-yellow-400 bg-white shadow-[0_6px_18px_rgba(251,191,36,0.10)]">
          <Search size={16} className="ml-2.5 mr-2 text-slate-400" />
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
            className="grid h-full w-10 place-items-center bg-linear-to-b from-yellow-400 to-yellow-500 text-slate-950"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>

        {showSuggestions && query.trim() && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {suggestions.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setShowSuggestions(false);
                  setShowCategories(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.meta}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showLocationSelector && (
        <LocationSelector onClose={() => setShowLocationSelector(false)} />
      )}

      {/* Navigation menu */}
      <nav ref={navRef} className="border-t border-white/10">
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

              <div className="pointer-events-auto absolute left-0 top-full z-[60] hidden max-h-[calc(100vh-8rem)] w-225 overflow-y-auto overscroll-contain rounded-lg bg-white p-2 text-slate-800 shadow-xl [scrollbar-width:thin] group-hover:block">
                <MegaMenu onSelect={handleCategorySelect} />
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
            <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain border-t border-white/10 py-4 [scrollbar-width:thin] lg:hidden">
              <div className="mb-4 flex items-center justify-between px-2">
                <div>
                  <p className="text-sm font-semibold text-white">Explore Honey Vision</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Everything you need, one tap away</p>
                </div>
                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-yellow-300">
                  Menu
                </span>
              </div>

              <div className="space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? "bg-yellow-400 text-slate-950 shadow-[0_6px_18px_rgba(250,204,21,0.18)]" : "text-slate-200 hover:bg-white/10 hover:text-white"}`
                }
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10"><House size={17} /></span>
                Home
              </NavLink>

              <div>
                <div className={`flex min-h-11 w-full items-center rounded-xl text-sm font-medium transition ${showCategories ? "bg-white/10 text-yellow-300" : "text-slate-200"}`}>
                  <NavLink
                    to="/products"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowCategories(false);
                    }}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left hover:bg-white/10 hover:text-white"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10"><Package size={17} /></span>
                    Products
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setShowCategories((value) => !value)}
                    className="grid min-h-11 w-12 shrink-0 place-items-center rounded-r-xl hover:bg-white/10 hover:text-white"
                    aria-label={showCategories ? "Collapse product categories" : "Expand product categories"}
                    aria-expanded={showCategories}
                  >
                  <ChevronDown size={17} className={`transition-transform ${showCategories ? "rotate-180" : "rotate-0"}`} />
                  </button>
                </div>
                {showCategories && (
                  <div className="pointer-events-auto mt-2 max-h-[55dvh] overflow-y-auto overscroll-contain rounded-xl border border-slate-200/80 bg-white p-2 text-slate-800 shadow-xl [scrollbar-width:thin]">
                    <MegaMenu onSelect={handleCategorySelect} />
                  </div>
                )}
              </div>

              {navLinks
                .map(([label, path]) => (
                  <NavLink
                    key={label}
                    to={path}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? "bg-yellow-400 text-slate-950 shadow-[0_6px_18px_rgba(250,204,21,0.18)]" : "text-slate-200 hover:bg-white/10 hover:text-white"}`
                    }
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">{(() => { const Icon = mobileNavIcons[label]; return Icon ? <Icon size={17} /> : null; })()}</span>
                    {label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                <Link to="/wishlist" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/5 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-yellow-300">
                  <Heart size={17} />
                  <span>Wishlist</span>
                </Link>

                <Link to="/cart" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/5 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-yellow-300">
                  <ShoppingCart size={17} />
                  <span>Cart</span>
                </Link>

                <Link
                  to={isLoggedIn && user?.role === 'admin' ? '/admin/dashboard' : isLoggedIn ? '/profile' : '/login'}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/5 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-yellow-300"
                >
                  {isLoggedIn && user?.role === 'admin' ? <LayoutDashboard size={17} /> : <User size={17} />}
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
