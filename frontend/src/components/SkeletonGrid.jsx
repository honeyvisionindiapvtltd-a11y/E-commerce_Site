export default function SkeletonGrid({ gridView = true, count = 8 }) {
  const items = Array.from({ length: count });

  return (
    <div className={gridView ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
      {items.map((_, i) => (
        <div key={i} className="animate-pulse">
          {gridView ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-44 bg-slate-100" />
              <div className="mt-4 h-4 w-3/4 bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 bg-slate-100" />
            </div>
          ) : (
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-28 w-28 bg-slate-100" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 bg-slate-100" />
                <div className="mt-3 h-3 w-1/4 bg-slate-100" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
