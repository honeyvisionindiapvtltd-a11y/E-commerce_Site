import { categoriesData } from '../seed/categoriesData.js';
import { productData } from '../seed/productData.js';

const approvedBrands = [
  'Honeywell',
  'Prizor',
  'CP Plus',
  'Dahua',
  'Dell',
  'Prama',
  'Hikvision',
  'HP',
  'DJI',
  'TP-Link',
  'Samsung',
  'Seagate',
];

const categoryBySlug = new Map(categoriesData.map((category) => [category.slug, category]));
const subcategories = categoriesData.flatMap((category) =>
  (category.subcategories || []).map((subcategory) => ({
    categorySlug: category.slug,
    subCategorySlug: subcategory.slug,
    name: subcategory.name,
  }))
);
const counts = new Map(subcategories.map((subcategory) => [subcategory.subCategorySlug, 0]));
const categoryCounts = new Map(categoriesData.map((category) => [category.slug, 0]));
const brandCounts = new Map(approvedBrands.map((brand) => [brand, 0]));
const duplicateSkus = [];
const duplicateSlugs = [];
const invalidCategories = [];
const invalidSubcategories = [];
const unapprovedBrands = [];
const invalidCommercialValues = [];
const seenSkus = new Set();
const seenSlugs = new Set();

for (const product of productData) {
  if (product.price <= 0 || product.mrp < product.price || product.stock <= 0) {
    invalidCommercialValues.push({ sku: product.sku, price: product.price, mrp: product.mrp, stock: product.stock });
  }
  if (!categoryBySlug.has(product.categorySlug)) {
    invalidCategories.push(product);
  } else {
    categoryCounts.set(product.categorySlug, categoryCounts.get(product.categorySlug) + 1);
  }

  const parentCategory = categoryBySlug.get(product.categorySlug);
  const validSubcategory = parentCategory?.subcategories?.some(
    (subcategory) => subcategory.slug === product.subCategorySlug
  );
  if (!validSubcategory) {
    invalidSubcategories.push(product);
  } else {
    counts.set(product.subCategorySlug, counts.get(product.subCategorySlug) + 1);
  }

  if (brandCounts.has(product.brand)) {
    brandCounts.set(product.brand, brandCounts.get(product.brand) + 1);
  } else {
    unapprovedBrands.push({ sku: product.sku, brand: product.brand });
  }

  if (seenSkus.has(product.sku)) duplicateSkus.push(product.sku);
  if (seenSlugs.has(product.slug)) duplicateSlugs.push(product.slug);
  seenSkus.add(product.sku);
  seenSlugs.add(product.slug);
}

const underPopulated = subcategories
  .filter((subcategory) => counts.get(subcategory.subCategorySlug) < 2)
  .map((subcategory) => ({ ...subcategory, count: counts.get(subcategory.subCategorySlug) }));

const report = {
  totalProducts: productData.length,
  totalCategories: categoriesData.length,
  totalSubcategories: subcategories.length,
  productsPerCategory: Object.fromEntries(categoryCounts),
  productsPerSubcategory: Object.fromEntries(counts),
  productsPerBrand: Object.fromEntries(brandCounts),
  underPopulated,
  invalidCategories,
  invalidSubcategories,
  invalidCategoryCount: invalidCategories.length,
  invalidSubcategoryCount: invalidSubcategories.length,
  duplicateSkus,
  duplicateSlugs,
  unapprovedBrands,
  invalidCommercialValues,
};

if (process.argv.includes('--stats')) {
  console.log(JSON.stringify({
    totalProducts: report.totalProducts,
    totalCategories: report.totalCategories,
    totalSubcategories: report.totalSubcategories,
    productsPerCategory: report.productsPerCategory,
    productsPerBrand: report.productsPerBrand,
    underPopulatedCount: report.underPopulated.length,
    invalidCategoryCount: report.invalidCategoryCount,
    invalidSubcategoryCount: report.invalidSubcategoryCount,
    duplicateSkuCount: report.duplicateSkus.length,
    duplicateSlugCount: report.duplicateSlugs.length,
    unapprovedBrandCount: report.unapprovedBrands.length,
    invalidCommercialValueCount: report.invalidCommercialValues.length,
    unapprovedBrandNames: [...new Set(report.unapprovedBrands.map((item) => item.brand))],
  }));
} else if (process.argv.includes('--issues')) {
  console.log(JSON.stringify({
    invalidCategories: report.invalidCategories.map((product) => ({ sku: product.sku, categorySlug: product.categorySlug })),
    invalidSubcategories: report.invalidSubcategories.map((product) => ({ sku: product.sku, categorySlug: product.categorySlug, subCategorySlug: product.subCategorySlug })),
    duplicateSkus: report.duplicateSkus,
    duplicateSlugs: report.duplicateSlugs,
    unapprovedBrands: report.unapprovedBrands,
  }, null, 2));
} else if (process.argv.includes('--summary')) {
  console.log(JSON.stringify({
    totalProducts: report.totalProducts,
    totalCategories: report.totalCategories,
    totalSubcategories: report.totalSubcategories,
    productsPerCategory: report.productsPerCategory,
    productsPerBrand: report.productsPerBrand,
    underPopulatedCount: report.underPopulated.length,
    underPopulated: report.underPopulated,
    invalidCategoryCount: report.invalidCategoryCount,
    invalidSubcategoryCount: report.invalidSubcategoryCount,
    duplicateSkuCount: report.duplicateSkus.length,
    duplicateSlugCount: report.duplicateSlugs.length,
    unapprovedBrandCount: report.unapprovedBrands.length,
    unapprovedBrands: report.unapprovedBrands,
  }, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}
