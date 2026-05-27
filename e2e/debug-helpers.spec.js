import { test, expect } from '@playwright/test';

test.describe('JavaScript Debug Helpers', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to setup page
    await page.goto('/');
    await page.locator('textarea[name="names"]').fill('Waffle A\nWaffle B\nWaffle C');
    await page.locator('#duration-input').fill('20');

    // Create the race
    await Promise.all([
      page.waitForResponse('/api/races'),
      page.click('button:has-text("Start Race")')
    ]);

    // Verify redirection to race page
    await expect(page).toHaveURL(/\/race\?id=/);

    // Wait for the canvas to render and become visible
    await page.locator('#race-canvas').waitFor({ state: 'visible' });
  });

  test('verify window.RACE_DEBUG namespace is exposed and getFPS works', async ({ page }) => {
    // Check namespace existence
    const hasDebug = await page.evaluate(() => typeof window.RACE_DEBUG !== 'undefined');
    expect(hasDebug).toBe(true);

    // Start the race to start loop
    await page.click('button:has-text("Start Race")');

    // Wait short time for frames to accumulate
    await page.waitForTimeout(500);

    const fps = await page.evaluate(() => window.RACE_DEBUG.getFPS());
    expect(fps).toBeGreaterThan(0);
  });

  test('verify teleportToFinish teleports waffle', async ({ page }) => {
    await page.click('button:has-text("Start Race")');

    // Teleport waffle 0
    await page.evaluate(() => window.RACE_DEBUG.teleportToFinish(0));

    // Get position of waffle 0
    const waffleX = await page.evaluate(() => {
      const w = window.RACE_STATE.waffles[0];
      return w ? w.x : 0;
    });

    expect(waffleX).toBeGreaterThan(500); // Should be very close to finish line (FINISH_LINE - 10)
  });

  test('verify triggerFinish forces immediate finish', async ({ page }) => {
    await page.click('button:has-text("Start Race")');

    // Wait a brief moment to ensure race is running
    await page.waitForTimeout(200);

    // Assert results section is hidden initially
    await expect(page.locator('#results')).toBeHidden();

    // Trigger immediate finish
    await page.evaluate(() => window.RACE_DEBUG.triggerFinish());

    // Results section should become visible with winner announcement
    await expect(page.locator('#results')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#winner-announcement')).toBeVisible({ timeout: 6000 });
  });
});
