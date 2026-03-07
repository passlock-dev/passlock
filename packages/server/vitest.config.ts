// vitest.config.ts

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          exclude: ["src/**/*.it.test.ts"],
          include: ["src/**/*.test.ts"],
          name: "unit",
        },
        plugins: [tsconfigPaths()],
      },
      {
        test: {
          include: ["src/**/*.it.test.ts"],
          name: "integration",
        },
        plugins: [tsconfigPaths()],
      },
    ],
  },
})
