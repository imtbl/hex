module.exports = {
  getArray (pattern, delimiter = '###') {
    return pattern.trim() !== ''
      ? pattern.split(delimiter).map(
        item => item.trim()
      )
      : []
  },
  getNamespaceReplacementsMapping (pattern) {
    const namespaceReplacements = {}

    if (pattern.trim() !== '') {
      for (const replacement of pattern.split('###')) {
        const replacementPair = replacement.split('|||')

        namespaceReplacements[replacementPair[0].trim()] = replacementPair[1]
          ? replacementPair[1].trim()
          : ''
      }
    }

    return namespaceReplacements
  }
}
