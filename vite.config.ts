import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: 'tests/demo',
  plugins: [
    react(),
    {
      name: 'mount-dist',
      configurePreviewServer(server) {
        const distPath = path.resolve(process.cwd(), 'dist')
        server.middlewares.use('/dist', (req, res, next) => {
          const subPath = (req.url ?? '/').replace(/^\//, '')
          const filePath = path.join(distPath, subPath)
          if (path.relative(distPath, filePath).startsWith('..')) return next()
          fs.stat(filePath, (err, stat) => {
            if (err || !stat.isFile()) return next()
            fs.createReadStream(filePath).on('error', next).pipe(res)
          })
        })
      },
    },
  ],
  resolve: {
    alias: {
      htmm: path.resolve(__dirname, 'src'),
    },
  },
})
