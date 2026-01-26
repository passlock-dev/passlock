// vitest.config.ts
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
      },
      {
        test: {
          include: ["src/**/*.it.test.ts"],
          name: "integration",
        },
      },
    ],
  },
})
