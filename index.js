const http = require('http')
const httpShutdown = require('http-shutdown')
const puppeteer = require('puppeteer')
const fs = require('fs')
const prismjs = require('prismjs')
const loadPrismLanguages = require('prismjs/components/')
loadPrismLanguages(['cpp'])

function handleCssRequest (res) {
  res.end(
    fs.readFileSync(
      require.resolve('prismjs/themes/prism.css')
    )
  )
}

async function requestHandler (req, res) {
  if (req.url === '/themes/prism.css') {
    handleCssRequest(res)
    return
  }

  const src = fs.readFileSync(process.argv[process.argv.length-1], 'utf8')
  const highlighted = await prismjs.highlight(src, prismjs.languages.cpp, 'cpp')
  res.end(`<html>
  <head>
    <link href="themes/prism.css" rel="stylesheet" />
  </head>
  <body>
    <pre><code class="language-cpp">${highlighted}</code></pre>
  </body>
  </html>`)
}

async function main () {
  const port = 3000
  const server = httpShutdown(http.createServer(requestHandler))
  server.listen(port)

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:${port}`)
  await page.screenshot({ path: 'test.png', fullpage: true })
  await browser.close()

  if (process.argv.indexOf('--server') !== -1) {
    console.log('Server mode')
    process.on('SIGINT', () => {
      server.shutdown()
    })
    return
  }

  server.shutdown()
}

module.exports = new Promise(main)
