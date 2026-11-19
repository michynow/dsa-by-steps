import { expect, test } from '@playwright/test';
import { choiceCase, predictCase } from './lesson-content';

const choice = choiceCase();
const predict = predictCase();
const base = '/en/foundations/linked-lists';

test('answers a Choice Check and a Predict Check, unblocks next and keeps them settled on reload', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}/${String(choice.number)}`);
  const next = page.getByRole('button', { name: 'Next' });
  const submit = page.getByRole('button', { name: 'Check answer' });
  const status = page.getByRole('status');

  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(choice.caption)).toBeHidden();

  await page.getByRole('radio', { name: choice.wrong }).check();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('radio', { name: choice.correct }).check();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByText(choice.caption)).toBeVisible();
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.goto(`${base}/${String(predict.number)}`);
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: predict.wrong }).click();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');

  await page.getByRole('button', { name: predict.correct }).click();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('button', { name: predict.correct })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.reload();
  await expect(status).toHaveText('Correct.');
  await expect(submit).toHaveCount(0);
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.goto(`${base}/${String(choice.number)}`);
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('radio', { name: choice.correct })).toBeChecked();
});
