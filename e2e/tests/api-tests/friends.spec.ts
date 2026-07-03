import { test, expect, Page, Request, Browser } from '@playwright/test';

const API = 'http://localhost:5002/api';

// Second Firebase test account credentials.
// Create this account once in Firebase Console, log in to the app once so it
// registers in MongoDB, then set these env vars in your shell or .env.e2e:
//   E2E_FRIEND_EMAIL=friend@example.com
//   E2E_FRIEND_PASSWORD=somePassword
// Tests that depend on these vars skip automatically when they are not set.
const FRIEND_EMAIL = process.env.E2E_FRIEND_EMAIL ?? '';
const FRIEND_PASSWORD = process.env.E2E_FRIEND_PASSWORD ?? '';

// Reuses the saved Firebase session (auth-state.json from global-setup) by
// navigating to /manage, which triggers an authenticated API request.
// The handler intercepts the first Authorization: Bearer header it sees.
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

// Performs a full login as an arbitrary user in a fresh (unauthenticated)
// browser context, then captures their Firebase ID token the same way.
// Used to obtain the friend account's token without polluting the main session.
async function loginAndCaptureToken(browser: Browser, email: string, password: string): Promise<string> {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  let token = '';
  const handler = (req: Request) => {
    const auth = req.headers()['authorization'];
    if (auth?.startsWith('Bearer ') && !token) token = auth.slice(7);
  };
  page.on('request', handler);
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/'); // Wait for redirect to home after successful login
  await page.goto('/manage');   // Navigate somewhere that fires an API request
  await page.waitForLoadState('networkidle');
  page.off('request', handler);
  await ctx.close();
  return token;
}

