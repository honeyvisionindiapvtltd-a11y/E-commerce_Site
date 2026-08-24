import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyRazorpaySignature } from '../controllers/paymentController.js';

test('verifyRazorpaySignature accepts valid HMACs and rejects malformed or tampered signatures', () => {
  const secret = 'test_secret';
  const orderId = 'order_123';
  const paymentId = 'pay_456';
  const validSignature = crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, validSignature), true);
  assert.equal(verifyRazorpaySignature(secret, 'order_999', paymentId, validSignature), false);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, validSignature.toUpperCase()), true);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, `${validSignature}0`), false);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, validSignature.slice(0, -1)), false);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, 'not-a-valid-hex-signature'), false);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, 'deadbeef'), false);
  assert.equal(verifyRazorpaySignature(secret, orderId, paymentId, ''), false);
});
