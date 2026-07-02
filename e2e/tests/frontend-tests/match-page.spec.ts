import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';

// Unique names/numbers to avoid collision with other test suites
const CREW_NAME  = '__E2E_Match_Crew__';
// Three players that will be added to the crew
const P1 = '__E2E_Match_P1__';
const P2 = '__E2E_Match_P2__';
const P3 = '__E2E_Match_P3__';
// Three players that remain outside the crew (used to verify crew filter)
const P4 = '__E2E_Match_P4__';
const P5 = '__E2E_Match_P5__';
const P6 = '__E2E_Match_P6__';
const CREW_PLAYER_NAMES = [P1, P2, P3];

// Minimal valid player body — all stats required by the backend
const basePlayer = (name: string, jerseyNumber: number) => ({
  name,
  jerseyNumber,
  preferredPosition: 'CM',
  marketValue: 50000,
  offensiveOverall: 70, defensiveOverall: 65, athleticismOverall: 72,
  dribbling: 70, shotAccuracy: 68, shotSpeed: 65, headers: 60,
  shortPass: 75, longPass: 72, ballControl: 70, positioning: 68, vision: 66,
  tackling: 60, interceptions: 62, marking: 58, defensiveIQ: 64,
  speed: 73, strength: 68, stamina: 70,
});

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

// Navigates to /match and clicks Apply Formation, transitioning the page to
// pitch mode. Used as setup for all pitch-mode-specific tests.
async function goToPitchMode(page: Page) {
  await page.goto('/match');
  await page.waitForLoadState('networkidle');
  // Wait for player chips to appear — they are rendered only after PlayerContext
  // loads the player list from the API
  await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.match-apply-btn').click();
  // Wait for the Team A roster to appear as confirmation that pitch mode is active
  await page.locator('.match-team-roster--a').waitFor({ state: 'visible', timeout: 5000 });
}

