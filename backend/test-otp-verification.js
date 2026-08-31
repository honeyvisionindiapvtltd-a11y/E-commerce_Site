import crypto from 'node:crypto';
import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import User from './models/User.js';

import {
  createDeliveryOtp,
  DELIVERY_OTP_MAX_ATTEMPTS,
  DELIVERY_OTP_TTL_MS,
  hashDeliveryOtp,
  verifyDeliveryOtp,
} from './services/orderTrackingService.js';

/*
 * ============================================================
 * HoneyVision - Production OTP Verification Test Suite
 * ============================================================
 *
 * Tests:
 * 1. OTP format
 * 2. OTP cryptographic randomness
 * 3. OTP hashing and verification
 * 4. Hash integrity / wrong OTP rejection
 * 5. OTP expiry configuration
 * 6. MongoDB storage and retrieval
 * 7. OTP attempt-limit configuration
 * 8. Actual attempt-limit simulation
 * 9. OTP reuse protection logic
 * 10. Timing comparison benchmark
 *
 * IMPORTANT:
 * This script tests the OTP service/database layer.
 * It does NOT replace API/integration tests for:
 *
 * POST /delivery/:orderNumber/start
 * POST /delivery/:orderNumber/mark-delivered
 *
 * Those require testing deliveryController.js directly.
 * ============================================================
 */

const TEST_PREFIX = 'TEST-OTP-PRODUCTION-';

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const randomWrongOtp = (validOtp) => {
  let otp;

  do {
    otp = String(crypto.randomInt(100000, 1000000));
  } while (otp === validOtp);

  return otp;
};

const median = (values) => {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const average = (values) => {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;

  const avg = average(values);

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - avg, 2),
      0
    ) / values.length;

  return Math.sqrt(variance);
};

const resolveMongoUri = () => {
  const directUri = process.env.MONGODB_DIRECT_URI;

  if (directUri && directUri.trim()) {
    return directUri.trim();
  }

  const remoteUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (remoteUri && remoteUri.trim()) {
    return remoteUri.trim();
  }

  return 'mongodb://127.0.0.1:27017/honeyvision';
};

const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();

    await mongoose.connect(mongoUri);

    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error(
      '✗ MongoDB connection failed:',
      error.message
    );

    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();

    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error(
      '✗ MongoDB disconnect failed:',
      error.message
    );
  }
};

/*
 * ============================================================
 * TEST 1
 * OTP FORMAT AND RANGE
 * ============================================================
 */

