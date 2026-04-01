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
  // প্রোডাকশনে console.log/warn সরিয়ে ফেলো, console.error রাখো (error tracking-এর জন্য)
  esbuild: {
    pure: process.env.NODE_ENV === "production" ? ["console.log", "console.warn"] : [],
  },
})
