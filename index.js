const http = require('http')
const httpShutdown = require('http-shutdown')
const puppeteer = require('puppeteer')
const fs = require('fs')
const prismjs = require('prismjs')
const loadPrismLanguages = require('prismjs/components/')
const { template } = require('lodash')

loadPrismLanguages(['cpp'])

function cssRequestHandler (res) {
  res.end(
    fs.readFileSync(
      require.resolve('prismjs/themes/prism.css')
    )
  )
}

async function rootRequestHandler (req, res) {
  if (req.url === '/themes/prism.css') {
    cssRequestHandler(res)
    return
  }

  const src = fs.readFileSync(process.argv[process.argv.length - 1], 'utf8')
  const highlighted = prismjs.highlight(src, prismjs.languages.cpp, 'cpp')
  res.end(template(fs.readFileSync('template.html', 'utf8'))({ highlighted }))
}

async function main () {
  const outputFilename = 'test.png'
  const port = 3000

  const server = httpShutdown(http.createServer(rootRequestHandler))
  server.listen(port)

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:${port}`)
  await page.screenshot({ path: outputFilename, fullpage: true })
  await browser.close()

  process.on('SIGINT', () => {
    server.shutdown()
  })

  if (process.argv.indexOf('--server') !== -1) {
    console.log('Server mode')
  } else {
    process.kill(process.pid, 'SIGINT')
  }
}

module.exports = new Promise(main)
