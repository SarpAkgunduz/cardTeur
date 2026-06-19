import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';
const TEST_PLAYER_NAME = '__E2E_PreviewPlayer__';
const TEST_CREW_NAME = '__E2E_PreviewCrew__';

const TEST_PLAYER_DATA = {
  name: TEST_PLAYER_NAME,
  jerseyNumber: 88,
  preferredPosition: 'CM',
  marketValue: 50000,
  offensiveOverall: 70,
  defensiveOverall: 65,
  athleticismOverall: 72,
  dribbling: 70, shotAccuracy: 68, shotSpeed: 65, headers: 60,
  shortPass: 75, longPass: 72, ballControl: 70, positioning: 68, vision: 66,
  tackling: 60, interceptions: 62, marking: 58, defensiveIQ: 64,
  speed: 73, strength: 68, stamina: 70,
};

async function captureAuthToken(page: Page): Promise<string> {
  let token = '';
  const handler = (req: Request) => {
    const auth = req.headers()['authorization'];
    if (auth?.startsWith('Bearer ') && !token) token = auth.slice(7);
  };
  page.on('request', handler);
  await page.goto('/manage');
  await page.waitForLoadState('networkidle');
  page.off('request', handler);
  return token;
}

test.describe('PreviewPage — frontend', () => {
  let token = '';
  let playerId = '';
  let crewId = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const apiCtx = await (await import('@playwright/test')).request.newContext();

    const playerRes = await apiCtx.post(`${API}/players`, {
      data: TEST_PLAYER_DATA,
      headers: { Authorization: `Bearer ${token}` },
    });
    playerId = (await playerRes.json())._id;

    const crewRes = await apiCtx.post(`${API}/crews`, {
      data: { name: TEST_CREW_NAME },
      headers: { Authorization: `Bearer ${token}` },
    });
    crewId = (await crewRes.json())._id;

    await apiCtx.post(`${API}/crews/${crewId}/players/${playerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await apiCtx.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const apiCtx = await (await import('@playwright/test')).request.newContext();
    if (crewId) await apiCtx.delete(`${API}/crews/${crewId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (playerId) await apiCtx.delete(`${API}/players/${playerId}`, { headers: { Authorization: `Bearer ${token}` } });
    await apiCtx.dispose();
  });

  // ── 1. Route protection ─────────────────────────────────────────────────────
  test('redirects to /login when not authenticated', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/preview');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  // ── 2. Page structure ───────────────────────────────────────────────────────
  test('shows Player Roster heading and crew filter dropdown', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.page-title')).toContainText('Player Roster');
    await expect(page.locator('#previewCrewFilter')).toBeVisible();
  });

  // ── 3. Crew filter contains test crew ───────────────────────────────────────
  test('crew filter dropdown lists the test crew', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    const option = page.locator('#previewCrewFilter option', { hasText: TEST_CREW_NAME });
    await expect(option).toHaveCount(1);
  });

  // ── 4. Filter by crew ───────────────────────────────────────────────────────
  test('selecting a crew shows only that crew\'s players', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewId);
    await expect(page.locator('.ct-player-card__name', { hasText: TEST_PLAYER_NAME })).toBeVisible();
  });

  // ── 5. Correct position group ───────────────────────────────────────────────
  test('CM player appears under the Midfielders section when crew is selected', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewId);

    const midSection = page.locator('.preview-section', {
      has: page.locator('.preview-section__label', { hasText: 'Midfielders' }),
    });
    await expect(midSection).toBeVisible();
    await expect(midSection.locator('.ct-player-card__name', { hasText: TEST_PLAYER_NAME })).toBeVisible();
  });

  // ── 6. All Players includes the test player ─────────────────────────────────
  test('selecting All Players still shows the test player', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', '');
    await expect(page.locator('.ct-player-card__name', { hasText: TEST_PLAYER_NAME })).toBeVisible();
  });

  // ── 7. Position section count ───────────────────────────────────────────────
  test('Midfielders section count badge matches the number of cards', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewId);

    const midSection = page.locator('.preview-section', {
      has: page.locator('.preview-section__label', { hasText: 'Midfielders' }),
    });
    const countBadge = midSection.locator('.preview-section__count');
    const cardCount = await midSection.locator('.ct-player-card__name').count();
    await expect(countBadge).toHaveText(String(cardCount));
  });
});
