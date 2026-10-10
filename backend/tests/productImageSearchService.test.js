import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  buildImageSearchDiagnostics,
  buildImageSearchResultResponse,
  classifyImageCategory,
  combineImageAndCatalogScores,
  cosineSimilarity,
  createImageEmbedding,
  createImageSearchEmbeddings,
  filterPossibleImageMatches,
  getCatalogEmbeddingSimilarity,
  hasProductRecognitionSignals,
  normalizeEmbeddingVector,
  parseImageRecognitionResponse,
  parseVisualProductMatchResponse,
  rankImageSearchCandidates,
  resolveImageVisionConfig,
  scoreProductCandidate,
  selectConfidentImageMatch,
  shouldReindexImageProduct,
} from '../services/productImageSearchService.js';

const makeCandidate = ({
  id,
  name,
  sku,
  brand = 'HoneyVision',
  modelNumber,
  category = 'Security Cameras',
  searchableText = `${brand} ${name} ${sku} ${modelNumber} ${category}`,
  imageEmbeddings = [[1, 0]],
  cloudinaryUrls = [`https://images.example.test/${id}.webp`],
} = {}) => ({
  product: { _id: id, name, sku, brand, model: modelNumber, price: 1000, stock: 3, isActive: true },
  productMatch: {
    productId: id,
    name,
    sku,
    brand,
    modelNumber,
    category,
    searchableText,
    imageEmbeddings,
    cloudinaryUrls,
    thumbnail: cloudinaryUrls[0] || '',
  },
});

test('image recognition uses the shared AI environment configuration', () => {
  const config = resolveImageVisionConfig({
    AI_PROVIDER: 'openai',
    AI_API_KEY: 'test-key',
    AI_BASE_URL: 'https://api.example.test/v1/',
    AI_MODEL: 'vision-test-model',
  });

  assert.equal(config.enabled, true);
  assert.equal(config.apiKey, 'test-key');
  assert.equal(config.baseURL, 'https://api.example.test/v1');
  assert.equal(config.model, 'vision-test-model');
});

test('image recognition parses product identifiers, visible text, and visual descriptions', () => {
  const signals = parseImageRecognitionResponse(JSON.stringify({
    brandName: 'Honey Vision',
    modelNumber: 'HV-420',
    productCode: '89012345',
    visibleText: '4MP IP Camera',
    visualDescription: 'White turret camera with a black glass lens',
  }));

  assert.equal(signals.brand, 'Honey Vision');
  assert.equal(signals.model, 'HV-420');
  assert.equal(signals.barcode, '89012345');
  assert.equal(signals.text, '4MP IP Camera');
  assert.equal(signals.visualDescription, 'White turret camera with a black glass lens');
  assert.equal(signals.source, 'openai-vision');
});

test('visual comparison parser accepts grouped product IDs and normalizes scores', () => {
  const result = parseVisualProductMatchResponse(JSON.stringify({
    matches: [
      { productId: ' product-a ', confidence: 1.2, reason: 'Same housing' },
      { productId: 'product-b', confidence: -0.2, reason: 'Different lens' },
    ],
  }));

  assert.deepEqual(result.matches, [
    { productId: 'product-a', confidence: 1, reason: 'Same housing' },
    { productId: 'product-b', confidence: 0, reason: 'Different lens' },
  ]);
});

test('image embeddings are normalized and cosine comparison rejects incompatible dimensions', async () => {
  assert.deepEqual(normalizeEmbeddingVector([3, 4]), [0.6, 0.8]);
  assert.equal(cosineSimilarity([1, 0], [0.8, 0.6]), 0.8);
  assert.equal(cosineSimilarity([1, 0], [1]), 0);

  const embedding = await createImageEmbedding(Buffer.from('image-bytes'), 'image/webp', async (blob) => {
    assert.equal(blob.type, 'image/webp');
    assert.equal(blob.size, 11);
    return { data: new Float32Array([3, 4]) };
  });
  assert.deepEqual(embedding, [0.6, 0.8]);
});

