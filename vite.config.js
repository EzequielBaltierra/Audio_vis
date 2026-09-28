import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs work at both a domain root and GitHub Pages' /Audio_vis/ path.
  base: './',
  build: {
    sourcemap: false,
    target: 'baseline-widely-available',
  },
  plugins: [react()],
})
