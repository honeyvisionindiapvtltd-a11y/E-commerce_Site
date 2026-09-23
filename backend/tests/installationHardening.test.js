import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areSupportedAdditionalServices,
  calculateInstallationPricing,
  isSupportedInstallationService,
} from '../services/installationService.js';
import {
  INSTALLATION_STATUSES,
  isValidStatusTransition,
} from '../constants/installationStatuses.js';

test('installation catalog rejects unknown services and extras', () => {
  assert.equal(isSupportedInstallationService('cctv'), true);
  assert.equal(isSupportedInstallationService('unknown-service'), false);
  assert.equal(areSupportedAdditionalServices(['cable', 'wifi']), true);
  assert.equal(areSupportedAdditionalServices(['unknown-extra']), false);
  assert.throws(() => calculateInstallationPricing({ serviceId: 'unknown-service' }), /Unsupported installation service/);
  assert.throws(() => calculateInstallationPricing({ serviceId: 'cctv', additionalServiceIds: ['unknown-extra'] }), /Unsupported additional installation service/);
});

test('installation pricing is calculated from the server catalog', () => {
  assert.deepEqual(calculateInstallationPricing({ serviceId: 'cctv', additionalServiceIds: ['cable'] }), {
    installationPrice: 1499,
    additionalTotal: 499,
    subtotal: 1998,
    gst: 360,
    total: 2358,
  });
});

test('installation lifecycle rejects invalid jumps', () => {
  assert.equal(isValidStatusTransition(INSTALLATION_STATUSES.BOOKED, INSTALLATION_STATUSES.CONFIRMED), true);
  assert.equal(isValidStatusTransition(INSTALLATION_STATUSES.BOOKED, INSTALLATION_STATUSES.INSTALLATION_COMPLETED), false);
  assert.equal(isValidStatusTransition(INSTALLATION_STATUSES.CANCELLED, INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS), false);
  assert.equal(isValidStatusTransition(INSTALLATION_STATUSES.INSTALLATION_COMPLETED, INSTALLATION_STATUSES.ASSIGNED), false);
});