test('multi-object uploads create full-frame and overlapping tile embeddings after orientation normalization', async () => {
  const imageBuffer = await sharp({
    create: { width: 900, height: 400, channels: 3, background: '#ffffff' },
  }).png().toBuffer();
  const embeddedBlobSizes = [];
  const variants = await createImageSearchEmbeddings(imageBuffer, async (blob) => {
    embeddedBlobSizes.push(blob.size);
    return { data: new Float32Array([1, 0]) };
  });

  assert.ok(variants.some(({ kind }) => kind === 'full'));
  assert.ok(variants.some(({ kind }) => kind === 'horizontal-tile-1'));
  assert.ok(variants.some(({ kind }) => kind === 'horizontal-tile-2'));
  assert.ok(variants.some(({ kind }) => kind === 'horizontal-tile-3'));
  assert.equal(embeddedBlobSizes.length, variants.length);
  assert.ok(variants.every(({ embedding }) => embedding.length === 2));
});

test('catalog image vectors use the strongest alternate view while remaining one product', () => {
  const alternateViews = [[0.7, Math.sqrt(0.51)], [1, 0], [0.8, 0.6]];
  const reference = [1, 0];
  const alternateOnly = [[0.96, Math.sqrt(1 - (0.96 ** 2))], [0.87, Math.sqrt(1 - (0.87 ** 2))]];
  assert.equal(getCatalogEmbeddingSimilarity(reference, alternateOnly), 0.96);

  const candidate = makeCandidate({
    id: 'mongo-product-1',
    imageEmbeddings: alternateOnly,
    cloudinaryUrls: ['https://images.example.test/front.webp', 'https://images.example.test/back.webp', 'https://images.example.test/side.webp'],
  });
  const ranked = rankImageSearchCandidates([candidate], {}, [1, 0]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].product._id, 'mongo-product-1');
  assert.equal(ranked[0].imageCount, 3);
  assert.equal(selectConfidentImageMatch(ranked)?.product._id, 'mongo-product-1');
  assert.equal(alternateViews.length, 3);
});

test('visually similar models are reranked by the stronger image match, not array order', () => {
  const visuallySimilar = makeCandidate({
    id: 'similar-model',
    name: '4MP Outdoor Camera Model B',
    sku: 'CAM-B',
    modelNumber: 'MODEL-B',
    imageEmbeddings: [[0.82, Math.sqrt(1 - (0.82 ** 2))]],
  });
  const exactProduct = makeCandidate({
    id: 'actual-model',
    name: '4MP Outdoor Camera Model A',
    sku: 'CAM-A',
    modelNumber: 'MODEL-A',
    imageEmbeddings: [[0.96, Math.sqrt(1 - (0.96 ** 2))]],
  });
  const ranked = rankImageSearchCandidates(
    [visuallySimilar, exactProduct],
    { brand: 'HoneyVision', model: 'MODEL-A', category: 'Security Cameras' },
    [1, 0]
  );

  assert.equal(ranked[0].product._id, 'actual-model');
  assert.equal(selectConfidentImageMatch(ranked)?.product._id, 'actual-model');
});

test('HP monitor variants group alternate views and brand conflicts cannot win verified selection', () => {
  const makeMonitor = (id, brand, sku, embedding) => ({
    product: { _id: id },
    productMatch: {
      productId: id,
      name: `${brand} 24 inch monitor`,
      sku,
      brand,
      category: 'Monitors',
      searchableText: `${brand} 24 inch monitor ${sku}`,
      cloudinaryUrls: [`https://images.example.test/${id}.webp`, `https://images.example.test/${id}-side.webp`],
      imageEmbeddings: embedding,
    },
  });
  const differentBrand = makeMonitor('dell-monitor', 'Dell', 'D-M24', [[1, 0]]);
  const hpMonitor = makeMonitor('hp-monitor', 'HP', 'HP-M24', [[0.96, Math.sqrt(1 - (0.96 ** 2))], [1, 0]]);
  const ranked = rankImageSearchCandidates([differentBrand, hpMonitor], { brand: 'HP' }, [1, 0]);

  assert.equal(ranked.find(({ product }) => product._id === 'hp-monitor').imageCount, 2);
  assert.equal(ranked.find(({ product }) => product._id === 'hp-monitor').visualSimilarity, 1);
  assert.equal(ranked.find(({ product }) => product._id === 'dell-monitor').brandConflict, true);
  assert.equal(selectConfidentImageMatch(ranked)?.product._id, 'hp-monitor');
});

