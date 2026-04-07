import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      APIFY_API_TOKEN: process.env.APIFY_API_TOKEN ?? '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
    testTimeout: 300000, // agent pipeline can take 2-3 minutes
  },
})
