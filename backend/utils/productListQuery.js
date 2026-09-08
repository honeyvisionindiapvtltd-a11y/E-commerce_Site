export const PRODUCT_LIST_SELECT = [
  '_id',
  'name',
  'slug',
  'sku',
  'brand',
  'category',
  'subCategory',
  'price',
  'mrp',
  'discountPercentage',
  'stock',
  'stockStatus',
  'thumbnail',
  'images',
  'rating',
  'reviewCount',
  'featured',
  'bestSeller',
  'newArrival',
  'shortDescription',
  'warranty',
  'installationAvailable',
  'productType',
  'createdAt',
].join(' ');

export const buildProductListProjection = () => PRODUCT_LIST_SELECT;

export const buildListPagination = ({ page = 1, limit = 24, total = 0 } = {}) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limitNumber)) : 1;
  const hasNextPage = total > pageNumber * limitNumber;
  const hasPreviousPage = pageNumber > 1;

  return {
    page: pageNumber,
    limit: limitNumber,
    skip,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    hasMore: hasNextPage,
  };
};

export const getSearchRegex = (value = '') => ({
  $regex: String(value).trim(),
  $options: 'i',
});
