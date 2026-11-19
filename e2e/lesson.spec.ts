import { expect, test } from '@playwright/test';
import { checkIds, firstStepTitle, lessonTitle, stepCount } from './lesson-content';

const passedChecks = Object.fromEntries(
  checkIds.map((id) => [`foundations/linked-lists/${id}`, { misses: 0, status: 'passed' }]),
);
const seededProgress = JSON.stringify({
  version: 1,
  stepsSeen: {},
  exercises: {},
  checks: passedChecks,
});

test('steps through the Linked lists Lesson, remembers seen Steps and keeps the Step on Locale switch', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(`
    if (window.localStorage.getItem('dsa-by-steps.progress') === null) {
      window.localStorage.setItem('dsa-by-steps.progress', ${JSON.stringify(seededProgress)});
    }
  `);
  await page.goto('/en');
  await page.getByRole('main').getByRole('link', { name: lessonTitle }).click();
  await expect(page).toHaveURL(/\/en\/foundations\/linked-lists\/1$/);
  const rail = page.getByRole('navigation', { name: 'Steps' });
  await expect(rail.getByRole('link')).toHaveCount(stepCount);

  if (testInfo.project.name === 'mobile') {
    await expect(rail.getByText('1', { exact: true })).toBeVisible();
    const title = await rail.getByText(firstStepTitle).boundingBox();
    expect(title?.width).toBeLessThanOrEqual(1);
  } else {
    await expect(rail.getByText(firstStepTitle)).toBeVisible();
  }

  for (let step = 2; step <= stepCount; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(new RegExp(`/${String(step)}$`));
  }
  const next = page.getByRole('button', { name: 'Next' });
  if (await next.isEnabled()) {
    await next.click();
    await expect(page).toHaveURL(/\/en\/foundations\/(?!linked-lists\/)[a-z0-9-]+\/1$/);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${String(stepCount)}$`));
  } else {
    await expect(next).toBeDisabled();
  }
  await expect(rail.getByRole('link', { name: /seen$/ })).toHaveCount(stepCount - 1);

  await rail.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/1$/);
  for (let step = 2; step <= stepCount; step += 1) {
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/${String(step)}$`));
  }
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/en\/foundations\/(?!linked-lists\/)[a-z0-9-]+\/1$/);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/${String(stepCount)}$`));
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(new RegExp(`/${String(stepCount - 1)}$`));

  await rail.getByRole('link').nth(1).click();
  await expect(page).toHaveURL(/\/2$/);
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page).toHaveURL(/\/pl\/foundations\/linked-lists\/2$/);
  const polishRail = page.getByRole('navigation', { name: 'Kroki' });
  await expect(polishRail.getByRole('link').nth(1)).toHaveAttribute('aria-current', 'step');

  await page.reload();
  await expect(polishRail.getByRole('link', { name: /(?<!nie) obejrzany$/ })).toHaveCount(
    stepCount - 1,
  );

  await polishRail.getByRole('link').last().click();
  await expect(page).toHaveURL(new RegExp(`/pl/foundations/linked-lists/${String(stepCount)}$`));
  await page.getByRole('link', { name: 'Przećwicz to' }).click();
  await expect(page).toHaveURL(/\/pl\/practice\/foundations\/linked-lists$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Odtwarzanie kolejki od końca' }),
  ).toBeVisible();
});

test('redirects the old Exercise URL to the Practice detail in the same Locale', async ({
  page,
}) => {
  await page.goto('/pl/foundations/linked-lists/code');
  await expect(page).toHaveURL(/\/pl\/practice\/foundations\/linked-lists$/);
});
