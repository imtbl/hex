#!/usr/bin/env node

/*!
 * hex
 * Copyright (C) 2019  Michael Serajnik  https://mserajnik.dev
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
const validator = require('./src/util/validator')
const importer = require('./src/importer')

service.use(bodyParser.json())

service.use((req, res, next) => {
  res.on('response', event => {
    event.res.setHeader('Access-Control-Allow-Origin', '*')
    event.res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    )
    event.res.setHeader(
      'Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS'
    )
  })

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

service.post('/import', (req, res) => {
  if (!validator.isValidAccessKey(req.body.accessKey)) {
    return res.send({
      error: 'InvalidAccessKey'
    }, 400)
  }

  if (!validator.isNotEmpty(req.body.cookies)) {
    return res.send({
      error: 'MissingCookies'
    }, 400)
  }

  if (!validator.isNotEmpty(req.body.url)) {
    return res.send({
      error: 'MissingUrl'
    }, 400)
  }

  res.send({
    import: req.body.url
  })

  importer.run(req.body.url, req.body.cookies)
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
