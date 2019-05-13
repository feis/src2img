const puppeteer = require('puppeteer')
const fs = require('fs')
const prismjs = require('prismjs')
const loadPrismLanguages = require('prismjs/components/')
const { template } = require('lodash')
const path = require('path')

loadPrismLanguages(['cpp'])

async function main () {
  const inputDirArgIndex = process.argv.indexOf('--input')
  const inputDir =
    inputDirArgIndex === -1 ? 'in' : process.argv[inputDirArgIndex+1]

  const outputDirArgIndex = process.argv.indexOf('--output')
  const outputDir = 
    outputDirArgIndex === -1 ? 'out' : process.argv[outputDirArgIndex+1]

  const css =
    fs.readFileSync(
      require.resolve('prismjs/themes/prism.css'))

  const browser = await puppeteer.launch()

  for (const inputFilename of fs.readdirSync(inputDir)) {
    const inputFilepath = path.join(inputDir, inputFilename)
    console.log(inputFilepath)
    const src = fs.readFileSync(inputFilepath, 'utf8')
    const highlighted = prismjs.highlight(src, prismjs.languages.cpp, 'cpp')
    const page = await browser.newPage()
    await page.setContent(
      template(fs.readFileSync('template.html', 'utf8'))({
        css,
        highlighted,
      }))

    const outputFilepath = path.join(outputDir, inputFilename + '.png')
    console.log(outputFilepath)
    await page.screenshot({ path: outputFilepath, fullpage: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
