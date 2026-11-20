import { expect, test } from '@playwright/test';

test('switches between Learn and Practice, opens an Exercise and returns through the Lesson link', async ({
  page,
}) => {
  await page.goto('/en');
  const modes = page.getByRole('navigation', { name: 'Mode' });
  await expect(modes.getByRole('link', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
  await expect(modes.getByRole('link', { name: 'Practice' })).not.toHaveAttribute('aria-current');

  await modes.getByRole('link', { name: 'Practice' }).click();
  await expect(page).toHaveURL(/\/en\/practice$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Practice' })).toBeVisible();
  await expect(modes.getByRole('link', { name: 'Practice' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(modes.getByRole('link', { name: 'Learn' })).not.toHaveAttribute('aria-current');

  await page.getByRole('link', { name: 'Linked lists Available' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/foundations\/linked-lists$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Run the hunt backwards' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Back to the Lesson' }).click();
  await expect(page).toHaveURL(/\/en\/foundations\/linked-lists\/1$/);
  await expect(modes.getByRole('link', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
});

test('opens the Practice detail from the Practice this link on the last Step', async ({ page }) => {
  await page.goto('/en/foundations/linked-lists/13');
  await page.getByRole('link', { name: 'Practice this' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/foundations\/linked-lists$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Run the hunt backwards' }),
  ).toBeVisible();
});

test('sends an unknown Practice detail to the Practice page', async ({ page }) => {
  await page.goto('/en/practice/foundations/nope');
  await expect(page).toHaveURL(/\/en\/practice$/);
});
