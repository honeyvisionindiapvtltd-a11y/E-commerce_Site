import 'dotenv/config';
import crypto from 'crypto';
import OpenAI from 'openai';
import Product from '../models/Product.js';
import ProductImageIndex from '../models/ProductImageIndex.js';

export const resolveImageVisionConfig = (env = process.env) => {
  const provider = String(env.AI_PROVIDER || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  const apiKey = String(env.AI_API_KEY || env.OPENAI_API_KEY || '').trim();
  const supportedProvider = !provider || ['openai', 'openaicompatible'].includes(provider);
  return {
    enabled: supportedProvider && Boolean(apiKey),
    apiKey,
    baseURL: String(env.AI_BASE_URL || '').trim().replace(/\/$/, ''),
    model: String(env.IMAGE_RECOGNITION_MODEL || env.AI_MODEL || 'gpt-4o-mini').trim(),
    timeout: Math.min(Math.max(Number(env.AI_TIMEOUT_MS) || 20000, 5000), 60000),
  };
};

const imageVisionConfig = resolveImageVisionConfig();
const IMAGE_VISION_CLIENT = imageVisionConfig.enabled
  ? new OpenAI({
    apiKey: imageVisionConfig.apiKey,
    ...(imageVisionConfig.baseURL ? { baseURL: imageVisionConfig.baseURL } : {}),
    timeout: imageVisionConfig.timeout,
    maxRetries: 0,
  })
  : null;
const INDEX_VERSION = 'product-image-index-v1';
const DEFAULT_CANDIDATE_LIMIT = 60;
const DEFAULT_RESULTS_LIMIT = 5;
let imageIndexTask = null;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeText = (value = '') => String(value || '').trim().toLowerCase();
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const roundValue = (value) => Number((value || 0).toFixed(4));

const coerceString = (...values) => values
  .map((value) => String(value ?? '').trim())
  .filter(Boolean)
  .join(' ');

const hashString = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const getProductImageUrls = (product = {}) => {
  const images = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.thumbnail || '',
    product.image || '',
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return [...new Set(images)];
};

const buildSearchableText = (product = {}) => {
  const textParts = [
    product.name,
    product.brand,
    product.category,
    product.subCategory,
    product.series,
    product.productFamily,
    product.model,
    product.modelVersion,
    product.cameraType,
    product.technology,
    product.resolution,
    product.specifications,
    product.shortDescription,
    product.description,
    product.sku,
    product.tags,
    product.aiFeatures,
    product.applications,
    product.modelNumber,
    product.productCode,
  ];

  const flattened = textParts.flatMap((part) => {
    if (Array.isArray(part)) return part;
    if (part && typeof part === 'object') return Object.values(part);
    return [part];
  });

  return flattened
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
};

const similarityScore = (valueA, valueB) => {
  const left = normalizeText(valueA);
  const right = normalizeText(valueB);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0;

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;

  return roundValue(overlap / union);
};

const normalizeProductType = (value = '') => String(value || '').trim().toLowerCase();

export const getProductImageIndexSummary = async () => {
  const [totalProducts, indexedProducts, pendingProducts, failedProducts, outdatedProducts, lastIndexed] = await Promise.all([
    Product.countDocuments({ isActive: { $ne: false } }),
    ProductImageIndex.countDocuments({ indexingStatus: 'indexed' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'pending' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'failed' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'outdated' }),
    ProductImageIndex.findOne({ indexingStatus: 'indexed' }).sort({ indexedAt: -1 }).select('indexedAt').lean(),
  ]);

  return {
    totalProducts,
    indexedProducts,
    pendingProducts,
    failedProducts,
    outdatedProducts,
    lastIndexedAt: lastIndexed?.indexedAt || null,
  };
};

export const markProductImageIndexOutdated = async (productId) => ProductImageIndex.updateOne(
  { product: productId },
  { $set: { indexingStatus: 'outdated', updatedAt: new Date() } }
);

export const removeProductImageIndex = async (productId) => ProductImageIndex.deleteOne({ product: productId });

export const buildProductImageIndexEntry = (product = {}) => {
  const imageUrls = getProductImageUrls(product);
  const searchableText = buildSearchableText(product);

  return {
    product: product._id,
    productId: String(product._id || product.id || ''),
    sku: product.sku || '',
    name: product.name || '',
    brand: product.brand || '',
    category: product.categoryName || product.category || '',
    subCategory: product.subCategoryName || product.subCategory || '',
    modelNumber: product.model || product.modelNumber || '',
    productCode: product.productCode || product.barcode || '',
    cloudinaryUrls: imageUrls,
    thumbnail: product.thumbnail || imageUrls[0] || '',
    searchableText,
    imageHash: hashString(JSON.stringify(imageUrls)),
    indexingStatus: 'indexed',
    embeddingVersion: INDEX_VERSION,
    indexedAt: new Date(),
    updatedAt: new Date(),
    errorMessage: '',
  };
};

export const shouldReindexImageProduct = ({
  doc,
  imageHash,
  searchableText,
  reindexAll = false,
  reindexFailed = false,
  reindexOutdated = false,
} = {}) => {
  if (reindexAll || !doc) return true;
  if (doc.imageHash !== imageHash || doc.searchableText !== searchableText || doc.embeddingVersion !== INDEX_VERSION) return true;
  if (doc.indexingStatus === 'pending') return true;
  if (reindexFailed && doc.indexingStatus === 'failed') return true;
  return reindexOutdated && doc.indexingStatus === 'outdated';
};

export const indexProductImageCatalog = async ({
  reindexAll = false,
  reindexFailed = false,
  reindexOutdated = false,
  limit = 0,
} = {}) => {
  const filters = { isActive: { $ne: false } };
  const productQuery = Product.find(filters).sort({ updatedAt: -1, createdAt: -1 });
  if (limit > 0) productQuery.limit(limit);

  const products = await productQuery.lean();
  const totals = { total: products.length, indexed: 0, pending: 0, failed: 0, outdated: 0 };

  for (const product of products) {
    const imageUrls = getProductImageUrls(product);
    const searchableText = buildSearchableText(product);
    const imageHash = hashString(JSON.stringify(imageUrls));
    const doc = await ProductImageIndex.findOne({ product: product._id }).lean();
    const shouldReindex = shouldReindexImageProduct({
      doc,
      imageHash,
      searchableText,
      reindexAll,
      reindexFailed,
      reindexOutdated,
    });

    if (!shouldReindex) {
      totals.indexed += 1;
      continue;
    }

    try {
      const nextEntry = {
        ...buildProductImageIndexEntry(product),
        imageHash,
        searchableText,
      };

      await ProductImageIndex.findOneAndUpdate(
        { product: product._id },
        {
          ...nextEntry,
          indexingStatus: 'indexed',
          errorMessage: '',
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      totals.indexed += 1;
    } catch (error) {
      await ProductImageIndex.findOneAndUpdate(
        { product: product._id },
        {
          product: product._id,
          productId: String(product._id),
          sku: product.sku || '',
          name: product.name || '',
          brand: product.brand || '',
          category: product.category || '',
          subCategory: product.subCategory || '',
          indexingStatus: 'failed',
          errorMessage: error?.message || 'Indexing failed',
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      totals.failed += 1;
    }
  }

  const summary = await getProductImageIndexSummary();
  return {
    success: true,
    summary,
    totals,
    message: 'Product image index updated successfully.',
  };
};

export const extractVisibleTextSignals = async (imageBuffer, mimeType = 'image/jpeg') => {
  if (!IMAGE_VISION_CLIENT) {
    return {
      brand: '',
      model: '',
      sku: '',
      barcode: '',
      category: '',
      text: '',
      source: 'fallback',
    };
  }

  try {
    const base64 = imageBuffer.toString('base64');
    const completion = await IMAGE_VISION_CLIENT.responses.create({
      model: imageVisionConfig.model,
      instructions: 'You identify retail products from photos. Extract only details visibly present in the image. Return a JSON object with brand, model, sku, barcode, category, and visibleText. Use empty strings for unreadable fields and never guess.',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Read the product label, model number, barcode, brand, and other visible text. Return JSON only.',
          },
          {
            type: 'input_image',
            image_url: `data:${mimeType};base64,${base64}`,
            detail: 'high',
          },
        ],
      }],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 300,
    });

    return parseImageRecognitionResponse(completion?.output_text || '{}');
  } catch (error) {
    console.warn('Vision-text extraction failed:', error.message);
    return {
      brand: '',
      model: '',
      sku: '',
      barcode: '',
      category: '',
      text: '',
      source: 'fallback',
    };
  }
};

const exactMatchCandidates = (signals = {}) => {
  const expressions = [];
  if (signals.barcode) expressions.push({ productCode: { $regex: escapeRegex(signals.barcode), $options: 'i' } });
  if (signals.sku) expressions.push({ sku: { $regex: escapeRegex(signals.sku), $options: 'i' } });
  if (signals.model) expressions.push({ modelNumber: { $regex: escapeRegex(signals.model), $options: 'i' } });
  if (signals.brand) expressions.push({ brand: { $regex: escapeRegex(signals.brand), $options: 'i' } });
  return expressions;
};

export const hasProductRecognitionSignals = (signals = {}) => [
  signals.brand,
  signals.model,
  signals.sku,
  signals.barcode,
  signals.category,
  signals.text,
].some((value) => String(value || '').trim().length > 0);

export const scoreProductCandidate = (candidate = {}, signals = {}) => {
  const productText = String(candidate.searchableText || '');
  const brandSimilarity = similarityScore(candidate.brand, signals.brand || '');
  const modelSimilarity = similarityScore(candidate.modelNumber || candidate.name, signals.model || signals.name || '');
  const skuSimilarity = similarityScore(candidate.sku, signals.sku || '');
  const categorySimilarity = similarityScore(candidate.category, signals.category || '');
  const queryText = coerceString(signals.brand, signals.model, signals.sku, signals.barcode, signals.category, signals.text);
  const queryTokens = new Set(queryText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 1));
  const productTokens = new Set(productText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 1));
  const matchedTokens = [...queryTokens].filter((token) => productTokens.has(token)).length;
  const textCoverage = queryTokens.size ? matchedTokens / queryTokens.size : 0;
  const normalizedProductCode = normalizeText(candidate.productCode);
  const normalizedSku = normalizeText(candidate.sku);
  const normalizedModel = normalizeText(candidate.modelNumber);
  const exactIdentifierMatch = Boolean(
    (signals.barcode && normalizeText(signals.barcode) === normalizedProductCode)
    || (signals.sku && normalizeText(signals.sku) === normalizedSku)
    || (signals.model && normalizeText(signals.model) === normalizedModel)
  );
  const confidence = exactIdentifierMatch
    ? 0.99
    : clamp((textCoverage * 0.55) + (brandSimilarity * 0.2) + (modelSimilarity * 0.2) + (categorySimilarity * 0.05), 0, 0.79);

  return {
    confidence: roundValue(confidence),
    brandSimilarity,
    modelSimilarity,
    skuSimilarity,
    categorySimilarity,
    semanticSimilarity: roundValue(textCoverage),
    exactIdentifierMatch,
  };
};

