import { test, expect } from "@playwright/test";

test.describe("once mode computation", () => {
  for (const workerType of ["shared", "dedicated"]) {
    test.describe(`using a ${workerType} worker`, () => {
      test.describe(".once() - method scoped", () => {
        test("cancels previous call when new call is made", async ({
          page,
        }) => {
          await page.goto(`/${workerType}/once/`);

          // Set up first computation
          await page.getByLabel("input a for test 1").fill("2");
          await page.getByLabel("input b for test 1").fill("5");

          // Start first computation
          await page
            .getByRole("button", { name: "compute once test 1" })
            .click();

          // Wait for it to start loading
          await expect(
            page.getByRole("button", { name: /loading.*test 1/ }),
          ).toBeVisible({ timeout: 1000 });

          // Quickly start a second computation with different values
          await page.getByLabel("input a for test 1").fill("3");
          await page.getByLabel("input b for test 1").fill("4");
          await page.getByRole("button", { name: /loading.*test 1/ }).click();

          // The result should be from the second computation (3 * 4 = 12)
          await expect(page.getByRole("button", { name: "12" })).toBeVisible({
            timeout: 10000,
          });
        });

        test("completes normally when no previous call exists", async ({
          page,
        }) => {
          await page.goto(`/${workerType}/once/`);

          await page.getByLabel("input a for test 1").fill("3");
          await page.getByLabel("input b for test 1").fill("7");
          await page
            .getByRole("button", { name: "compute once test 1" })
            .click();

          // Should show progress and complete
          await expect(
            page.getByRole("button", { name: /loading.*test 1/ }),
          ).toBeVisible({ timeout: 1000 });
          await expect(page.getByRole("button", { name: "21" })).toBeVisible({
            timeout: 10000,
          });
        });
      });

      test.describe(".onceBy(key) - method+key scoped", () => {
        test("cancels previous call with same key", async ({ page }) => {
          await page.goto(`/${workerType}/once/`);

          // Set up first computation
          await page.getByLabel("input a for test 2").fill("4");
          await page.getByLabel("input b for test 2").fill("6");

          // Start first computation
          await page
            .getByRole("button", { name: "compute onceby foo test 2" })
            .click();

          // Wait for it to start loading
          await expect(
            page.getByRole("button", { name: /loading.*test 2/ }),
          ).toBeVisible({ timeout: 1000 });

          // Quickly start a second computation with different values
          await page.getByLabel("input a for test 2").fill("5");
          await page.getByLabel("input b for test 2").fill("3");
          await page.getByRole("button", { name: /loading.*test 2/ }).click();

          // The result should be from the second computation (5 * 3 = 15)
          await expect(page.getByRole("button", { name: "15" })).toBeVisible({
            timeout: 10000,
          });
        });
      });

      test.describe("global onceBy - global key scoped", () => {
        test("cancels previous call with same global key", async ({ page }) => {
          await page.goto(`/${workerType}/once/`);

          // Set up first computation
          await page.getByLabel("input a for test 3").fill("6");
          await page.getByLabel("input b for test 3").fill("7");

          // Start first computation
          await page
            .getByRole("button", { name: "compute global onceby test 3" })
            .click();

          // Wait for it to start loading
          await expect(
            page.getByRole("button", { name: /loading.*test 3/ }),
          ).toBeVisible({ timeout: 1000 });

          // Quickly start a second computation with different values
          await page.getByLabel("input a for test 3").fill("8");
          await page.getByLabel("input b for test 3").fill("2");
          await page.getByRole("button", { name: /loading.*test 3/ }).click();

          // The result should be from the second computation (8 * 2 = 16)
          await expect(page.getByRole("button", { name: "16" })).toBeVisible({
            timeout: 10000,
          });
        });
      });
    });
  }
});
