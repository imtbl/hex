const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')
const fetch = require('node-fetch')
const Zip = require('adm-zip')

const config = require('../config')

const downloadArchive = (url, destination) => {
  const zipDestination = `${destination}.zip`

  return fetch(url)
    .then(res => res.ok
      ? res
      : Promise.reject(new Error('Initial error downloading file.'))
    )
    .then(res => {
      if (!res.ok) {
        return Promise.reject(new Error('Initial error downloading file.'))
      }

      const stream = fs.createWriteStream(zipDestination)

      return new Promise((resolve, reject) => {
        const errorHandler = () => {
          reject(new Error('Unable to download file.'))
        }

        res.body
          .on('error', errorHandler)
          .pipe(stream)

        stream
          .on('error', errorHandler)
          .on('finish', () => {
            resolve(zipDestination)
          })
      }).then(zipDestination => {
        return zipDestination
      }, err => {
        return Promise.reject(err)
      })
    })
}

const removeArchive = archivePath => {
  const zipPath = `${archivePath}.zip`

  return new Promise((resolve, reject) => {
    fs.unlink(zipPath, err => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })
}

module.exports = {
  async download (url, cookies, port) {
    let browser

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: config.browserWSEndpoint
      })
    } catch (err) {
      port.postMessage({
        text: `${url}: error while trying to connect to browser.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    let page

    try {
      page = await browser.newPage()
    } catch (err) {
      port.postMessage({
        text: `${url}: error while trying to open a new browser page.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    page.setExtraHTTPHeaders({
      Cookie: cookies
    })

    try {
      await page.goto(url)
    } catch (err) {
      port.postMessage({
        text: `${url}: error while trying to open ${url}.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    let namespacedTags

    try {
      namespacedTags = await page.evaluate(() => {
        const namespacedTags = []

        const title = document.getElementById('gn')

        namespacedTags.push({
          namespace: 'title',
          tags: [title.textContent.toLowerCase()]
        })

        const tagList = document.getElementById('taglist')

        for (const namespace of tagList.querySelectorAll('table tbody tr')) {
          const tags = []

          for (const tagItem of namespace.querySelectorAll('td a')) {
            tags.push(tagItem.textContent)
          }

          namespacedTags.push({
            namespace: namespace.querySelector('.tc')
              .textContent
              .replace(/:([^:]*)$/, '$1'),
            tags
          })
        }

        return namespacedTags
      })
    } catch (err) {
      port.postMessage({
        text: `${url}: does not seem to be a valid ExH gallery.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    let i = namespacedTags.length

    while (i--) {
      if (config.blacklistedNamespaces.includes(namespacedTags[i].namespace)) {
        namespacedTags.splice(i, 1)
      }
    }

    let downloadButtonOnClick

    try {
      downloadButtonOnClick = await page.evaluate(() => {
        const downloadButton = document.querySelector('#gd5 .g2.gsp a')

        return downloadButton.getAttribute('onclick')
      })
    } catch (err) {
      port.postMessage({
        text: `${url}: does not seem to be a valid ExH gallery.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    const match = /^return popUp\('(.+)'/.exec(downloadButtonOnClick)

    if (!(match && match[1])) {
      port.postMessage({
        text: `${url}: does not seem to be a valid ExH gallery.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    try {
      await page.goto(match[1])
    } catch (err) {
      port.postMessage({
        text: `${url}: error while trying to open ${match[1]}.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    try {
      await page.click(
        'input[type="submit"][value="Download Original Archive"]'
      )
    } catch (err) {
      port.postMessage({
        text: `${url}: could not click download button on ${match[1]}.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    await page.waitForNavigation()

    const downloadLink = `${page.url()}?start=1`

    try {
      await browser.close()
    } catch (err) {
      port.postMessage({
        text: `${url}: browser did not close correctly.`,
        type: 'warning'
      })
    }

    let downloadPath

    try {
      downloadPath = path.resolve(
        config.importPath, `hex_${Math.floor(Date.now())}`
      )

      new Zip(await downloadArchive(downloadLink, downloadPath)).extractAllTo(
        downloadPath, true
      )

      await removeArchive(downloadPath)
    } catch (err) {
      port.postMessage({
        text: `${url}: error while trying to download ${downloadLink}.`,
        type: 'error'
      })

      port.unref()

      process.exit(1)
    }

    port.postMessage({
      text: `${url}: successfully downloaded and extracted to ` +
        `${downloadPath}.`,
      type: 'info'
    })

    return {
      url,
      downloadPath,
      namespacedTags
    }
  }
}
