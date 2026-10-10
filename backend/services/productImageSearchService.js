import 'dotenv/config';
import crypto from 'crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
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
const IMAGE_EMBEDDING_MODEL = String(process.env.IMAGE_EMBEDDING_MODEL || 'Xenova/clip-vit-base-patch32').trim();
const IMAGE_PREPROCESSING_VERSION = 'oriented-jpeg-tiles-v2';
const IMAGE_EMBEDDING_VERSION = `clip:${IMAGE_EMBEDDING_MODEL}:${IMAGE_PREPROCESSING_VERSION}`;
const DEFAULT_CANDIDATE_LIMIT = 1000;
const DEFAULT_RESULTS_LIMIT = 5;
const MAX_IMAGES_PER_PRODUCT = 5;
const CATEGORY_CLASSIFIER_MARGIN = 0.05;
const CATEGORY_CLASSIFIER_MIN_SIMILARITY = 0.7;
let imageIndexTask = null;
let imageEmbedderTask = null;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeText = (value = '') => String(value || '').trim().toLowerCase();
const roundValue = (value) => Number((value || 0).toFixed(4));

const coerceString = (...values) => values
  .map((value) => String(value ?? '').trim())
  .filter(Boolean)
  .join(' ');

const getReferenceName = (value) => (
  value && typeof value === 'object' && !(value instanceof Date)
    ? coerceString(value.name, value.title, value.slug)
    : String(value ?? '').trim()
);

const normalizeIdentifier = (value = '') => normalizeText(value).replace(/[^a-z0-9]/g, '');

const hashString = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

export const normalizeEmbeddingVector = (values = []) => {
  const vector = Array.from(values, Number);
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0));
  if (!vector.length || !Number.isFinite(magnitude) || magnitude === 0) return [];
  return vector.map((value) => value / magnitude);
};

export const cosineSimilarity = (vectorA = [], vectorB = []) => {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || vectorA.length === 0 || vectorA.length !== vectorB.length) return 0;
  return roundValue(clamp(
    vectorA.reduce((sum, value, index) => sum + (Number(value) * Number(vectorB[index])), 0),
    -1,
    1
  ));
};

const getImageEmbedder = async () => {
  if (!imageEmbedderTask) {
    imageEmbedderTask = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('image-feature-extraction', IMAGE_EMBEDDING_MODEL, { dtype: 'q8' });
    })();
  }
  return imageEmbedderTask;
};

export const createImageEmbedding = async (imageBuffer, mimeType = 'image/jpeg', embedder = null) => {
  const extractor = embedder || await getImageEmbedder();
  const tensor = await extractor(new Blob([imageBuffer], { type: mimeType }));
  return normalizeEmbeddingVector(tensor?.data || []);
};

const normalizeImageForEmbedding = async (imageBuffer) => {
  const { data, info } = await sharp(imageBuffer, { limitInputPixels: 40000000 })
    .rotate()
    .jpeg({ quality: 95 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
};

const getImageEmbeddingVariants = async (imageBuffer) => {
  const normalized = await normalizeImageForEmbedding(imageBuffer);
  const variants = [{ buffer: normalized.buffer, kind: 'full' }];
  const cropVariant = async (left, top, width, height, kind) => {
    if (width < 160 || height < 160) return;
    const buffer = await sharp(normalized.buffer)
      .extract({ left, top, width, height })
      .jpeg({ quality: 95 })
      .toBuffer();
    variants.push({ buffer, kind });
  };

  try {
    const trimmed = await sharp(normalized.buffer)
      .trim({ background: '#ffffff', threshold: 18 })
      .jpeg({ quality: 95 })
      .toBuffer({ resolveWithObject: true });
    const originalArea = normalized.width * normalized.height;
    const trimmedArea = trimmed.info.width * trimmed.info.height;
    if (trimmedArea > 0 && trimmedArea < originalArea * 0.88) {
      variants.push({ buffer: trimmed.data, kind: 'background-trim' });
    }
  } catch (error) {
    if (error?.message !== 'Image to trim is blank') throw error;
  }

  const aspectRatio = normalized.width / normalized.height;
  if (aspectRatio >= 1.35 && normalized.width >= 480) {
    const tileWidth = Math.ceil(normalized.width / 3);
    const overlap = Math.round(tileWidth * 0.06);
    for (let index = 0; index < 3; index += 1) {
      const left = Math.max(0, index * tileWidth - overlap);
      const right = Math.min(normalized.width, (index + 1) * tileWidth + overlap);
      await cropVariant(left, 0, right - left, normalized.height, `horizontal-tile-${index + 1}`);
    }
  } else if (aspectRatio <= 0.74 && normalized.height >= 480) {
    const tileHeight = Math.ceil(normalized.height / 3);
    const overlap = Math.round(tileHeight * 0.06);
    for (let index = 0; index < 3; index += 1) {
      const top = Math.max(0, index * tileHeight - overlap);
      const bottom = Math.min(normalized.height, (index + 1) * tileHeight + overlap);
      await cropVariant(0, top, normalized.width, bottom - top, `vertical-tile-${index + 1}`);
    }
  } else if (Math.min(normalized.width, normalized.height) >= 480) {
    const tileWidth = Math.ceil(normalized.width / 2);
    const tileHeight = Math.ceil(normalized.height / 2);
    const overlapX = Math.round(tileWidth * 0.06);
    const overlapY = Math.round(tileHeight * 0.06);
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        const left = Math.max(0, column * tileWidth - overlapX);
        const top = Math.max(0, row * tileHeight - overlapY);
        const right = Math.min(normalized.width, (column + 1) * tileWidth + overlapX);
        const bottom = Math.min(normalized.height, (row + 1) * tileHeight + overlapY);
        await cropVariant(left, top, right - left, bottom - top, `grid-tile-${row + 1}-${column + 1}`);
      }
    }
  }

  return variants;
};

