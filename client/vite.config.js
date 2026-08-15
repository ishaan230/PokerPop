import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let branch = 'unknown'
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
} catch (e) {}

const buildTime = new Date().toLocaleString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_INFO__: JSON.stringify({ branch, buildTime })
  }
})
