const Joi = require('joi')

const config = require('../config')

module.exports = {
  settings: Joi.object({
    accessKey: Joi.any().valid(`Bearer ${config.accessKey}`).required()
  }),
  import: Joi.object({
    accessKey: Joi.any().valid(`Bearer ${config.accessKey}`).required(),
    cookies: Joi.string().required(),
    url:
      Joi.string().pattern(new RegExp('^https://exhentai.org.+')).required(),
    skipImport: Joi.boolean(),
    skipKnownFiles: Joi.boolean(),
    deleteArchivesAfterImport: Joi.boolean(),
    skipTags: Joi.boolean(),
    blacklistedNamespaces: Joi.string().allow(''),
    namespaceReplacements: Joi.string().allow(''),
    additionalTags: Joi.string().allow(''),
    addUniqueIdentifierTag: Joi.boolean()
  })
}
