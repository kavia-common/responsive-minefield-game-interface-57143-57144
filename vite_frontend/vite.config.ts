import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PUBLIC_INTERFACE
export default defineConfig({
  /** Vite config for the Minesweeper frontend. */
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Ensure existing tests in src/test/ are discovered by default runs.
    // Vitest defaults to **/*.{test,spec}.* which does not match test_engine.ts / test_ui.tsx.
    include: ['src/test/test_*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
    globals: true
  },
  server: {
    port: 3000,
    strictPort: false
  }
})
