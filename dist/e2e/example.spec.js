import { test, expect } from '@playwright/test';
test.describe('swarpc example app', () => {
    test('has correct title', async ({ page }) => {
        await page.goto('/');
        // Expect the page to load correctly
        await expect(page).toHaveTitle(/SvelteKit/);
    });
    test('can make RPC call to get classmapping', async ({ page }) => {
        await page.goto('/');
        // Wait for the service worker to register
        await page.waitForTimeout(1000);
        // Click the button to make the RPC call
        await page.getByRole('button', { name: 'Get classmapping' }).click();
        // Wait for the request to complete and check for results
        await expect(page.locator('ul li')).toHaveCount({ min: 1 }, { timeout: 10000 });
        // Verify that classmapping data was loaded
        const listItems = page.locator('ul li');
        await expect(listItems.first()).toBeVisible();
    });
    test('shows progress indicator during request', async ({ page }) => {
        await page.goto('/');
        // Wait for the service worker to register
        await page.waitForTimeout(1000);
        // Click the button to make the RPC call
        await page.getByRole('button', { name: 'Get classmapping' }).click();
        // Check that progress indicator appears
        await expect(page.locator('progress, p:has-text("Loading")')).toBeVisible({ timeout: 5000 });
    });
    test('can cancel ongoing request', async ({ page }) => {
        await page.goto('/');
        // Wait for the service worker to register
        await page.waitForTimeout(1000);
        // Click the button to make the RPC call
        await page.getByRole('button', { name: 'Get classmapping' }).click();
        // Wait for the cancel button to appear
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 5000 });
        // Click cancel
        await page.getByRole('button', { name: 'Cancel' }).click();
        // Verify that the loading state is cleared
        await expect(page.locator('progress')).not.toBeVisible({ timeout: 3000 });
    });
});