test('possible matches exclude off-category catalog products and retain relevant other brands', () => {
  const hpMonitor = makeCandidate({
    id: 'hp-monitor',
    name: 'HP CCTV Monitor',
    sku: 'HP-MON',
    brand: 'HP',
    category: 'Monitors & Displays',
    imageEmbeddings: [[1, 0]],
  });
  const dellMonitor = makeCandidate({
    id: 'dell-monitor',
    name: 'Dell 27 inch Monitor',
    sku: 'DELL-MON',
    brand: 'Dell',
    category: 'Monitors & Displays',
    imageEmbeddings: [[0.82, Math.sqrt(1 - (0.82 ** 2))]],
  });
  const hpCooler = makeCandidate({
    id: 'hp-cooler',
    name: 'HP CPU Cooler',
    sku: 'HP-COOL',
    brand: 'HP',
    category: 'Computer Components',
    imageEmbeddings: [[0.8, Math.sqrt(1 - (0.8 ** 2))]],
  });
  const ranked = rankImageSearchCandidates([hpCooler, dellMonitor, hpMonitor], { category: 'monitor' }, [1, 0]);
  const matches = filterPossibleImageMatches(ranked, {
    selectedMatch: ranked.find(({ product }) => product._id === 'hp-monitor'),
    categorySignal: 'monitor',
    categoryConfident: true,
    minimumSimilarity: 0.65,
  });

  assert.ok(matches.some(({ product }) => product._id === 'dell-monitor'));
  assert.ok(matches.every(({ product }) => product._id !== 'hp-cooler'));
  assert.ok(matches.every(({ categorySimilarity }) => categorySimilarity > 0));
});

test('catalog-derived category classification is margin-gated and category filtering is optional', () => {
  const monitors = makeCandidate({
    id: 'monitor-reference',
    category: 'Monitors & Displays',
    imageEmbeddings: [[1, 0], [0.98, 0.2]],
  }).productMatch;
  const coolers = makeCandidate({
    id: 'cooling-pad-reference',
    category: 'Computer Accessories',
    imageEmbeddings: [[0, 1], [0.1, 0.99]],
  }).productMatch;
  const clearClassification = classifyImageCategory([[1, 0]], [monitors, coolers], {
    minimumSimilarity: 0.7,
    minimumMargin: 0.05,
  });
  const uncertainClassification = classifyImageCategory([[0.7, Math.sqrt(1 - (0.7 ** 2))]], [monitors, coolers], {
    minimumSimilarity: 0.7,
    minimumMargin: 0.05,
  });
  const monitor = makeCandidate({
    id: 'monitor',
    category: 'Monitors & Displays',
    imageEmbeddings: [[1, 0]],
  });
  const coolingPad = makeCandidate({
    id: 'cooling-pad',
    category: 'Computer Accessories',
    imageEmbeddings: [[0.8, 0.6]],
  });
  const ranked = rankImageSearchCandidates([coolingPad, monitor], {}, [1, 0]);

  assert.equal(clearClassification.category, 'Monitors & Displays');
  assert.equal(clearClassification.confident, true);
  assert.equal(uncertainClassification.confident, false);
  assert.equal(uncertainClassification.category, '');
  assert.ok(filterPossibleImageMatches(ranked, { minimumSimilarity: 0.65 }).some(({ product }) => product._id === 'cooling-pad'));
  assert.ok(filterPossibleImageMatches(ranked, {
    categorySignal: clearClassification.category,
    categoryConfident: clearClassification.confident,
    minimumSimilarity: 0.65,
  }).every(({ product }) => product._id !== 'cooling-pad'));
  assert.equal(selectConfidentImageMatch(ranked, { categoryConfident: true })?.product._id, 'monitor');
});