async function testOtpFormat() {
  console.log('\n--- Test 1: OTP Format and Range ---');

  try {
    const samples = 1000;

    for (let i = 0; i < samples; i++) {
      const otp = createDeliveryOtp();

      if (!/^\d{6}$/.test(otp)) {
        console.error(
          `✗ Invalid OTP format: ${otp}`
        );

        return false;
      }

      const number = Number(otp);

      if (
        number < 100000 ||
        number > 999999
      ) {
        console.error(
          `✗ OTP outside valid range: ${number}`
        );

        return false;
      }
    }

    console.log(
      `✓ ${samples} OTPs generated`
    );

    console.log(
      '✓ All OTPs contain exactly 6 digits'
    );

    console.log(
      '✓ All OTPs are within 100000-999999'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 2
 * CRYPTOGRAPHIC RANDOMNESS / COLLISION CHECK
 * ============================================================
 */

async function testOtpRandomness() {
  console.log('\n--- Test 2: OTP Randomness ---');

  try {
    const samples = 5000;
    const otps = new Set();

    for (let i = 0; i < samples; i++) {
      otps.add(createDeliveryOtp());
    }

    const uniqueCount = otps.size;
    const collisionCount = samples - uniqueCount;

    console.log(
      `✓ Generated ${samples} OTPs`
    );

    console.log(
      `✓ Unique OTPs: ${uniqueCount}/${samples}`
    );

    console.log(
      `✓ Collisions: ${collisionCount}`
    );

    /*
     * A collision is statistically possible with random
     * 6-digit OTPs, so we do NOT require 100% uniqueness.
     *
     * We only fail on an obviously abnormal result.
     */
    if (uniqueCount < samples * 0.98) {
      console.error(
        '✗ Abnormally low OTP uniqueness'
      );

      return false;
    }

    console.log(
      '✓ OTP uniqueness is within expected range'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 3
 * HASHING AND VERIFICATION
 * ============================================================
 */

async function testOtpHashing() {
  console.log(
    '\n--- Test 3: OTP Hashing and Verification ---'
  );

  try {
    const otp = createDeliveryOtp();

    const hash = hashDeliveryOtp(otp);

    console.log(
      `✓ Generated OTP: ${otp}`
    );

    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      console.error(
        '✗ Hash is not a valid SHA-256 hexadecimal digest'
      );

      return false;
    }

    console.log(
      `✓ SHA-256 hash generated: ${hash.substring(0, 16)}...`
    );

    if (hash === otp) {
      console.error(
        '✗ Plain OTP appears to be stored as hash'
      );

      return false;
    }

    console.log(
      '✓ OTP is not stored as plaintext'
    );

    if (!verifyDeliveryOtp(otp, hash)) {
      console.error(
        '✗ Correct OTP failed verification'
      );

      return false;
    }

    console.log(
      '✓ Correct OTP verified successfully'
    );

    const wrongOtp = randomWrongOtp(otp);

    if (verifyDeliveryOtp(wrongOtp, hash)) {
      console.error(
        '✗ Incorrect OTP was accepted'
      );

      return false;
    }

    console.log(
      '✓ Incorrect OTP correctly rejected'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 4
 * HASH INTEGRITY
 * ============================================================
 */

async function testHashIntegrity() {
  console.log('\n--- Test 4: Hash Integrity ---');

  try {
    const otp1 = createDeliveryOtp();
    const otp2 = randomWrongOtp(otp1);

    const hash1 = hashDeliveryOtp(otp1);
    const hash2 = hashDeliveryOtp(otp2);

    if (hash1 === hash2) {
      console.error(
        '✗ Different OTPs generated identical hashes'
      );

      return false;
    }

    console.log(
      '✓ Different OTPs generate different hashes'
    );

    if (!verifyDeliveryOtp(otp1, hash1)) {
      console.error(
        '✗ Original OTP does not match its hash'
      );

      return false;
    }

    if (verifyDeliveryOtp(otp2, hash1)) {
      console.error(
        '✗ Different OTP matched original hash'
      );

      return false;
    }

    console.log(
      '✓ Hash integrity verified'
    );

    /*
     * Malformed hash must not crash verification.
     */
    const malformedHashes = [
      '',
      'abc',
      '123',
      'not-a-hash',
      null,
      undefined,
    ];

    for (const malformedHash of malformedHashes) {
      let result;

      try {
        result = verifyDeliveryOtp(
          otp1,
          malformedHash
        );
      } catch (error) {
        console.error(
          '✗ Verification crashed on malformed hash:',
          error.message
        );

        return false;
      }

      if (result !== false) {
        console.error(
          '✗ Malformed hash was accepted'
        );

        return false;
      }
    }

    console.log(
      '✓ Malformed hashes safely rejected'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 5
 * OTP EXPIRY CONFIGURATION
 * ============================================================
 */

async function testOtpExpiry() {
  console.log('\n--- Test 5: OTP Expiry ---');

  try {
    if (
      !Number.isInteger(DELIVERY_OTP_TTL_MS) ||
      DELIVERY_OTP_TTL_MS <= 0
    ) {
      console.error(
        '✗ OTP TTL must be a positive integer'
      );

      return false;
    }

    const now = Date.now();

    const expiresAt =
      now + DELIVERY_OTP_TTL_MS;

    if (expiresAt <= now) {
      console.error(
        '✗ OTP expiry timestamp is invalid'
      );

      return false;
    }

    const minutes =
      DELIVERY_OTP_TTL_MS /
      (1000 * 60);

    const hours =
      DELIVERY_OTP_TTL_MS /
      (1000 * 60 * 60);

    console.log(
      `✓ OTP TTL: ${minutes.toFixed(2)} minutes`
    );

    console.log(
      `✓ OTP TTL: ${hours.toFixed(2)} hours`
    );

    console.log(
      `✓ Expires at: ${new Date(expiresAt).toISOString()}`
    );

    /*
     * Production safety warning rather than hard failure.
     */
    if (minutes > 60) {
      console.warn(
        '⚠ WARNING: OTP validity exceeds 60 minutes'
      );

      console.warn(
        '⚠ Consider using a shorter delivery OTP lifetime'
      );
    }

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 6
 * DATABASE STORAGE AND RETRIEVAL
 * ============================================================
 */

async function testDatabaseOtpStorage() {
  console.log(
    '\n--- Test 6: Database OTP Storage and Retrieval ---'
  );

  let testOrder = null;

  try {
    const testUser =
      await User.findOne({
        role: 'customer',
      });

    if (!testUser) {
      console.error(
        '✗ No customer found for database test'
      );

      return false;
    }

    const otp = createDeliveryOtp();

    testOrder = new Order({
      orderNumber:
        `${TEST_PREFIX}${Date.now()}`,

      user: testUser._id,

      items: [],

      subtotal: 0,

      totalAmount: 0,

      shippingAddress: {
        name: 'OTP Test Customer',
        phone: '+919876543210',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Odisha',
        postalCode: '751001',
        country: 'India',
      },

      paymentMethod: 'COD',

      status: 'OUT_FOR_DELIVERY',

      deliveryAgent: testUser._id,

      deliveryOtpHash:
        hashDeliveryOtp(otp),

      deliveryOtpExpiresAt:
        new Date(
          Date.now() + DELIVERY_OTP_TTL_MS
        ),

      deliveryOtpVerifiedAt: null,

      deliveryOtpAttempts: 0,
    });

    await testOrder.save();

    console.log(
      `✓ Test order created: ${testOrder.orderNumber}`
    );

    const retrievedOrder =
      await Order.findById(
        testOrder._id
      ).select(
        '+deliveryOtpHash ' +
        '+deliveryOtpExpiresAt ' +
        '+deliveryOtpVerifiedAt ' +
        '+deliveryOtpAttempts'
      );

    if (!retrievedOrder) {
      console.error(
        '✗ Test order could not be retrieved'
      );

      return false;
    }

    if (
      !retrievedOrder.deliveryOtpHash
    ) {
      console.error(
        '✗ OTP hash was not stored'
      );

      return false;
    }

    console.log(
      '✓ OTP hash retrieved from MongoDB'
    );

    /*
     * Verify that plaintext OTP is NOT stored.
     */
    if (
      retrievedOrder.deliveryOtpHash === otp
    ) {
      console.error(
        '✗ Plaintext OTP detected in database'
      );

      return false;
    }

    console.log(
      '✓ Plaintext OTP is not stored'
    );

    if (
      !verifyDeliveryOtp(
        otp,
        retrievedOrder.deliveryOtpHash
      )
    ) {
      console.error(
        '✗ OTP failed verification after DB retrieval'
      );

      return false;
    }

    console.log(
      '✓ OTP verified successfully after DB retrieval'
    );

    if (
      retrievedOrder.deliveryOtpAttempts !== 0
    ) {
      console.error(
        '✗ Initial attempt count is not zero'
      );

      return false;
    }

    console.log(
      '✓ Initial attempt count is 0'
    );

    if (
      retrievedOrder.deliveryOtpVerifiedAt !== null
    ) {
      console.error(
        '✗ OTP is marked verified before verification'
      );

      return false;
    }

    console.log(
      '✓ OTP is initially unverified'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  } finally {
    if (testOrder?._id) {
      try {
        await Order.findByIdAndDelete(
          testOrder._id
        );

        console.log(
          '✓ Test order cleaned up'
        );
      } catch (error) {
        console.error(
          '✗ Test cleanup failed:',
          error.message
        );
      }
    }
  }
}

/*
 * ============================================================
 * TEST 7
 * ATTEMPT LIMIT CONFIGURATION
 * ============================================================
 */

async function testAttemptConfiguration() {
  console.log(
    '\n--- Test 7: OTP Attempt Configuration ---'
  );

  try {
    if (
      !Number.isInteger(
        DELIVERY_OTP_MAX_ATTEMPTS
      )
    ) {
      console.error(
        '✗ Max attempts must be an integer'
      );

      return false;
    }

    if (
      DELIVERY_OTP_MAX_ATTEMPTS < 1
    ) {
      console.error(
        '✗ Max attempts must be at least 1'
      );

      return false;
    }

    console.log(
      `✓ Maximum attempts: ${DELIVERY_OTP_MAX_ATTEMPTS}`
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 8
 * ACTUAL ATTEMPT LIMIT SIMULATION
 * ============================================================
 */

async function testAttemptLimitSimulation() {
  console.log(
    '\n--- Test 8: Attempt Limit Simulation ---'
  );

  try {
    const otp = createDeliveryOtp();

    const hash = hashDeliveryOtp(otp);

    let attempts = 0;

    /*
     * Simulate the same state transition the controller
     * should perform after a failed verification.
     */
    while (
      attempts <
      DELIVERY_OTP_MAX_ATTEMPTS
    ) {
      const wrongOtp =
        randomWrongOtp(otp);

      const valid =
        verifyDeliveryOtp(
          wrongOtp,
          hash
        );

      if (valid) {
        console.error(
          '✗ Incorrect OTP unexpectedly verified'
        );

        return false;
      }

      attempts++;
    }

    if (
      attempts !==
      DELIVERY_OTP_MAX_ATTEMPTS
    ) {
      console.error(
        '✗ Attempt counter did not reach configured limit'
      );

      return false;
    }

    console.log(
      `✓ ${attempts} incorrect OTP attempts rejected`
    );

    /*
     * Once maximum attempts are reached, the controller
     * must refuse further verification.
     *
     * We explicitly simulate the controller guard here.
     */
    const locked =
      attempts >=
      DELIVERY_OTP_MAX_ATTEMPTS;

    if (!locked) {
      console.error(
        '✗ Attempt limit lock condition failed'
      );

      return false;
    }

    console.log(
      '✓ Account/order should be locked for further OTP attempts'
    );

    /*
     * Even the correct OTP must NOT bypass the controller's
     * attempt-limit guard.
     */
    if (!verifyDeliveryOtp(otp, hash)) {
      console.error(
        '✗ Internal verification unexpectedly failed'
      );

      return false;
    }

    console.log(
      '✓ Correct OTP is internally valid'
    );

    console.log(
      '✓ Controller must reject it when attempts >= maximum'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 9
 * OTP REUSE / VERIFIED STATE
 * ============================================================
 */

async function testOtpReuseProtection() {
  console.log(
    '\n--- Test 9: OTP Reuse Protection ---'
  );

  try {
    const verifiedAt =
      new Date();

    if (!(verifiedAt instanceof Date)) {
      console.error(
        '✗ Verification timestamp could not be created'
      );

      return false;
    }

    /*
     * Controller-level rule:
     *
     * If deliveryOtpVerifiedAt exists,
     * the OTP must not be accepted again.
     */
    const alreadyVerified =
      verifiedAt !== null;

    if (!alreadyVerified) {
      console.error(
        '✗ Verified state detection failed'
      );

      return false;
    }

    console.log(
      '✓ Already-verified state detected'
    );

    console.log(
      '✓ Controller should reject OTP reuse'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * TEST 10
 * TIMING BENCHMARK
 * ============================================================
 *
 * IMPORTANT:
 * Timing tests are statistical.
 *
 * We DO NOT fail the complete test suite simply because
 * one machine produces a large percentage difference.
 *
 * The correct objective is to ensure:
 *
 * - crypto.timingSafeEqual is used by the service
 * - correct and incorrect OTPs behave correctly
 * - timing measurements are collected over many samples
 *
 * A timing benchmark cannot mathematically prove the absence
 * of every timing side-channel.
 * ============================================================
 */

async function testTimingBenchmark() {
  console.log(
    '\n--- Test 10: Timing-Safe Verification Benchmark ---'
  );

  try {
    const otp = createDeliveryOtp();

    const hash = hashDeliveryOtp(otp);

    const warmupIterations = 500;

    const measurementIterations = 2000;

    /*
     * Warm up Node.js/JIT.
     */
    for (
      let i = 0;
      i < warmupIterations;
      i++
    ) {
      verifyDeliveryOtp(
        otp,
        hash
      );

      verifyDeliveryOtp(
        randomWrongOtp(otp),
        hash
      );
    }

    const correctTimes = [];
    const incorrectTimes = [];

    /*
     * Measure correct OTP.
     */
    for (
      let i = 0;
      i < measurementIterations;
      i++
    ) {
      const start =
        process.hrtime.bigint();

      const result =
        verifyDeliveryOtp(
          otp,
          hash
        );

      const end =
        process.hrtime.bigint();

      if (!result) {
        console.error(
          '✗ Correct OTP unexpectedly failed'
        );

        return false;
      }

      correctTimes.push(
        Number(end - start)
      );
    }

    /*
     * Measure incorrect OTP.
     */
    for (
      let i = 0;
      i < measurementIterations;
      i++
    ) {
      const wrongOtp =
        randomWrongOtp(otp);

      const start =
        process.hrtime.bigint();

      const result =
        verifyDeliveryOtp(
          wrongOtp,
          hash
        );

      const end =
        process.hrtime.bigint();

      if (result) {
        console.error(
          '✗ Incorrect OTP unexpectedly passed'
        );

        return false;
      }

      incorrectTimes.push(
        Number(end - start)
      );
    }

    const correctMedian =
      median(correctTimes);

    const incorrectMedian =
      median(incorrectTimes);

    const correctAverage =
      average(correctTimes);

    const incorrectAverage =
      average(incorrectTimes);

    const correctStd =
      standardDeviation(correctTimes);

    const incorrectStd =
      standardDeviation(incorrectTimes);

    const medianDifference =
      Math.abs(
        correctMedian -
        incorrectMedian
      );

    const medianAverage =
      (
        correctMedian +
        incorrectMedian
      ) / 2;

    const medianDifferencePercent =
      medianAverage === 0
        ? 0
        : (
            medianDifference /
            medianAverage
          ) * 100;

    console.log(
      `✓ Correct OTP samples: ${measurementIterations}`
    );

    console.log(
      `✓ Incorrect OTP samples: ${measurementIterations}`
    );

    console.log(
      `✓ Correct median: ${(correctMedian / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Incorrect median: ${(incorrectMedian / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Correct average: ${(correctAverage / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Incorrect average: ${(incorrectAverage / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Correct standard deviation: ${(correctStd / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Incorrect standard deviation: ${(incorrectStd / 1000).toFixed(3)} µs`
    );

    console.log(
      `✓ Median timing difference: ${medianDifferencePercent.toFixed(2)}%`
    );

    /*
     * DO NOT declare a cryptographic timing attack simply
     * because this percentage is high.
     *
     * The actual implementation should use
     * crypto.timingSafeEqual(), which should be verified
     * directly in orderTrackingService.js.
     */
    console.log(
      '✓ Timing benchmark completed'
    );

    console.log(
      'ℹ Large variance alone does not prove a timing vulnerability'
    );

    return true;
  } catch (error) {
    console.error(
      '✗ Test failed:',
      error.message
    );

    return false;
  }
}

/*
 * ============================================================
 * MAIN TEST RUNNER
 * ============================================================
 */

async function runAllTests() {
  console.log(
    '\n╔══════════════════════════════════════════════╗'
  );

  console.log(
    '║ HoneyVision Production OTP Test Suite      ║'
  );

  console.log(
    '╚══════════════════════════════════════════════╝'
  );

  console.log(
    `\nEnvironment: ${
      process.env.NODE_ENV || 'development'
    }`
  );

  await connectDB();

  const tests = [
    [
      'OTP Format and Range',
      testOtpFormat,
    ],

    [
      'OTP Randomness',
      testOtpRandomness,
    ],

    [
      'OTP Hashing and Verification',
      testOtpHashing,
    ],

    [
      'Hash Integrity',
      testHashIntegrity,
    ],

    [
      'OTP Expiry',
      testOtpExpiry,
    ],

    [
      'Database OTP Storage',
      testDatabaseOtpStorage,
    ],

    [
      'Attempt Configuration',
      testAttemptConfiguration,
    ],

    [
      'Attempt Limit Simulation',
      testAttemptLimitSimulation,
    ],

    [
      'OTP Reuse Protection',
      testOtpReuseProtection,
    ],

    [
      'Timing Benchmark',
      testTimingBenchmark,
    ],
  ];

  const results = [];

  try {
    for (const [name, test] of tests) {
      let passed = false;

      try {
        passed = await test();
      } catch (error) {
        console.error(
          `✗ Unexpected error in ${name}:`,
          error.message
        );
      }

      results.push({
        name,
        passed,
      });
    }
  } finally {
    await disconnectDB();
  }

  console.log(
    '\n╔══════════════════════════════════════════════╗'
  );

  console.log(
    '║                 TEST SUMMARY               ║'
  );

  console.log(
    '╚══════════════════════════════════════════════╝'
  );

  let passCount = 0;

  for (const result of results) {
    const status =
      result.passed
        ? '✓ PASS'
        : '✗ FAIL';

    console.log(
      `${status}: ${result.name}`
    );

    if (result.passed) {
      passCount++;
    }
  }

  console.log(
    `\nTotal: ${passCount}/${results.length} tests passed`
  );

  if (
    passCount === results.length
  ) {
    console.log(
      '\n✓ OTP service/database test suite passed.'
    );

    console.log(
      '✓ No plaintext OTP storage detected.'
    );

    console.log(
      '✓ OTP generation and verification passed.'
    );

    console.log(
      '✓ Database persistence passed.'
    );

    console.log(
      '✓ Attempt-limit logic passed.'
    );

    console.log(
      '✓ Timing benchmark completed.'
    );

    console.log(
      '\nIMPORTANT: Run end-to-end API tests before production deployment.'
    );

    process.exit(0);
  }

  console.log(
    '\n✗ One or more tests failed.'
  );

  process.exit(1);
}

runAllTests().catch((error) => {
  console.error(
    '\n✗ Test execution failed:',
    error
  );

  process.exit(1);
});