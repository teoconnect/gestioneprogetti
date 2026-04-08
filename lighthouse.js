const playwright = require('playwright');
const { playAudit } = require('playwright-lighthouse');

(async () => {
  const browser = await playwright.chromium.launch({
    args: ['--remote-debugging-port=9222'],
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/login');

  await playAudit({
    page: page,
    thresholds: {
      pwa: 100,
    },
    port: 9222,
    htmlReport: false,
  });

  await browser.close();
})();