export const createImageSearchEmbeddings = async (imageBuffer, embedder = null) => {
  const variants = await getImageEmbeddingVariants(imageBuffer);
  const embeddings = [];
  for (const variant of variants) {
    const embedding = await createImageEmbedding(variant.buffer, 'image/jpeg', embedder);
    if (embedding.length) embeddings.push({ embedding, kind: variant.kind });
  }
  return embeddings;
};

const fetchCatalogImageEmbedding = async (imageUrl) => {
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}`);
  const mimeType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!mimeType.startsWith('image/')) throw new Error('Catalog URL did not return an image');
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  if (imageBuffer.length === 0 || imageBuffer.length > 10 * 1024 * 1024) throw new Error('Catalog image size is outside the supported range');
  const { buffer } = await normalizeImageForEmbedding(imageBuffer);
  return createImageEmbedding(buffer, 'image/jpeg');
};

export const getCatalogEmbeddingSimilarity = (queryEmbedding, imageEmbeddings = []) => {
  const vectors = Array.isArray(imageEmbeddings) ? imageEmbeddings : [];
  return roundValue(Math.max(0, ...vectors.map((vector) => cosineSimilarity(queryEmbedding, vector))));
};

export const classifyImageCategory = (queryEmbeddings = [], candidates = [], {
  minimumSimilarity = CATEGORY_CLASSIFIER_MIN_SIMILARITY,
  minimumMargin = CATEGORY_CLASSIFIER_MARGIN,
} = {}) => {
  const queries = queryEmbeddings.length && Array.isArray(queryEmbeddings[0])
    ? queryEmbeddings
    : queryEmbeddings.length ? [queryEmbeddings] : [];
  const categories = new Map();
  for (const candidate of candidates) {
    const category = String(candidate.category || candidate.subCategory || '').trim();
    const key = normalizeCategoryKey(category);
    if (!key || !hasValidImageEmbeddings(candidate.imageEmbeddings)) continue;
    const vectors = categories.get(key) || { category, vectors: [] };
    vectors.vectors.push(...candidate.imageEmbeddings);
    categories.set(key, vectors);
  }
  const ranked = [...categories.values()].map(({ category, vectors }) => {
    const centroid = normalizeEmbeddingVector(vectors[0].map((_, index) => (
      vectors.reduce((sum, vector) => sum + vector[index], 0) / vectors.length
    )));
    return {
      category,
      similarity: roundValue(Math.max(0, ...queries.map((query) => cosineSimilarity(query, centroid)))),
    };
  }).sort((left, right) => right.similarity - left.similarity);
  const top = ranked[0];
  const margin = top ? roundValue(top.similarity - (ranked[1]?.similarity || 0)) : 0;
  const confident = Boolean(top && top.similarity >= minimumSimilarity && margin >= minimumMargin);
  return {
    category: confident ? top.category : '',
    confidence: top?.similarity || 0,
    margin,
    confident,
    ranked: ranked.slice(0, 3),
  };
};

const hasValidImageEmbeddings = (imageEmbeddings = []) => {
  if (!Array.isArray(imageEmbeddings) || imageEmbeddings.length === 0) return false;
  const dimensions = imageEmbeddings[0]?.length;
  return Number.isInteger(dimensions)
    && dimensions > 0
    && imageEmbeddings.every((vector) => (
      Array.isArray(vector)
      && vector.length === dimensions
      && vector.every((value) => typeof value === 'number' && Number.isFinite(value))
      && Math.sqrt(vector.reduce((sum, value) => sum + (value ** 2), 0)) > 0
    ));
};

const getProductImageUrls = (product = {}) => {
  const images = [
    product.thumbnail || '',
    product.image || '',
    ...(Array.isArray(product.images) ? product.images : []),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return [...new Set(images)];
};

const buildSearchableText = (product = {}) => {
  const textParts = [
    product.name,
    product.brand,
    getReferenceName(product.categoryName || product.category),
    getReferenceName(product.subCategoryName || product.subCategory),
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

const normalizeCategoryText = (value = '') => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(Boolean)
  .map((token) => token.endsWith('ies') ? `${token.slice(0, -3)}y` : (token.endsWith('s') && token.length > 4 ? token.slice(0, -1) : token))
  .join(' ');

const categorySimilarityScore = (valueA, valueB) => (
  similarityScore(normalizeCategoryText(valueA), normalizeCategoryText(valueB))
);

const normalizeCategoryKey = (value = '') => normalizeCategoryText(value)
  .split(/\s+/)
  .filter(Boolean)
  .sort()
  .join(' ');

const normalizeProductType = (value = '') => String(value || '').trim().toLowerCase();

export const getProductImageIndexSummary = async () => {
  const [totalProducts, indexedProducts, pendingProducts, failedProducts, outdatedProducts, imageIndexEntries, lastIndexed] = await Promise.all([
    Product.countDocuments({ isActive: { $ne: false } }),
    ProductImageIndex.countDocuments({ indexingStatus: 'indexed' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'pending' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'failed' }),
    ProductImageIndex.countDocuments({ indexingStatus: 'outdated' }),
    ProductImageIndex.find({ cloudinaryUrls: { $exists: true, $ne: [] } })
      .select('indexingStatus embeddingModel imageEmbeddings')
      .lean(),
    ProductImageIndex.findOne({ indexingStatus: 'indexed' }).sort({ indexedAt: -1 }).select('indexedAt').lean(),
  ]);
  const imageProducts = imageIndexEntries.length;
  const embeddedProducts = imageIndexEntries.filter((entry) => (
    entry.indexingStatus === 'indexed'
    && entry.embeddingModel === IMAGE_EMBEDDING_VERSION
    && hasValidImageEmbeddings(entry.imageEmbeddings)
  )).length;

  return {
    totalProducts,
    indexedProducts,
    pendingProducts,
    failedProducts,
    outdatedProducts,
    imageProducts,
    embeddedProducts,
    productsMissingEmbeddings: Math.max(0, imageProducts - embeddedProducts),
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
    category: getReferenceName(product.categoryName || product.category),
    subCategory: getReferenceName(product.subCategoryName || product.subCategory),
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
  reindexEmbeddings = false,
} = {}) => {
  if (reindexAll || !doc) return true;
  if (doc.imageHash !== imageHash || doc.searchableText !== searchableText || doc.embeddingVersion !== INDEX_VERSION) return true;
  if (doc.indexingStatus === 'pending') return true;
  if (reindexFailed && doc.indexingStatus === 'failed') return true;
  if (reindexEmbeddings && (
    doc.embeddingModel !== IMAGE_EMBEDDING_VERSION
    || (Array.isArray(doc.cloudinaryUrls) && doc.cloudinaryUrls.length > 0
      && !hasValidImageEmbeddings(doc.imageEmbeddings))
  )) return true;
  return reindexOutdated && doc.indexingStatus === 'outdated';
};

export const indexProductImageCatalog = async ({
  reindexAll = false,
  reindexFailed = false,
  reindexOutdated = false,
  reindexEmbeddings = false,
  limit = 0,
} = {}) => {
  const filters = { isActive: { $ne: false } };
  const productQuery = Product.find(filters)
    .populate('category', 'name title slug')
    .populate('subCategory', 'name title slug')
    .sort({ updatedAt: -1, createdAt: -1 });
  if (limit > 0) productQuery.limit(limit);

  const products = await productQuery.lean();
  const totals = { total: products.length, indexed: 0, pending: 0, failed: 0, outdated: 0 };

  for (const product of products) {
    const imageUrls = getProductImageUrls(product);
    const searchableText = buildSearchableText(product);
    const imageHash = hashString(JSON.stringify(imageUrls));
    const doc = await ProductImageIndex.findOne({
      $or: [
        { product: product._id },
        { productId: String(product._id) },
      ],
    }).lean();
    const indexFilter = doc ? { _id: doc._id } : { productId: String(product._id) };
    const shouldReindex = shouldReindexImageProduct({
      doc,
      imageHash,
      searchableText,
      reindexAll,
      reindexFailed,
      reindexOutdated,
      reindexEmbeddings,
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
      if (reindexEmbeddings) {
        const imageEmbeddings = [];
        let embeddingErrors = 0;
        for (const imageUrl of imageUrls.slice(0, MAX_IMAGES_PER_PRODUCT)) {
          try {
            const embedding = await fetchCatalogImageEmbedding(imageUrl);
            if (embedding.length) imageEmbeddings.push(embedding);
          } catch (error) {
            embeddingErrors += 1;
            console.warn(JSON.stringify({
              event: 'product-image-embedding-error',
              productId: String(product._id),
              errorName: error?.name || 'Error',
              status: Number(error?.status) || 0,
            }));
          }
        }
        nextEntry.imageEmbeddings = imageEmbeddings;
        nextEntry.embedding = imageEmbeddings.length
          ? normalizeEmbeddingVector(imageEmbeddings[0].map((_, index) => (
            imageEmbeddings.reduce((sum, vector) => sum + (vector[index] || 0), 0) / imageEmbeddings.length
          )))
          : [];
        nextEntry.embeddingModel = IMAGE_EMBEDDING_VERSION;
        nextEntry.errorMessage = embeddingErrors > 0 ? `${embeddingErrors} catalog image embedding(s) could not be generated.` : '';
      } else if (doc?.imageHash !== imageHash) {
        nextEntry.imageEmbeddings = [];
        nextEntry.embedding = [];
        nextEntry.embeddingModel = '';
      }

      await ProductImageIndex.findOneAndUpdate(
        indexFilter,
        {
          ...nextEntry,
          indexingStatus: 'indexed',
          errorMessage: nextEntry.errorMessage,
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      totals.indexed += 1;
    } catch (error) {
      await ProductImageIndex.findOneAndUpdate(
        indexFilter,
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
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
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
      visualDescription: '',
      source: 'fallback',
    };
  }

  const base64 = imageBuffer.toString('base64');
  const completion = await IMAGE_VISION_CLIENT.responses.create({
    model: imageVisionConfig.model,
    instructions: 'You identify retail products from photos. Extract only details visibly present in the image. Return a JSON object with brand, model, sku, barcode, category, visibleText, and visualDescription. visualDescription should describe the product itself, its shape, color, configuration, and distinctive visible features. Use empty strings for unreadable fields and never guess.',
    input: [{
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'Identify the visible product category and describe its physical appearance. Also read any visible brand, model number, SKU, barcode, and label text. Return JSON only.',
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
};

export const hasProductRecognitionSignals = (signals = {}) => [
  signals.brand,
  signals.model,
  signals.sku,
  signals.barcode,
  signals.category,
  signals.text,
  signals.visualDescription,
].some((value) => String(value || '').trim().length > 0);

export const scoreProductCandidate = (candidate = {}, signals = {}) => {
  const productText = String(candidate.searchableText || '');
  const brandSimilarity = similarityScore(candidate.brand, signals.brand || '');
  const modelSimilarity = similarityScore(candidate.modelNumber || candidate.name, signals.model || signals.name || '');
  const skuSimilarity = similarityScore(candidate.sku, signals.sku || '');
  const categorySimilarity = Math.max(
    categorySimilarityScore(candidate.category, signals.category || ''),
    categorySimilarityScore(candidate.subCategory, signals.category || '')
  );
  const queryText = coerceString(
    signals.brand,
    signals.model,
    signals.sku,
    signals.barcode,
    signals.category,
    signals.text,
    signals.visualDescription,
  );
  const queryTokens = new Set(queryText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 1));
  const productTokens = new Set(productText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 1));
  const matchedTokens = [...queryTokens].filter((token) => productTokens.has(token)).length;
  const textCoverage = queryTokens.size ? matchedTokens / queryTokens.size : 0;
  const productCode = normalizeIdentifier(candidate.productCode);
  const candidateSku = normalizeIdentifier(candidate.sku);
  const candidateModel = normalizeIdentifier(candidate.modelNumber);
  const barcode = normalizeIdentifier(signals.barcode);
  const signalSku = normalizeIdentifier(signals.sku);
  const signalModel = normalizeIdentifier(signals.model);
  const exactBarcodeMatch = Boolean(barcode && productCode && barcode === productCode);
  const exactSkuMatch = Boolean(signalSku && candidateSku && signalSku === candidateSku);
  const exactModelMatch = Boolean(signalModel && candidateModel && signalModel === candidateModel);
  const exactIdentifierMatch = exactBarcodeMatch || exactSkuMatch || exactModelMatch;
  const identifierConflicts = [
    Boolean(barcode && productCode && barcode !== productCode),
    Boolean(signalSku && candidateSku && signalSku !== candidateSku),
    Boolean(signalModel && candidateModel && signalModel !== candidateModel),
  ].filter(Boolean).length;
  const brandConflict = Boolean(
    signals.brand
    && candidate.brand
    && brandSimilarity === 0
  );
  const categoryConflict = Boolean(
    signals.category
    && candidate.category
    && categorySimilarity === 0
  );
  const matchReasons = [];

  if (exactBarcodeMatch) matchReasons.push('exact-barcode');
  if (exactSkuMatch) matchReasons.push('exact-sku');
  if (exactModelMatch) matchReasons.push('exact-model');
  if (brandSimilarity > 0) matchReasons.push('brand-agreement');
  if (categorySimilarity > 0) matchReasons.push('category-compatible');
  if (textCoverage > 0) matchReasons.push('description-token-overlap');
  if (identifierConflicts) matchReasons.push('conflicting-identifier');
  if (brandConflict) matchReasons.push('conflicting-brand');
  if (categoryConflict) matchReasons.push('conflicting-category');
  const rawConfidence = clamp(
    (textCoverage * 0.48)
      + (brandSimilarity * 0.17)
      + (modelSimilarity * 0.2)
      + (categorySimilarity * 0.15)
      + ((exactModelMatch ? 0.28 : 0) + (exactSkuMatch ? 0.32 : 0) + (exactBarcodeMatch ? 0.36 : 0))
      - (identifierConflicts * 0.22)
      - (brandConflict ? 0.14 : 0)
      - (categoryConflict ? 0.08 : 0),
    0,
    1
  );
  const confidence = exactIdentifierMatch && identifierConflicts === 0 && !brandConflict
    ? 0.99
    : rawConfidence;

  return {
    confidence: roundValue(confidence),
    brandSimilarity,
    modelSimilarity,
    skuSimilarity,
    categorySimilarity,
    semanticSimilarity: roundValue(textCoverage),
    exactIdentifierMatch,
    identifierConflicts,
    brandConflict,
    categoryConflict,
    matchReasons,
  };
};

export const combineImageAndCatalogScores = (candidate, signals, visualMatch = {}) => {
  const catalogScore = scoreProductCandidate(candidate, signals);
  const visualSimilarity = roundValue(clamp(Number(visualMatch.confidence) || 0, 0, 1));
  const confidence = roundValue(clamp(
    (visualSimilarity * 0.82)
      + (catalogScore.confidence * 0.18)
      - (catalogScore.identifierConflicts * 0.24)
      - (catalogScore.brandConflict ? 0.12 : 0)
      - (catalogScore.categoryConflict ? 0.06 : 0),
    0,
    1
  ));
  const matchReasons = [...catalogScore.matchReasons];
  if (visualSimilarity > 0) matchReasons.push('visual-image-similarity');

  return {
    ...catalogScore,
    visualSimilarity,
    confidence,
    matchReasons: [...new Set(matchReasons)],
  };
};

const ensureImageIndexCoverage = async (requestId) => {
  if (imageIndexTask) return imageIndexTask;

  imageIndexTask = (async () => {
    const summary = await getProductImageIndexSummary();
    const accountedFor = summary.indexedProducts + summary.pendingProducts + summary.failedProducts + summary.outdatedProducts;
    const indexNeedsRefresh = !(
      accountedFor >= summary.totalProducts
      && summary.pendingProducts === 0
      && summary.failedProducts === 0
      && summary.outdatedProducts === 0
    );
    const embeddingsNeedRefresh = summary.productsMissingEmbeddings > 0;
    if (!indexNeedsRefresh && !embeddingsNeedRefresh) return;

    console.info(JSON.stringify({
      event: 'product-image-index-repair-start',
      requestId,
      catalogProducts: summary.totalProducts,
      imageProducts: summary.imageProducts,
      missingEmbeddings: summary.productsMissingEmbeddings,
      refreshEmbeddings: embeddingsNeedRefresh,
    }));
    await indexProductImageCatalog({
      reindexFailed: summary.failedProducts > 0,
      reindexOutdated: summary.outdatedProducts > 0,
      reindexEmbeddings: embeddingsNeedRefresh,
    });
    const repairedSummary = await getProductImageIndexSummary();
    console.info(JSON.stringify({
      event: 'product-image-index-repair-complete',
      requestId,
      indexedProducts: repairedSummary.indexedProducts,
      imageProducts: repairedSummary.imageProducts,
      embeddedProducts: repairedSummary.embeddedProducts,
      productsMissingEmbeddings: repairedSummary.productsMissingEmbeddings,
    }));
  })();

  try {
    await imageIndexTask;
  } catch (error) {
    console.warn(JSON.stringify({
      event: 'product-image-search-stage-error',
      requestId,
      stage: 'index-repair',
      errorName: error?.name || 'Error',
      status: Number(error?.status) || 0,
    }));
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
    visualDescription: coerceString(parsed.visualDescription, parsed.productDescription, parsed.description),
    source: 'openai-vision',
  };
};

export const parseVisualProductMatchResponse = (content = '{}') => {
  const parsed = JSON.parse(content || '{}');
  const confidence = Number(parsed.confidence);
  const matches = Array.isArray(parsed.matches)
    ? parsed.matches.map((match) => {
      const matchConfidence = Number(match.confidence);
      return {
        productId: String(match.productId || match.id || '').trim(),
        confidence: Number.isFinite(matchConfidence) ? roundValue(clamp(matchConfidence, 0, 1)) : 0,
        reason: String(match.reason || '').trim(),
      };
    }).filter((match) => match.productId)
    : [];
  const productId = String(parsed.productId || parsed.matchedProductId || '').trim();

  return {
    productId,
    confidence: Number.isFinite(confidence) ? roundValue(clamp(confidence, 0, 1)) : 0,
    reason: String(parsed.reason || '').trim(),
    matches: matches.length ? matches : (productId ? [{
      productId,
      confidence: Number.isFinite(confidence) ? roundValue(clamp(confidence, 0, 1)) : 0,
      reason: String(parsed.reason || '').trim(),
    }] : []),
  };
};

export const buildImageSearchDiagnostics = ({
  requestId = '',
  index = {},
  queryEmbeddingDimensions = 0,
  thresholds = {},
  categoryClassification = null,
  candidates = [],
  filteredCandidateProductIds = [],
  selectedProductId = null,
  outcome = 'no-match',
} = {}) => ({
  event: 'product-image-search',
  requestId,
  outcome,
  index,
  queryEmbeddingDimensions,
  thresholds,
  categoryClassification,
  filteredCandidateProductIds: filteredCandidateProductIds.map(String),
  candidates: candidates.map(({ product, scores, imageCount = 0, embeddingCount = 0, rejectionReason = '' }) => ({
    productId: String(product?._id || product?.product || ''),
    scores: {
      visualSimilarity: scores?.visualSimilarity || 0,
      modelSimilarity: scores?.modelSimilarity || 0,
      brandSimilarity: scores?.brandSimilarity || 0,
      categorySimilarity: scores?.categorySimilarity || 0,
      semanticSimilarity: scores?.semanticSimilarity || 0,
      exactIdentifierMatch: Boolean(scores?.exactIdentifierMatch),
      identifierConflicts: scores?.identifierConflicts || 0,
      brandConflict: Boolean(scores?.brandConflict),
      categoryConflict: Boolean(scores?.categoryConflict),
      confidence: scores?.confidence || 0,
    },
    matchReasons: scores?.matchReasons || [],
    imageCount,
    embeddingCount,
    rejectionReason,
  })),
  selectedProductId: selectedProductId ? String(selectedProductId) : null,
});

const logImageSearchDiagnostics = (diagnostics) => {
  console.info(JSON.stringify(diagnostics));
};

const getProductImageCount = (candidate) => new Set([
  candidate?.thumbnail,
  ...(Array.isArray(candidate?.cloudinaryUrls) ? candidate.cloudinaryUrls : []),
].map((value) => String(value || '').trim()).filter(Boolean)).size;

export const rankImageSearchCandidates = (candidates = [], signals = {}, queryEmbedding = []) => candidates
  .map((candidate) => {
    const imageEmbeddings = candidate.productMatch?.imageEmbeddings || [];
    const queryEmbeddings = queryEmbedding.length && Array.isArray(queryEmbedding[0])
      ? queryEmbedding
      : queryEmbedding.length ? [queryEmbedding] : [];
    const embeddingCompatible = queryEmbeddings.length > 0
      && hasValidImageEmbeddings(imageEmbeddings)
      && imageEmbeddings[0].length === queryEmbeddings[0].length;
    const visualSimilarity = embeddingCompatible
      ? roundValue(Math.max(0, ...queryEmbeddings.map((query) => getCatalogEmbeddingSimilarity(query, imageEmbeddings))))
      : 0;
    const scores = combineImageAndCatalogScores(candidate.productMatch, signals, { confidence: visualSimilarity });
    if (!hasValidImageEmbeddings(imageEmbeddings)) scores.matchReasons.push('catalog-image-embedding-unavailable');
    else if (!embeddingCompatible) scores.matchReasons.push('embedding-dimension-mismatch');
    return {
      ...candidate,
      ...scores,
      visualSimilarity,
      imageCount: getProductImageCount(candidate.productMatch),
      embeddingCount: Array.isArray(imageEmbeddings) ? imageEmbeddings.length : 0,
      embeddingCompatible,
    };
  })
  .sort((left, right) => (
    right.confidence - left.confidence
    || left.identifierConflicts - right.identifierConflicts
    || right.visualSimilarity - left.visualSimilarity
    || right.modelSimilarity - left.modelSimilarity
    || String(left.product?._id || '').localeCompare(String(right.product?._id || ''))
  ));

export const filterPossibleImageMatches = (
  rankedCandidates = [],
  { selectedMatch = null, categorySignal = '', minimumSimilarity = 0.65, limit = 3, categoryConfident = false } = {}
) => {
  return rankedCandidates
    .filter((candidate) => {
      if (candidate.imageCount === 0 || candidate.visualSimilarity < minimumSimilarity) return false;
      if (categorySignal && categoryConfident && candidate.categorySimilarity === 0) return false;
      if (selectedMatch && String(candidate.product?._id) === String(selectedMatch.product._id)) return false;
      return true;
    })
    .slice(0, limit);
};

export const selectConfidentImageMatch = (
  rankedCandidates = [],
  {
    visualThreshold = 0.94,
    confidenceThreshold = 0.72,
    marginThreshold = 0.06,
    categoryConfident = false,
  } = {}
) => {
  const eligibleCandidates = rankedCandidates.filter((candidate) => (
    candidate.imageCount > 0
    && candidate.visualSimilarity >= visualThreshold
    && candidate.confidence >= confidenceThreshold
    && candidate.identifierConflicts === 0
    && !candidate.brandConflict
    && (!categoryConfident || !candidate.categoryConflict)
  ));
  const top = eligibleCandidates[0];
  if (!top) return null;

  const runnerUp = eligibleCandidates[1];
  if (runnerUp && top.confidence - runnerUp.confidence < marginThreshold) return null;
  return top;
};

export const buildScanProductResponse = (product, confidence) => ({
  id: String(product._id),
  name: product.name,
  sku: product.sku,
  brand: product.brand,
  price: product.price,
  mrp: product.mrp,
  stock: product.stock,
  stockStatus: product.stockStatus,
  availability: product.isActive !== false && product.stock > 0,
  confidence,
  thumbnail: product.thumbnail || product.images?.[0] || '',
});

export const buildImageSearchResultResponse = ({
  verifiedMatch = null,
  possibleMatches = [],
  requestId = '',
  recognitionWarning = '',
} = {}) => {
  const matchType = verifiedMatch
    ? (verifiedMatch.exactIdentifierMatch ? 'exact-identifier' : 'visual-image-match')
    : (possibleMatches.length ? 'possible-match' : 'no-match');

  return {
    success: true,
    matched: Boolean(verifiedMatch),
    confidence: verifiedMatch?.confidence || 0,
    matchType,
    message: verifiedMatch
      ? 'Product matched against the HoneyVision catalog.'
      : "We couldn't confidently identify this product. Review the closest catalog matches below.",
    product: verifiedMatch ? buildScanProductResponse(verifiedMatch.product, verifiedMatch.confidence) : null,
    possibleMatches,
    requestId,
    ...(recognitionWarning ? { recognitionWarning } : {}),
  };
};

const toPossibleMatch = ({ product, confidence, visualSimilarity, matchReasons }) => ({
  id: String(product._id),
  name: product.name,
  sku: product.sku,
  brand: product.brand,
  price: product.price,
  stock: product.stock,
  confidence,
  visualSimilarity,
  matchReasons,
  thumbnail: product.thumbnail || product.images?.[0] || '',
});

const getCandidateRejectionReason = (
  candidate,
  {
    visualThreshold,
    confidenceThreshold,
    marginThreshold,
    possibleMatchThreshold,
    categorySignal = '',
    alternativeCategory = '',
    categoryConfident = false,
  },
  selected,
  rankedCandidates
) => {
  if (selected && String(candidate.product?._id) === String(selected.product._id)) return 'selected-confident-match';
  if (candidate.imageCount === 0) return 'catalog-image-missing';
  if (candidate.embeddingCount === 0) return 'catalog-embedding-missing';
  if (!candidate.embeddingCompatible) return 'embedding-dimension-mismatch';
  if (candidate.identifierConflicts > 0) return 'conflicting-identifier';
  if (candidate.brandConflict) return 'conflicting-brand';
  if (categoryConfident && candidate.categoryConflict) return 'category-incompatible';
  if (categorySignal && candidate.categorySimilarity === 0) return 'category-incompatible';
  if (
    alternativeCategory
    && (candidate.productMatch?.category || candidate.productMatch?.subCategory)
    && normalizeCategoryKey(candidate.productMatch.category || candidate.productMatch.subCategory) !== normalizeCategoryKey(alternativeCategory)
  ) return 'category-incompatible';
  if (candidate.visualSimilarity < visualThreshold) {
    return candidate.visualSimilarity >= possibleMatchThreshold
      ? 'below-verified-visual-threshold'
      : 'below-possible-match-threshold';
  }
  if (candidate.confidence < confidenceThreshold) return 'below-confidence-threshold';

  const eligible = rankedCandidates.filter((item) => (
    item.imageCount > 0
    && item.embeddingCompatible
    && item.visualSimilarity >= visualThreshold
    && item.confidence >= confidenceThreshold
    && item.identifierConflicts === 0
    && !item.brandConflict
    && (!categoryConfident || !item.categoryConflict)
  ));
  if (eligible.length > 1 && eligible[0].confidence - eligible[1].confidence < marginThreshold) {
    return 'ambiguous-confidence-margin';
  }
  return 'not-selected';
};

export const searchProductsByImage = async (fileBuffer, mimeType, metadata = {}) => {
  const requestId = String(metadata.requestId || crypto.randomUUID());
  const emptyResult = (matchType, message) => ({
    success: true,
    matched: false,
    confidence: 0,
    matchType,
    message,
    product: null,
    possibleMatches: [],
  });

  let processedSignals = {
    brand: '',
    model: '',
    sku: '',
    barcode: '',
    category: '',
    text: '',
    visualDescription: '',
    source: 'fallback',
  };
  let recognitionWarning = '';
  if (IMAGE_VISION_CLIENT) {
    try {
      processedSignals = await extractVisibleTextSignals(fileBuffer, mimeType);
    } catch (error) {
      recognitionWarning = 'Visible label recognition is temporarily unavailable; matching is based on product-image similarity.';
      console.warn(JSON.stringify({
        event: 'product-image-search-stage-error',
        requestId,
        stage: 'ocr-vision',
        errorName: error?.name || 'Error',
        status: Number(error?.status) || 0,
      }));
    }
  } else {
    recognitionWarning = 'Visible label recognition is not configured; matching is based on product-image similarity.';
  }
  const finalSignals = {
    ...processedSignals,
    name: metadata?.name || '',
    brand: metadata?.brand || processedSignals.brand || '',
    model: metadata?.model || processedSignals.model || '',
    sku: metadata?.sku || processedSignals.sku || '',
    barcode: metadata?.barcode || processedSignals.barcode || '',
    category: metadata?.category || processedSignals.category || '',
    text: coerceString(processedSignals.text, metadata?.text || ''),
    visualDescription: processedSignals.visualDescription || '',
  };

  await ensureImageIndexCoverage(requestId);
  const queryEmbeddingVariants = await createImageSearchEmbeddings(fileBuffer);
  const queryEmbeddings = queryEmbeddingVariants.map(({ embedding }) => embedding);
  if (!queryEmbeddings.length) throw new Error('Image embedding model returned an empty vector');
  const queryEmbedding = queryEmbeddings[0];
  console.info(JSON.stringify({
    event: 'product-image-query-embedding',
    requestId,
    mimeType,
    embeddingDimensions: queryEmbedding.length,
    embeddingVariants: queryEmbeddingVariants.map(({ kind }) => kind),
  }));
  const candidates = await ProductImageIndex.find({ indexingStatus: { $in: ['indexed', 'outdated'] } })
    .sort({ updatedAt: -1 })
    .limit(DEFAULT_CANDIDATE_LIMIT)
    .lean();
  const imageBearingCandidates = candidates.filter((candidate) => Array.isArray(candidate.cloudinaryUrls) && candidate.cloudinaryUrls.length > 0);
  const missingEmbeddingCount = imageBearingCandidates.filter((candidate) => (
    candidate.embeddingModel !== IMAGE_EMBEDDING_VERSION
    || !hasValidImageEmbeddings(candidate.imageEmbeddings)
  )).length;
  if (missingEmbeddingCount > 0) {
    const coverageWarning = 'The catalog image index is incomplete. Ask an administrator to run the product image indexing job.';
    recognitionWarning = [recognitionWarning, coverageWarning].filter(Boolean).join(' ');
    console.warn(JSON.stringify({
      event: 'product-image-search-index-incomplete',
      requestId,
      productsWithImages: imageBearingCandidates.length,
      productsMissingEmbeddings: missingEmbeddingCount,
    }));
  }
  const candidateProductIds = [...new Set(candidates.map((candidate) => candidate.product).filter(Boolean).map(String))];
  const products = await Product.find({
    _id: { $in: candidateProductIds },
    isActive: { $ne: false },
  }).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  console.info(JSON.stringify({
    event: 'product-image-candidate-retrieval',
    requestId,
    indexedImageProducts: imageBearingCandidates.length,
    candidatesReturned: candidates.length,
    activeProductsResolved: products.length,
    queryEmbeddingDimensions: queryEmbedding.length,
    productsMissingEmbeddings: missingEmbeddingCount,
  }));

  const categoryClassification = classifyImageCategory([queryEmbedding], imageBearingCandidates);
  console.info(JSON.stringify({
    event: 'product-image-category-classification',
    requestId,
    confident: categoryClassification.confident,
    selectedCategory: categoryClassification.category || null,
    confidence: categoryClassification.confidence,
    margin: categoryClassification.margin,
    topCategories: categoryClassification.ranked,
  }));

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

  if (evaluatedResults.length === 0) {
    const result = {
      ...emptyResult('no-match', "We couldn't confidently identify this product."),
      requestId,
      ...(recognitionWarning ? { recognitionWarning } : {}),
    };
    logImageSearchDiagnostics(buildImageSearchDiagnostics({
      requestId,
      candidates: candidates.slice(0, DEFAULT_RESULTS_LIMIT).map((candidate) => ({
        product: { _id: candidate.product },
        scores: {},
        imageCount: getProductImageCount(candidate),
        embeddingCount: candidate.imageEmbeddings?.length || 0,
        rejectionReason: 'product-document-not-resolved',
      })),
      index: {
        indexedImageProducts: imageBearingCandidates.length,
        candidatesReturned: candidates.length,
        activeProductsResolved: products.length,
        productsMissingEmbeddings: missingEmbeddingCount,
      },
      queryEmbeddingDimensions: queryEmbedding.length,
      outcome: result.matchType,
    }));
    return result;
  }

  const searchSignals = {
    ...finalSignals,
    category: categoryClassification.category || finalSignals.category,
  };
  const rankedResults = rankImageSearchCandidates(evaluatedResults, searchSignals, queryEmbeddings);
  const visualThreshold = Number(process.env.IMAGE_MATCH_VISUAL_THRESHOLD) || 0.94;
  const confidenceThreshold = Number(process.env.IMAGE_MATCH_CONFIDENCE_THRESHOLD) || 0.72;
  const marginThreshold = Number(process.env.IMAGE_MATCH_MARGIN_THRESHOLD) || 0.06;
  const confidenceCandidate = selectConfidentImageMatch(rankedResults, {
    visualThreshold,
    confidenceThreshold,
    marginThreshold,
    categoryConfident: categoryClassification.confident,
  });
  const verifiedMatch = confidenceCandidate
    ? rankedResults.find(({ product }) => String(product._id) === String(confidenceCandidate.product._id))
    : null;
  const possibleMatchThreshold = Number(process.env.IMAGE_MATCH_POSSIBLE_THRESHOLD || 0.65);
  const possibleCandidates = filterPossibleImageMatches(rankedResults, {
    selectedMatch: verifiedMatch,
    categorySignal: categoryClassification.category,
    categoryConfident: categoryClassification.confident,
    minimumSimilarity: possibleMatchThreshold,
  });
  const diagnosticFilteredCandidates = filterPossibleImageMatches(rankedResults, {
    selectedMatch: verifiedMatch,
    categorySignal: categoryClassification.category,
    categoryConfident: categoryClassification.confident,
    minimumSimilarity: possibleMatchThreshold,
    limit: 10,
  });
  const possibleMatches = possibleCandidates.map((candidate) => toPossibleMatch(candidate));
  const alternativeCategory = verifiedMatch?.productMatch?.category
    || possibleCandidates[0]?.productMatch?.category
    || '';
  const result = buildImageSearchResultResponse({
    verifiedMatch,
    possibleMatches,
    requestId,
    recognitionWarning,
  });
  const diagnostics = buildImageSearchDiagnostics({
    requestId,
    candidates: rankedResults.slice(0, 10).map((item) => ({
      ...item,
      scores: item,
      rejectionReason: getCandidateRejectionReason(item, {
        visualThreshold,
        confidenceThreshold,
        marginThreshold,
        possibleMatchThreshold,
        categorySignal: categoryClassification.category,
        alternativeCategory,
        categoryConfident: categoryClassification.confident,
      }, verifiedMatch, rankedResults),
    })),
    categoryClassification,
    filteredCandidateProductIds: diagnosticFilteredCandidates.map(({ product }) => product._id),
    index: {
      indexedImageProducts: imageBearingCandidates.length,
      candidatesReturned: candidates.length,
      activeProductsResolved: products.length,
      productsMissingEmbeddings: missingEmbeddingCount,
    },
    queryEmbeddingDimensions: queryEmbedding.length,
    thresholds: {
      visualSimilarity: visualThreshold,
      confidence: confidenceThreshold,
      margin: marginThreshold,
      possibleMatch: possibleMatchThreshold,
      categorySimilarity: CATEGORY_CLASSIFIER_MIN_SIMILARITY,
      categoryMargin: CATEGORY_CLASSIFIER_MARGIN,
    },
    selectedProductId: verifiedMatch?.product._id,
    outcome: result.matchType,
  });
  logImageSearchDiagnostics(diagnostics);

  return result;
};
