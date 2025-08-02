import { defineConfig } from "vite"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["@vitest/web-worker"],
  },
})
