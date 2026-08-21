import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Harness state, and the nested git worktrees agents run in — each
    // carries its own node_modules, which is not this project's code.
    ".claude/**",
  ]),
  {
    // Layering rule from CLAUDE.md: repository.ts is the only place the
    // prisma client is imported. Enums/types from @/generated/prisma/enums
    // stay importable everywhere.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/**/repository.ts", "src/lib/prisma.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message: "prisma may only be imported from src/lib/**/repository.ts",
            },
            {
              name: "@/generated/prisma/client",
              message: "prisma may only be imported from src/lib/**/repository.ts (via @/lib/prisma)",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
