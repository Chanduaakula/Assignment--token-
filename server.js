// Production server for Render: serves the built Vite app (dist/) and /api handlers.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const PORT = Number(process.env.PORT) || 3000
const DIST = path.resolve('dist')
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
}

http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0]

  if (url.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }
    res.status = (c) => { res.statusCode = c; return res }
    res.json = (d) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)) }
    const name = url.replace(/^\/api\//, '')
    if (!/^[\w-]+$/.test(name)) return res.status(404).json({ error: 'Not found.' })
    try {
      const chunks = []
      for await (const c of req) chunks.push(c)
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch { req.body = {} }
      const { default: handler } = await import(pathToFileURL(path.resolve('api', `${name}.js`)).href)
      return await handler(req, res)
    } catch (err) {
      console.error(err)
      if (!res.headersSent) res.status(500).json({ error: 'Internal error.' })
      return
    }
  }

  let file = path.join(DIST, path.normalize(url))
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html')
  }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`Server on port ${PORT}`))
