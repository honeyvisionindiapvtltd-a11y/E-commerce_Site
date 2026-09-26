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
          <Link to="/products" className="text-xl leading-none text-slate-500 sm:text-2xl" aria-label="View products">›</Link>
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-8 relative">
          <img src={imgs[0]} alt="hero" className="h-64 w-full object-cover" />
          <div className="absolute left-6 top-6 rounded-md bg-black/40 p-4 text-white">
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && <p className="mt-2 text-sm max-w-xl">{subtitle}</p>}
            <div className="mt-4 flex gap-3">
              <Link to="/products" className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Shop all</Link>
              <Link to="/offers" className="rounded-2xl border border-white/30 px-4 py-2 text-sm">View offers</Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-rows-2 gap-4 p-2">
          <img src={imgs[1]} alt="promo1" className="h-32 w-full object-cover rounded-md" />
          <img src={imgs[2]} alt="promo2" className="h-32 w-full object-cover rounded-md" />
        </div>
      </div>
      <div className="border-t border-slate-100 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="text-[11px] leading-4 text-slate-600 sm:text-sm">Best deals on electronics, accessories & more</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/products" className="rounded-xl bg-amber-500 px-2.5 py-1.5 text-[10px] font-semibold text-slate-950 sm:px-4 sm:py-2 sm:text-sm">Today's Deals</Link>
            <Link to="/products" className="text-[10px] text-slate-600 underline sm:text-sm">See all</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
