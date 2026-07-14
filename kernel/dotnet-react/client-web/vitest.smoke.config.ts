/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// UI-5 composed-entrypoint smoke. Separate config so `npm test` (the unit tier) never picks it up: the smoke
// needs a running server (the e2e context; scripts/e2e.sh runs it after the harness).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tools/smoke/**/*.smoke.{ts,tsx}'],
  },
});
