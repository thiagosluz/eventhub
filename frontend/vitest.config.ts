import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.tsx'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.stories.*', '**/storybook-static/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'src/types/**',
        'src/**/*.d.ts',
        'src/test-setup.ts',
        'src/app/layout.tsx',
        'src/app/providers.tsx',
        'src/**/*.stories.*',
      ],
    },
  },
});
