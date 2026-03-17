import { chromium, FullConfig } from '@playwright/test';

// Runs once before all tests
// Logs in as admin and saves the browser storage state to a file
// All tests then reuse this state instead of logging in every time
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  // Wait until redirected to homepage after login
  await page.waitForURL(`${baseURL}/`);

  // Save storage state (localStorage + cookies) to file
  await page.context().storageState({ path: './auth-state.json' });

  await browser.close();
}

export default globalSetup;
