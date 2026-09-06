/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  base: '/zombie-game/',
  server: {
    port: 5174,
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
})
