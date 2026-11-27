// Local-only dev server: runs api/*.js handlers on port 3001 without `vercel dev`.
// Not used in production (Vercel serves /api there).
import http from 'node:http'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const PORT = Number(process.env.PORT) || 3001

const server = http.createServer(async (req, res) => {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  const name = (req.url || '').split('?')[0].replace(/^\/api\//, '')
  if (!/^[\w-]+$/.test(name)) return res.status(404).json({ error: 'Not found.' })

  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString()
    try {
      req.body = raw ? JSON.parse(raw) : {}
    } catch {
      req.body = {}
    }

    const file = pathToFileURL(path.resolve('api', `${name}.js`)).href
    const { default: handler } = await import(file)
    await handler(req, res)
  } catch (err) {
    console.error(err)
    if (!res.headersSent) res.status(500).json({ error: 'Internal error.' })
  }
})

server.listen(PORT, () => console.log(`API dev server: http://localhost:${PORT}`))
