import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { slugifyCategory } from "../lib/products";

const categories = [
  ["Laptops", "/images/categories/laptop.png"],
  ["Desktop PCs", "/images/categories/desktop-pc.png"],
  ["Components", "/images/categories/components.png"],
  ["Networking", "/images/categories/networking.png"],
  ["CCTV & Security", "/images/categories/cctv.png"],
  ["Drones & Cameras", "/images/categories/drone.png"],
  ["Accessories", "/images/categories/headphones.png"],
  ["Office Equipment", "/images/categories/printer.png"],
  ["Power Backup", "/images/categories/power-backup.png"],
  ["Display", "/images/categories/display.png"],
];

export default function ShopByCategory() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full px-3 py-6 sm:px-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Shop by Category</h2>

          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-amber-500 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => scroll("right")}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-amber-500 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {categories.map(([name, image]) => (
            <Link
              key={name}
              to={`/products?category=${slugifyCategory(name)}`}
              className="group min-w-35 rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
            >
              <img
                src={image}
                alt={name}
                className="mx-auto h-20 w-28 object-contain transition group-hover:scale-105"
              />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {name}
              </p>
              <div className="mx-auto mt-2 h-0.5 w-7 bg-amber-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}