import { expect, test } from '@playwright/test';

test('answers a Choice Check and a Predict Check, unblocks next and keeps them settled on reload', async ({
  page,
}) => {
  await page.goto('/en/foundations/linked-lists/2');
  const next = page.getByRole('button', { name: 'Next' });
  const submit = page.getByRole('button', { name: 'Check answer' });
  const status = page.getByRole('status');

  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(/You store each item in its own node/)).toBeHidden();

  await page.getByRole('radio', { name: /^Its index/ }).check();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('radio', { name: /^A link to the next node/ }).check();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByText(/You store each item in its own node/)).toBeVisible();
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await next.click();
  await next.click();
  await expect(page).toHaveURL(/\/4$/);
  await expect(next).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: /^Select C,/ }).click();
  await submit.click();
  await expect(status).toHaveText('Not right. Try again.');

  await page.getByRole('button', { name: /^Select A,/ }).click();
  await submit.click();
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('button', { name: /^Select A,/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.reload();
  await expect(status).toHaveText('Correct.');
  await expect(submit).toHaveCount(0);
  await expect(next).not.toHaveAttribute('aria-disabled', 'true');

  await page.goto('/en/foundations/linked-lists/2');
  await expect(status).toHaveText('Correct.');
  await expect(page.getByRole('radio', { name: /^A link to the next node/ })).toBeChecked();
});
