import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Env files (.env.development, .env.production, and their .local overrides)
  // live at the repo root now — shared with mobile (Expo) and server (Express)
  // instead of duplicated per subproject.
  envDir: path.resolve(__dirname, '..'),
})
