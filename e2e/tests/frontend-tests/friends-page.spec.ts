import { test, expect, Page, Request, Browser } from '@playwright/test';

const API = 'http://localhost:5002/api';

// Second Firebase test account — see api-tests/friends.spec.ts for setup instructions.
// Tests that rely on these skip automatically when the vars are not set.
const FRIEND_EMAIL = process.env.E2E_FRIEND_EMAIL ?? '';
const FRIEND_PASSWORD = process.env.E2E_FRIEND_PASSWORD ?? '';

// Reuses the saved global Firebase session to capture the main user's Bearer token.
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

// Logs in with arbitrary credentials in a fresh (empty) context and captures the token.
// Used to obtain the friend account's token without affecting the main session.
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
  await page.waitForURL('**/');
  await page.goto('/manage'); // Navigate somewhere that fires an authenticated API request
  await page.waitForLoadState('networkidle');
  page.off('request', handler);
  await ctx.close();
  return token;
}

test.describe('FriendsPage — frontend', () => {
  // Serial mode so the UI state built by one test (e.g. sending a request) is
  // visible in the next test (e.g. checking the Requests tab).
  test.describe.configure({ mode: 'serial' });

  let token = '';            // Main account's Firebase token
  let friendToken = '';      // Friend account's token (requires E2E_FRIEND_PASSWORD)
  let friendUid = '';        // Friend's MongoDB uid
  let friendDisplayName = ''; // Friend's display name — used to locate rows in the UI
  let mainUid = '';          // Main account's uid — needed when friend sends a request to main

  test.beforeAll(async ({ browser }) => {
    // Get main user's token from the saved session
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    token = await captureAuthToken(page);
    await ctx.close();

    const api = await (await import('@playwright/test')).request.newContext();

    // Fetch main user's uid — needed in the bidirectional acceptance test
    const meRes = await api.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    mainUid = (await meRes.json()).uid;

    if (!FRIEND_EMAIL || !FRIEND_PASSWORD) {
      await api.dispose();
      return; // Friend-dependent tests skip via test.skip() inside each test
    }

    // Log in as the friend to obtain their Firebase token
    friendToken = await loginAndCaptureToken(browser, FRIEND_EMAIL, FRIEND_PASSWORD);

    // Ensure friend exists in MongoDB. /register is idempotent — returns existing doc if present.
    const regRes = await api.post(`${API}/users/register`, {
      data: { displayName: 'E2E Friend' },
      headers: { Authorization: `Bearer ${friendToken}` },
    });
    const regData = await regRes.json();
    friendUid = regData.uid;
    friendDisplayName = regData.displayName;

    // Remove any leftover friendship or pending requests from a previous test run
    await api.delete(`${API}/users/friends/${friendUid}`, { headers: { Authorization: `Bearer ${token}` } });
    await api.delete(`${API}/users/friend-requests/${friendUid}`, { headers: { Authorization: `Bearer ${token}` } });

    await api.dispose();
  });

  test.afterAll(async () => {
    // Cleanup regardless of which tests ran — prevents dirty state for future runs
    if (!token || !friendUid) return;
    const api = await (await import('@playwright/test')).request.newContext();
    const h = { Authorization: `Bearer ${token}` };
    await api.delete(`${API}/users/friends/${friendUid}`, { headers: h });
    await api.delete(`${API}/users/friend-requests/${friendUid}`, { headers: h });
    await api.dispose();
  });

  // ── Route protection ──────────────────────────────────────────────────────────

  test('redirects to /login when not authenticated', async ({ browser }) => {
    // Use an empty context (no saved session) to simulate a logged-out visitor
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/friends');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  // ── Page structure ────────────────────────────────────────────────────────────

  test('shows Friends heading, invite section, and three tabs', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.friends-page__title')).toHaveText('Friends');
    // Invite section contains the user's invite link + copy/WhatsApp buttons
    await expect(page.locator('.friends-page__invite')).toBeVisible();
    // All three tab buttons must be present
    await expect(page.locator('.friends-page__tab', { hasText: 'My Friends' })).toBeVisible();
    await expect(page.locator('.friends-page__tab', { hasText: 'Requests' })).toBeVisible();
    await expect(page.locator('.friends-page__tab', { hasText: 'Add Friend' })).toBeVisible();
  });

  test('My Friends tab is active by default and shows the filter input', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    // Page opens on the My Friends tab; the active class marks the selected tab
    await expect(page.locator('.friends-page__tab--active')).toContainText('My Friends');
    // Filter input is rendered only when the My Friends tab is active
    await expect(page.locator('.friends-page__search-input')).toBeVisible();
  });

  // ── Add Friend tab: search behaviour ─────────────────────────────────────────

  test('Add Friend: invalid email shows "No user found" message', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await page.locator('.friends-page__tab', { hasText: 'Add Friend' }).click();
    // Type an email that definitely does not exist in the system
    await page.locator('.friends-page__search-input').fill('totally-invalid@nouser.example');
    await page.locator('.friends-page__add-search-btn').click();
    // Backend returns [] → frontend shows the "not found" message
    await expect(page.locator('.friends-page__add-notfound')).toBeVisible();
  });

  test('Add Friend: pressing Enter on the search input triggers search', async ({ page }) => {
    test.skip(!FRIEND_EMAIL || !friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await page.locator('.friends-page__tab', { hasText: 'Add Friend' }).click();
    await page.locator('.friends-page__search-input').fill(FRIEND_EMAIL);
    // The input has an onKeyDown handler that calls handleExactSearch on Enter
    await page.locator('.friends-page__search-input').press('Enter');
    await expect(page.locator('.friends-page__row--result')).toBeVisible();
    await expect(page.locator('.friends-page__row--result .friends-page__email')).toHaveText(FRIEND_EMAIL);
  });

  test('Add Friend: valid email shows result card with Add button', async ({ page }) => {
    test.skip(!FRIEND_EMAIL || !friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await page.locator('.friends-page__tab', { hasText: 'Add Friend' }).click();
    await page.locator('.friends-page__search-input').fill(FRIEND_EMAIL);
    await page.locator('.friends-page__add-search-btn').click();
    await expect(page.locator('.friends-page__row--result')).toBeVisible();
    await expect(page.locator('.friends-page__row--result .friends-page__email')).toHaveText(FRIEND_EMAIL);
    // Add button must be present (we are not yet friends)
    await expect(page.locator('.friends-page__action-btn--add')).toBeVisible();
  });

  // ── Send friend request via UI ────────────────────────────────────────────────

  test('Add Friend: clicking Add sends the request and clears the form', async ({ page }) => {
    test.skip(!FRIEND_EMAIL || !friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await page.locator('.friends-page__tab', { hasText: 'Add Friend' }).click();
    await page.locator('.friends-page__search-input').fill(FRIEND_EMAIL);
    await page.locator('.friends-page__add-search-btn').click();
    await expect(page.locator('.friends-page__row--result')).toBeVisible();
    await page.locator('.friends-page__action-btn--add').click();
    // After a successful request: result card is cleared and the input is reset
    await expect(page.locator('.friends-page__row--result')).toHaveCount(0);
    await expect(page.locator('.friends-page__search-input')).toHaveValue('');
  });

  // ── Requests tab ──────────────────────────────────────────────────────────────
  // Relies on the request being sent in the previous test (serial execution)

  test('Requests tab: sent request appears in "Sent requests" section', async ({ page }) => {
    test.skip(!friendUid, 'E2E_FRIEND_EMAIL / E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await page.locator('.friends-page__tab', { hasText: 'Requests' }).click();
    // The "Sent requests" section label must be visible
    await expect(
      page.locator('.friends-page__section-label', { hasText: 'Sent requests' })
    ).toBeVisible();
    // Friend's name appears in the outgoing list
    await expect(page.locator('.friends-page__name', { hasText: friendDisplayName })).toBeVisible();
    // A sent request shows a "Pending" badge, not an action button
    const friendRow = page.locator('.friends-page__row', {
      has: page.locator('.friends-page__name', { hasText: friendDisplayName }),
    });
    await expect(friendRow.locator('.friends-page__already-badge')).toHaveText('Pending');
  });

  // ── Mutual friendship & My Friends ───────────────────────────────────────────
  // The backend auto-accepts when both users have sent each other a request.
  // We set up mutual acceptance via a direct API call from the friend's token,
  // then navigate to the UI to verify the result.

  test('My Friends tab shows friend after mutual acceptance', async ({ page }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    const api = await (await import('@playwright/test')).request.newContext();
    // Friend sends a request to main → the backend sees that main already sent one
    // to friend (from the "Add" test), so it treats this as mutual acceptance.
    await api.post(`${API}/users/friends/${mainUid}`, {
      headers: { Authorization: `Bearer ${friendToken}` },
    });
    await api.dispose();

    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    // Should land on My Friends tab by default; friend must now be listed
    await expect(page.locator('.friends-page__tab--active')).toContainText('My Friends');
    await expect(page.locator('.friends-page__name', { hasText: friendDisplayName })).toBeVisible();
    // Count badge in the header should reflect at least one friend
    await expect(page.locator('.friends-page__count')).toContainText(/\d+ friends/);
  });

  test('My Friends filter: typing a name shows only matching entries', async ({ page }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    // Filter is client-side — no network request fired on each keystroke
    await page.locator('.friends-page__search-input').fill(friendDisplayName);
    await expect(page.locator('.friends-page__name', { hasText: friendDisplayName })).toBeVisible();
    // Every visible name element must match the filter text
    const allNames = await page.locator('.friends-page__name').allTextContents();
    for (const name of allNames) {
      expect(name.toLowerCase()).toContain(friendDisplayName.toLowerCase());
    }
  });

  // ── Remove friend ─────────────────────────────────────────────────────────────

  test('Remove friend: confirm dialog removes friend from the list', async ({ page }) => {
    test.skip(!friendToken, 'E2E_FRIEND_PASSWORD not set');
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');

    // Click the remove icon on the friend's row — this opens a ConfirmDialog modal
    const friendRow = page.locator('.friends-page__row', {
      has: page.locator('.friends-page__name', { hasText: friendDisplayName }),
    });
    await friendRow.locator('.friends-page__action-btn--remove').click();

    // ConfirmDialog renders a Bootstrap modal with a "Confirm" button (variant="danger")
    await page.getByRole('button', { name: 'Confirm' }).click();

    // After confirmation the DELETE /api/users/friends/:uid request fires;
    // the friend's row must disappear within the default timeout
    await expect(
      page.locator('.friends-page__name', { hasText: friendDisplayName })
    ).toHaveCount(0, { timeout: 5000 });
  });
});