const ensureImageIndexCoverage = async () => {
  if (imageIndexTask) return imageIndexTask;

  imageIndexTask = (async () => {
    const summary = await getProductImageIndexSummary();
    const accountedFor = summary.indexedProducts + summary.pendingProducts + summary.failedProducts + summary.outdatedProducts;
    if (
      accountedFor >= summary.totalProducts
      && summary.pendingProducts === 0
      && summary.failedProducts === 0
      && summary.outdatedProducts === 0
    ) return;

    await indexProductImageCatalog({
      reindexFailed: summary.failedProducts > 0,
      reindexOutdated: summary.outdatedProducts > 0,
    });
  })();

  try {
    await imageIndexTask;
  } catch (error) {
    console.warn('Product image index refresh failed; searching the available index:', error.message);
  } finally {
    imageIndexTask = null;
  }
};

export const parseImageRecognitionResponse = (content = '{}') => {
  const parsed = JSON.parse(content || '{}');
  return {
    brand: coerceString(parsed.brand, parsed.brandName),
    model: coerceString(parsed.model, parsed.modelNumber, parsed.modelNo),
    sku: coerceString(parsed.sku, parsed.productSku),
    barcode: coerceString(parsed.barcode, parsed.qrCode, parsed.productCode),
    category: coerceString(parsed.category, parsed.subCategory),
    text: coerceString(parsed.visibleText, parsed.text),
    source: 'openai-vision',
  };
};

