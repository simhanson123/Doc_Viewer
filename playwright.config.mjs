/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Electron tests launch their own process — no webServer
};
