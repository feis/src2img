const puppeteer = require('puppeteer')
const fs = require('fs')
const { template } = require('lodash')
const path = require('path')

var tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
}

function replaceTag (tag) {
  return tagsToReplace[tag] || tag
}

function escapeHtmlEntities (str) {
  return str.replace(/[&<>]/g, replaceTag)
}

async function main () {
  const fakeroot = 'http://127.0.0.1'

  const isHtmlEnabled = process.argv.indexOf('--html') !== -1

  const inputDirArgIndex = process.argv.indexOf('--input')
  const inputDir =
    inputDirArgIndex === -1 ? 'in' : process.argv[ inputDirArgIndex + 1 ]

  const outputDirArgIndex = process.argv.indexOf('--output')
  const outputDir =
    outputDirArgIndex === -1 ? 'out' : process.argv[ outputDirArgIndex + 1 ]

  const browser = await puppeteer.launch()

  console.log('Input directory: ' + inputDir)

  const inputFilenames =
    fs.readdirSync(inputDir)
      .filter(e => path.extname(e) === '.cpp')

  const page = await browser.newPage()
  await page.setRequestInterception(true)

  let html = ''

  page.on('request', request => {
    const fileRelativePath = request.url().substr(fakeroot.length)
    if (fileRelativePath === '/') {
      request.respond({ body: html })
    } else {
      request.respond({
        body:
          fs.readFileSync(
            path.join(
              path.dirname(require.resolve('prismjs')),
              fileRelativePath)) })
    }
  })

  for (const inputFilename of inputFilenames) {
    console.log('Processing: ' + inputFilename)
    const inputFilepath = path.join(inputDir, inputFilename)
    const src = escapeHtmlEntities(fs.readFileSync(inputFilepath, 'utf8'))

    html = template(fs.readFileSync('template.html', 'utf8'))({ src })

    if (isHtmlEnabled) {
      fs.writeFileSync(
        path.join(outputDir, inputFilename + '.html'),
        html)
    }

    await page.goto(fakeroot)
    const outputFilepath = path.join(outputDir, inputFilename + '.png')
    await page.screenshot({ path: outputFilepath, fullPage: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
