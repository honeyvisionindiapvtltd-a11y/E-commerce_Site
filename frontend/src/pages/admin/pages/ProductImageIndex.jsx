import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function ProductImageIndex() {
  const [summary, setSummary] = useState({
    totalProducts: 0,
    indexedProducts: 0,
    pendingProducts: 0,
    failedProducts: 0,
    outdatedProducts: 0,
    lastIndexedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/products/image-index-summary`);
      const data = await response.json();
      if (response.ok && data?.success) {
        setSummary({
          totalProducts: data.totalProducts || 0,
          indexedProducts: data.indexedProducts || 0,
          pendingProducts: data.pendingProducts || 0,
          failedProducts: data.failedProducts || 0,
          outdatedProducts: data.outdatedProducts || 0,
          lastIndexedAt: data.lastIndexedAt || null,
        });
      }
    } catch (error) {
      console.error('Failed to load image index summary', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runRefresh = async (mode = {}) => {
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/products/image-index-refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Index refresh failed');
      }
      await loadSummary();
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h2 className="mt-2 text-2xl font-black text-[#071426]">Product Image Search Index</h2>
          </div>
          <button type="button" onClick={() => runRefresh({})} disabled={busy} className="rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Indexing...' : 'Index New Products'}
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading index summary...</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Stat label="Total" value={summary.totalProducts} />
            <Stat label="Indexed" value={summary.indexedProducts} />
            <Stat label="Pending" value={summary.pendingProducts} />
            <Stat label="Failed" value={summary.failedProducts} />
            <Stat label="Outdated" value={summary.outdatedProducts} />
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Last indexing time</p>
          <p className="mt-2 text-sm text-slate-700">{summary.lastIndexedAt ? new Date(summary.lastIndexedAt).toLocaleString('en-IN') : 'Not indexed yet'}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton label="Re-index Failed" onClick={() => runRefresh({ reindexFailed: true })} disabled={busy} />
          <ActionButton label="Re-index Outdated" onClick={() => runRefresh({ reindexOutdated: true })} disabled={busy} />
          <ActionButton label="Re-index All" onClick={() => runRefresh({ reindexAll: true })} disabled={busy} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#071426]">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
      {label}
    </button>
  );
}
