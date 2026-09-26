const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 1000 } });
  const widths = [320, 360, 375, 390, 414, 1024, 1280, 1440, 1920];
  const routes = ['/', '/categories'];

  for (const route of routes) {
    console.log(`\n==== ROUTE ${route} ====\n`);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const errors = [];
      page.on('pageerror', err => errors.push('pageerror:' + err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push('console:' + msg.text());
      });

      await page.goto(`http://localhost:5174${route}`, { waitUntil: 'networkidle', timeout: 30000 });

      const metrics = await page.evaluate(() => ({
        width: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
        navPresent: !!document.querySelector('nav, .navbar, .bottom-nav, .mobile-nav'),
        imagesCount: document.querySelectorAll('img').length,
        summary: document.body.innerText.slice(0, 180),
        mainPresent: !!document.querySelector('main')
      }));

      console.log(JSON.stringify({ route, width, metrics, errors }, null, 2));
      await page.screenshot({ path: `audit-${route.replace('/', '_')}-${width}.png`, fullPage: false });
    }
  }

  await browser.close();
})();
