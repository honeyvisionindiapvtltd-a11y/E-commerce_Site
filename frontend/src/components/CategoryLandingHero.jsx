import { Link } from 'react-router-dom';

export default function CategoryLandingHero({ title = 'Products', subtitle = '', banners = [] }) {
  const defaultBanners = [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  ];

  const imgs = banners.length ? banners : defaultBanners;

  return (
    <div className="mb-6 w-full overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
      <div className="border-t border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Best deals on electronics, accessories & more</div>
          <div className="flex items-center gap-3">
            <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Today's Deals</button>
            <Link to="/deals" className="text-sm text-slate-600 underline">See all</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
