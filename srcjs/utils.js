export function classNames(...classes) {
  return classes.filter(cls => cls).join(' ')
}

export function getFirstDefined(...args) {
  return args.find(x => x != null)
}

// Case-insensitive string includes
export function strIncludes(string, substring) {
  return string.toUpperCase().indexOf(substring.toUpperCase()) >= 0
}

// Locale-sensitive, case-insensitive string includes
export function getStrIncludesLocale(locales, options = { sensitivity: 'base' }) {
  const collator = new Intl.Collator(locales, options)
  return (string, substring) => {
    const strLength = string.length
    const substrLength = substring.length
    for (let i = 0; i <= strLength - substrLength; i++) {
      if (collator.compare(string.substring(i, i + substrLength), substring) === 0) {
        return true
      }
    }
    return false
  }
}
