import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';
const PLAYER_A = '__E2E_PF_PlayerA__';
const CREW_FULL = '__E2E_PF_CrewFull__';
const CREW_EMPTY = '__E2E_PF_CrewEmpty__';

const BASE_PLAYER = {
  jerseyNumber: 93,
  preferredPosition: 'CM',
  marketValue: 50000,
  offensiveOverall: 70, defensiveOverall: 65, athleticismOverall: 72,
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

test.describe('PreviewPage — #previewCrewFilter dropdown', () => {
  let token = '';
  let playerAId = '';
  let crewFullId = '';
  let crewEmptyId = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };

    const pRes = await api.post(`${API}/players`, { data: { ...BASE_PLAYER, name: PLAYER_A }, headers: h });
    playerAId = (await pRes.json())._id;

    const cFull = await api.post(`${API}/crews`, { data: { name: CREW_FULL }, headers: h });
    crewFullId = (await cFull.json())._id;

    const cEmpty = await api.post(`${API}/crews`, { data: { name: CREW_EMPTY }, headers: h });
    crewEmptyId = (await cEmpty.json())._id;

    await api.post(`${API}/crews/${crewFullId}/players/${playerAId}`, { headers: h });
    await api.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };
    if (crewFullId) await api.delete(`${API}/crews/${crewFullId}`, { headers: h });
    if (crewEmptyId) await api.delete(`${API}/crews/${crewEmptyId}`, { headers: h });
    if (playerAId) await api.delete(`${API}/players/${playerAId}`, { headers: h });
    await api.dispose();
  });

  // ── Dropdown visibility & options ────────────────────────────────────────────

  test('dropdown is visible and enabled when crews exist', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    const select = page.locator('#previewCrewFilter');
    await expect(select).toBeVisible();
    await expect(select).not.toBeDisabled();
  });

  test('dropdown lists both test crews as options', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#previewCrewFilter option', { hasText: CREW_FULL })).toHaveCount(1);
    await expect(page.locator('#previewCrewFilter option', { hasText: CREW_EMPTY })).toHaveCount(1);
  });

  test('crew option label shows player count in parentheses', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#previewCrewFilter option', { hasText: CREW_FULL })).toHaveText(`${CREW_FULL} (1)`);
    await expect(page.locator('#previewCrewFilter option', { hasText: CREW_EMPTY })).toHaveText(`${CREW_EMPTY} (0)`);
  });

  test('All Players option follows the "All Players (N)" format', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#previewCrewFilter option[value=""]')).toHaveText(/^All Players \(\d+\)$/);
  });

  // ── Filtering behaviour ──────────────────────────────────────────────────────

  test('selecting a crew shows only that crew\'s players', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewFullId);
    await expect(page.locator('.ct-player-card__name', { hasText: PLAYER_A })).toBeVisible();
  });

  test('selecting the empty crew shows "No players found."', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewEmptyId);
    await expect(page.locator('.empty-message')).toHaveText('No players found.');
  });

  test('switching back to All Players shows the test player again', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');
    await page.selectOption('#previewCrewFilter', crewEmptyId);
    await page.selectOption('#previewCrewFilter', '');
    await expect(page.locator('.ct-player-card__name', { hasText: PLAYER_A })).toBeVisible();
  });

  // ── Count badge consistency ──────────────────────────────────────────────────

  test('All Players option count matches the number of visible cards on page', async ({ page }) => {
    await page.goto('/preview');
    await page.waitForLoadState('networkidle');

    const labelText = await page.locator('#previewCrewFilter option[value=""]').textContent() ?? '';
    const match = labelText.match(/\((\d+)\)/);
    const labelCount = match ? parseInt(match[1], 10) : -1;

    const cardCount = await page.locator('.ct-player-card__name').count();
    expect(cardCount).toBe(labelCount);
  });
});
