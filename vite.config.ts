/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/zombie-game/',
  test: {
    environment: 'jsdom',
  },
})
