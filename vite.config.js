import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    sourcemap: false,
    target: 'baseline-widely-available',
  },
  plugins: [react()],
})
