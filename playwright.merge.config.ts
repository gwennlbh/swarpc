import { defineConfig } from "@playwright/test";

/**
 * Config used only for `playwright merge-reports`.
 *
 * Blob reports from different CI environments (Docker container, Android runner)
 * record different absolute paths for testDir. This config provides a single
 * canonical testDir so merging succeeds regardless of where each shard ran.
 */
export default defineConfig({
  testDir: "./tests/e2e",
});
