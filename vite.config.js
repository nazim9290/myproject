import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// AgencyBook — Production build config
// Source map বন্ধ — কেউ original code দেখতে পাবে না
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: "es2020",
  },
})