test.describe('MatchPage — frontend', () => {
  test.describe.configure({ mode: 'serial' });

  let token = '';
  let crewId = '';
  // Maps player name → MongoDB _id for teardown
  const playerIds: Record<string, string> = {};

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };

    // Create 6 test players — 3 for the crew (P1-P3), 3 outside (P4-P6)
    // Jersey numbers 96-101 to avoid collision with other suites
    const specs = [
      [P1, 96], [P2, 97], [P3, 98],
      [P4, 99], [P5, 100], [P6, 101],
    ] as const;
    for (const [name, jersey] of specs) {
      const res = await api.post(`${API}/players`, { data: basePlayer(name, jersey), headers: h });
      playerIds[name] = (await res.json())._id;
    }

    // Create the crew and add P1-P3 to it
    const cRes = await api.post(`${API}/crews`, { data: { name: CREW_NAME }, headers: h });
    crewId = (await cRes.json())._id;
    for (const name of CREW_PLAYER_NAMES) {
      await api.post(`${API}/crews/${crewId}/players/${playerIds[name]}`, { headers: h });
    }

    await api.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };
    if (crewId) await api.delete(`${API}/crews/${crewId}`, { headers: h });
    for (const id of Object.values(playerIds)) {
      await api.delete(`${API}/players/${id}`, { headers: h });
    }
    await api.dispose();
  });

  // ── Route protection ──────────────────────────────────────────────────────────

  test('redirects to /login when not authenticated', async ({ browser }) => {
    // Empty context = no saved session = logged-out visitor
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/match');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  // ── Page structure ────────────────────────────────────────────────────────────

  test('shows "Match Lineup" heading and the Formation Builder card', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.match-page-title')).toHaveText('Match Lineup');
    // Formation Builder card is always visible regardless of mode
    await expect(page.locator('.match-settings-card--builder')).toBeVisible();
    await expect(page.locator('.match-settings-card__header')).toContainText('Formation Builder');
  });

  // ── Formation Builder selects ─────────────────────────────────────────────────

  test('Formation Builder has Crew, Player Count, Team A and Team B formation selects', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');

    // Helper: locate a setting group by its label text, then get the select inside it
    const settingSelect = (labelText: string) =>
      page.locator('.match-setting-group', {
        has: page.locator('.match-setting-label', { hasText: labelText }),
      }).locator('select');

    await expect(settingSelect('Crew')).toBeVisible();
    await expect(settingSelect('Number of Players')).toBeVisible();
    await expect(settingSelect('Team A Formation')).toBeVisible();
    await expect(settingSelect('Team B Formation')).toBeVisible();
  });

  test('Crew select defaults to "All Players"', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');

    const crewSelect = page.locator('.match-setting-group', {
      has: page.locator('.match-setting-label', { hasText: 'Crew' }),
    }).locator('select');

    // Empty value = "All Players" option
    await expect(crewSelect).toHaveValue('');
    await expect(crewSelect.locator('option[value=""]')).toHaveText('All Players');
  });

  test('Crew select lists the test crew as an option', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle'); // wait for crews API call to complete

    const crewSelect = page.locator('.match-setting-group', {
      has: page.locator('.match-setting-label', { hasText: 'Crew' }),
    }).locator('select');

    // Option text is crew name uppercased + player count, e.g. "__E2E_MATCH_CREW__ (3)"
    await expect(crewSelect.locator('option', { hasText: CREW_NAME.toUpperCase() })).toHaveCount(1);
  });

  // ── Player chip sidebar ────────────────────────────────────────────────────────

  test('test player names appear as chips in the sidebar', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });

    // All 6 test players should appear in the "All Players" pool
    for (const name of [P1, P2, P3, P4, P5, P6]) {
      await expect(page.locator('.crew-chip', { hasText: name })).toBeVisible();
    }
  });

  test('all chips start selected by default', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });

    // Every test player's chip must carry the selected class on page load
    for (const name of [P1, P2, P3, P4, P5, P6]) {
      await expect(page.locator('.crew-chip', { hasText: name })).toHaveClass(/crew-chip--selected/);
    }
  });

  test('selecting the test crew shows only its 3 players as chips', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });

    const crewSelect = page.locator('.match-setting-group', {
      has: page.locator('.match-setting-label', { hasText: 'Crew' }),
    }).locator('select');
    await crewSelect.selectOption(crewId);

    // After filtering, only the 3 crew players appear as chips
    await expect(page.locator('.crew-chip', { hasText: P1 })).toBeVisible();
    await expect(page.locator('.crew-chip', { hasText: P2 })).toBeVisible();
    await expect(page.locator('.crew-chip', { hasText: P3 })).toBeVisible();
    // Players outside the crew must not appear
    await expect(page.locator('.crew-chip', { hasText: P4 })).toHaveCount(0);
    await expect(page.locator('.crew-chip', { hasText: P5 })).toHaveCount(0);
    await expect(page.locator('.crew-chip', { hasText: P6 })).toHaveCount(0);
  });

  // ── None / All buttons ────────────────────────────────────────────────────────

  test('"None" deselects all chips and disables Apply Formation', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.getByRole('button', { name: 'None' }).click();

    // No chip should carry the selected class
    await expect(page.locator('.crew-chip--selected')).toHaveCount(0);
    // Apply Formation is disabled when there are no active players (leftPlayers.length === 0)
    await expect(page.locator('.match-apply-btn')).toBeDisabled();
  });

  test('"All" after "None" reselects chips and re-enables Apply Formation', async ({ page }) => {
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await page.locator('.crew-chip').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.getByRole('button', { name: 'None' }).click();
    await expect(page.locator('.crew-chip--selected')).toHaveCount(0);

    await page.getByRole('button', { name: 'All' }).click();

    // Test players must be selected again
    for (const name of [P1, P2, P3, P4, P5, P6]) {
      await expect(page.locator('.crew-chip', { hasText: name })).toHaveClass(/crew-chip--selected/);
    }
    // Apply Formation re-enabled
    await expect(page.locator('.match-apply-btn')).not.toBeDisabled();
  });

  // ── Pitch mode (after Apply Formation) ───────────────────────────────────────

  test('Apply Formation transitions the page to pitch mode', async ({ page }) => {
    await goToPitchMode(page);

    // The pitch placeholder ("Pick formations and click…") must be gone
    await expect(page.locator('.match-pitch-placeholder')).toHaveCount(0);
    // Both team roster panels must appear
    await expect(page.locator('.match-team-roster--a')).toBeVisible();
    await expect(page.locator('.match-team-roster--b')).toBeVisible();
  });

  test('Crew select is disabled once pitch mode is active', async ({ page }) => {
    await goToPitchMode(page);

    const crewSelect = page.locator('.match-setting-group', {
      has: page.locator('.match-setting-label', { hasText: 'Crew' }),
    }).locator('select');

    // pitchMode = true → disabled prop added to the crew select
    await expect(crewSelect).toBeDisabled();
  });

  test('Number of Players select is disabled once pitch mode is active', async ({ page }) => {
    await goToPitchMode(page);

    const countSelect = page.locator('.match-setting-group', {
      has: page.locator('.match-setting-label', { hasText: 'Number of Players' }),
    }).locator('select');

    await expect(countSelect).toBeDisabled();
  });

  test('Save and ANNOUNCE MATCH buttons appear only in pitch mode', async ({ page }) => {
    // Verify they are NOT present in setup mode
    await page.goto('/match');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.fp-btn--save')).toHaveCount(0);
    await expect(page.locator('.fp-btn--accent')).toHaveCount(0);

    // Now enter pitch mode and verify they appear
    await goToPitchMode(page);
    await expect(page.locator('.fp-btn--save')).toBeVisible();
    await expect(page.locator('.fp-btn--accent')).toContainText('ANNOUNCE MATCH');
  });

  test('team rosters list test player names after Apply Formation', async ({ page }) => {
    await goToPitchMode(page);

    // All 6 test players must appear somewhere in Team A or Team B rosters
    const allRosterNames = await page.locator('.match-team-roster__name').allTextContents();
    for (const name of [P1, P2, P3, P4, P5, P6]) {
      expect(allRosterNames.some(n => n.includes(name))).toBe(true);
    }
  });

  // ── Bench ─────────────────────────────────────────────────────────────────────

  test('bench panel shows "No players on bench" initially in pitch mode', async ({ page }) => {
    await goToPitchMode(page);
    await expect(page.locator('.match-bench-empty')).toHaveText('No players on bench');
  });

  test('sending a player to bench adds them to the bench panel', async ({ page }) => {
    await goToPitchMode(page);

    // Grab the name of the first player in Team A's roster
    const firstName = await page.locator('.match-team-roster--a .match-team-roster__name').first().textContent();
    expect(firstName).toBeTruthy();

    // Click the bench button ("send to bench") for that first player
    await page.locator('.match-team-roster--a .match-team-roster__bench').first().click();

    // Player must appear in the bench panel
    await expect(page.locator('.match-bench-name', { hasText: firstName! })).toBeVisible();
    // Bench count badge must be visible with "1"
    await expect(page.locator('.match-bench-count')).toHaveText('1');
  });

  test('adding a benched player to Team A removes them from the bench panel', async ({ page }) => {
    await goToPitchMode(page);

    // Send the first Team A player to the bench
    await page.locator('.match-team-roster--a .match-team-roster__bench').first().click();
    await expect(page.locator('.match-bench-count')).toHaveText('1');

    // Click "A" to add the benched player back to Team A
    await page.locator('.match-bench-btn--a').first().click();

    // Bench must be empty again
    await expect(page.locator('.match-bench-empty')).toBeVisible();
    await expect(page.locator('.match-bench-count')).toHaveCount(0);
  });
});
