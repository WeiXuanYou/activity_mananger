import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests are kept to **pure, server-free** helpers — dates, math,
 * sorting, format conversion. Anything that needs Next runtime, Prisma,
 * or React render is tested via the puppeteer audit scripts at the
 * project root.
 *
 * Why this split: vitest tests run in ~50ms each, so a CI build can run
 * 100s of them on every push without slowing the loop. Heavyweight E2E
 * scripts stay opt-in and run pre-merge.
 */
export default defineConfig({
  test: {
    include: ["modules/**/*.{test,spec}.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
