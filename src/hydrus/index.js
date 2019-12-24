const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const slash = require('slash')

const config = require('../config')

const getFilePaths = directoryPath => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, filePaths) => {
      if (err) {
        reject(err)
      }

      let assumedDockerHostImportPath = config.dockerHostImportPath.trim()

      if (assumedDockerHostImportPath) {
        assumedDockerHostImportPath = slash(assumedDockerHostImportPath)

        directoryPath = directoryPath.replace(
          config.importPath, assumedDockerHostImportPath
        )
      }

      filePaths = filePaths.map(
        filePath => path.join(directoryPath, filePath)
      )

      resolve(filePaths)
    })
  })
}

const removeExtractedArchive = archivePath => {
  return new Promise((resolve, reject) => {
    fs.rmdir(archivePath, { recursive: true }, err => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })
}

const getApiVersion = () => {
  return fetch(`${config.hydrusBaseUrl}/api_version`)
}

const verifyAccessKey = () => {
  return fetch(`${config.hydrusBaseUrl}/verify_access_key`, {
    headers: {
      'Hydrus-Client-API-Access-Key': config.hydrusAccessKey
    }
  })
}

const addFile = filePath => {
  return fetch(`${config.hydrusBaseUrl}/add_files/add_file`, {
    method: 'post',
    headers: {
      'Hydrus-Client-API-Access-Key': config.hydrusAccessKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: filePath
    })
  })
}

const associateUrl = (fileHash, url) => {
  return fetch(`${config.hydrusBaseUrl}/add_urls/associate_url`, {
    method: 'post',
    headers: {
      'Hydrus-Client-API-Access-Key': config.hydrusAccessKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url_to_add: url,
      hash: fileHash
    })
  })
}

const addTags = (fileHash, tags) => {
  return fetch(`${config.hydrusBaseUrl}/add_tags/add_tags`, {
    method: 'post',
    headers: {
      'Hydrus-Client-API-Access-Key': config.hydrusAccessKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hash: fileHash,
      service_names_to_tags: {
        [config.hydrusTagService]: tags
      }
    })
  })
}