test.describe('Friends API', () => {
  // Serial mode: tests share state (friendUid, request sent in one test checked in next)
  test.describe.configure({ mode: 'serial' });

  let token = '';       // Main test account's Firebase token
  let friendToken = ''; // Friend account's Firebase token (requires E2E_FRIEND_PASSWORD)
  let friendUid = '';   // Friend's MongoDB uid (derived via /register after login)
  let mainUid = '';     // Main account's uid (needed for bidirectional request setup)

  test.beforeAll(async ({ browser }) => {
    // Capture main user token using the saved global auth session
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const api = await (await import('@playwright/test')).request.newContext();

    // Fetch main user's uid — needed later to let the friend send a request back
    const meRes = await api.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    mainUid = (await meRes.json()).uid;

    if (!FRIEND_EMAIL || !FRIEND_PASSWORD) {
      await api.dispose();
      return; // Friend-dependent tests will be skipped via test.skip() in each case
    }

    // Log in as the friend and obtain their Firebase token
    friendToken = await loginAndCaptureToken(browser, FRIEND_EMAIL, FRIEND_PASSWORD);

    // POST /register ensures the friend exists in MongoDB.
    // If they already exist, the endpoint returns the existing document — safe to call repeatedly.
    const regRes = await api.post(`${API}/users/register`, {
      data: { displayName: 'E2E Friend' },
      headers: { Authorization: `Bearer ${friendToken}` },
    });
    friendUid = (await regRes.json()).uid;

    // Clean slate: remove any leftover friendship or pending requests from previous runs
    await api.delete(`${API}/users/friends/${friendUid}`, { headers: { Authorization: `Bearer ${token}` } });
    await api.delete(`${API}/users/friend-requests/${friendUid}`, { headers: { Authorization: `Bearer ${token}` } });

    await api.dispose();
  });

  test.afterAll(async () => {
    // Ensure no dangling friend relationship regardless of which tests ran
    if (!token || !friendUid) return;
    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };
    await api.delete(`${API}/users/friends/${friendUid}`, { headers: h });
    await api.delete(`${API}/users/friend-requests/${friendUid}`, { headers: h });
    await api.dispose();
  });

  // ── Search ────────────────────────────────────────────────────────────────────
  // GET /api/users/search?q= — exact uid or email match only (no fuzzy search)

  test('GET /api/users/search — empty query returns empty array', async ({ request }) => {
    const res = await request.get(`${API}/users/search?q=`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toEqual([]);
  });

  test('GET /api/users/search — nonexistent email returns empty array', async ({ request }) => {
    const res = await request.get(`${API}/users/search?q=no-such-user@fake.example`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toEqual([]);
  });

  test('GET /api/users/search — own email is excluded from results', async ({ request }) => {
    // Backend always excludes the caller: User.findOne({ uid: { $ne: uid }, ... })
    const meRes = await request.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    const { email } = await meRes.json();
    const res = await request.get(`${API}/users/search?q=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toEqual([]);
  });

  test('GET /api/users/search — finds friend by exact email', async ({ request }) => {
    test.skip(!FRIEND_EMAIL || !friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    const res = await request.get(`${API}/users/search?q=${encodeURIComponent(FRIEND_EMAIL)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].uid).toBe(friendUid);
    expect(body[0].email).toBe(FRIEND_EMAIL);
  });

  test('GET /api/users/search — finds friend by exact uid', async ({ request }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    const res = await request.get(`${API}/users/search?q=${encodeURIComponent(friendUid)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].uid).toBe(friendUid);
  });

  // ── Send & cancel friend request ──────────────────────────────────────────────
  // These tests run serially: send → verify outgoing → cancel → verify cleared

  test('POST /api/users/friends/:uid — sends a friend request', async ({ request }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    // Adds mainUid to friend's friendRequests array in MongoDB
    const res = await request.post(`${API}/users/friends/${friendUid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe('requested');
  });

  test('GET /api/users/friend-requests — sent request appears in outgoing', async ({ request }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    // "outgoing" = users who have the caller's uid in their own friendRequests array
    const res = await request.get(`${API}/users/friend-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const { outgoing } = await res.json();
    expect(outgoing.some((u: { uid: string }) => u.uid === friendUid)).toBe(true);
  });

  test('DELETE /api/users/friend-requests/:uid — cancels the sent request', async ({ request }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    // Removes mainUid from friend's friendRequests (bidirectional cleanup)
    const res = await request.delete(`${API}/users/friend-requests/${friendUid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).success).toBe(true);
  });

  test('GET /api/users/friend-requests — outgoing is empty after cancel', async ({ request }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    const res = await request.get(`${API}/users/friend-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { outgoing } = await res.json();
    expect(outgoing.some((u: { uid: string }) => u.uid === friendUid)).toBe(false);
  });

  // ── Bidirectional acceptance ──────────────────────────────────────────────────
  // The backend auto-accepts when both sides have sent a request:
  //   1. Friend sends request to main  → main.friendRequests = [friendUid]
  //   2. Main sends request to friend  → backend sees friendUid in main.friendRequests
  //                                    → treats it as mutual → status: 'accepted'

  test('bidirectional requests result in status "accepted"', async ({ request }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    // Step 1: friend sends request to main
    const fReq = await request.post(`${API}/users/friends/${mainUid}`, {
      headers: { Authorization: `Bearer ${friendToken}` },
    });
    expect((await fReq.json()).status).toBe('requested');

    // Step 2: main sends request to friend — backend detects cross-request, accepts mutually
    const mReq = await request.post(`${API}/users/friends/${friendUid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await mReq.json()).status).toBe('accepted');
  });

  test('GET /api/users/friends — friend appears after mutual acceptance', async ({ request }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    const res = await request.get(`${API}/users/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const friends = await res.json();
    expect(friends.some((f: { uid: string }) => f.uid === friendUid)).toBe(true);
  });

  test('DELETE /api/users/friends/:uid — removes the friend (bidirectional)', async ({ request }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    // Backend removes each from the other's friends array
    const res = await request.delete(`${API}/users/friends/${friendUid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).success).toBe(true);
  });

  test('GET /api/users/friends — friend is gone after removal', async ({ request }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    const res = await request.get(`${API}/users/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const friends = await res.json();
    expect(friends.some((f: { uid: string }) => f.uid === friendUid)).toBe(false);
  });
});
