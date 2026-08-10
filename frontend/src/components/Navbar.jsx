import { useState } from "react";
import {
  ChevronDown,
  GitCompareArrows,
  Headphones,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { slugifyCategory } from "../lib/products";

const logo = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269504/logo.png_tun5nq.png";

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

const productLinks = [
  { label: "CCTV Cameras", category: "CCTV & Security" },
  { label: "IP Cameras", category: "CCTV & Security" },
  { label: "AI Cameras", category: "CCTV & Security" },
  { label: "Drones", category: "Drones & Cameras" },
  { label: "Networking", category: "Networking" },
  { label: "Storage Devices", category: "Storage" },
  { label: "Accessories", category: "IT Accessories" },
  { label: "Audio Video", category: "Electronics" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { cart, wishlist, deliveryPin, isLoggedIn } = useCommerce();
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setMenuOpen(false);
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
        <form onSubmit={submitSearch} className="hidden h-12 min-w-0 flex-1 overflow-hidden rounded-lg border-2 border-yellow-400 bg-white lg:flex">
          <Link
            to="/categories"
            className="flex min-w-44 items-center justify-between border-r border-slate-300 bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            All Categories
            <ChevronDown size={17} />
          </Link>

          <input
            type="search"
            placeholder="Search for products, brands and more..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 px-4 text-sm text-slate-800 outline-none"
          />

          <button
            type="submit"
            className="grid w-14 place-items-center bg-yellow-500 text-slate-950 transition hover:bg-yellow-400"
            aria-label="Search"
          >
            <Search size={22} />
          </button>
        </form>

        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <NavIcon icon={GitCompareArrows} label="Compare" to="/compare" />
          <NavIcon icon={Heart} label="Wishlist" to="/wishlist" count={wishlist.length} />
          <NavIcon icon={ShoppingCart} label="Cart" to="/cart" count={cart.reduce((total, item) => total + item.quantity, 0)} />
          <NavIcon icon={User} label={isLoggedIn ? "Profile" : "Login"} to={isLoggedIn ? "/profile" : "/login"} />
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
      <form onSubmit={submitSearch} className="mx-3 mb-3 flex h-11 overflow-hidden rounded-lg border-2 border-yellow-400 bg-white sm:mx-6 lg:hidden">
        <input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 px-4 text-sm text-slate-800 outline-none"
        />

        <button
          type="submit"
          className="grid w-14 place-items-center bg-yellow-500 text-slate-950"
          aria-label="Search"
        >
          <Search size={21} />
        </button>
      </form>

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

              <div className="absolute left-0 top-12 z-50 hidden w-96 grid-cols-2 gap-4 rounded-lg bg-white p-5 text-slate-800 shadow-xl group-hover:grid">
                {productLinks.map(({ label, category }) => (
                  <Link
                    key={label}
                    to={`/products?category=${slugifyCategory(category)}`}
                    className="hover:text-yellow-500"
                  >
                    {label}
                  </Link>
                ))}
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

                <Link to={isLoggedIn ? "/profile" : "/login"} className="hover:text-yellow-400">
                  {isLoggedIn ? "Profile" : "Login"}
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
