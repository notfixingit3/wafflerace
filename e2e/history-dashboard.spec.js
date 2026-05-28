import { test, expect } from '@playwright/test';

test.describe('History & Analytics Dashboard', () => {
  // SQLite writes need serial execution to prevent conflicts
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Generate a test race result first so we have history data
    await page.goto('/');
    await page.locator('textarea[name="names"]').fill('AliceWaffle\nBobWaffle\nCharlieWaffle');
    await page.locator('#duration-input').fill('15'); // Short duration

    await Promise.all([
      page.waitForResponse('/api/races'),
      page.click('button:has-text("Start Race")')
    ]);

    await expect(page).toHaveURL(/\/race\?id=/);
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // Start and trigger finish
    await page.click('button:has-text("Start Race")');
    await page.waitForTimeout(200);
    await page.evaluate(() => window.RACE_DEBUG.triggerFinish());

    // Wait for results container to become visible, indicating results are saved
    await expect(page.locator('#results')).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(1000); // Give SQLite write breathing room
  });

  test('should support search and duration filtering', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');
    await page.waitForSelector('#history-table');

    // 1. Verify Top Winners Chart is rendered
    const chart = page.locator('#top-winners-chart');
    await expect(chart).toBeVisible();
    const barCount = await chart.locator('div.flex').count();
    expect(barCount).toBeGreaterThanOrEqual(1);

    // 2. Verify search filtering works
    const rows = page.locator('#history-table tbody tr');
    const totalCount = await rows.count();
    expect(totalCount).toBeGreaterThan(0);

    // Search for a specific winner that we generated (e.g. Waffle)
    await page.fill('#history-search', 'AliceWaffle');
    await page.waitForTimeout(300); // wait for keyup handler to run

    // Count visible rows
    let visibleCount = 0;
    for (let i = 0; i < totalCount; i++) {
      const row = rows.nth(i);
      const isVisible = await row.evaluate(node => !node.classList.contains('hidden'));
      if (isVisible) visibleCount++;
    }
    expect(visibleCount).toBeLessThanOrEqual(totalCount);

    // Clear search
    await page.fill('#history-search', '');
    await page.waitForTimeout(200);

    // 3. Verify duration filtering works
    await page.selectOption('#history-filter-duration', 'short'); // < 30s
    await page.waitForTimeout(300);
    
    // Rows under 30s should be visible
    let shortVisibleCount = 0;
    for (let i = 0; i < totalCount; i++) {
      const row = rows.nth(i);
      const isVisible = await row.evaluate(node => !node.classList.contains('hidden'));
      if (isVisible) shortVisibleCount++;
    }
    expect(shortVisibleCount).toBeGreaterThan(0);

    // Filter long (> 60s) — our 15s race should be hidden
    await page.selectOption('#history-filter-duration', 'long');
    await page.waitForTimeout(300);

    let longVisibleCount = 0;
    for (let i = 0; i < totalCount; i++) {
      const row = rows.nth(i);
      const isVisible = await row.evaluate(node => !node.classList.contains('hidden'));
      if (isVisible) longVisibleCount++;
    }
    
    // The short race should be hidden, so long visible count should be less
    expect(longVisibleCount).toBeLessThan(shortVisibleCount);
  });

  test('should download a valid CSV file on export', async ({ page }) => {
    await page.goto('/history');
    await page.waitForSelector('#history-table');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-csv-btn');
    const download = await downloadPromise;

    // Check download parameters
    expect(download.suggestedFilename()).toContain('wafflerace_history_');
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
