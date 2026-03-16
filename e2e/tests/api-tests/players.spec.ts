import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api/players';

const TEST_PLAYER = {
  name: 'Playwright Test Oyuncu',
  jerseyNumber: 99,
  preferredPosition: 'ST',
  marketValue: 500000,
  cardImage: '/assets/sakgunduz.png',
  cardTitle: 'gold',
  offensiveOverall: 85,
  defensiveOverall: 60,
  athleticismOverall: 75,
  dribbling: 88,
  shotAccuracy: 84,
  shotSpeed: 82,
  headers: 70,
  shortPass: 80,
  longPass: 75,
  ballControl: 87,
  positioning: 85,
  vision: 83,
  tackling: 55,
  interceptions: 58,
  marking: 60,
  defensiveIQ: 62,
  speed: 80,
  strength: 72,
  stamina: 74,
};

test.describe('Player API', () => {

  test('POST /api/players — oyuncu oluşturur ve doğru veriyi döner', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: TEST_PLAYER,
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    // MongoDB _id atandı mı?
    expect(body._id).toBeTruthy();

    // Gönderilen veriler geri döndü mü?
    expect(body.name).toBe(TEST_PLAYER.name);
    expect(body.jerseyNumber).toBe(TEST_PLAYER.jerseyNumber);
    expect(body.preferredPosition).toBe(TEST_PLAYER.preferredPosition);
    expect(body.cardTitle).toBe(TEST_PLAYER.cardTitle);
    expect(body.offensiveOverall).toBe(TEST_PLAYER.offensiveOverall);
    expect(body.defensiveOverall).toBe(TEST_PLAYER.defensiveOverall);
    expect(body.athleticismOverall).toBe(TEST_PLAYER.athleticismOverall);

    // Temizlik — oluşturulan oyuncuyu sil
    const deleteResponse = await request.delete(`${API_URL}/${body._id}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('GET /api/players — tüm oyuncuları listeler', async ({ request }) => {
    const response = await request.get(API_URL);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST → GET → DELETE — tam yaşam döngüsü', async ({ request }) => {
    // Oluştur
    const createRes = await request.post(API_URL, { data: TEST_PLAYER });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    const id = created._id;
    expect(id).toBeTruthy();

    // ID ile getir
    const getRes = await request.get(`${API_URL}/${id}`);
    expect(getRes.ok()).toBeTruthy();
    const fetched = await getRes.json();
    expect(fetched.name).toBe(TEST_PLAYER.name);

    // Sil
    const deleteRes = await request.delete(`${API_URL}/${id}`);
    expect(deleteRes.ok()).toBeTruthy();

    // Silindiğini doğrula
    const afterDelete = await request.get(`${API_URL}/${id}`);
    expect(afterDelete.status()).toBe(404); // 404 = not ok, ok() false döner
  });

});
