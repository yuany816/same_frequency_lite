const http = require('http')
const fs = require('fs')
const path = require('path')

const port = Number(process.env.PORT || 8080)
const root = path.join(__dirname, 'dist')

const contentTypes = {
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
}

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  const requested = decodeURIComponent((req.url || '/').split('?')[0])
  const filePath = path.resolve(root, `.${requested}`)
  if (!filePath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (error, stats) => {
    const target = !error && stats.isFile() ? filePath : path.join(root, 'app.json')
    fs.readFile(target, (readError, data) => {
      if (readError) {
        res.writeHead(404)
        res.end('Not Found')
        return
      }
      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(target)] || 'application/octet-stream'
      })
      res.end(data)
    })
  })
}).listen(port, '0.0.0.0', () => {
  console.log(`mini-program build server listening on ${port}`)
})
