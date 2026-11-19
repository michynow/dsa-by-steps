import { expect, test } from '@playwright/test';

const nodeALink = JSON.stringify(['list', 'node-a', 'node-b']);

test('plays a Linked lists Step one event at a time, settles, and replays it', async ({ page }) => {
  await page.goto('/en/foundations/linked-lists/3');
  const nodes = page.locator('[data-stage] [data-element]:not([data-leaving])');
  const link = page.locator(`[data-stage] [data-link='${nodeALink}']`);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await nodes.count()).toBeLessThan(4);
  await expect(link).toHaveCount(0);

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(nodes).toHaveCount(4);
  await expect(link).toHaveCount(1);

  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(nodes).toHaveCount(1);
  await expect(link).toHaveCount(0);
  await expect(nodes).toHaveCount(4);
  await expect(link).toHaveCount(1);
});
