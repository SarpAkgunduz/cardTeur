import { test, expect } from '@playwright/test';

const ANNOUNCE_URL = 'http://localhost:5001/api/match/announce';

const LEFT_TEAM_WITH_EMAIL = [
  { name: 'Sarp Akgündüz', email: 'test-recipient@example.com', preferredPosition: 'ST' },
  { name: 'Furkan İmaro', email: 'another-test@example.com', preferredPosition: 'CM' },
];

const RIGHT_TEAM_NO_EMAIL = [
  { name: 'Ruşen Besen', preferredPosition: 'GK' },
  { name: 'Emre Akkoç', preferredPosition: 'CB' },
];

const VALID_PAYLOAD = {
  location: 'Test Saha, İstanbul',
  date: '2026-04-25',
  time: '18:00',
  leftTeam: LEFT_TEAM_WITH_EMAIL,
  rightTeam: RIGHT_TEAM_NO_EMAIL,
};

test.describe('POST /api/match/announce', () => {

  test('returns 200 with sent/skipped counts for valid payload', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, { data: VALID_PAYLOAD });

    // The endpoint should respond 200 regardless of whether SMTP actually delivers
    // (SMTP failure throws 500 — if SMTP is not configured this test is expected to fail at network level)
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.sent)).toBe(true);
    expect(Array.isArray(body.skipped)).toBe(true);

    // 2 players have email → should be in sent list
    expect(body.sent.length).toBe(2);
    // 2 players have no email → should be in skipped list
    expect(body.skipped.length).toBe(2);
  });

  test('skips all players when none have an email address', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, {
      data: {
        ...VALID_PAYLOAD,
        leftTeam: [{ name: 'Oyuncu A', preferredPosition: 'ST' }],
        rightTeam: [{ name: 'Oyuncu B', preferredPosition: 'GK' }],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sent.length).toBe(0);
    expect(body.skipped.length).toBe(2);
  });

  test('returns 400 when location is missing', async ({ request }) => {
    const { location: _removed, ...withoutLocation } = VALID_PAYLOAD;
    const res = await request.post(ANNOUNCE_URL, { data: withoutLocation });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 400 when date is missing', async ({ request }) => {
    const { date: _removed, ...withoutDate } = VALID_PAYLOAD;
    const res = await request.post(ANNOUNCE_URL, { data: withoutDate });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when time is missing', async ({ request }) => {
    const { time: _removed, ...withoutTime } = VALID_PAYLOAD;
    const res = await request.post(ANNOUNCE_URL, { data: withoutTime });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when leftTeam is not an array', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, {
      data: { ...VALID_PAYLOAD, leftTeam: null },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when rightTeam is not an array', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, {
      data: { ...VALID_PAYLOAD, rightTeam: null },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when body is completely empty', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('handles empty teams gracefully — sent and skipped both 0', async ({ request }) => {
    const res = await request.post(ANNOUNCE_URL, {
      data: {
        location: 'Saha',
        date: '2026-05-01',
        time: '20:00',
        leftTeam: [],
        rightTeam: [],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sent.length).toBe(0);
    expect(body.skipped.length).toBe(0);
  });

});