test('conflicting OCR identifiers are penalized and cannot produce an automatic match', () => {
  const wrongCandidate = makeCandidate({
    id: 'wrong-model',
    name: 'Camera Model B',
    sku: 'CAM-B',
    modelNumber: 'MODEL-B',
    imageEmbeddings: [[1, 0]],
  });
  const rightCandidate = makeCandidate({
    id: 'right-model',
    name: 'Camera Model A',
    sku: 'CAM-A',
    modelNumber: 'MODEL-A',
    imageEmbeddings: [[0.9, Math.sqrt(1 - (0.9 ** 2))]],
  });
  const signals = { sku: 'CAM-A', model: 'MODEL-B', brand: 'HoneyVision' };
  const wrongScore = scoreProductCandidate(wrongCandidate.productMatch, signals);
  const ranked = rankImageSearchCandidates([wrongCandidate, rightCandidate], signals, [1, 0]);

  assert.ok(wrongScore.identifierConflicts > 0);
  assert.ok(wrongScore.confidence < 0.99);
  assert.equal(selectConfidentImageMatch(ranked), null);
});

test('missing catalog images never become a confident visual match', () => {
  const missingImage = makeCandidate({
    id: 'no-catalog-image',
    sku: 'CAM-420',
    modelNumber: 'HV-420',
    imageEmbeddings: [],
    cloudinaryUrls: [],
  });
  const ranked = rankImageSearchCandidates(
    [missingImage],
    { sku: 'CAM-420', model: 'HV-420' },
    [1, 0]
  );

  assert.equal(ranked[0].imageCount, 0);
  assert.equal(ranked[0].exactIdentifierMatch, true);
  assert.equal(selectConfidentImageMatch(ranked), null);
});

test('catalog candidates with missing or dimension-incompatible embeddings are rejected explicitly', () => {
  const missing = makeCandidate({
    id: 'missing-vector',
    imageEmbeddings: [],
  });
  const incompatible = makeCandidate({
    id: 'wrong-vector-dimensions',
    imageEmbeddings: [[1, 0, 0]],
  });
  const ranked = rankImageSearchCandidates([missing, incompatible], {}, [1, 0]);

  assert.equal(ranked.find(({ product }) => product._id === 'missing-vector').embeddingCompatible, false);
  assert.equal(ranked.find(({ product }) => product._id === 'wrong-vector-dimensions').embeddingCompatible, false);
  assert.equal(selectConfidentImageMatch(ranked), null);
  assert.ok(ranked.every(({ matchReasons }) => matchReasons.includes('catalog-image-embedding-unavailable') || matchReasons.includes('embedding-dimension-mismatch')));
});

