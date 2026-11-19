import { expect, test } from '@playwright/test';
import lesson from '../src/content/foundations/linked-lists/en.json' with { type: 'json' };

const beat = 450;
const linkingSongsPath = '/en/foundations/linked-lists/3';
const introToEcho = JSON.stringify(['queue', 'intro', 'echo']);
const seededProgress = JSON.stringify({
  version: 1,
  stepsSeen: {},
  exercises: {},
  checks: Object.fromEntries(
    Object.keys(lesson.checks).map((id) => [
      `foundations/linked-lists/${id}`,
      { misses: 0, status: 'passed' },
    ]),
  ),
});

test('plays a Linked lists Step one event at a time, settles, and replays it', async ({ page }) => {
  await page.addInitScript(
    `window.localStorage.setItem('dsa-by-steps.progress', ${JSON.stringify(seededProgress)});`,
  );
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(linkingSongsPath);
  const nodes = page.locator('[data-stage] [data-element]:not([data-leaving])');
  const link = page.locator(`[data-stage] [data-link='${introToEcho}']`);

  await expect(nodes).toHaveCount(1);
  await expect(link).toHaveCount(0);

  await page.clock.runFor(beat);
  await expect(nodes).toHaveCount(2);
  await expect(link).toHaveCount(0);

  await page.clock.runFor(beat);
  await expect(nodes).toHaveCount(3);

  await page.clock.runFor(beat);
  await expect(nodes).toHaveCount(4);
  await expect(link).toHaveCount(0);

  await page.clock.runFor(beat);
  await expect(link).toHaveCount(1);

  await page.clock.runFor(beat);
  await page.clock.runFor(beat);
  await page.clock.runFor(beat);
  await expect(nodes).toHaveCount(4);
  await expect(link).toHaveCount(1);

  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(nodes).toHaveCount(1);
  await expect(link).toHaveCount(0);

  await page.clock.runFor(beat);
  await expect(nodes).toHaveCount(2);
});
