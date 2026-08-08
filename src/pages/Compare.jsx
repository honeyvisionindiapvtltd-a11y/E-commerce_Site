function Compare() {
  return (
    <main className="bg-slate-950 text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-slate-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.22em] text-amber-400">Make the right choice</p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Compare Products</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
            Compare selected items side-by-side so you can find the best fit for your security and IT needs.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Feature comparison</h2>
            <p className="mt-4 text-slate-300">Review specs, pricing, warranty, and installation compatibility in a clear table layout.</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Smart recommendations</h2>
            <p className="mt-4 text-slate-300">Get tailored suggestions based on your space, budget, and security goals.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Compare
