import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isMinified = process.env.BUILD_MINIFIED === '1'

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: !isMinified,
    minify: isMinified,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'htmm',
      fileName: () => (isMinified ? 'htmm.min.js' : 'htmm.js'),
      formats: ['umd'],
    },
  },
})
