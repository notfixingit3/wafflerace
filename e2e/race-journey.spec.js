import { test, expect } from '@playwright/test';

test.describe('Race Journey, Podium Reveal & Spectator Mode', () => {
  // Use sequential mode as database is SQLite to avoid lock conflicts
  test.describe.configure({ mode: 'serial' });

  test('happy path - full race journey, sequential podium reveal, and history persistence', async ({ page }) => {
    // 1. Create a race
    await page.goto('/');
    await page.locator('textarea[name="names"]').fill('Alice\nBob\nCharlie\nDave\nEve');
    await page.locator('#duration-input').fill('15');

    await Promise.all([
      page.waitForResponse('/api/races'),
      page.click('button:has-text("Start Race")')
    ]);

    await expect(page).toHaveURL(/\/race\?id=/);
    await page.locator('#race-canvas').waitFor({ state: 'visible' });

    // 2. Start the race
    await page.click('button:has-text("Start Race")');

    // Wait a brief moment to let them run
    await page.waitForTimeout(500);

    // 3. Trigger immediate finish via debug utility
    await page.evaluate(() => window.RACE_DEBUG.triggerFinish());

    // 4. Assert results section becomes visible
    const resultsContainer = page.locator('#results');
    await expect(resultsContainer).toBeVisible({ timeout: 6000 });

    // 5. Verify sequential podium reveals
    // 3rd place podium reveals at 600ms
    const podium3 = page.locator('#podium-3rd');
    await expect(podium3).toHaveClass(/opacity-100/, { timeout: 2000 });

    // 2nd place podium reveals at 1200ms
    const podium2 = page.locator('#podium-2nd');
    await expect(podium2).toHaveClass(/opacity-100/, { timeout: 2000 });

    // 1st place podium reveals at 1800ms
    const podium1 = page.locator('#podium-1st');
    await expect(podium1).toHaveClass(/opacity-100/, { timeout: 2000 });

    // 6. Verify correct placement from simulation state
    const top3Names = await page.evaluate(() => {
      return [...window.RACE_STATE.waffles]
        .sort((a, b) => b.x - a.x)
        .map(w => w.name)
        .slice(0, 3);
    });

    const name1st = await page.locator('#podium-1st-name').textContent();
    const name2nd = await page.locator('#podium-2nd-name').textContent();
    const name3rd = await page.locator('#podium-3rd-name').textContent();

    expect(name1st).toBe(top3Names[0]);
    expect(name2nd).toBe(top3Names[1]);
    expect(name3rd).toBe(top3Names[2]);

    // 7. Verify winner boat canvas exists and is visible
    const winnerCanvas = page.locator('#winner-boat-canvas');
    await expect(winnerCanvas).toBeVisible();

    // Give a brief delay for final field reveal and database sync
    await page.waitForTimeout(1000);

    // 8. Verify history analytics persistence
    await page.goto('/history');
    await page.waitForSelector('table');
    
    // The winner's name should appear in the history list table
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(top3Names[0]);
  });

  test('verify spectator mode hides controls', async ({ page }) => {
    // Visit race page with spectator parameter set to 1
    await page.goto('/race?names=A,B,C,D&spectator=1');

    // Controls should not be visible to spectator
    await expect(page.locator('#start-btn')).toBeHidden();
    await expect(page.locator('#pee-btn')).toBeHidden();
    await expect(page.locator('#race-controls')).toBeHidden();
    await expect(page.locator('#name-options')).toBeHidden();
  });
});
