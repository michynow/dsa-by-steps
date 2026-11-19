import { expect, test } from '@playwright/test';

test('answers a Choice Check and a Predict Check, unblocks next and keeps them settled on reload', async ({
  page,
}) => {
  await page.goto('/en/foundations/linked-lists/3');
  const next = page.getByRole('button', { name: 'Next' });
  const submit = page.getByRole('button', { name: 'Check answer' });
  const status = page.getByRole('status');

  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(/Intro holds a link to the next node/)).toBeHidden();

  await page.getByRole('radio', { name: /^Its position number/ }).check();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('radio', { name: /^A link to the next node/ }).check();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByText(/Intro holds a link to the next node/)).toBeVisible();
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await next.click();
  await expect(page).toHaveURL(/\/4$/);
  await page.reload();
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: /^Select Pulse,/ }).click();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');

  await page.getByRole('button', { name: /^Select Intro,/ }).click();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('button', { name: /^Select Intro,/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.reload();
  await expect(status).toHaveText('Correct.');
  await expect(submit).toHaveCount(0);
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.goto('/en/foundations/linked-lists/3');
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('radio', { name: /^A link to the next node/ })).toBeChecked();
});
