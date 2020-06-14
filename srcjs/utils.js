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

// Get value at nested path (e.g. [1, 0, 3])
export function get(obj, path) {
  return path.reduce((value, key) => {
    if (!(value instanceof Object) || value === undefined) {
      return undefined
    }
    return value[key]
  }, obj)
}

// Set value at nested path (e.g. [1, 0, 3])
export function set(obj, path, value) {
  let newObj = { ...obj }
  let subObj = newObj
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      if (value === undefined) {
        delete subObj[key]
      } else {
        subObj[key] = value
      }
    } else {
      if (typeof subObj[key] === 'object') {
        subObj[key] = { ...subObj[key] }
      } else {
        subObj[key] = {}
      }
      subObj = subObj[key]
    }
  })
  return newObj
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
