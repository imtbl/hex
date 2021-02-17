const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const slash = require('slash')

const config = require('../config')
const tags = require('../util/tags')

const getFilePaths = directoryPath => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, filePaths) => {
      if (err) {
        reject(err)
      }

      let assumedDockerHostImportPath = config.dockerHostImportPath

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

const accessKeyHeader = {
  'Hydrus-Client-API-Access-Key': config.hydrusAccessKey
}

const contentTypeJsonHeader = {
  'Content-Type': 'application/json'
}

const getApiVersion = () => {
  return fetch(`${config.hydrusBaseUrl}/api_version`)
}

const verifyAccessKey = () => {
  return fetch(`${config.hydrusBaseUrl}/verify_access_key`, {
    headers: {
      ...accessKeyHeader
    }
  })
}

const addFile = filePath => {
  return fetch(`${config.hydrusBaseUrl}/add_files/add_file`, {
    method: 'post',
    headers: {
      ...accessKeyHeader,
      ...contentTypeJsonHeader
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
      ...accessKeyHeader,
      ...contentTypeJsonHeader
    },
    body: JSON.stringify({
      urls_to_add: [
        url,
        url.endsWith('/')
          ? `${url.replace(/\/([^/]*)$/, '$1')}?p=0`
          : `${url}?p=0`
      ],
      hash: fileHash
    })
  })
}

const addTags = (fileHash, tags) => {
  return fetch(`${config.hydrusBaseUrl}/add_tags/add_tags`, {
    method: 'post',
    headers: {
      ...accessKeyHeader,
      ...contentTypeJsonHeader
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
  async import (data, settings, port) {
    const deleteArchivesAfterImport =
      typeof settings.deleteArchivesAfterImport === 'boolean'
        ? settings.deleteArchivesAfterImport
        : typeof settings.deleteArchivesAfterImport === 'string' &&
          ['true', 'false'].includes(settings.deleteArchivesAfterImport)
          ? settings.deleteArchivesAfterImport === 'true'
          : config.deleteArchivesAfterImport

    const skipKnownFiles = typeof settings.skipKnownFiles === 'boolean'
      ? settings.skipKnownFiles
      : typeof settings.skipKnownFiles === 'string' &&
        ['true', 'false'].includes(settings.skipKnownFiles)
        ? settings.skipKnownFiles === 'true'
        : config.skipKnownFiles

    const skipTags = typeof settings.skipTags === 'boolean'
      ? settings.skipTags
      : typeof settings.skipTags === 'string' &&
        ['true', 'false'].includes(settings.skipTags)
        ? settings.skipTags === 'true'
        : config.skipTags

    const namespaceReplacements =
      typeof settings.namespaceReplacements === 'string'
        ? tags.getNamespaceReplacementsMapping(
          settings.namespaceReplacements
        )
        : config.namespaceReplacements

    const additionalTags = typeof settings.additionalTags === 'string'
      ? tags.getArray(settings.additionalTags)
      : config.additionalTags

    const blacklistedNamespaces =
      typeof settings.blacklistedNamespaces === 'string'
        ? tags.getArray(settings.blacklistedNamespaces)
        : config.blacklistedNamespaces

    const addUniqueIdentifierTag =
      typeof settings.addUniqueIdentifierTag === 'boolean'
        ? settings.addUniqueIdentifierTag
        : typeof settings.addUniqueIdentifierTag === 'string' &&
          ['true', 'false'].includes(settings.addUniqueIdentifierTag)
          ? settings.addUniqueIdentifierTag === 'true'
          : config.addUniqueIdentifierTag

    const uniqueIdentifierNamespace =
      typeof settings.uniqueIdentifierNamespace === 'string'
        ? settings.uniqueIdentifierNamespace.trim()
        : config.uniqueIdentifierNamespace.trim()

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

      if (deleteArchivesAfterImport) {
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

      port.close()

      process.exit(1)
    }

    if (apiVersionResponse.version < config.hydrusApiVersion) {
      port.postMessage({
        text: `${data.url}: hydrus API version ` +
          `(${apiVersionResponse.version}) is too old, aborting.`,
        type: 'error'
      })

      if (deleteArchivesAfterImport) {
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

      port.close()

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

      if (deleteArchivesAfterImport) {
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

      port.close()

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

      if (deleteArchivesAfterImport) {
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

      port.close()

      process.exit(1)
    }

    for (const permission of [0, 1, 2]) {
      if (!verifyAccessKeyResponse.basic_permissions.includes(permission)) {
        port.postMessage({
          text: `${data.url}: hydrus API access key is missing required ` +
            'permissions.',
          type: 'error'
        })

        if (deleteArchivesAfterImport) {
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

        port.close()

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

      if (deleteArchivesAfterImport) {
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

      port.close()

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
          text: `${data.url}: could not import file ${filePath} ` +
            `(${currentFileIndex}/${filePaths.length}) into hydrus.`,
          type: 'error'
        })

        if (deleteArchivesAfterImport) {
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

        port.close()

        process.exit(1)
      }

      if (addFileResponse.status !== 1 && skipKnownFiles) {
        port.postMessage({
          text: `${data.url}: file ${filePath} ` +
            `(${currentFileIndex}/${filePaths.length}) ` +
            'is already known, skipping.',
          type: 'info'
        })

        continue
      }

      try {
        await associateUrl(addFileResponse.hash, data.url)
      } catch (err) {
        port.postMessage({
          text: `${data.url}: could not associate URL ${data.url} with ` +
            `${addFileResponse.hash} ` +
            `(${currentFileIndex}/${filePaths.length}).`,
          type: 'error'
        })

        if (deleteArchivesAfterImport) {
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

        port.close()

        process.exit(1)
      }

      if (!skipTags) {
        const finalizedTags = []

        for (const namespacedTags of data.namespacedTags) {
          let namespace = Object.prototype.hasOwnProperty.call(
            namespaceReplacements, namespacedTags.namespace
          )
            ? namespaceReplacements[namespacedTags.namespace]
            : namespacedTags.namespace

          namespace = namespace.trim()

          if (namespace !== '') {
            namespace += ':'
          }

          for (const tag of namespacedTags.tags) {
            finalizedTags.push(`${namespace}${tag}`)
          }
        }

        for (const additionalTag of additionalTags) {
          finalizedTags.push(additionalTag)
        }

        if (!blacklistedNamespaces.includes('page')) {
          finalizedTags.push(`page:${currentFileIndex}`)
        }

        if (addUniqueIdentifierTag && uniqueIdentifierNamespace !== '') {
          finalizedTags.push(
            `${uniqueIdentifierNamespace}:` +
              `${data.galleryId}-${currentFileIndex}`
          )
        }

        try {
          await addTags(addFileResponse.hash, finalizedTags)
        } catch (err) {
          port.postMessage({
            text: `${data.url}: could not add tags to ` +
              `${addFileResponse.hash} ` +
              `(${currentFileIndex}/${filePaths.length}).`,
            type: 'error'
          })

          if (deleteArchivesAfterImport) {
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

          port.close()

          process.exit(1)
        }
      }

      port.postMessage({
        text: `${data.url}: successfully imported file ${filePath} ` +
          `(${currentFileIndex}/${filePaths.length}) into hydrus.`,
        type: 'info'
      })
    }

    port.postMessage({
      text: `${data.url}: hydrus import successfully completed.`,
      type: 'info'
    })

    if (deleteArchivesAfterImport) {
      try {
        await removeExtractedArchive(data.downloadPath)
      } catch (err) {
        port.postMessage({
          text: `${data.url}: could not delete archive ` +
            `${data.downloadPath}.`,
          type: 'error'
        })

        port.close()

        process.exit(1)
      }
    }
  }
}
