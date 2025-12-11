import { defineConfig, devices, PlaywrightTestConfig } from "@playwright/test";
import { minutesToMilliseconds } from "date-fns";

type Project = NonNullable<PlaywrightTestConfig["projects"]>[number];

const chromium: Project = {
  name: "chromium",
  use: {
    ...devices["Desktop Chrome"],
    contextOptions: {
      serviceWorkers: process.env.CI ? "allow" : "block",
    },
  },
};

const firefox: Project = {
  name: "firefox",
  use: { ...devices["Desktop Firefox"] },
};

const webkit: Project = {
  name: "webkit",
  use: {
    ...devices["Desktop Safari"],
    contextOptions: {
      // See https://github.com/microsoft/playwright/issues/1090
      serviceWorkers: "block",
    },
  },
};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Leave some time before github actions makes the job time out (1 hour), so the report can be deployed */
  globalTimeout: minutesToMilliseconds(50),
  timeout: minutesToMilliseconds(1.2),
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ["json", { outputFile: "test-results.json" }],
        [process.env.SHARDING ? "blob" : "html"],
        ["github"],
        ["list"],
      ]
    : [],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: dependsOnTarget({
      live: process.env.BASE_URL,
      dev: "http://localhost:5173",
      built: "http://localhost:4173",
    }),

    // See https://github.com/microsoft/playwright/issues/16357
    bypassCSP: dependsOnTarget({
      live: true,
      dev: false,
      built: false,
    }),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    // Ensure no TZ issues for assertions that depend on time
    timezoneId: "Etc/UTC",
  },

  /* Configure projects for major browsers */
  projects: dependsOnTarget({
    live: [chromium],
    dev: [chromium, firefox, webkit],
    built: [chromium, firefox, webkit],
  }),

  /* Run your local dev server before starting the tests */
  webServer: dependsOnTarget({
    live: undefined,
    dev: {
      command: "npm run dev",
      cwd: "example",
      port: 5173,
      reuseExistingServer: true,
    },
    built: {
      command: "npm run preview",
      cwd: "example",
      port: 4173,
      reuseExistingServer: false,
    },
  }),
});

/**
 *
 * @param  param0
 * @param  param0.live - Value to return if we're checking against a live URL (meaning $BASE_URL is set)
 * @param  param0.built - Value to return if we're checking against a built version (meaning $CI is set)
 * @param  param0.dev - Value to return if we're checking against a dev server (meaning $CI is not set)
 */
function dependsOnTarget<L, B, D>({
  live,
  built,
  dev,
}: {
  live: L;
  built: B;
  dev: D;
}): L | D | B {
  if (process.env.BASE_URL) return live;
  if (process.env.CI) return built;
  return dev;
}
