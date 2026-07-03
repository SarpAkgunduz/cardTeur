import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';
const PLAYER_IN_CREW = '__E2E_CD_PlayerIn__';
const PLAYER_AVAILABLE = '__E2E_CD_PlayerAvail__';
const CREW_NAME = '__E2E_CD_Crew__';

const BASE_PLAYER = {
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

test.describe('CrewPage — Add Player dropdown & crew-picker', () => {
  let token = '';
  let playerInId = '';
  let playerAvailId = '';
  let crewId = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };

    const pIn = await api.post(`${API}/players`, {
      data: { ...BASE_PLAYER, name: PLAYER_IN_CREW, jerseyNumber: 94 },
      headers: h,
    });
    playerInId = (await pIn.json())._id;

    const pAvail = await api.post(`${API}/players`, {
      data: { ...BASE_PLAYER, name: PLAYER_AVAILABLE, jerseyNumber: 95 },
      headers: h,
    });
    playerAvailId = (await pAvail.json())._id;

    const cRes = await api.post(`${API}/crews`, { data: { name: CREW_NAME }, headers: h });
    crewId = (await cRes.json())._id;

    await api.post(`${API}/crews/${crewId}/players/${playerInId}`, { headers: h });
    await api.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };
    if (crewId) await api.delete(`${API}/crews/${crewId}`, { headers: h });
    if (playerInId) await api.delete(`${API}/players/${playerInId}`, { headers: h });
    if (playerAvailId) await api.delete(`${API}/players/${playerAvailId}`, { headers: h });
    await api.dispose();
  });

  // ── Add Player dropdown ──────────────────────────────────────────────────────

  test('clicking Add Player reveals the select dropdown', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();
    await expect(crewCard.locator('.crew-card__player-select select')).toBeVisible();
  });

  test('dropdown first option is the disabled placeholder', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();

    const placeholder = crewCard.locator('.crew-card__player-select select option[value=""]');
    await expect(placeholder).toHaveText('Select a player…');
    await expect(placeholder).toBeDisabled();
  });

  test('dropdown excludes players already in the crew', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();

    const select = crewCard.locator('.crew-card__player-select select');
    const options = await select.locator('option').allTextContents();

    expect(options.some(o => o.includes(PLAYER_IN_CREW))).toBe(false);
  });

  test('dropdown includes players not yet in the crew', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();

    const select = crewCard.locator('.crew-card__player-select select');
    const options = await select.locator('option').allTextContents();

    expect(options.some(o => o.includes(PLAYER_AVAILABLE))).toBe(true);
  });

  test('cancel button closes the dropdown without adding a player', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const crewCard = page.locator('.crew-card', {
      has: page.locator('.crew-card__name', { hasText: CREW_NAME }),
    });
    await crewCard.locator('.crew-card__add-player-btn').click();
    await expect(crewCard.locator('.crew-card__player-select select')).toBeVisible();

    await crewCard.locator('.crew-card__player-select .crew-edit-btn--cancel').click();
    await expect(crewCard.locator('.crew-card__player-select')).toHaveCount(0);
    await expect(crewCard.locator('.crew-card__add-player-btn')).toBeVisible();
  });

  // ── Right-panel crew-picker ──────────────────────────────────────────────────

  test('clicking a player row in the right panel reveals the crew-picker', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const playerSection = page.locator('.crew-email-section', {
      has: page.locator('.crew-email-row__name', { hasText: PLAYER_AVAILABLE }),
    });
    await playerSection.locator('.crew-email-row').click();
    await expect(playerSection.locator('.crew-picker')).toBeVisible();
  });

  test('crew-picker button is disabled for player already in that crew', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const playerSection = page.locator('.crew-email-section', {
      has: page.locator('.crew-email-row__name', { hasText: PLAYER_IN_CREW }),
    });
    await playerSection.locator('.crew-email-row').click();

    const crewBtn = playerSection.locator('.crew-picker__item', { hasText: CREW_NAME });
    await expect(crewBtn).toBeDisabled();
    await expect(crewBtn).toHaveClass(/crew-picker__item--in/);
  });

  test('crew-picker button is enabled for player not in that crew', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const playerSection = page.locator('.crew-email-section', {
      has: page.locator('.crew-email-row__name', { hasText: PLAYER_AVAILABLE }),
    });
    await playerSection.locator('.crew-email-row').click();

    const crewBtn = playerSection.locator('.crew-picker__item', { hasText: CREW_NAME });
    await expect(crewBtn).not.toBeDisabled();
    await expect(crewBtn).not.toHaveClass(/crew-picker__item--in/);
  });

  test('clicking the same player row again closes the crew-picker', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    const playerSection = page.locator('.crew-email-section', {
      has: page.locator('.crew-email-row__name', { hasText: PLAYER_AVAILABLE }),
    });
    await playerSection.locator('.crew-email-row').click();
    await expect(playerSection.locator('.crew-picker')).toBeVisible();

    await playerSection.locator('.crew-email-row').click();
    await expect(playerSection.locator('.crew-picker')).toHaveCount(0);
  });
});
