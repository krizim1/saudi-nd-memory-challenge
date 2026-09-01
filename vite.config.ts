import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Reachable from the event touchscreen on the same network.
    host: true,
    port: 5173,
  },
  test: {
    // Logic specs run in node; anything that renders opts into jsdom
    // with a `// @vitest-environment jsdom` pragma.
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
})
