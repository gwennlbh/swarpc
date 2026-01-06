import { test, expect } from "@playwright/test";

test.describe("cancelable computation", () => {
  // TODO test workerType=service
  for (const workerType of ["shared", "dedicated"]) {
    test.describe(`using a ${workerType} worker`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`/${workerType}/`);
        await page.getByRole("spinbutton").first().fill("2");
        await page.getByRole("spinbutton").nth(1).fill("5");
        await page.getByRole("button", { name: "compute" }).click();
      });

      test("completes and shows progress", async ({ page }) => {
        const result = page.getByRole("button").first();
        await expect(result).toHaveAccessibleName("loading... 0%");
        await expect(result).toHaveAccessibleName("loading... 20%");
        await expect(result).toHaveAccessibleName("loading... 40%");
        await expect(result).toHaveAccessibleName("loading... 60%");
        await expect(result).toHaveAccessibleName("loading... 80%");
        await expect(result).toHaveAccessibleName("10");
      });

      test("can be canceled", async ({ page }) => {
        const result = page.getByRole("button").first();
        await expect(result).toHaveAccessibleName("loading... 0%");
        await expect(result).toHaveAccessibleName("loading... 20%");
        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(result).toHaveAccessibleName("compute");
      });
    });
  }
});
