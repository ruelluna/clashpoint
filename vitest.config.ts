import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
})
