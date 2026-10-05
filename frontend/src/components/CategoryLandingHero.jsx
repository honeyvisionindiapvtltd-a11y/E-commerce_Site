import { Link } from 'react-router-dom';

export default function CategoryLandingHero({ title = 'Products', subtitle = '', banners = [] }) {
  const defaultBanners = [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  ];

  const imgs = banners.length ? banners : defaultBanners;

  return (
    <div className="mb-3 w-full overflow-hidden rounded-2xl bg-white shadow-sm sm:mb-6">
      <div className="lg:hidden">
        <div className="relative">
          <img src={imgs[0]} alt="Featured products" className="h-36 w-full object-cover sm:h-44" />
          <span className="absolute left-2 top-2 bg-white/80 px-1 text-[10px] font-medium text-slate-500">AD</span>
        </div>
        <div className="flex items-center justify-between bg-sky-50 px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="text-xs font-bold text-slate-800 sm:text-sm">Latest products and offers</span>
          <Link
            to="/products"
            className="text-xl leading-none text-slate-500 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:text-2xl"
            aria-label="View all products"
            title="View all products"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-8 relative">
          <img src={imgs[0]} alt="Laptop displaying a technology setup" className="h-56 w-full object-cover" />
          <div className="absolute left-6 top-6 max-w-[min(80%,42rem)] rounded-md bg-black/45 p-4 text-white">
            <h2 className="text-2xl font-bold leading-tight">{title}</h2>
            {subtitle && <p className="mt-2 max-w-xl text-sm leading-5">{subtitle}</p>}
            <div className="mt-3 flex gap-3">
              <Link
                to="/products"
                className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Shop all products"
              >
                Shop all
              </Link>
              <Link
                to="/combo-deals"
                className="rounded-2xl border border-white/30 px-4 py-2 text-sm transition hover:border-amber-300 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="View combo offers"
              >
                View offers
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-rows-2 gap-3 p-2">
          <img src={imgs[1]} alt="People exploring technology together" className="h-28 w-full rounded-md object-cover" />
          <img src={imgs[2]} alt="Smartwatch and wearable technology" className="h-28 w-full rounded-md object-cover" />
        </div>
      </div>
      <div className="border-t border-slate-100 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="text-[11px] leading-4 text-slate-600 sm:text-sm">Best deals on electronics, accessories & more</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/combo-deals"
              className="rounded-xl bg-amber-500 px-2.5 py-1.5 text-[10px] font-semibold text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:px-4 sm:py-2 sm:text-sm"
              aria-label="Browse today's combo deals"
            >
              Today's Deals
            </Link>
            <Link
              to="/products?limit=100#product-results"
              className="text-[10px] text-slate-600 underline transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:text-sm"
              aria-label="See all products"
            >
              See all
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
