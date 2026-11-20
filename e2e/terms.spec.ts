import { expect, test } from '@playwright/test';
import lesson from '../src/content/foundations/linked-lists/en.json' with { type: 'json' };

const passedChecks = Object.fromEntries(
  Object.keys(lesson.checks).map((id) => [
    `foundations/linked-lists/${id}`,
    { misses: 0, status: 'passed' },
  ]),
);
const seededProgress = JSON.stringify({
  version: 1,
  stepsSeen: {},
  exercises: {},
  checks: passedChecks,
});

test('opens a Term Chip with the keyboard, reads its gloss and closes it with Escape', async ({
  page,
}) => {
  await page.addInitScript(`
    window.localStorage.setItem('dsa-by-steps.progress', ${JSON.stringify(seededProgress)});
  `);
  await page.goto('/en/foundations/linked-lists/3');
  const chip = page.getByRole('button', { name: 'node' });
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(chip).toHaveAttribute('aria-expanded', 'true');
  await expect(chip).toHaveAccessibleDescription(`New term node ${lesson.terms.node.gloss}`);
  await page.keyboard.press('Escape');
  await expect(chip).toHaveAttribute('aria-expanded', 'false');
  await expect(chip).toHaveAccessibleDescription('New term');
  await expect(chip).toBeFocused();
});
