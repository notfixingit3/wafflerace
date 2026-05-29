import { test, expect } from '@playwright/test';

test.describe('OBS Streaming & Theming Engine', () => {
  // Use sequential mode as database is SQLite to avoid lock conflicts
  test.describe.configure({ mode: 'serial' });

  test('applies theme and hides controls for obs stream template', async ({ page }) => {
    // 1. Visit race page with obs theme
    await page.goto('/race?names=Alice,Bob,Charlie&theme=obs');
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // Verify html tag has data-theme="obs"
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('obs');

    // Controls should be hidden
    await expect(page.locator('#start-btn')).toBeHidden();
    await expect(page.locator('#pee-btn')).toBeHidden();
    await expect(page.locator('#fullscreen-btn')).toBeHidden();
    await expect(page.locator('#name-options')).toBeHidden();
  });

  test('applies dark theme correctly', async ({ page }) => {
    // 1. Visit race page with dark theme
    await page.goto('/race?names=Alice,Bob,Charlie&theme=dark');
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // Verify html tag has data-theme="dark"
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('dark');
  });

  test('triggers client-side webhook post-race finish', async ({ page }) => {
    let webhookPayload = null;
    
    // Route mock webhook URL
    await page.route('**/api/mock-webhook', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }
      webhookPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Start a race with mock webhook URL
    await page.goto('/race?names=Alice,Bob,Charlie&webhook=http://localhost:9090/api/mock-webhook');
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // Start the race manually since auto_start is not set
    await page.click('button:has-text("Start Race")');
    await page.waitForTimeout(500);

    // Trigger immediate finish via debug utility
    await page.evaluate(() => window.RACE_DEBUG.triggerFinish());

    // Wait for the results section to show and the webhook timer to fire (at 2500ms)
    await expect(page.locator('#results')).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(3000);

    // Verify webhook payload is valid and has expected structure
    expect(webhookPayload).not.toBeNull();
    expect(webhookPayload.event).toBe('race_finished');
    expect(webhookPayload.winner).toBeTruthy();
    expect(webhookPayload.results.length).toBe(3);
    expect(webhookPayload.results[0].rank).toBe(1);
    expect(webhookPayload.results[0].name).toBe(webhookPayload.winner);
  });

  test('auto starts the race when auto_start=1 is set', async ({ page }) => {
    await page.goto('/race?names=Alice,Bob,Charlie&auto_start=1');
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // When auto-start is triggered, the start button is disabled and the pee button becomes visible
    // Wait for auto-start delay to execute (uses setTimeout of 600ms, plus preloader checks)
    await page.waitForTimeout(1500);

    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeDisabled();

    const peeBtn = page.locator('#pee-btn');
    await expect(peeBtn).toBeVisible();
  });
});
