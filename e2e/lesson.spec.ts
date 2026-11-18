import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openFirstLesson(page: Page): Promise<number> {
  await page.goto('/en');
  const lessons = page.getByRole('main').getByRole('list').getByRole('link');
  test.skip(
    (await lessons.count()) === 0,
    'No Lesson is registered in src/content yet; run this spec after Lessons are merged',
  );
  await lessons.first().click();
  await expect(page).toHaveURL(/\/en\/[^/]+\/[^/]+\/1$/);
  return (await page.getByRole('navigation', { name: 'Steps' }).getByRole('link').count()) - 1;
}

test('steps through a Lesson, remembers seen Steps and keeps the Step on Locale switch', async ({
  page,
}) => {
  const stepCount = await openFirstLesson(page);
  const rail = page.getByRole('navigation', { name: 'Steps' });

  for (let step = 2; step <= stepCount; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(new RegExp(`/${String(step)}$`));
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/\/code$/);
  await expect(page.getByText('The Exercise arrives soon.')).toBeVisible();
  await expect(rail.getByRole('link', { name: /seen$/ })).toHaveCount(stepCount);

  await rail.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/1$/);
  for (let step = 2; step <= stepCount; step += 1) {
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/${String(step)}$`));
  }
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/code$/);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(new RegExp(`/${String(stepCount)}$`));

  const second = rail.getByRole('link').nth(Math.min(1, stepCount - 1));
  await second.click();
  const stepPath = new URL(page.url()).pathname.replace(/^\/en/, '');
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page).toHaveURL(new RegExp(`/pl${stepPath}$`));
  await expect(page.getByRole('navigation', { name: 'Kroki' })).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('navigation', { name: 'Kroki' }).getByRole('link', { name: /obejrzany$/ }),
  ).toHaveCount(stepCount - 1);
  await expect(
    page
      .getByRole('navigation', { name: 'Kroki' })
      .getByRole('link')
      .nth(Math.min(1, stepCount - 1)),
  ).toHaveAttribute('aria-current', 'step');

  await page.getByRole('navigation', { name: 'Kroki' }).getByRole('link').last().click();
  await expect(page).toHaveURL(/\/pl\/.*\/code$/);
  await expect(page.getByText('Ćwiczenie pojawi się wkrótce.')).toBeVisible();
});