test('labelled no-match and ambiguous visual cases return no confident selection', () => {
  const noMatch = makeCandidate({
    id: 'unrelated',
    imageEmbeddings: [[0.2, Math.sqrt(0.96)]],
  });
  const ambiguousA = makeCandidate({
    id: 'ambiguous-a',
    imageEmbeddings: [[0.96, Math.sqrt(1 - (0.96 ** 2))]],
  });
  const ambiguousB = makeCandidate({
    id: 'ambiguous-b',
    imageEmbeddings: [[0.955, Math.sqrt(1 - (0.955 ** 2))]],
  });

  test('labelled catalog-photo calibration rejects a visually similar different camera model', async () => {
    const cases = JSON.parse(await readFile(new URL('./fixtures/productImageSimilarityCases.json', import.meta.url), 'utf8'));
    assert.equal(cases[0].expectedMatch, true);
    assert.equal(cases[1].expectedMatch, false);

    const trueProduct = makeCandidate({
      id: 'tapo-c530ws',
      imageEmbeddings: [[1, 0]],
    });
    const differentModel = makeCandidate({
      id: 'hikvision-bullet',
      name: 'Hikvision 8MP Bullet Camera',
      sku: 'HV-CCTV-0026',
      imageEmbeddings: [[cases[1].observedCosineSimilarity, Math.sqrt(1 - (cases[1].observedCosineSimilarity ** 2))]],
    });
    const ranked = rankImageSearchCandidates([differentModel, trueProduct], {}, [1, 0]);
    const selected = selectConfidentImageMatch(ranked, { visualThreshold: 0.94, confidenceThreshold: 0.72, marginThreshold: 0.06 });

    assert.equal(ranked[0].product._id, 'tapo-c530ws');
    assert.equal(selected.product._id, 'tapo-c530ws');
    assert.ok(ranked.find(({ product }) => product._id === 'hikvision-bullet').visualSimilarity < 0.94);
  });

  assert.equal(selectConfidentImageMatch(rankImageSearchCandidates([noMatch], {}, [1, 0])), null);
  assert.equal(selectConfidentImageMatch(rankImageSearchCandidates([ambiguousA, ambiguousB], {}, [1, 0])), null);
  const response = buildImageSearchResultResponse({
    possibleMatches: [{ id: 'unrelated', name: 'Unrelated product', confidence: 0.2 }],
    requestId: 'no-match-request',
  });
  assert.equal(response.matched, false);
  assert.equal(response.product, null);
  assert.equal(response.possibleMatches[0].id, 'unrelated');
});

test('exact OCR identifiers are high confidence only when other identifiers do not conflict', () => {
  const matching = scoreProductCandidate({
    sku: 'CAM-420',
    modelNumber: 'HV-420',
    searchableText: 'Honey Vision 4MP IP camera model HV-420',
  }, { sku: 'CAM-420', model: 'HV-420', brand: 'Honey Vision' });
  const conflicting = scoreProductCandidate({
    sku: 'CAM-OTHER',
    modelNumber: 'HV-420',
    brand: 'Other Brand',
    searchableText: 'Other Brand outdoor camera model HV-420',
  }, { sku: 'CAM-420', model: 'HV-420', brand: 'Honey Vision' });

  assert.equal(matching.exactIdentifierMatch, true);
  assert.equal(matching.confidence, 0.99);
  assert.ok(conflicting.identifierConflicts > 0);
  assert.ok(conflicting.confidence < matching.confidence);
});

test('text-only recognition contributes evidence but is not an automatic image match', () => {
  const signals = { visualDescription: 'white turret camera black lens' };
  const score = scoreProductCandidate({
    searchableText: 'white outdoor turret camera with black lens',
  }, signals);

  assert.equal(hasProductRecognitionSignals(signals), true);
  assert.ok(score.semanticSimilarity > 0.5);
  assert.equal(score.exactIdentifierMatch, false);
});

test('empty recognition output is not treated as usable text evidence', () => {
  assert.equal(hasProductRecognitionSignals({ text: '   ' }), false);
  assert.equal(hasProductRecognitionSignals({ model: 'HV-420' }), true);
});

test('re-index flags refresh text records and optionally missing image embeddings', () => {
  const shared = {
    imageHash: 'image-hash',
    searchableText: 'camera model hv-420',
    embeddingVersion: 'product-image-index-v1',
    embeddingModel: 'clip:Xenova/clip-vit-base-patch32',
    imageEmbeddings: [[1, 0]],
    cloudinaryUrls: ['https://images.example.test/camera.webp'],
    indexingStatus: 'indexed',
  };

  assert.equal(shouldReindexImageProduct({ ...shared, doc: shared, reindexFailed: true }), false);
  assert.equal(shouldReindexImageProduct({ doc: null, reindexEmbeddings: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'failed' }, reindexFailed: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'outdated' }, reindexOutdated: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, imageEmbeddings: [] }, reindexEmbeddings: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, imageEmbeddings: [[1, Number.NaN]] }, reindexEmbeddings: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, embeddingModel: 'stale-model' }, reindexEmbeddings: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, imageEmbeddings: [] } }), false);
});

