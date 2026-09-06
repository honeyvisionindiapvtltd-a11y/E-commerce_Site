import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { slugifyCategory } from '../lib/products';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function MegaMenu({ onSelect }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories/tree?light=true`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!ignore) setTree(data.categories || data.data || []);
      } catch (e) {
        // ignore
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="p-4 text-sm">Loading...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 p-3 text-slate-800 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
      {tree.slice(0, 12).map((cat) => (
        <div key={cat._id || cat.slug}>
          <h4 className="mb-2 font-bold">{cat.name}</h4>
          <ul className="space-y-1 text-sm font-normal">
            {(cat.children || []).slice(0, 6).map((sub) => (
              <li key={sub._id || sub.slug}>
                <Link
                  to={`/products?category=${slugifyCategory(cat.name)}&subCategory=${slugifyCategory(sub.name)}`}
                  onClick={() => onSelect?.({
                    categorySlug: slugifyCategory(cat.name),
                    subCategorySlug: slugifyCategory(sub.name),
                  })}
                  className="block rounded-md px-2 py-1.5 font-normal transition hover:bg-yellow-50 hover:text-yellow-600"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
