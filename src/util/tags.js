module.exports = {
  getArray (tagsString, delimiter = '###') {
    return tagsString && tagsString.trim() !== ''
      ? tagsString.split(delimiter).map(
        item => item.trim()
      )
      : []
  },
  getNamespaceReplacementsMapping (namespacesString) {
    const namespaceReplacements = {}

    if (namespacesString && namespacesString.trim() !== '') {
      for (const replacement of namespacesString.split('###')) {
        const replacementPair = replacement.split('|||')

        namespaceReplacements[replacementPair[0].trim()] = replacementPair[1]
          ? replacementPair[1].trim()
          : ''
      }
    }

    return namespaceReplacements
  }
}
