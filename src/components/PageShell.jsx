function PageShell({ title, subtitle, description, children }) {
  return (
    <main className="bg-slate-950 text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-white/10 bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {subtitle && (
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">
              {subtitle}
            </p>
          )}

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {description && (
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              {description}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  )
}

export default PageShell;