module.exports = {
  async import (data, port) {
    let apiVersionResponse

    try {
      apiVersionResponse = await getApiVersion()
      apiVersionResponse = await apiVersionResponse.json()
    } catch (err) {
      port.postMessage({
        text: `${data.url}: could not fetch hydrus API version; is the API ` +
          'running?',
        type: 'error'
      })

      if (config.deleteArchivesAfterImport) {
        try {
          await removeExtractedArchive(data.downloadPath)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not delete archive ` +
              `${data.downloadPath}.`,
            type: 'error'
          })
        }
      }

      port.unref()

      process.exit(1)
    }

    if (apiVersionResponse.version < config.hydrusApiVersion) {
      port.postMessage({
        text: `${data.url}: hydrus API version ` +
          `(${apiVersionResponse.version}) is too old, aborting.`,
        type: 'error'
      })

      if (config.deleteArchivesAfterImport) {
        try {
          await removeExtractedArchive(data.downloadPath)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not delete archive ` +
              `${data.downloadPath}.`,
            type: 'error'
          })
        }
      }

      port.unref()

      process.exit(1)
    }

    if (
      apiVersionResponse.version > config.hydrusApiVersion &&
      !config.hydrusAllowNewerApiVersion
    ) {
      port.postMessage({
        text: `${data.url}: newer hydrus API version ` +
          `(${apiVersionResponse.version}) detected and allowing newer ` +
          'versions is disabled, aborting.',
        type: 'error'
      })

      if (config.deleteArchivesAfterImport) {
        try {
          await removeExtractedArchive(data.downloadPath)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not delete archive ` +
              `${data.downloadPath}.`,
            type: 'error'
          })
        }
      }

      port.unref()

      process.exit(1)
    }

    let verifyAccessKeyResponse

    try {
      verifyAccessKeyResponse = await verifyAccessKey()
      verifyAccessKeyResponse = await verifyAccessKeyResponse.json()
    } catch (err) {
      port.postMessage({
        text: `${data.url}: could not verify hydrus API access key.`,
        type: 'error'
      })

      if (config.deleteArchivesAfterImport) {
        try {
          await removeExtractedArchive(data.downloadPath)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not delete archive ` +
              `${data.downloadPath}.`,
            type: 'error'
          })
        }
      }

      port.unref()

      process.exit(1)
    }

    for (const permission of [0, 1, 2]) {
      if (!verifyAccessKeyResponse.basic_permissions.includes(permission)) {
        port.postMessage({
          text: `${data.url}: hydrus API access key is missing required ` +
            'permissions.',
          type: 'error'
        })

        if (config.deleteArchivesAfterImport) {
          try {
            await removeExtractedArchive(data.downloadPath)
          } catch (err) {
            port.postMessage({
              text: `${data.url}: could not delete archive ` +
                `${data.downloadPath}.`,
              type: 'error'
            })
          }
        }

        port.unref()

        process.exit(1)
      }
    }

    let filePaths

    try {
      filePaths = await getFilePaths(data.downloadPath)
    } catch (err) {
      port.postMessage({
        text: `${data.url}: could not read files in ${data.downloadPath}.`,
        type: 'error'
      })

      if (config.deleteArchivesAfterImport) {
        try {
          await removeExtractedArchive(data.downloadPath)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not delete archive ` +
              `${data.downloadPath}.`,
            type: 'error'
          })
        }
      }

      port.unref()

      process.exit(1)
    }

    let currentFileIndex = 0

    for (const filePath of filePaths) {
      currentFileIndex++

      let addFileResponse

      try {
        addFileResponse = await addFile(filePath)
        addFileResponse = await addFileResponse.json()
      } catch (err) {
        port.postMessage({
          text: `${data.url}: could not import file ${filePath} into hydrus.`,
          type: 'error'
        })

        if (config.deleteArchivesAfterImport) {
          try {
            await removeExtractedArchive(data.downloadPath)
          } catch (err) {
            port.postMessage({
              text: `${data.url}: could not delete archive ` +
                `${data.downloadPath}.`,
              type: 'error'
            })
          }
        }

        port.unref()

        process.exit(1)
      }

      if (addFileResponse.status !== 1 && config.skipKnownFiles) {
        port.postMessage({
          text: `${data.url}: file ${filePath} is already known, skipping.`,
          type: 'info'
        })

        continue
      }

      try {
        await associateUrl(addFileResponse.hash, data.url)
      } catch (err) {
        port.postMessage({
          text: `${data.url}: could not associate URL ${data.url} to ` +
            `${addFileResponse.hash}.`,
          type: 'error'
        })

        if (config.deleteArchivesAfterImport) {
          try {
            await removeExtractedArchive(data.downloadPath)
          } catch (err) {
            port.postMessage({
              text: `${data.url}: could not delete archive ` +
                `${data.downloadPath}.`,
              type: 'error'
            })
          }
        }

        port.unref()

        process.exit(1)
      }

      if (!config.skipTags) {
        const finalizedTags = []

        for (const namespacedTags of data.namespacedTags) {
          let namespace = Object.prototype.hasOwnProperty.call(
            config.namespaceReplacements, namespacedTags.namespace
          )
            ? config.namespaceReplacements[namespacedTags.namespace]
            : namespacedTags.namespace

          namespace = namespace.trim()

          if (namespace !== '') {
            namespace += ':'
          }

          for (const tag of namespacedTags.tags) {
            finalizedTags.push(`${namespace}${tag}`)
          }
        }

        for (const additionalTag of config.additionalTags) {
          finalizedTags.push(additionalTag)
        }

        if (!config.blacklistedNamespaces.includes('page')) {
          finalizedTags.push(`page:${currentFileIndex}`)
        }

        try {
          await addTags(addFileResponse.hash, finalizedTags)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not add tags to ${addFileResponse.hash}.`,
            type: 'error'
          })

          if (config.deleteArchivesAfterImport) {
            try {
              await removeExtractedArchive(data.downloadPath)
            } catch (err) {
              port.postMessage({
                text: `${data.url}: could not delete archive ` +
                  `${data.downloadPath}.`,
                type: 'error'
              })
            }
          }

          port.unref()

          process.exit(1)
        }
      }
    }

    port.postMessage({
      text: `${data.url}: hydrus import successfully completed.`,
      type: 'info'
    })

    if (config.deleteArchivesAfterImport) {
      try {
        await removeExtractedArchive(data.downloadPath)
      } catch (err) {
        port.postMessage({
          text: `${data.url}: could not delete archive ` +
            `${data.downloadPath}.`,
          type: 'error'
        })

        port.unref()

        process.exit(1)
      }
    }
  }
}
