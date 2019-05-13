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

  console.log('Input directory: ' + inputDir)

  const inputFilenames =
    fs.readdirSync(inputDir)
      .filter(e => path.extname(e) === '.cpp')

  for (const inputFilename of inputFilenames) {
    console.log('Processing: ' + inputFilename)
    const inputFilepath = path.join(inputDir, inputFilename)
    const src = fs.readFileSync(inputFilepath, 'utf8')
    const highlighted = prismjs.highlight(src, prismjs.languages.cpp, 'cpp')
    const page = await browser.newPage()
    await page.setContent(
      template(fs.readFileSync('index.tpl', 'utf8'))({
        css,
        highlighted,
      }))

    const outputFilepath = path.join(outputDir, inputFilename + '.png')
    await page.screenshot({ path: outputFilepath, fullPage: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
