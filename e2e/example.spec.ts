import { test, expect } from "@playwright/test";

test.describe("swarpc example app", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");

    // Expect the page to load correctly
    await expect(page).toHaveTitle("swarpc Example App");
  });

  test("loads the page and shows the button", async ({ page }) => {
    await page.goto("/");

    // Wait for the service worker initialization message to appear or disappear
    await page.waitForTimeout(3000);

    // The button should be visible once SW is ready
    await expect(
      page.getByRole("button", { name: "Get classmapping" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("can click the button and show loading state", async ({ page }) => {
    await page.goto("/");

    // Wait longer for the service worker to be ready
    await page.waitForTimeout(3000);

    // Click the button to make the RPC call only if it's visible
    const button = page.getByRole("button", { name: "Get classmapping" });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();

    // Check if either a loading indicator appears OR cancel button appears
    // This validates that clicking the button does something even if the RPC doesn't complete
    const loadingIndicator = page.locator('progress, p:has-text("Loading")');
    const cancelButton = page.getByRole("button", { name: "Cancel" });

    // Wait for either to appear - this proves the button click was handled
    await Promise.race([
      expect(loadingIndicator).toBeVisible({ timeout: 5000 }),
      expect(cancelButton).toBeVisible({ timeout: 5000 }),
    ]);
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

    // Wait for page to load and expose swarpc
    await expect(page.locator("#status")).toHaveText("Loaded");
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      try {
        // Use the globally exposed swarpc and arktype
        // @ts-ignore
        const { Client } = window.swarpc;
        // @ts-ignore
        const { type } = window.arktype;

        if (!Client || !type) {
          return { success: false, error: "Required libraries not available" };
        }

        // Define simple procedures for dedicated worker
        const procedures = {
          echo: {
            input: type({ message: "string" }),
            progress: type({}),
            success: type({ echo: "string" }),
          },
        } as const;

        // Test that we can create a client with dedicated worker configuration
        const swarpcClient = Client(procedures, {
          worker: "./dedicated-worker.js",
        });

        return {
          success: true,
          hasClient: !!swarpcClient,
          hasEchoMethod: typeof swarpcClient.echo === "function",
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasClient).toBe(true);
    expect(result.hasEchoMethod).toBe(true);
  });
});
