import { defineConfig } from "@playwright/test";
import { minutesToMilliseconds } from "date-fns";

/**
 * Playwright configuration for running end-to-end tests on Chrome for Android.
 *
 * SharedWorker is not tested here because it is not supported on Chrome for Android:
 * https://issues.chromium.org/issues/40290702
 *
 * @see https://playwright.dev/docs/api/class-android
 */
export default defineConfig({
  /* Leave some time before github actions makes the job time out, so the report can be deployed */
  globalTimeout: minutesToMilliseconds(50),
  /* Extra time per test to account for Android emulator overhead */
  timeout: minutesToMilliseconds(2),
  testDir: "./tests/e2e/android",
  /* Run tests serially — the emulator only has one Chrome instance */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker: Android emulator can only run one Chrome at a time */
  workers: 1,
  /* Reporter to use */
  reporter: process.env.CI ? [["blob"], ["github"], ["list"]] : [],
  use: {
    /* The preview server is accessible from the Android emulator via adb reverse */
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    timezoneId: "Europe/Paris",
  },
  /* Start the built example site before running tests */
  webServer: {
    command: "npm run preview",
    cwd: "example",
    port: 4173,
    reuseExistingServer: false,
  },
});
