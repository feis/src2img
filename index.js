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

function getParam (paramName, defaultValue) {
  const index = process.argv.indexOf(paramName)
  return index === -1 ? defaultValue : process.argv[ index + 1 ]
}

function hasParam (paramName) {
  return process.argv.indexOf(paramName) !== -1
}

function readConfig (configFilename) {
  return null
}

async function main () {
  const fakeroot = 'http://127.0.0.1'

  const isHtmlEnabled = hasParam('--html')
  const inputDir = getParam('--input', 'in')
  const outputDir = getParam('--output', 'out')
  const configFile = getParam('--config', null)

  const config = readConfig(configFile)

  const browser = await puppeteer.launch()

  console.log('Input directory: ' + inputDir)

  const inputFilenames =
    fs.readdirSync(inputDir)
      .filter(e => ['.cpp', '.cc'].includes(path.extname(e)))

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1 })
  await page.setRequestInterception(true)

  let html = ''

  page.on('request', request => {
    const fileRelativePath = request.url().substr(fakeroot.length)
    if (fileRelativePath === '/') {
      request.respond({ body: html })
    } else if (fileRelativePath === '/prism.css') {
      request.respond({ body: fs.readFileSync('prism.css') })
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
    const truncated = escapeHtmlEntities(fs.readFileSync(inputFilepath, 'utf8')).trim().split('\n')
    truncated.shift()
    const src = truncated.join('\n')
    const startLine = 2

    html = template(fs.readFileSync('template.html', 'utf8'))({ src, startLine })

    if (isHtmlEnabled) {
      fs.writeFileSync(
        path.join(outputDir, inputFilename + '.html'),
        html)
    }

    await page.goto(fakeroot)
    const outputFilepath = path.join(outputDir, inputFilename + '.png')
    await page.screenshot({
      path: outputFilepath,
      fullPage: true,
      omitBackground: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
