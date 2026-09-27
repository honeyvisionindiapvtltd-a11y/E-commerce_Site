import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const router = express.Router();
const SITE_ORIGIN = 'https://honeyvision.co.in';
const CACHE_DURATION_MS = 30 * 60 * 1000;
let cachedSitemap = null;
let sitemapGeneration = null;

const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
}[character]));

const sitemapUrl = (path, lastModified) => {
  const lastmod = lastModified ? `<lastmod>${new Date(lastModified).toISOString().slice(0, 10)}</lastmod>` : '';
  return `<url><loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc>${lastmod}</url>`;
};

async function generateSitemap() {
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, slug: { $type: 'string', $ne: '' } })
      .select('_id updatedAt')
      .lean(),
    Category.find({ isActive: true, slug: { $type: 'string', $ne: '' } })
      .select('slug parentCategory updatedAt')
      .lean(),
  ]);

  const urls = new Map();
  const addUrl = (path, updatedAt) => {
    if (!urls.has(path)) urls.set(path, sitemapUrl(path, updatedAt));
  };

  [
    '/',
    '/products',
    '/categories',
    '/about',
    '/brands',
    '/solutions',
    '/technology',
    '/services',
    '/industries',
    '/blogs',
    '/contact',
    '/warranty',
    '/faqs',
    '/privacy-policy',
    '/terms',
    '/delivery',
    '/installation',
    '/dealer-locator',
    '/combo-deals',
    '/amc',
  ].forEach((path) => addUrl(path));

  products.forEach((product) => addUrl(`/products/${product._id}`, product.updatedAt));

  const categoriesById = new Map(categories.map((category) => [String(category._id), category]));
  categories.forEach((category) => {
    if (!category.parentCategory) {
      addUrl(`/products?category=${encodeURIComponent(category.slug)}`, category.updatedAt);
      return;
    }

    const parent = categoriesById.get(String(category.parentCategory));
    if (parent) {
      const query = new URLSearchParams({ category: parent.slug, subCategory: category.slug });
      addUrl(`/products?${query.toString()}`, category.updatedAt);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from(urls.values()).join('')}</urlset>`;
}

router.get('/sitemap.xml', async (_req, res) => {
  res.type('application/xml');
  res.set('Cache-Control', 'public, max-age=300, s-maxage=1800');

  if (cachedSitemap && cachedSitemap.expiresAt > Date.now()) {
    return res.send(cachedSitemap.body);
  }

  try {
    sitemapGeneration ||= generateSitemap();
    const body = await sitemapGeneration;
    cachedSitemap = { body, expiresAt: Date.now() + CACHE_DURATION_MS };
    return res.send(body);
  } catch (error) {
    if (cachedSitemap) return res.send(cachedSitemap.body);
    console.error('Sitemap generation failed:', error.message);
    return res.status(503).send('Sitemap is temporarily unavailable.');
  } finally {
    sitemapGeneration = null;
  }
});

export default router;