import { test, expect } from "@playwright/test";

test.describe("swarpc example app", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");

    // Expect the page to load correctly
    await expect(page).toHaveTitle("swarpc Example App");
  });

  test("loads service worker page and shows operations", async ({ page }) => {
    await page.goto("/");

    // Wait for the service worker initialization
    await page.waitForTimeout(3000);

    // Check that all operation sections are visible
    await expect(
      page.locator("h2:has-text('Factorial Calculation')"),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h2:has-text('Sum of Squares')")).toBeVisible();
    await expect(
      page.locator("h2:has-text('Fibonacci Sequence')"),
    ).toBeVisible();
  });

  test("can perform factorial calculation with progress tracking", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for service worker to be ready
    await page.waitForTimeout(3000);

    // Set input values
    await page.fill('label:has-text("Number:") input', "5");
    await page.fill('label:has-text("Delay (ms):") input', "50");

    // Click the factorial button
    const factorialButton = page.locator('button:has-text("Calculate 5!")');
    await expect(factorialButton).toBeVisible({ timeout: 10000 });
    await factorialButton.click();

    // Check for progress indicator
    await expect(page.locator("progress")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=/\\d+\\.\\d+% complete/")).toBeVisible({
      timeout: 5000,
    });

    // Wait for result to appear
    const result = page.locator('.result:has-text("Result: 120")');
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test("can cancel operation using cancel button", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Set longer delay to ensure we can cancel
    await page.fill('label:has-text("Number:") input', "10");
    await page.fill('label:has-text("Delay (ms):") input', "200");

    // Start factorial calculation
    const factorialButton = page.locator('button:has-text("Calculate 10!")');
    await factorialButton.click();

    // Wait for progress to start
    await expect(page.locator("progress")).toBeVisible({ timeout: 5000 });

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel factorial")');
    await expect(cancelButton).toBeVisible({ timeout: 2000 });
    await cancelButton.click();

    // Progress should disappear
    await expect(page.locator("progress")).not.toBeVisible({ timeout: 3000 });
  });

  test("service worker registration works", async ({ page }) => {
    await page.goto("/");

    // Check that service worker is being registered in the browser
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;

      try {
        const registration = await navigator.serviceWorker.register(
          "./service-worker.js",
        );
        return registration !== null;
      } catch (error) {
        console.error("SW registration failed:", error);
        return false;
      }
    });

    expect(swRegistered).toBe(true);
  });
});

test.describe("swarpc dedicated worker tests", () => {
  test("can create client with dedicated worker configuration", async ({
    page,
  }) => {
    await page.goto("/test-dedicated-worker");

    // Wait for page to load and client to be ready
    await expect(page.locator("#status")).toHaveText("Loaded");
    await page.waitForTimeout(500);

    // Check that the page has properly initialized the dedicated worker client
    const result = await page.evaluate(() => {
      try {
        // Check if swarpc and arktype are available globally
        // @ts-ignore
        const { Client } = window.swarpc;
        // @ts-ignore
        const { type } = window.arktype;

        if (!Client || !type) {
          return { success: false, error: "Required libraries not available" };
        }

        return {
          success: true,
          hasClient: !!Client,
          hasType: !!type,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasClient).toBe(true);
    expect(result.hasType).toBe(true);
  });

  test("can run single operation with progress tracking", async ({ page }) => {
    await page.goto("/test-dedicated-worker");
    await expect(page.locator("#status")).toHaveText("Loaded");

    // Set input and run factorial calculation
    await page.fill('input[type="number"]', "8");
    const calculateButton = page.locator('button:has-text("Calculate 8!")');
    await calculateButton.click();

    // Check for progress indicator
    await expect(page.locator("progress").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=/\\d+\\.\\d+%/").first()).toBeVisible({
      timeout: 5000,
    });

    // Wait for result
    await expect(page.locator("#operation1-result")).toContainText(
      "8! = 40320",
      { timeout: 10000 },
    );
  });

  test("can run parallel operations", async ({ page }) => {
    await page.goto("/test-dedicated-worker");
    await expect(page.locator("#status")).toHaveText("Loaded");

    // Click the parallel button
    const parallelButton = page.locator("#run-parallel-btn");
    await parallelButton.click();

    // All three operations should show progress simultaneously
    await expect(page.locator("progress").nth(0)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("progress").nth(1)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("progress").nth(2)).toBeVisible({
      timeout: 5000,
    });

    // Wait for all results
    await expect(page.locator("#operation1-result")).toContainText(
      "8! = 40320",
      { timeout: 15000 },
    );
    await expect(page.locator("#operation2-result")).toContainText(
      "12! = 479001600",
      { timeout: 15000 },
    );
    await expect(page.locator("#operation3-result")).toContainText(
      "Fibonacci sequence:",
      { timeout: 15000 },
    );
  });

  test("can cancel dedicated worker operations", async ({ page }) => {
    await page.goto("/test-dedicated-worker");
    await expect(page.locator("#status")).toHaveText("Loaded");

    // Set a higher number to ensure we have time to cancel
    await page.fill('input[type="number"]', "15");

    // Start the operation
    const calculateButton = page.locator('button:has-text("Calculate 15!")');
    await calculateButton.click();

    // Wait for progress to start
    await expect(page.locator("progress").first()).toBeVisible({
      timeout: 5000,
    });

    // Click cancel
    const cancelButton = page.locator('.cancel-btn:has-text("Cancel")').first();
    await expect(cancelButton).toBeVisible({ timeout: 2000 });
    await cancelButton.click();

    // Should show cancelled result
    await expect(page.locator("#operation1-result")).toContainText(
      "Cancelled",
      { timeout: 5000 },
    );
  });
});
