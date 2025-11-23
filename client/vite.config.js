import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically exposes VITE_* environment variables to import.meta.env
  // No need for manual define, but keeping for explicit fallback
})
