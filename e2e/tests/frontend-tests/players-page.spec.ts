import { test, expect, request as playwrightRequest } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const TEST_PLAYER_NAME = '__E2E_TestPlayer__';

// Helper: delete all players created by this test suite
async function cleanupTestPlayers(playerIds: string[]) {
  const ctx = await playwrightRequest.newContext();
  for (const id of playerIds) {
    await ctx.delete(`${API_BASE}/api/players/${id}`);
  }
  await ctx.dispose();
}

test.describe('Players Page — frontend', () => {
  // Track created player IDs so we can delete them after each test
  const createdIds: string[] = [];

  test.afterAll(async () => {
    await cleanupTestPlayers(createdIds);
  });

  // ────────────────────────────────────────────────
  // 1. Add Player — full form submission
  // ────────────────────────────────────────────────
  test('can create a player through the form and see them on the players page', async ({ page }) => {
    // Intercept the POST so we can grab the new player's _id for cleanup
    let createdPlayerId = '';
    page.on('response', async (response) => {
      if (response.url().includes('/api/players') && response.request().method() === 'POST') {
        try {
          const body = await response.json();
          if (body._id) createdPlayerId = body._id;
        } catch { /* ignore */ }
      }
    });

    await page.goto('/add');
    await expect(page.locator('h2')).toContainText('Add Player');

    // ── Section 1: Identity ──
    await page.fill('#name', TEST_PLAYER_NAME);
    await page.fill('#jerseyNumber', '99');
    await page.fill('#marketValue', '1000000');
    await page.selectOption('#preferredPosition', 'ST');
    // cardImage is optional — leave default

    // ── Section 2: Offensive Stats ──
    await page.fill('#dribbling', '75');
    await page.fill('#shotAccuracy', '80');
    await page.fill('#shotSpeed', '78');
    await page.fill('#headers', '60');
    await page.fill('#longPass', '65');
    await page.fill('#shortPass', '70');
    await page.fill('#ballControl', '72');
    await page.fill('#positioning', '74');
    await page.fill('#vision', '68');

    // ── Section 3: Defensive ──
    await page.fill('#tackling', '55');
    await page.fill('#interceptions', '58');
    await page.fill('#marking', '52');
    await page.fill('#defensiveIQ', '60');

    // ── Section 3: Athleticism ──
    await page.fill('#speed', '85');
    await page.fill('#strength', '70');
    await page.fill('#stamina', '80');

    // ── Submit ──
    await page.locator('button[type="submit"]').click();

    // Toast should appear
    await expect(page.locator('.toast-notification, [class*="toast"]').first()).toBeVisible({ timeout: 5000 });

    // After toast the form redirects to /edit
    await page.waitForURL('**/edit', { timeout: 8000 });

    // Player should be visible in the list
    await expect(page.getByText(TEST_PLAYER_NAME)).toBeVisible();

    // Save ID for cleanup
    if (createdPlayerId) createdIds.push(createdPlayerId);
  });

  // ────────────────────────────────────────────────
  // 2. /add route is accessible while authenticated
  // ────────────────────────────────────────────────
  test('navigates to /add page from the players list', async ({ page }) => {
    await page.goto('/edit');

    // The "Add Player" button should be visible
    const addBtn = page.locator('a[href="/add"], button', { hasText: /add player/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page).toHaveURL(/\/add/);
    await expect(page.locator('h2')).toContainText('Add Player');
  });

  // ────────────────────────────────────────────────
  // 3. Validation — empty name is rejected
  // ────────────────────────────────────────────────
  test('shows validation error when name is empty', async ({ page }) => {
    await page.goto('/add');

    await page.selectOption('#preferredPosition', 'CM');
    await page.locator('button[type="submit"]').click();

    // Toast error should appear with name-related message
    const toast = page.locator('.toast-notification, [class*="toast"]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/name/i);
  });

  // ────────────────────────────────────────────────
  // 4. Validation — empty position is rejected
  // ────────────────────────────────────────────────
  test('shows validation error when position is not selected', async ({ page }) => {
    await page.goto('/add');

    await page.fill('#name', 'NoPositionPlayer');
    await page.locator('button[type="submit"]').click();

    const toast = page.locator('.toast-notification, [class*="toast"]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/position/i);
  });
});
