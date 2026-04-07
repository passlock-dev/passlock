// vitest.config.ts

import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vitest/config"

const resolveAliases = {
  resolve: {
    alias: {
      "@test": fileURLToPath(new URL("./test", import.meta.url)),
    },
  },
} as const

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
        ...resolveAliases,
      },
      {
        test: {
          include: ["src/**/*.it.test.ts"],
          name: "integration",
        },
        ...resolveAliases,
      },
    ],
  },
})