export const searchProductsByImage = async (fileBuffer, mimeType, metadata = {}) => {
  const processedSignals = await extractVisibleTextSignals(fileBuffer, mimeType);
  const finalSignals = {
    ...processedSignals,
    name: metadata?.name || '',
    brand: metadata?.brand || processedSignals.brand || '',
    model: metadata?.model || processedSignals.model || '',
    sku: metadata?.sku || processedSignals.sku || '',
    barcode: metadata?.barcode || processedSignals.barcode || '',
    category: metadata?.category || processedSignals.category || '',
    text: coerceString(processedSignals.text, metadata?.text || ''),
  };

  if (!hasProductRecognitionSignals(finalSignals)) {
    return {
      success: true,
      matched: false,
      confidence: 0,
      matchType: 'no-readable-product-details',
      message: 'We could not read a brand, model, barcode, or product label. Try a closer, well-lit photo of the product label.',
      product: null,
      possibleMatches: [],
    };
  }

  await ensureImageIndexCoverage();
  const exactFilters = exactMatchCandidates(finalSignals);
  const candidateFilters = [];

  if (exactFilters.length > 0) {
    candidateFilters.push({ $or: exactFilters });
  }

  if (finalSignals.brand) {
    candidateFilters.push({ brand: { $regex: escapeRegex(finalSignals.brand), $options: 'i' } });
  }

  if (finalSignals.category) {
    candidateFilters.push({ category: { $regex: escapeRegex(finalSignals.category), $options: 'i' } });
  }

  if (finalSignals.model) {
    candidateFilters.push({ modelNumber: { $regex: escapeRegex(finalSignals.model), $options: 'i' } });
  }

  const filter = candidateFilters.length > 0 ? { $and: [{ indexingStatus: { $in: ['indexed', 'outdated'] } }, { $or: candidateFilters }] } : { indexingStatus: { $in: ['indexed', 'outdated'] } };

  const candidates = await ProductImageIndex.find(filter)
    .sort({ updatedAt: -1 })
    .limit(DEFAULT_CANDIDATE_LIMIT)
    .lean();
  const candidateProductIds = candidates.map((candidate) => candidate.product).filter(Boolean);
  const products = await Product.find({
    _id: { $in: candidateProductIds },
    isActive: { $ne: false },
  }).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  const evaluatedResults = [];

  for (const candidate of candidates) {
    const product = productsById.get(String(candidate.product));
    if (!product) continue;

    const scores = scoreProductCandidate(candidate, finalSignals);
    const { confidence, exactIdentifierMatch } = scores;

    if (!candidate.product || Number.isNaN(confidence)) continue;

    evaluatedResults.push({
      product,
      productMatch: candidate,
      ...scores,
    });
  }

  evaluatedResults.sort((left, right) => right.confidence - left.confidence);

  const highConfidenceThreshold = Number(process.env.IMAGE_MATCH_HIGH_THRESHOLD || 0.82);
  const mediumThreshold = Number(process.env.IMAGE_MATCH_MEDIUM_THRESHOLD || 0.65);

  const exactBrandMatch = evaluatedResults[0]?.exactIdentifierMatch;

  if (exactBrandMatch && evaluatedResults[0]?.confidence >= mediumThreshold) {
    const top = evaluatedResults[0];
    return {
      success: true,
      matched: true,
      confidence: top.confidence,
      matchType: 'image+ocr+vector',
      message: 'Product matched against the HoneyVision catalog.',
      product: {
        id: String(top.product._id),
        name: top.product.name,
        sku: top.product.sku,
        brand: top.product.brand,
        price: top.product.price,
        mrp: top.product.mrp,
        stock: top.product.stock,
        stockStatus: top.product.stockStatus,
        availability: top.product.isActive !== false && top.product.stock > 0,
        thumbnail: top.product.thumbnail || top.product.images?.[0] || '',
      },
      possibleMatches: evaluatedResults.slice(0, 3).map(({ product, confidence }) => ({
        id: String(product._id),
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        confidence,
        thumbnail: product.thumbnail || product.images?.[0] || '',
      })),
    };
  }

  const topMatches = evaluatedResults.slice(0, DEFAULT_RESULTS_LIMIT);

  if (topMatches.length === 0) {
    return {
      success: true,
      matched: false,
      confidence: 0,
      matchType: 'no-match',
      message: "We couldn't confidently identify this product.",
      product: null,
      possibleMatches: [],
    };
  }

  const bestConfidence = topMatches[0].confidence;
  const matched = bestConfidence >= highConfidenceThreshold;

  return {
    success: true,
    matched,
    confidence: bestConfidence,
    matchType: matched ? 'image+ocr+vector' : 'possible-match',
    message: matched ? 'Product matched against the HoneyVision catalog.' : "We couldn't confidently identify this product.",
    product: matched ? {
      id: String(topMatches[0].product._id),
      name: topMatches[0].product.name,
      sku: topMatches[0].product.sku,
      brand: topMatches[0].product.brand,
      price: topMatches[0].product.price,
      mrp: topMatches[0].product.mrp,
      stock: topMatches[0].product.stock,
      stockStatus: topMatches[0].product.stockStatus,
      availability: topMatches[0].product.stock > 0 && topMatches[0].product.isActive !== false,
      thumbnail: topMatches[0].product.thumbnail || topMatches[0].product.images?.[0] || '',
    } : null,
    possibleMatches: topMatches.slice(0, 3).map(({ product, confidence }) => ({
      id: String(product._id),
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      confidence,
      thumbnail: product.thumbnail || product.images?.[0] || '',
    })),
  };
};
