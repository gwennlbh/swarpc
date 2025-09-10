import { test, expect } from "@playwright/test";

test.describe("swarpc service worker tests", () => {
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

  test("UI responds to user input changes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Change input values and verify button text updates
    await page.fill('label:has-text("Number:") input', "7");
    await expect(page.locator('button:has-text("Calculate 7!")')).toBeVisible();

    // Test sum of squares input
    const sumSection = page.locator("section:has-text('Sum of Squares')");
    await sumSection.locator('input[type="number"]').first().fill("10");
    await expect(
      sumSection.locator('button:has-text("Calculate 1² + 2² + ... + 10²")'),
    ).toBeVisible();

    // Test fibonacci input
    const fibSection = page.locator("section:has-text('Fibonacci Sequence')");
    await fibSection.locator('input[type="number"]').first().fill("8");
    await expect(
      fibSection.locator('button:has-text("Generate 8 Fibonacci Terms")'),
    ).toBeVisible();
  });

  test("can start operations and show loading states", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Set values for quick test
    await page.fill('label:has-text("Number:") input', "4");
    await page.fill('label:has-text("Delay (ms):") input', "50");

    // Start calculation
    const factorialButton = page.locator('button:has-text("Calculate 4!")');
    await expect(factorialButton).toBeVisible({ timeout: 10000 });
    await factorialButton.click();

    // Verify loading state appears
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator("text=Loading")).toBeVisible();

    // Should be able to cancel
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('button:has-text("Cancel")')).not.toBeVisible({
      timeout: 3000,
    });
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

  test("progress reporting works correctly", async ({ page }) => {
    await page.goto("/test-dedicated-worker");
    await expect(page.locator("#status")).toHaveText("Loaded");

    // Set values for good progress tracking
    await page.fill('input[type="number"]', "10");

    // Start operation
    const calculateButton = page.locator('button:has-text("Calculate 10!")');
    await calculateButton.click();

    // Wait for progress to appear and check values
    const progressBar = page.locator("progress").first();
    await expect(progressBar).toBeVisible({ timeout: 5000 });

    // Wait for progress percentage to show
    const progressText = page.locator("#operation1-progress");
    await expect(progressText).toContainText("%", { timeout: 5000 });

    // Check that progress increases
    let initialProgress: string | null = null;
    let finalProgress: string | null = null;

    // Get initial progress
    initialProgress = await progressText.textContent();

    // Wait a bit and check it changed
    await page.waitForTimeout(500);
    finalProgress = await progressText.textContent();

    // Progress should have changed (or operation completed)
    if (initialProgress && finalProgress) {
      expect(
        initialProgress !== finalProgress || finalProgress.includes("100"),
      ).toBeTruthy();
    }

    // Wait for final result
    await expect(page.locator("#operation1-result")).toContainText(
      "10! = 3628800",
      { timeout: 10000 },
    );
  });

  test("user input validation works", async ({ page }) => {
    await page.goto("/test-dedicated-worker");
    await expect(page.locator("#status")).toHaveText("Loaded");

    // Test with different input values
    const inputValues = ["6", "12", "1"];

    for (const value of inputValues) {
      await page.fill('[data-testid="factorial1-input"]', value);

      // Check that button text updates correctly
      await expect(
        page.locator(`button:has-text("Calculate ${value}!")`),
      ).toBeVisible();
    }

    // Test fibonacci input
    const fibInput = page.locator('[data-testid="fibonacci-input"]');
    await fibInput.fill("25");
    await expect(
      page.locator('button:has-text("Generate 25 Fibonacci Terms")'),
    ).toBeVisible();
  });
});
