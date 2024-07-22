import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', ['html', { subdir: 'html' }]],
      exclude: [
        'src/index.ts', // re-exports
        'src/effect.ts', // re-exports        
        'src/config.ts', // no real logic here
        'src/capabilities/*.ts', // wrapper around browser api
        'src/**/*.fixture.ts', // test fixtures
        'src/test/fixtures.ts', // test fixtures
      ],
    },
  },
  server: {
    port: 5174
  }
})
