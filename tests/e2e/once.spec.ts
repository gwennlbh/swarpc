import { test, expect } from "@playwright/test";

test.describe("once mode computation", () => {
  for (const workerType of ["shared", "dedicated"]) {
    test.describe(`using a ${workerType} worker`, () => {
      test.describe(".once() - method scoped", () => {
        test("cancels previous call when new call is made", async ({
          page,
        }) => {
          await page.goto(`/${workerType}/once/`);

          const section = page.locator("#test-once");
          const button = section.getByRole("button");
          const inputA = section.getByRole("spinbutton").first();
          const inputB = section.getByRole("spinbutton").nth(1);

          // Set up first computation
          await inputA.fill("2");
          await inputB.fill("5");

          // Start first computation
          await button.click();

          // Wait for it to start loading
          await expect(button).toHaveAccessibleName(/loading.../);

          // Quickly start a second computation with different values
          await inputA.fill("3");
          await inputB.fill("4");
          await button.click();

          // The result should be from the second computation (3 * 4 = 12)
          await expect(button).toHaveAccessibleName("12", { timeout: 10000 });
        });

        test("completes normally when no previous call exists", async ({
          page,
        }) => {
          await page.goto(`/${workerType}/once/`);

          const section = page.locator("#test-once");
          const button = section.getByRole("button");
          const inputA = section.getByRole("spinbutton").first();
          const inputB = section.getByRole("spinbutton").nth(1);

          await inputA.fill("3");
          await inputB.fill("7");
          await button.click();

          // Should show progress and complete
          await expect(button).toHaveAccessibleName(/loading.../);
          await expect(button).toHaveAccessibleName("21", { timeout: 10000 });
        });
      });

      test.describe(".onceBy(key) - method+key scoped", () => {
        test("cancels previous call with same key", async ({ page }) => {
          await page.goto(`/${workerType}/once/`);

          const section = page.locator("#test-onceby-key");
          const button = section.getByRole("button");
          const inputA = section.getByRole("spinbutton").first();
          const inputB = section.getByRole("spinbutton").nth(1);

          // Set up first computation
          await inputA.fill("4");
          await inputB.fill("6");

          // Start first computation
          await button.click();

          // Wait for it to start loading
          await expect(button).toHaveAccessibleName(/loading.../);

          // Quickly start a second computation with different values
          await inputA.fill("5");
          await inputB.fill("3");
          await button.click();

          // The result should be from the second computation (5 * 3 = 15)
          await expect(button).toHaveAccessibleName("15", { timeout: 10000 });
        });
      });

      test.describe("global onceBy - global key scoped", () => {
        test("cancels previous call with same global key", async ({ page }) => {
          await page.goto(`/${workerType}/once/`);

          const section = page.locator("#test-global-onceby");
          const button = section.getByRole("button");
          const inputA = section.getByRole("spinbutton").first();
          const inputB = section.getByRole("spinbutton").nth(1);

          // Set up first computation
          await inputA.fill("6");
          await inputB.fill("7");

          // Start first computation
          await button.click();

          // Wait for it to start loading
          await expect(button).toHaveAccessibleName(/loading.../);

          // Quickly start a second computation with different values
          await inputA.fill("8");
          await inputB.fill("2");
          await button.click();

          // The result should be from the second computation (8 * 2 = 16)
          await expect(button).toHaveAccessibleName("16", { timeout: 10000 });
        });
      });
    });
  }
});
