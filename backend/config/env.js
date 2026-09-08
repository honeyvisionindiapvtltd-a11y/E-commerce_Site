const isTruthy = (value) => ['true', '1', 'yes', 'on'].includes(String(value ?? '').toLowerCase());

const resolveMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_DIRECT_URI;

export const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return process.env.JWT_SECRET;
};

export const validateEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const missing = [];
  const warnings = [];

  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    missing.push('JWT_SECRET');
  }

  if (!resolveMongoUri()) {
    missing.push('MONGODB_URI');
  }

  if (nodeEnv === 'production' && (!process.env.FRONTEND_URL || !String(process.env.FRONTEND_URL).trim())) {
    missing.push('FRONTEND_URL');
  }

  const razorpayEnabled = isTruthy(process.env.RAZORPAY_ENABLED);
  if (razorpayEnabled) {
    if (!process.env.RAZORPAY_KEY_ID) missing.push('RAZORPAY_KEY_ID');
    if (!process.env.RAZORPAY_KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET');
    if (isTruthy(process.env.RAZORPAY_WEBHOOKS_ENABLED) && !process.env.RAZORPAY_WEBHOOK_SECRET) {
      missing.push('RAZORPAY_WEBHOOK_SECRET');
    }
  }

  const stripeEnabled = isTruthy(process.env.STRIPE_ENABLED);
  if (stripeEnabled) {
    if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
    if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    nodeEnv,
    jwtSecret: getJwtSecret(),
    mongoUri: resolveMongoUri(),
    warnings,
  };
};
