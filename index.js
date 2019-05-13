const puppeteer = require('puppeteer')
const fs = require('fs')
const prismjs = require('prismjs')
const loadPrismLanguages = require('prismjs/components/')
const { template } = require('lodash')

loadPrismLanguages(['cpp'])

async function main () {
  const outputFilename = 'test.png'

  const css =
    fs.readFileSync(
      require.resolve('prismjs/themes/prism.css'))

  const src = fs.readFileSync(process.argv[process.argv.length - 1], 'utf8')
  const highlighted = prismjs.highlight(src, prismjs.languages.cpp, 'cpp')

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(
    template(fs.readFileSync('template.html', 'utf8'))({
      css,
      highlighted,
    }))
  await page.screenshot({ path: outputFilename, fullpage: true })
  await browser.close()
}

module.exports = new Promise(main)
