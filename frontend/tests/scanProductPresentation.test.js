import test from 'node:test';
import assert from 'node:assert/strict';
import { getScanProductPresentation } from '../src/pages/scanProductPresentation.js';

test('the product card and View Product link use the MongoDB ID returned by the scan API', () => {
  const apiResponse = {
    product: {
      id: '6a94180566c9505dbd962d53',
      name: 'TP-Link 4MP Outdoor Camera',
      thumbnail: 'https://images.example.test/tapo-c530ws.webp',
    },
    possibleMatches: [{
      id: '6a94180566c9505dbd962d52',
      name: 'Similar Hikvision Camera',
    }],
  };

  const presentation = getScanProductPresentation(apiResponse.product);

  assert.equal(presentation.id, apiResponse.product.id);
  assert.equal(presentation.name, apiResponse.product.name);
  assert.equal(presentation.thumbnail, apiResponse.product.thumbnail);
  assert.equal(presentation.href, `/products/${apiResponse.product.id}`);
  assert.notEqual(presentation.href, `/products/${apiResponse.possibleMatches[0].id}`);
});

test('a missing selected product ID never falls back to an alternative product', () => {
  assert.equal(getScanProductPresentation(null), null);
  assert.equal(getScanProductPresentation({ name: 'Unverified match' }), null);
});
