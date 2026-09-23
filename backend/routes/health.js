import { Router } from 'express';

const router = Router();

const healthResponse = { status: 'ok', message: 'HoneyVision API is running' };

const getPrimaryFrontendUrl = () => (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)[0] || null;

router.get('/', (_req, res) => {
  const frontendUrl = getPrimaryFrontendUrl();

  if (frontendUrl) {
    return res.redirect(frontendUrl);
  }

  return res.json({
    status: 'ok',
    message: 'HoneyVision API is running',
    endpoints: ['/api', '/api/health'],
  });
});

router.get('/health', (_req, res) => {
  res.json(healthResponse);
});

router.head('/health', (_req, res) => {
  res.sendStatus(200);
});

export default router;
