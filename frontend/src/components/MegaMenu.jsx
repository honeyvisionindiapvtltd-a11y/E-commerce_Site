import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { slugifyCategory } from '../lib/products';

export default function MegaMenu() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/categories/tree');
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
    <div className="grid grid-cols-3 gap-4 p-5 text-slate-800">
      {tree.slice(0, 12).map((cat) => (
        <div key={cat._id || cat.slug}>
          <h4 className="font-semibold mb-2">{cat.name}</h4>
          <ul className="space-y-1 text-sm">
            {(cat.children || []).slice(0, 6).map((sub) => (
              <li key={sub._id || sub.slug}>
                <Link to={`/products?category=${slugifyCategory(cat.name)}&subCategory=${slugifyCategory(sub.name)}`} className="hover:text-yellow-500">
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
