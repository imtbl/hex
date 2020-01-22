const path = require('path')

const tags = require('../util/tags')

let importPath = process.env.HEX_IMPORT_PATH

if (importPath.startsWith('.')) {
  importPath = path.resolve(__dirname, '../..', importPath)
}

module.exports = {
  version: '1.5.0',
  apiVersion: 2,
  port: process.env.HEX_PORT || 8000,
  accessKey: process.env.HEX_ACCESS_KEY,
  browserWSEndpoint: process.env.HEX_BROWSER_WS_ENDPOINT ||
    'ws://localhost:3000',
  hydrusBaseUrl: process.env.HEX_HYDRUS_BASE_URL || 'http://localhost:45869',
  hydrusApiVersion: 11,
  hydrusAllowNewerApiVersion:
    process.env.HEX_HYDRUS_ALLOW_NEWER_API_VERSION === 'true',
  hydrusAccessKey: process.env.HEX_HYDRUS_ACCESS_KEY,
  hydrusTagService: process.env.HEX_HYDRUS_TAG_SERVICE || 'my tags',
  skipImport: process.env.HEX_SKIP_IMPORT === 'true',
  importPath: importPath,
  dockerHostImportPath: process.env.HEX_DOCKER_HOST_IMPORT_PATH
    ? process.env.HEX_DOCKER_HOST_IMPORT_PATH.trim()
    : '',
  skipKnownFiles: process.env.HEX_SKIP_KNOWN_FILES === 'true',
  deleteArchivesAfterImport:
    process.env.HEX_DELETE_ARCHIVES_AFTER_IMPORT === 'true',
  skipTags: process.env.HEX_SKIP_TAGS === 'true',
  blacklistedNamespaces: tags.getArray(process.env.HEX_BLACKLISTED_NAMESPACES),
  namespaceReplacements: tags.getNamespaceReplacementsMapping(
    process.env.HEX_NAMESPACE_REPLACEMENTS
  ),
  additionalTags: tags.getArray(process.env.HEX_ADDITIONAL_TAGS),
  addUniqueIdentifierTag: process.env.HEX_ADD_UNIQUE_IDENTIFIER_TAG === 'true'
}
