const http = require('http')
const httpShutdown = require('http-shutdown')
const puppeteer = require('puppeteer')

function requestHandler (req, res) {
  res.end('test')
}

async function main () {
  const port = 3000
  const server = httpShutdown(http.createServer(requestHandler))
  server.listen(port)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
//  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`http://127.0.0.1:${port}`)
  await page.screenshot({ path: 'test.png', fullpage: true })
  await browser.close()
  server.shutdown()
}

module.exports = new Promise(main)
