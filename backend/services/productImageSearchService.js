import crypto from 'crypto';
import OpenAI from 'openai';
import Product from '../models/Product.js';
import ProductImageIndex from '../models/ProductImageIndex.js';

const OPENAI_CLIENT = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const INDEX_VERSION = 'product-image-index-v1';
const DEFAULT_CANDIDATE_LIMIT = 60;
const DEFAULT_RESULTS_LIMIT = 5;

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

const buildEmbeddingVector = (product = {}, extraTerms = []) => {
  const coreTokens = [
    ...extraTerms,
    product.brand,
    product.name,
    product.sku,
    product.model,
    product.modelNumber,
    product.productCode,
    product.category,
    product.subCategory,
    product.series,
    product.productFamily,
    product.cameraType,
    product.technology,
    product.resolution,
    product.shortDescription,
    product.description,
  ];

  const tokens = [...new Set(coreTokens.flatMap((value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)))];

  const vector = Array.from({ length: 32 }, (_, index) => {
    let accumulator = 0;
    for (const token of tokens) {
      const tokenHash = hashString(`${token}:${index}`);
      const numericValue = parseInt(tokenHash.slice(0, 8), 16) / 0xffffffff;
      accumulator += numericValue;
    }
    return roundValue(tokens.length ? accumulator / tokens.length : 0);
  });

  return vector;
};

const cosineSimilarity = (left = [], right = []) => {
  const leftVector = Array.isArray(left) ? left : [];
  const rightVector = Array.isArray(right) ? right : [];
  const length = Math.min(leftVector.length, rightVector.length);

  if (!length) return 0;

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = Number(leftVector[index]) || 0;
    const rightValue = Number(rightVector[index]) || 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) return 0;

  return roundValue(dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude)));
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
    embedding: buildEmbeddingVector(product, [searchableText]),
    searchableText,
    imageHash: hashString(JSON.stringify(imageUrls)),
    indexingStatus: 'indexed',
    embeddingVersion: INDEX_VERSION,
    indexedAt: new Date(),
    updatedAt: new Date(),
    errorMessage: '',
  };
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
    const shouldReindex = reindexAll || reindexFailed || reindexOutdated || !doc || doc.imageHash !== imageHash || doc.searchableText !== searchableText || doc.embeddingVersion !== INDEX_VERSION || doc.indexingStatus === 'failed' || doc.indexingStatus === 'outdated';

    if (!shouldReindex) {
      totals.indexed += 1;
      continue;
    }

    try {
      const nextEntry = {
        ...buildProductImageIndexEntry(product),
        imageHash,
        searchableText,
        embedding: buildEmbeddingVector(product, [searchableText]),
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
  if (!OPENAI_CLIENT) {
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
    const completion = await OPENAI_CLIENT.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a product recognition assistant for an ecommerce catalog. Return compact JSON with brand, model, sku, barcode, category, and visibleText, derived strictly from the supplied product image. If you cannot read a field, leave it empty string.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify the product from the image. Use visible text, packaging labels, logos, and model information. Return JSON only. Do not hallucinate. If unsure, leave fields blank.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      brand: coerceString(parsed.brand, parsed.brandName),
      model: coerceString(parsed.model, parsed.modelNumber, parsed.modelNo),
      sku: coerceString(parsed.sku, parsed.productSku),
      barcode: coerceString(parsed.barcode, parsed.qrCode, parsed.productCode),
      category: coerceString(parsed.category, parsed.subCategory),
      text: coerceString(parsed.visibleText, parsed.text),
      source: 'openai-vision',
    };
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

const buildQueryVector = (signals = {}) => {
  const textSeed = [
    signals.brand,
    signals.model,
    signals.sku,
    signals.barcode,
    signals.category,
    signals.text,
    signals.name,
  ].join(' ');

  const words = [...new Set(String(textSeed || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean))];

  return buildEmbeddingVector({ name: textSeed, brand: signals.brand, model: signals.model, sku: signals.sku, category: signals.category }, words);
};

const exactMatchCandidates = (signals = {}) => {
  const expressions = [];
  if (signals.barcode) expressions.push({ productCode: { $regex: escapeRegex(signals.barcode), $options: 'i' } });
  if (signals.sku) expressions.push({ sku: { $regex: escapeRegex(signals.sku), $options: 'i' } });
  if (signals.model) expressions.push({ modelNumber: { $regex: escapeRegex(signals.model), $options: 'i' } });
  if (signals.brand) expressions.push({ brand: { $regex: escapeRegex(signals.brand), $options: 'i' } });
  return expressions;
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

  const queryVector = buildQueryVector(finalSignals);
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

  const evaluatedResults = [];

  for (const candidate of candidates) {
    const product = await Product.findById(candidate.product).lean();
    if (!product || product.isActive === false) continue;

    const visualSimilarity = cosineSimilarity(candidate.embedding, queryVector);
    const semanticSimilarity = similarityScore(candidate.searchableText, finalSignals.text || finalSignals.model || finalSignals.brand || finalSignals.name || '');
    const brandSimilarity = similarityScore(candidate.brand, finalSignals.brand || '');
    const modelSimilarity = similarityScore(candidate.modelNumber || candidate.name, finalSignals.model || finalSignals.name || '');
    const skuSimilarity = similarityScore(candidate.sku, finalSignals.sku || '');
    const categorySimilarity = similarityScore(candidate.category, finalSignals.category || '');
    const textSimilarity = similarityScore(candidate.searchableText, finalSignals.text || candidate.searchableText || '');

    const confidence = clamp(
      (visualSimilarity * 0.4) +
      ((brandSimilarity + modelSimilarity + skuSimilarity + textSimilarity) / 4) * 0.25 +
      (categorySimilarity * 0.15) +
      (semanticSimilarity * 0.2),
      0,
      1
    );

    if (!candidate.product || Number.isNaN(confidence)) continue;

    evaluatedResults.push({
      product,
      productMatch: candidate,
      confidence: roundValue(confidence),
      visualSimilarity: roundValue(visualSimilarity),
      brandSimilarity: roundValue(brandSimilarity),
      modelSimilarity: roundValue(modelSimilarity),
      skuSimilarity: roundValue(skuSimilarity),
      categorySimilarity: roundValue(categorySimilarity),
      semanticSimilarity: roundValue(semanticSimilarity),
    });
  }

  evaluatedResults.sort((left, right) => right.confidence - left.confidence);

  const highConfidenceThreshold = Number(process.env.IMAGE_MATCH_HIGH_THRESHOLD || 0.82);
  const mediumThreshold = Number(process.env.IMAGE_MATCH_MEDIUM_THRESHOLD || 0.65);

  const exactBrandMatch = !!(finalSignals.barcode || finalSignals.sku || finalSignals.model) && evaluatedResults[0]?.confidence >= 0.5;

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
