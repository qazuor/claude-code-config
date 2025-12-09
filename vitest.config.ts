import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['test/integration/**/*.test.ts', 'node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/bin.ts',
        'src/cli/index.ts',
        'src/cli/commands/**/*.ts',
        'src/cli/prompts/**/*.ts',
        'src/index.ts',
        'src/lib/index.ts',
        'src/**/index.ts',
        'src/**/*.d.ts',
        'src/types/**/*.ts',
        'src/lib/scaffold/generator.ts',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 70,
          functions: 75,
          lines: 80,
        },
      },
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
