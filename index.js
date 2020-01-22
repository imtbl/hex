#!/usr/bin/env node

/*!
 * hex
 * Copyright (C) 2019-present  Michael Serajnik  https://mserajnik.dev
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const bodyParser = require('body-parser')
const service = require('restana')()

require('dotenv').config()

const config = require('./src/config')
const logger = require('./src/util/logger')
const schemas = require('./src/util/schemas')
const importer = require('./src/importer')

service.use(bodyParser.json())

service.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Accept, Authorization, Content-Type, Origin, X-Requested-With'
  )
  res.setHeader(
    'Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS'
  )

  if (req.method === 'OPTIONS') {
    return res.send()
  }

  next()
})

service.get('/', (req, res) => {
  res.send({
    hex: {
      version: config.version,
      apiVersion: config.apiVersion
    }
  })
})

service.get('/settings', async (req, res) => {
  try {
    await schemas.settings.validateAsync({
      accessKey: req.headers.authorization
    })
  } catch (err) {
    return res.send({
      error: `${err.details[0].path[0]}`
    }, 400)
  }

  res.send({
    settings: {
      skipImport: config.skipImport,
      skipKnownFiles: config.skipKnownFiles,
      deleteArchivesAfterImport: config.deleteArchivesAfterImport,
      skipTags: config.skipTags,
      blacklistedNamespaces: config.blacklistedNamespaces,
      namespaceReplacements: config.namespaceReplacements,
      additionalTags: config.additionalTags,
      addUniqueIdentifierTag: config.additionalTags
    }
  })
})

service.post('/import', async (req, res) => {
  try {
    await schemas.import.validateAsync({
      accessKey: req.headers.authorization,
      cookies: req.body.cookies,
      url: req.body.url,
      skipImport: req.body.skipImport,
      skipKnownFiles: req.body.skipKnownFiles,
      deleteArchivesAfterImport: req.body.deleteArchivesAfterImport,
      skipTags: req.body.skipTags,
      blacklistedNamespaces: req.body.blacklistedNamespaces,
      namespaceReplacements: req.body.namespaceReplacements,
      additionalTags: req.body.additionalTags,
      addUniqueIdentifierTag: req.body.addUniqueIdentifierTag
    })
  } catch (err) {
    return res.send({
      error: `${err.details[0].path[0]}`
    }, 400)
  }

  res.send({
    import: req.body.url
  })

  importer.run(req.body.url, req.body.cookies, {
    skipImport: req.body.skipImport,
    skipKnownFiles: req.body.skipKnownFiles,
    deleteArchivesAfterImport: req.body.deleteArchivesAfterImport,
    skipTags: req.body.skipTags,
    blacklistedNamespaces: req.body.blacklistedNamespaces,
    namespaceReplacements: req.body.namespaceReplacements,
    additionalTags: req.body.additionalTags,
    addUniqueIdentifierTag: req.body.addUniqueIdentifierTag
  })
})

;(async () => {
  await service.start(config.port)

  logger.log('hex has started.')
})()

process.on('SIGTERM', async () => {
  await service.close()

  logger.log('hex has shut down.')

  process.exit(0)
})

process.on('SIGINT', async () => {
  await service.close()

  logger.log('hex has shut down.')

  process.exit(0)
})
