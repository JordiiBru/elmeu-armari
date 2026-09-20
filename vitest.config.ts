import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // One home for unit tests: tests/unit, named after what they cover.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
