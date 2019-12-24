const { Worker, isMainThread, parentPort } = require('worker_threads')

if (isMainThread) {
  const logger = require('../util/logger')

  module.exports = {
    run (url, cookies, settings) {
      const worker = new Worker(__filename)

      worker.on('message', message => logger.log(message.text, message.type))

      worker.postMessage({ url, cookies, settings })
    }
  }
} else {
  const config = require('../config')
  const exh = require('../exh')
  const hydrus = require('../hydrus')

  parentPort.once('message', async message => {
    parentPort.postMessage({
      text: `${message.url}: starting download.`,
      type: 'info'
    })

    const data = await exh.download(
      message.url, message.cookies, message.settings, parentPort
    )

    parentPort.postMessage({
      text: `${message.url}: successfully downloaded and extracted to ` +
        `${data.downloadPath}.`,
      type: 'info'
    })

    const skipImport = typeof message.settings.skipImport === 'boolean'
      ? message.settings.skipImport
      : typeof message.settings.skipImport === 'string' &&
        ['true', 'false'].includes(message.settings.skipImport)
        ? message.settings.skipImport === 'true'
        : config.skipImport

    if (skipImport) {
      parentPort.postMessage({
        text: `${message.url}: skipping hydrus import.`,
        type: 'info'
      })

      parentPort.close()

      process.exit(0)
    }

    await hydrus.import(data, message.settings, parentPort)
  })
}
