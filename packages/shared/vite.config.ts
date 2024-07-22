import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', ['html', { subdir: 'html' }]],
      exclude: [],
    },
  },
})
