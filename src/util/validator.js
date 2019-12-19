const config = require('../config')

module.exports = {
  isValidAccessKey (accessKey) {
    return accessKey === config.accessKey
  },
  isNotEmpty (value) {
    return typeof value !== 'undefined' && value.trim().length > 0
      ? true
      : false
  }
}
