import { test, expect } from '@playwright/test';

test.describe('Asset Loading Verification', () => {
  test('verify active boat and background sprites are loaded successfully', async ({ page }) => {
    const failedAssets = [];

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Intercept requests and track any asset request that fails (HTTP >= 400)
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/assets/') && response.status() >= 400) {
        failedAssets.push({ url, status: response.status() });
      }
    });

    // Load setup page
    await page.goto('/');
    await page.locator('textarea[name="names"]').fill('Waffle 1\nWaffle 2\nWaffle 3');
    await page.locator('#duration-input').fill('15');

    // Submit race creation form
    await Promise.all([
      page.waitForResponse('/api/races'),
      page.click('button:has-text("Start Race")')
    ]);

    // Verify redirection to race page
    await expect(page).toHaveURL(/\/race\?id=/);

    // Wait for the canvas to render and become visible
    const canvas = page.locator('#race-canvas');
    await canvas.waitFor({ state: 'visible' });

    // Click start to initialize and kick off the loop
    await page.click('button:has-text("Start Race")');

    // Retrieve active assets load status from window context
    const assetValidation = await page.evaluate(() => {
      if (!window.RACE_STATE || !window.RACE_ASSETS) {
        return { error: 'RACE_STATE or RACE_ASSETS is missing' };
      }

      const waffles = window.RACE_STATE.waffles || [];
      const parallaxLayers = window.RACE_STATE.parallaxLayers || [];
      const boatImages = window.RACE_ASSETS.boatImages || [];

      // Check active boat images (those assigned to waffles)
      const brokenBoats = waffles
        .map(w => {
          const img = boatImages[w.spriteIndex];
          const isOk = img && img.complete && img.naturalWidth > 0;
          return { name: w.name, index: w.spriteIndex, src: img?.src, isOk };
        })
        .filter(b => !b.isOk);

      // Check active background images
      const brokenBgs = parallaxLayers
        .map((layer, index) => {
          const img = layer.img;
          const isOk = img && img.complete && img.naturalWidth > 0;
          return { layer: index, src: img?.src, isOk };
        })
        .filter(bg => !bg.isOk);

      return {
        brokenBoats,
        brokenBgs,
        wafflesCount: waffles.length,
        layersCount: parallaxLayers.length
      };
    });

    expect(assetValidation.error).toBeUndefined();
    expect(assetValidation.wafflesCount).toBe(3);
    expect(assetValidation.layersCount).toBe(3);

    // Assert that there are no broken boats or background layers actively rendering
    expect(assetValidation.brokenBoats).toEqual([]);
    expect(assetValidation.brokenBgs).toEqual([]);

    // Check if any of the active canvas asset URLs failed to load over the network
    const activeUrls = await page.evaluate(() => {
      const waffles = window.RACE_STATE.waffles || [];
      const parallaxLayers = window.RACE_STATE.parallaxLayers || [];
      const boatImages = window.RACE_ASSETS.boatImages || [];

      const urls = [];
      waffles.forEach(w => {
        const img = boatImages[w.spriteIndex];
        if (img?.src) urls.push(img.src);
      });
      parallaxLayers.forEach(layer => {
        if (layer.img?.src) urls.push(layer.img.src);
      });
      return urls;
    });

    const activeAssetFailures = failedAssets.filter(f => activeUrls.includes(f.url));
    expect(activeAssetFailures).toEqual([]);
  });
});
