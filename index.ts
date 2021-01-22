const puppeteer = require('puppeteer')
const fs = require('fs')
const { template } = require('lodash')
const path = require('path')

const tagsToReplace : {[tag: string]: string} = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
}

function replaceTag (tag: string) : string {
  return tagsToReplace[tag] || tag
}

function escapeHtmlEntities (str: string) {
  return str.replace(/[&<>]/g, replaceTag)
}

function getParam (paramName: string, defaultValue: string|null) {
  const index = process.argv.indexOf(paramName)
  return index === -1 ? defaultValue : process.argv[ index + 1 ]
}

function hasParam (paramName: string) {
  return process.argv.indexOf(paramName) !== -1
}

async function main () {
  const fakeRoot = 'http://127.0.0.1'

  const isHtmlEnabled = hasParam('--html')
  const configFile = getParam('--config', 'config.json')

  const browser = await puppeteer.launch()

  const configs : {
    input: string,
    output: string,
    language: "cpp"|"python",
    sources: any[],
  } = JSON.parse(fs.readFileSync(configFile, 'utf8'))

  console.log('Input directory: ' + configs.input)

  const page = await browser.newPage()
  await page.setViewport({ width: 2000, height: 1 })
  await page.setRequestInterception(true)

  let html = ''

  page.on('request', (request: any) => {
    const fileRelativePath = request.url().substr(fakeRoot.length)
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



  for (const config of configs.sources) {
    console.log('Processing: ' + config.filename)
    const inputFilepath = path.join(configs.input, config.filename)

    const startLine = config.startLine || 2

    const lines =
        escapeHtmlEntities(fs.readFileSync(inputFilepath, 'utf8'))
          .trim()
          .split('\n')

    const endLine = config.endLine || lines.length

    const src = lines.slice(startLine - 1, endLine).join('\n')

    html = template(fs.readFileSync('template_'+configs.language+'.html', 'utf8'))({ src, startLine })

    if (isHtmlEnabled) {
      fs.writeFileSync(
        path.join(config.output, config.filename + '.html'),
        html,
        'utf8')
    }

    await page.goto(fakeRoot)

    let filename = config.filename.replace(/^.*[\\\/]/, '');
    const outputFilename = `${filename}.${startLine}-${endLine}.png`

    const outputFilepath = path.join(configs.output, outputFilename)

    await page.screenshot({
      path: outputFilepath,
      fullPage: true,
      omitBackground: true })
  }
  await browser.close()
}

module.exports = new Promise(main)
