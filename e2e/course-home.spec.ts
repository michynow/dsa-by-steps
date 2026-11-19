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

test('keeps the Locale when switching to Practice and back to Learn', async ({ page }) => {
  await page.goto('/pl');
  const modes = page.getByRole('navigation', { name: 'Tryb' });
  await modes.getByRole('link', { name: 'Ćwicz' }).click();
  await expect(page).toHaveURL(/\/pl\/practice$/);
  await modes.getByRole('link', { name: 'Ucz się' }).click();
  await expect(page).toHaveURL(/\/pl$/);
});
