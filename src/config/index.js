const path = require('path')

let importPath = process.env.HEX_IMPORT_PATH

if (importPath.startsWith('.')) {
  importPath = path.resolve(__dirname, '../..', importPath)
}

const namespaceReplacements = {}

if (process.env.HEX_NAMESPACE_REPLACEMENTS.trim() !== '') {
  for (
    const replacement of process.env.HEX_NAMESPACE_REPLACEMENTS.split('###')
  ) {
    const replacementPair = replacement.split('|||')

    namespaceReplacements[replacementPair[0].trim()] = replacementPair[1]
      ? replacementPair[1].trim()
      : ''
  }
}

module.exports = {
  version: '1.0.0',
  apiVersion: 1,
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
  dockerHostImportPath: process.env.HEX_DOCKER_HOST_IMPORT_PATH,
  skipKnownFiles: process.env.HEX_SKIP_KNOWN_FILES === 'true',
  deleteArchivesAfterImport:
    process.env.HEX_DELETE_ARCHIVES_AFTER_IMPORT === 'true',
  blacklistedNamespaces: process.env.HEX_BLACKLISTED_NAMESPACES.trim() !== ''
    ? process.env.HEX_BLACKLISTED_NAMESPACES.split('###').map(
      namespace => namespace.trim()
    )
    : [],
  namespaceReplacements
}
