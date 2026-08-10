import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { slugifyCategory } from "../lib/products";

const categoryTiles = [
  ["Laptops", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png"],
  ["Desktop PCs", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010023/networking_ozm2kk.jpg"],
  ["Components", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010026/components_hlmuj1.jpg"],
  ["Networking", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010023/assesories_eizhmq.jpg"],
  ["CCTV & Security", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010027/cctv_y2raii.jpg"],
  ["Drones & Cameras", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786250199/drone_and_camers_cxwmhx.png"],
  ["Accessories", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786012476/headphone_ami4sj.webp"],
  ["Office Equipment", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010025/officeeqp0.124_voj31y.jpg"],
  ["Power Backup", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010026/power_bank_kqypks.jpg"],
  ["Display", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010024/display_rar3xa.webp"],
];

export default function Categories() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Explore categories</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-950">Shop by Category</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Discover products grouped by category, view category-specific offers, and navigate directly to the products you need.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Browse All Products
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {categoryTiles.map(([name, image]) => (
            <Link
              key={name}
              to={`/products?category=${slugifyCategory(name)}`}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-amber-300 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="overflow-hidden bg-white p-6">
                <img
                  src={image}
                  alt={name}
                  className="h-60 w-full object-contain transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold text-slate-950">{name}</h2>
                  <ChevronRight size={18} className="text-amber-500" />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Browse the latest items across {name.toLowerCase()} and related accessories.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
