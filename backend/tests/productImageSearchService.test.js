import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasProductRecognitionSignals,
  parseImageRecognitionResponse,
  parseVisualProductMatchResponse,
  resolveImageVisionConfig,
  scoreProductCandidate,
  shouldReindexImageProduct,
} from '../services/productImageSearchService.js';

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

test('visual product match parsing normalizes confidence and trims product ID', () => {
  const match = parseVisualProductMatchResponse(JSON.stringify({
    productId: ' product-123 ',
    confidence: 0.93,
    reason: 'Matching turret housing and lens layout',
  }));

  assert.deepEqual(match, {
    productId: 'product-123',
    confidence: 0.93,
    reason: 'Matching turret housing and lens layout',
  });
});

test('visual description is usable matching evidence and contributes to candidate scoring', () => {
  const signals = { visualDescription: 'white turret camera black lens' };
  const score = scoreProductCandidate({
    searchableText: 'white outdoor turret camera with black lens',
  }, signals);

  assert.equal(hasProductRecognitionSignals(signals), true);
  assert.ok(score.semanticSimilarity > 0.5);
});

test('exact SKU recognition returns a high-confidence catalog match', () => {
  const score = scoreProductCandidate({
    sku: 'CAM-420',
    searchableText: 'Honey Vision 4MP IP camera model CAM-420',
  }, { sku: 'CAM-420' });

  assert.equal(score.exactIdentifierMatch, true);
  assert.equal(score.confidence, 0.99);
});

test('text-only recognition stays a possible match instead of an automatic match', () => {
  const score = scoreProductCandidate({
    brand: 'Honey Vision',
    searchableText: 'Honey Vision outdoor 4MP camera',
  }, { text: 'camera' });

  assert.equal(score.exactIdentifierMatch, false);
  assert.ok(score.confidence < 0.82);
});

test('empty recognition output is not treated as usable evidence', () => {
  assert.equal(hasProductRecognitionSignals({ text: '   ' }), false);
  assert.equal(hasProductRecognitionSignals({ model: 'HV-420' }), true);
});

test('reindex flags only rebuild records in the requested failed or outdated state', () => {
  const shared = {
    imageHash: 'image-hash',
    searchableText: 'camera model hv-420',
    embeddingVersion: 'product-image-index-v1',
  };

  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'indexed' }, reindexFailed: true }), false);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'failed' }, reindexFailed: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'outdated' }, reindexOutdated: true }), true);
  assert.equal(shouldReindexImageProduct({ ...shared, doc: { ...shared, indexingStatus: 'pending' } }), true);
});