test('the ranked MongoDB product ID reaches the product card and View Product link', async () => {
  const { getScanProductPresentation } = await import('../../frontend/src/pages/scanProductPresentation.js');
  const selectedId = '6a94180566c9505dbd962d53';
  const selectedProduct = {
    _id: selectedId,
    name: 'TP-Link Tapo C530WS Outdoor Camera',
    sku: 'HV-CCTV-0027',
    brand: 'TP-Link',
    thumbnail: 'https://images.example.test/tapo-c530ws.webp',
    price: 2599,
    stock: 6,
    isActive: true,
  };
  const similarProduct = {
    _id: '6a94180566c9505dbd962d54',
    name: 'Hikvision 8MP Bullet Camera',
    sku: 'HV-CCTV-0026',
    brand: 'Hikvision',
    thumbnail: 'https://images.example.test/hikvision.webp',
    price: 5999,
    stock: 2,
    isActive: true,
  };
  const productsById = new Map([
    [selectedId, selectedProduct],
    [similarProduct._id, similarProduct],
  ]);
  const indexCandidates = [
    {
      ...makeCandidate({
        id: selectedId,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        brand: selectedProduct.brand,
        modelNumber: 'TAPO-C530WS',
        imageEmbeddings: [[0.96, Math.sqrt(1 - (0.96 ** 2))]],
      }).productMatch,
      product: selectedId,
    },
    {
      ...makeCandidate({
        id: similarProduct._id,
        name: similarProduct.name,
        sku: similarProduct.sku,
        brand: similarProduct.brand,
        modelNumber: 'HIK-8MP',
        imageEmbeddings: [[1, 0]],
      }).productMatch,
      product: similarProduct._id,
    },
  ];
  const candidatesWithCatalogProducts = indexCandidates.map((productMatch) => ({
    product: productsById.get(String(productMatch.product)),
    productMatch,
  }));
  const ranked = rankImageSearchCandidates(
    candidatesWithCatalogProducts,
    { brand: 'TP-Link', model: 'TAPO-C530WS', sku: 'HV-CCTV-0027', category: 'Security Cameras' },
    [1, 0]
  );
  const selected = selectConfidentImageMatch(ranked);
  assert.ok(selected);
  assert.equal(selected.product._id, selectedId);

  const apiResponse = buildImageSearchResultResponse({
    verifiedMatch: selected,
    requestId: 'scan-request',
  });
  const card = getScanProductPresentation(apiResponse.product);

  assert.equal(apiResponse.matched, true);
  assert.equal(apiResponse.product.id, selectedId);
  assert.equal(card.id, selectedId);
  assert.equal(card.name, selectedProduct.name);
  assert.equal(card.href, `/products/${selectedId}`);
});

test('structured diagnostics contain product IDs and scores but no image URL or upload data', () => {
  const diagnostics = buildImageSearchDiagnostics({
    requestId: 'request-123',
    thresholds: { visualSimilarity: 0.94 },
    candidates: [{
      product: { _id: 'mongo-product-1' },
      scores: { visualSimilarity: 0.94, confidence: 0.91, identifierConflicts: 0, matchReasons: ['visual-image-similarity'] },
      imageCount: 2,
      embeddingCount: 2,
      rejectionReason: 'selected-confident-match',
    }],
    selectedProductId: 'mongo-product-1',
    outcome: 'visual-image-match',
  });

  assert.equal(diagnostics.requestId, 'request-123');
  assert.equal(diagnostics.candidates[0].productId, 'mongo-product-1');
  assert.equal(diagnostics.candidates[0].rejectionReason, 'selected-confident-match');
  assert.equal(diagnostics.thresholds.visualSimilarity, 0.94);
  assert.equal(diagnostics.selectedProductId, 'mongo-product-1');
  assert.equal(JSON.stringify(diagnostics).includes('https://'), false);
});
