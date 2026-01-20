import { test, expect } from "@playwright/test";

/**
 * Returns a regex pattern matching loading text on the button
 * where all nodes have a progress that's at most the given progress.
 * @param progress
 */
function loadingPattern(progress: number, granularity: number): RegExp {
  const progressAlternatives =
    "(" +
    Array.from({
      length: 1 + Math.ceil(progress / granularity),
    })
      .map((_, i) => `${i * granularity}%`)
      .join("|") +
    ")";

  return new RegExp(`^loading... (${progressAlternatives}(, )?)+$`);
}

for (const workerType of ["shared", "dedicated"]) {
  test.describe(`using a ${workerType} worker`, () => {
    for (const broadcast of [false, true]) {
      test.describe(broadcast ? "broadcast" : "single node", () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(
            `/${workerType}/once/${broadcast ? "?nodes=10" : ""}`,
          );
          if (broadcast) {
            await page.getByRole("checkbox", { name: "Broadcast" }).check();
          }
        });

        test.describe(".once() - method scoped", () => {
          test("cancels previous call when new call is made", async ({
            page,
          }) => {
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

            // Capture loading progress sequence to ensure
            // the previous calls no longer affect it
            let loadingTexts: string[] = [];

            async function watchLoadingProgress() {
              while (true) {
                const name = await button.textContent();
                if (!name) continue;

                const lastSeen = loadingTexts.at(-1);

                if (!lastSeen) {
                  loadingTexts.push(name);
                  continue;
                }

                if (lastSeen === name) continue;

                const pattern = /loading... ((?<progress>\d+)%((, )?))+$/;

                if (pattern.test(name) && pattern.test(lastSeen)) {
                  const lastProgress =
                    pattern.exec(lastSeen)!.groups!.progress!;
                  const currentProgress = pattern.exec(name)!.groups!.progress!;

                  // 100% is shown very briefly before the result,
                  // so we can skip it to avoid flakiness
                  // since this watch loop may miss it or may not
                  if (currentProgress === "100") continue;

                  if (lastProgress === currentProgress) continue;
                }

                loadingTexts.push(name);

                await page.waitForTimeout(50);
              }
            }

            await Promise.race([
              page.waitForTimeout(1_600),
              watchLoadingProgress(),
            ]);

            // Quickly start a second computation with different values
            await inputA.fill("3");
            await inputB.fill("4");
            await button.click();

            // The result should be from the second computation (3 * 4 = 12)
            await expect(button).toHaveAccessibleName("12", {
              timeout: 10000,
            });

            await either(
              () =>
                expect(loadingTexts).toMatchObject([
                  loadingPattern(0, 5),
                  loadingPattern(20, 5),
                  loadingPattern(40, 5),
                  loadingPattern(60, 5), // With 60%
                  loadingPattern(0, 5),
                  loadingPattern(25, 5),
                  loadingPattern(50, 5),
                  loadingPattern(75, 5),
                  "12",
                ]),
              () =>
                expect(loadingTexts).toMatchObject([
                  loadingPattern(0, 5),
                  loadingPattern(20, 5),
                  loadingPattern(40, 5),
                  // Without 60%
                  loadingPattern(0, 5),
                  loadingPattern(25, 5),
                  loadingPattern(50, 5),
                  loadingPattern(75, 5),
                  "12",
                ]),
            );
          });

          test("completes normally when no previous call exists", async ({
            page,
          }) => {
            const section = page.locator("#test-once");
            const button = section.getByRole("button");
            const inputA = section.getByRole("spinbutton").first();
            const inputB = section.getByRole("spinbutton").nth(1);

            await inputA.fill("3");
            await inputB.fill("7");
            await button.click();

            // Should show progress and complete
            await expect(button).toHaveAccessibleName(/loading.../);
            await expect(button).toHaveAccessibleName("21", {
              timeout: 10000,
            });
          });
        });

        test.describe(".onceBy(key) - method+key scoped", () => {
          test("cancels previous call with same key", async ({ page }) => {
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
            await expect(button).toHaveAccessibleName("15", {
              timeout: 10000,
            });
          });
        });

        test.describe("global onceBy - global key scoped", () => {
          test("cancels previous call with same global key", async ({
            page,
          }) => {
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
            await expect(button).toHaveAccessibleName("16", {
              timeout: 10000,
            });
          });
        });
      });
    }
  });
}

type MaybePromise<T> = T | Promise<T>;

async function either(
  ...checks: Array<() => MaybePromise<void>>
): Promise<void> {
  const results = await Promise.allSettled([
    ...checks.map(async (check) => check()),
  ]);

  if (
    !results.every(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
  ) {
    return;
  }

  throw results.map((r) => r.reason);
}
