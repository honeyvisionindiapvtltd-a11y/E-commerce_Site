import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { slugifyCategory } from '../lib/products';

const API_BASE = '/api';
let categoryTreePromise;

export default function MegaMenu({ onSelect } = {}) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        if (!categoryTreePromise) {
          categoryTreePromise = fetch(`${API_BASE}/categories/tree`).then((res) => {
            if (!res.ok) throw new Error('Failed');
            return res.json();
          });
        }
        const data = await categoryTreePromise;
        if (!ignore) setTree(data.categories || data.data || []);
      } catch (e) {
        categoryTreePromise = null;
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="p-4 text-sm">Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4 p-5 text-slate-800">
      {tree.slice(0, 12).map((cat) => (
        <div key={cat._id || cat.slug}>
          <Link
            to={`/products?category=${encodeURIComponent(cat.slug)}`}
            onClick={(event) => {
              if (!onSelect) return;
              event.preventDefault();
              onSelect({ categorySlug: cat.slug });
            }}
            className="mb-2 block cursor-pointer font-semibold hover:text-yellow-500"
          >
            {cat.name}
          </Link>
          <ul className="space-y-1 text-sm">
            {(cat.subcategories || cat.children || []).slice(0, 6).map((sub) => (
              <li key={sub._id || sub.slug}>
                <Link
                  to={`/products?category=${encodeURIComponent(cat.slug)}&subCategory=${encodeURIComponent(sub.slug || slugifyCategory(sub.name))}`}
                  onClick={(event) => {
                    if (!onSelect) return;
                    event.preventDefault();
                    onSelect({ categorySlug: cat.slug, subCategorySlug: sub.slug || slugifyCategory(sub.name) });
                  }}
                  className="block cursor-pointer pointer-events-auto hover:text-yellow-500"
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
