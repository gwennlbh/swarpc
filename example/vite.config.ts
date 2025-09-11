import { sveltekit } from "@sveltejs/kit/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  worker: {
    format: "es",
    plugins: () => [svelte()],
  },
  build: {
    minify: false,
  },
});
