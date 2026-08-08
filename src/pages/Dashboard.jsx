function Dashboard() {
  return (
    <main className="bg-slate-950 text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-slate-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.22em] text-amber-400">Admin overview</p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Dashboard</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
            Manage orders, installation updates, and account activity from a single dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Orders</h2>
            <p className="mt-4 text-slate-300">Track recent purchases, delivery status, and upcoming installation windows.</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Installations</h2>
            <p className="mt-4 text-slate-300">View active installation booking details and technician assignments.</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Support</h2>
            <p className="mt-4 text-slate-300">Manage service requests, AMC renewals, and warranty claims from one place.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
