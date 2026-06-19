import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';
const TEST_CREW_NAME = '__E2E_UIcrew__';
const TEST_CREW_RENAMED = '__E2E_UIcrew_Renamed__';
const TEST_PLAYER_NAME = '__E2E_UICrewPlayer__';

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

test.describe('CrewPage — frontend', () => {
  test.describe.configure({ mode: 'serial' });

  let token = '';
  let playerId = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const apiCtx = await (await import('@playwright/test')).request.newContext();
    const res = await apiCtx.post(`${API}/players`, {
      data: {
        name: TEST_PLAYER_NAME,
        jerseyNumber: 89,
        preferredPosition: 'ST',
        marketValue: 60000,
        offensiveOverall: 75,
        defensiveOverall: 55,
        athleticismOverall: 78,
        dribbling: 72, shotAccuracy: 80, shotSpeed: 75, headers: 65,
        shortPass: 68, longPass: 60, ballControl: 74, positioning: 78, vision: 65,
        tackling: 45, interceptions: 50, marking: 48, defensiveIQ: 52,
        speed: 82, strength: 72, stamina: 75,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    playerId = (await res.json())._id;
    await apiCtx.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const apiCtx = await (await import('@playwright/test')).request.newContext();

    const crewsRes = await apiCtx.get(`${API}/crews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const crews: Array<{ _id: string; name: string }> = await crewsRes.json();
    for (const crew of crews) {
      if (crew.name === TEST_CREW_NAME || crew.name === TEST_CREW_RENAMED) {
        await apiCtx.delete(`${API}/crews/${crew._id}`, { headers: { Authorization: `Bearer ${token}` } });
      }
    }

    if (playerId) {
      await apiCtx.delete(`${API}/players/${playerId}`, { headers: { Authorization: `Bearer ${token}` } });
    }
    await apiCtx.dispose();
  });

  // ── 1. Route protection ─────────────────────────────────────────────────────
  test('redirects to /login when not authenticated', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/crew');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  // ── 2. Page structure ───────────────────────────────────────────────────────
  test('shows Crews heading, New Crew button and both tabs', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.page-title')).toContainText('Crews');
    await expect(page.getByRole('button', { name: /new crew/i })).toBeVisible();
    await expect(page.locator('.crew-tab', { hasText: 'Crews' })).toBeVisible();
    await expect(page.locator('.crew-tab', { hasText: 'Permissions' })).toBeVisible();
  });

  // ── 3. Create crew ──────────────────────────────────────────────────────────
  test('can create a crew via the New Crew button', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new crew/i }).click();
    await page.locator('.crew-create-bar input').fill(TEST_CREW_NAME);
    await page.locator('.crew-create-bar input').press('Enter');
    await expect(page.locator('.crew-card__name', { hasText: TEST_CREW_NAME })).toBeVisible({ timeout: 5000 });
  });

  // ── 4. Crew appears under MY CREWS ─────────────────────────────────────────
  test('newly created crew appears under MY CREWS section', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.crew-section-label', { hasText: 'MY CREWS' })).toBeVisible();
    await expect(page.locator('.crew-card__name', { hasText: TEST_CREW_NAME })).toBeVisible();
  });

  // ── 5. Add player to crew ───────────────────────────────────────────────────
  test('can add a player to the crew via the Add Player dropdown', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: TEST_CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();
    await crewCard.locator('select').selectOption({ label: new RegExp(TEST_PLAYER_NAME) });

    await expect(
      crewCard.locator('.crew-member-row__name', { hasText: TEST_PLAYER_NAME })
    ).toBeVisible({ timeout: 5000 });
  });

  // ── 6. Remove player from crew ──────────────────────────────────────────────
  test('can remove a player from the crew', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: TEST_CREW_NAME }),
    });
    await crewCard.locator('.crew-member-row__remove').first().click();
    await expect(
      crewCard.locator('.crew-member-row__name', { hasText: TEST_PLAYER_NAME })
    ).toHaveCount(0, { timeout: 5000 });
  });

  // ── 7. Rename crew ──────────────────────────────────────────────────────────
  test('can rename a crew via the pencil button', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: TEST_CREW_NAME }),
    });
    await crewCard.locator('button[title="Rename"]').click();
    await crewCard.locator('.crew-card__rename-input').fill(TEST_CREW_RENAMED);
    await crewCard.locator('.crew-card__rename-input').press('Enter');

    await expect(page.locator('.crew-card__name', { hasText: TEST_CREW_RENAMED })).toBeVisible({ timeout: 5000 });
  });

  // ── 8. Rename: Escape cancels ───────────────────────────────────────────────
  test('pressing Escape while renaming cancels the edit', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: TEST_CREW_RENAMED }),
    });
    await crewCard.locator('button[title="Rename"]').click();
    await crewCard.locator('.crew-card__rename-input').fill('should-not-save');
    await crewCard.locator('.crew-card__rename-input').press('Escape');

    await expect(page.locator('.crew-card__name', { hasText: TEST_CREW_RENAMED })).toBeVisible();
    await expect(page.locator('.crew-card__name', { hasText: 'should-not-save' })).toHaveCount(0);
  });

  // ── 9. Delete crew ──────────────────────────────────────────────────────────
  test('can delete a crew via the trash button', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: TEST_CREW_RENAMED }),
    });
    await crewCard.locator('button[title="Delete crew"]').click();
    await expect(page.locator('.crew-card__name', { hasText: TEST_CREW_RENAMED })).toHaveCount(0, { timeout: 5000 });
  });

  // ── 10. Permissions tab ─────────────────────────────────────────────────────
  test('switching to Permissions tab shows the permissions panel', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-tab', { hasText: 'Permissions' }).click();
    await expect(page.locator('.crew-permissions')).toBeVisible();
  });

  // ── 11. Tab switching back ──────────────────────────────────────────────────
  test('switching back to Crews tab shows the crews panel', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-tab', { hasText: 'Permissions' }).click();
    await page.locator('.crew-tab', { hasText: 'Crews' }).click();
    await expect(page.locator('.crew-page')).toBeVisible();
  });
});
