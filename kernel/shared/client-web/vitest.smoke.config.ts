/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// UI-5 composed-entrypoint smoke. Separate config so `npm test` (the unit tier) never picks it up: the smoke
// needs a BUILT client and a running server, and the edition's own e2e orchestrator supplies both, in that order
// (E-107). Named as a role rather than a path because this file is shared and the two editions name their
// orchestrators differently (E-105).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tools/smoke/**/*.smoke.{ts,tsx}'],
  },
});
