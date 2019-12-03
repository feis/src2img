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

async function main () {
  const fakeroot = 'http://127.0.0.1'

  const isHtmlEnabled = hasParam('--html')
  const inputDir = getParam('--input', 'in')
  const outputDir = getParam('--output', 'out')
  const configFile = getParam('--config', null)



  const browser = await puppeteer.launch()

  console.log('Input directory: ' + inputDir)

  const page = await browser.newPage()
  await page.setViewport({ width: 2000, height: 1 })
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

  const configs =
    configFile === null ?  
      fs.readdirSync(inputDir)
        .filter(e => ['.cpp', '.cc']
        .includes(path.extname(e)))
        .map((e) => { return {filename: e}; }) :
      JSON.parse(fs.readFileSync(configFile, 'utf8'))

  for (const config of configs) {
    console.log('Processing: ' + config.filename)
    const inputFilepath = path.join(inputDir, config.filename)

    const startLine = config.startLine || 2

    const lines =
      escapeHtmlEntities(fs.readFileSync(inputFilepath, 'utf8'))
        .trim()
        .split('\n')

    const endLine = config.endLine || lines.length

    const src = lines.slice(startLine - 1, endLine).join('\n')

    html = template(fs.readFileSync('template.html', 'utf8'))({ src, startLine })

    if (isHtmlEnabled) {
      fs.writeFileSync(
        path.join(outputDir, config.filename + '.html'),
        html,
        'utf8')
    }

    await page.goto(fakeroot)

    const filename = config.filename.replace(/^.*[\\\/]/, '')

    const outputFilename = `${filename}.${startLine}-${endLine}.png`

    const outputFilepath = path.join(outputDir, outputFilename)

    await page.screenshot({
      path: outputFilepath,
      fullPage: true,
      omitBackground: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
