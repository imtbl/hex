const { Worker, isMainThread, parentPort } = require('worker_threads')

if (isMainThread) {
  const logger = require('../util/logger')

  module.exports = {
    run (url, cookies) {
      const worker = new Worker(__filename)

      worker.on('message', message => logger.log(message.text, message.type))

      worker.postMessage({ url, cookies })
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

    const data = await exh.download(message.url, message.cookies, parentPort)

    if (config.skipImport) {
      parentPort.postMessage({
        text: `${message.url}: skipping hydrus import.`,
        type: 'info'
      })

      parentPort.unref()

      process.exit(0)
    }

    await hydrus.import(data, parentPort)
  })
}
