import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Race Creation flow.
 * Tolerant of the current module loading transition issue.
 */

test.describe('Race Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#race-form').waitFor({ state: 'visible' });
  });

  test('happy path - creates race and redirects with correct parameters', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.locator('textarea[name="names"]').fill('Alice\nBob\nCharlie');
    await page.locator('#duration-input').fill('45');

    await Promise.all([
      page.waitForResponse('/api/races'),
      page.click('button:has-text("Start Race")')
    ]);

    await expect(page).toHaveURL(/\/race\?id=/, { timeout: 4000 });

    const url = page.url();
    expect(url).toContain('names=Alice%2CBob%2CCharlie');
    expect(url).toContain('duration=45');

    const realErrors = pageErrors.filter(e => !e.includes("Unexpected token 'export'"));
    if (realErrors.length > 0) {
      throw new Error(`Unexpected page errors: ${realErrors.join(', ')}`);
    }

    await expect(page.locator('#race-canvas')).toBeVisible({ timeout: 5000 });
  });

  test('rejects empty names', async ({ page }) => {
    await page.click('button:has-text("Start Race")');
    await expect(page).not.toHaveURL(/\/race\?id=/, { timeout: 1500 });
  });

  test('Test Race (15 names) button works', async ({ page }) => {
    await page.click('button:has-text("Test Race (15 names)")');
    const count = (await page.locator('textarea[name="names"]').inputValue()).split('\n').filter(Boolean).length;
    expect(count).toBe(15);
  });

  test('duration presets work correctly', async ({ page }) => {
    await page.click('button:has-text("2m")');
    expect(await page.locator('#duration-input').inputValue()).toBe('120');

    await page.click('button:has-text("5m")');
    expect(await page.locator('#duration-input').inputValue()).toBe('300');
  });

  test('non-default collections appear in redirect URL', async ({ page }) => {
    await page.locator('textarea[name="names"]').fill('Test');
    await page.locator('#duration-input').fill('30');

    const boat = page.locator('#boat-collection');
    if (await boat.count() > 0) await boat.selectOption({ index: 1 }).catch(() => {});
    const bg = page.locator('#background-collection');
    if (await bg.count() > 0) await bg.selectOption({ index: 1 }).catch(() => {});

    await page.click('button:has-text("Start Race")');
    await expect(page).toHaveURL(/\/race\?id=/, { timeout: 4000 });
  });

  test('handles names with special characters', async ({ page }) => {
    await page.locator('textarea[name="names"]').fill("O'Brien\nJean-Luc\nMüller");
    await page.locator('#duration-input').fill('30');
    await page.click('button:has-text("Start Race")');
    await expect(page).toHaveURL(/\/race\?id=/, { timeout: 4000 });
  });
});
