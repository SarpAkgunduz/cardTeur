import { expect, Page, test } from '@playwright/test';

type Tier = 'bronze' | 'silver' | 'gold';

const tierLabels: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

async function highestVisibleRandomNumber(page: Page, label: string) {
  const pattern = new RegExp(`^${label} Player (\\d+)$`, 'i');
  const names = await page.locator('.ct-player-card__name').allTextContents();
  return names.reduce((max, name) => {
    const match = name.trim().match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

async function generateTier(page: Page, tier: Tier) {
  await page.getByRole('button', { name: /generate random player/i }).click();
  await expect(page.getByRole('dialog', { name: /generate random player/i })).toBeVisible();
  await page.locator(`.random-tier-card--${tier}`).click();
}

test.describe('Random player generator', () => {
  test('uses highest visible tier number + 1, and starts at 1 when no player exists for that tier', async ({ page }) => {
    const generatedNames: string[] = [];

    await page.goto('/manage');
    await expect(page.getByRole('button', { name: /generate random player/i })).toBeVisible();

    try {
      for (const tier of ['bronze', 'silver', 'gold'] as Tier[]) {
        const label = tierLabels[tier];
        const nextNumber = await highestVisibleRandomNumber(page, label) + 1;
        const expectedName = `${label} Player ${nextNumber}`;

        generatedNames.push(expectedName);
        await generateTier(page, tier);

        await expect(page.locator('.ct-player-card__name', { hasText: expectedName })).toBeVisible();
      }
    } finally {
      if (generatedNames.length > 0) {
        await page.getByRole('button', { name: /delete player/i }).click();

        for (const name of generatedNames.reverse()) {
          const card = page.locator('.ct-player-card').filter({
            has: page.locator('.ct-player-card__name').filter({ hasText: new RegExp(`^${name}$`) }),
          }).last();

          if (await card.count() === 0) continue;

          await card.locator('button.btn-danger').click();
          await page.getByRole('button', { name: /confirm/i }).click();
          await expect(page.locator('.ct-player-card__name').filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(0);
        }
      }
    }
  });
});
