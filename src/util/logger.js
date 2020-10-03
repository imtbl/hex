module.exports = {
  log (message, type = 'info') {
    switch (type) {
      case 'error':
        console.error(`${new Date().toLocaleString()}:`, message)

        return
      case 'warning':
        console.warn(`${new Date().toLocaleString()}:`, message)

        return
      default:
        console.info(`${new Date().toLocaleString()}:`, message)
    }
  }
}
