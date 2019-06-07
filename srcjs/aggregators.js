export function sum(arr) {
  arr = toNumbers(arr)
  if (arr.length === 0) return ''
  const result = arr.reduce((a, b) => a + b, 0)
  // Adjust for precision errors
  return round(result, 12)
}

export function mean(arr) {
  arr = toNumbers(arr)
  if (arr.length === 0) return ''
  const result = sum(arr) / arr.length
  // Adjust for precision errors
  return round(result, 12)
}

export function max(arr) {
  arr = toNumbers(arr)
  if (arr.length === 0) return ''
  return Math.max.apply(null, arr)
}

export function min(arr) {
  arr = toNumbers(arr)
  if (arr.length === 0) return ''
  return Math.min.apply(null, arr)
}

export function count(arr) {
  return arr.length
}

export function unique(arr) {
  return [...new Set(arr)].join(', ')
}

export function frequency(arr) {
  const counts = {}
  arr.forEach(value => {
    counts[value] = counts[value] || 0
    counts[value] += 1
  })
  const values = Object.keys(counts).map(val => {
    return val + (counts[val] > 1 ? ` (${counts[val]})` : '')
  })
  return values.join(', ')
}

export const aggregators = {
  mean,
  sum,
  max,
  min,
  count,
  unique,
  frequency
}

export function round(n, digits = 3) {
  if (!Number.isFinite(n)) {
    return n
  }
  digits = digits > 0 ? digits : 0
  const c = Math.pow(10, digits)
  // Round away from zero rather than up (Math.round rounds -1.5 to -1)
  return Math.sign(n) * Math.round(Math.abs(n) * c) / c
}

function toNumbers(arr) {
  return arr.map(normalizeNumber).filter(n => typeof n === 'number')
}

export function normalizeNumber(n) {
  if (n === null || n === undefined || n === 'NA' || n === 'NaN') {
    n = null
  }
  if (n === 'Inf') {
    n = Infinity
  }
  if (n === '-Inf') {
    n = -Infinity
  }
  if (typeof n === 'string') {
    n = Number(n)
  }
  return n
}
