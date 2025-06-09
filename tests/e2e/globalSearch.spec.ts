import { test, expect } from '@playwright/test';

test('global search bar returns results', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByPlaceholder('Global search');
  await searchInput.click();
  await searchInput.type('test');

  // We expect dropdown to appear; this is just a smoke test as backend mocked
  const dropdown = page.locator('.shadow');
  await expect(dropdown).toBeVisible();
});
