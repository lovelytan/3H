const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 8002
const PUBLIC_DIR = path.join(__dirname)

const server = http.createServer((req, res) => {
  // 获取请求的文件路径
  let filePath = path.join(PUBLIC_DIR, req.url)

  // 如果请求的是目录，则默认返回index.html
  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 文件不存在，返回404错误
      res.statusCode = 404
      res.end()
    } else {
      // 文件存在，读取文件并返回
      fs.readFile(filePath, (err, data) => {
        if (err) {
          // 读取文件出错，返回500错误
          res.statusCode = 500
          res.end()
        } else {
          // 返回文件内容
          res.setHeader('Content-Type', getContentType(filePath))
          res.end(data)
        }
      })
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`)
})

// 根据文件后缀名获取Content-Type
function getContentType (filePath) {
  const extname = path.extname(filePath).toLowerCase()
  switch (extname) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'text/javascript'
    case '.json':
      return 'application/json'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}
