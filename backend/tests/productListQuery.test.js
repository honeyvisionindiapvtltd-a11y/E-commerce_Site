import test from 'node:test';
import assert from 'node:assert/strict';
import { buildListPagination, buildProductListProjection, getSearchRegex } from '../utils/productListQuery.js';

test('buildListPagination clamps values and returns hasMore from limit + 1', () => {
  const pagination = buildListPagination({ page: '2', limit: '24' });

  assert.equal(pagination.page, 2);
  assert.equal(pagination.limit, 24);
  assert.equal(pagination.skip, 24);
  assert.equal(pagination.hasMore, false);
});

test('buildProductListProjection keeps listing fields lean and excludes related products', () => {
  const projection = buildProductListProjection();

  assert.match(projection, /_id/);
  assert.doesNotMatch(projection, /relatedProducts/);
  assert.match(projection, /thumbnail/);
});

test('getSearchRegex preserves a safe case-insensitive match for catalog search', () => {
  const regex = getSearchRegex('cam');

  assert.equal(regex.$options, 'i');
  assert.equal(regex.$regex, 'cam');
});
