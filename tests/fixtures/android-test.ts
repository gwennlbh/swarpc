import { test as base, expect } from "@playwright/test";
import { _android } from "playwright";
import type { AndroidDevice } from "playwright";

const androidTest = base.extend<object, { device: AndroidDevice }>({
  // One ADB connection per worker process
  device: [
    async ({}, use) => {
      const [device] = await _android.devices();
      await use(device);
      await device.close();
    },
    { scope: "worker" },
  ],

  // New Chrome browser context per test for isolation
  // (SharedWorker is intentionally excluded — it is not supported on Chrome for Android:
  //  https://issues.chromium.org/issues/40290702)
  context: async ({ device, baseURL }, use) => {
    const context = await device.launchBrowser({
      pkg: "com.android.chrome",
      baseURL,
      serviceWorkers: "allow",
    });
    await use(context);
    await context.close();
  },
});

export const test = process.env.ANDROID === "1" ? androidTest : base;

export { expect };
