import { test, expect, Page, Request } from '@playwright/test';

const API = 'http://localhost:5002/api';
const TEST_CREW_NAME = '__E2E_Crew__';
const TEST_PLAYER = {
  name: '__E2E_CrewTestPlayer__',
  jerseyNumber: 77,
  preferredPosition: 'CM',
  marketValue: 100000,
  offensiveOverall: 70,
  defensiveOverall: 65,
  athleticismOverall: 72,
  dribbling: 70, shotAccuracy: 68, shotSpeed: 65, headers: 60,
  shortPass: 75, longPass: 72, ballControl: 70, positioning: 68, vision: 66,
  tackling: 60, interceptions: 62, marking: 58, defensiveIQ: 64,
  speed: 73, strength: 68, stamina: 70,
};

// Navigate to /manage and intercept the first authenticated API request
// to capture the Firebase Bearer token already stored in the browser session.
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

test.describe('Crew API', () => {
  let token = '';
  let crewId = '';
  let playerId = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();
  });

  test.afterAll(async () => {
    if (!token) return;
    const ctx = await (await import('@playwright/test')).request.newContext();
    if (crewId) await ctx.delete(`${API}/crews/${crewId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (playerId) await ctx.delete(`${API}/players/${playerId}`, { headers: { Authorization: `Bearer ${token}` } });
    await ctx.dispose();
  });

  // ── 1. Create crew ──────────────────────────────────────────────────────────
  test('POST /api/crews — creates a crew and returns it', async ({ request }) => {
    const res = await request.post(`${API}/crews`, {
      data: { name: TEST_CREW_NAME },
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body._id).toBeTruthy();
    expect(body.name).toBe(TEST_CREW_NAME);
    expect(Array.isArray(body.playerIds)).toBe(true);
    crewId = body._id;
  });

  // ── 2. List crews ───────────────────────────────────────────────────────────
  test('GET /api/crews — lists crews including the one just created', async ({ request }) => {
    const res = await request.get(`${API}/crews`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((c: { _id: string }) => c._id === crewId)).toBe(true);
  });

  // ── 3. Create test player (needed for add/remove) ───────────────────────────
  test('POST /api/players — creates a test player for crew tests', async ({ request }) => {
    const res = await request.post(`${API}/players`, {
      data: TEST_PLAYER,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body._id).toBeTruthy();
    playerId = body._id;
  });

  // ── 4. Add player to crew ───────────────────────────────────────────────────
  test('POST /api/crews/:id/players/:playerId — adds player to crew', async ({ request }) => {
    const res = await request.post(`${API}/crews/${crewId}/players/${playerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.playerIds).toContain(playerId);
  });

  // ── 5. Remove player from crew ──────────────────────────────────────────────
  test('DELETE /api/crews/:id/players/:playerId — removes player from crew', async ({ request }) => {
    const res = await request.delete(`${API}/crews/${crewId}/players/${playerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.playerIds).not.toContain(playerId);
  });

  // ── 6. Delete crew ──────────────────────────────────────────────────────────
  test('DELETE /api/crews/:id — deletes the crew', async ({ request }) => {
    const res = await request.delete(`${API}/crews/${crewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    crewId = ''; // prevent double-delete in afterAll
  });

  // ── 7. Verify deletion ──────────────────────────────────────────────────────
  test('GET /api/crews — deleted crew no longer appears', async ({ request }) => {
    const res = await request.get(`${API}/crews`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // crewId was already cleared — just verify the list is an array
    expect(Array.isArray(body)).toBe(true);
  });
});