import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    // Her testten önce localStorage'ı temizle (oturumu sıfırla)
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ── UI ──────────────────────────────────────────────────────────────────

  test('Login form visibility test', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Login');
  });

  // ── BAŞARILI GİRİŞLER ───────────────────────────────────────────────────

  test('admin login — redirects to homepage', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL('/');
  });

  test('user login — redirects to homepage', async ({ page }) => {
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('user123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL('/');
  });

  test('successful login sets localStorage session', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL('/');

    const session = await page.evaluate(() => {
      const raw = localStorage.getItem('openteur:auth:session');
      return raw ? JSON.parse(raw) : null;
    });

    expect(session).not.toBeNull();
    expect(session.value.isAuthenticated).toBe(true);
    expect(session.value.role).toBe('admin');
  });

  // ── FAILED LOGINS ─────────────────────────────────────────────────────

  test('incorrect password — shows error message', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('wrongPassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toHaveText('Invalid email or password.');
    await expect(page).toHaveURL('/login');
  });

  test('incorrect email — shows error message', async ({ page }) => {
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger')).toHaveText('Invalid email or password.');
    await expect(page).toHaveURL('/login');
  });

  test('empty email — shows error message', async ({ page }) => {
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger')).toHaveText('Please fill in all fields.');
    await expect(page).toHaveURL('/login');
  });

  test('empty password — shows error message', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger')).toHaveText('Please fill in all fields.');
    await expect(page).toHaveURL('/login');
  });

  test('both fields empty — shows error message', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger')).toHaveText('Please fill in all fields.');
    await expect(page).toHaveURL('/login');
  });

  // ── ROUTE PROTECTION ────────────────────────────────────────────────────────

  test('redirects to login when accessing protected route without authentication', async ({ page }) => {
    await page.goto('/edit');
    await expect(page).toHaveURL('/login');
  });

  test('redirects to homepage when accessing /login after login', async ({ page }) => {
    // First, log in successfully
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');

    // Try to access /login again
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

});
