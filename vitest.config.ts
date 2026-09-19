import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Most unit tests live under tests/unit/, but a couple (engine.ts,
    // color-matching.ts) sit next to the module they test. Both patterns
    // are included — dropping the first is what silently took
    // src/lib/outfits/{engine,color-matching}.test.ts out of every run,
    // this repo's and CI's alike, since before this fix nothing pointed
    // at them at all.
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
