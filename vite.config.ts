import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // `docx` is only reached through `await import('docx')` (P3); give its chunk a
        // recognisable name so the on-demand load is visible in the network panel.
        codeSplitting: {
          groups: [{ name: 'docx', test: /[\\/]node_modules[\\/]docx[\\/]/ }],
        },
      },
    },
  },
})
