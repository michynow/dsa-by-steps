import { expect, test } from '@playwright/test';

test('opens the Course home and switches Locale', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: 'DSA by steps' })).toBeVisible();

  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page).toHaveURL(/\/pl$/);
  await expect(page.getByRole('heading', { level: 1, name: 'DSA krok po kroku' })).toBeVisible();

  await page.goto('/');
  await expect(page).toHaveURL(/\/pl$/);
});
