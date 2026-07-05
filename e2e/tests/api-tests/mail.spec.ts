import { test, expect } from '@playwright/test';

// The legacy unauthenticated /api/match/announce route was removed for security.
// Announcements now go through POST /api/matches/:id/announce (requireAuth).
const LEGACY_ANNOUNCE_URL = 'http://localhost:5002/api/match/announce';

test.describe('POST /api/match/announce (removed)', () => {

  test('legacy unauthenticated announce route no longer exists', async ({ request }) => {
    const res = await request.post(LEGACY_ANNOUNCE_URL, {
      data: {
        location: 'Test Saha',
        date: '2026-04-25',
        time: '18:00',
        leftTeam: [{ name: 'Player A', email: 'test@example.com', preferredPosition: 'ST' }],
        rightTeam: [{ name: 'Player B', preferredPosition: 'GK' }],
      },
    });
    expect(res.status()).toBe(404);
  });

});
