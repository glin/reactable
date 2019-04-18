export function sum(arr) {
  arr = toNumbers(arr)
  const result = arr.reduce((a, b) => a + b)
  // Adjust for precision errors
  return round(result, 12)
}

export function mean(arr) {
  arr = toNumbers(arr)
  const result = sum(arr) / arr.length
  // Adjust for precision errors
  return round(result, 12)
}

export function max(arr) {
  arr = toNumbers(arr)
  return Math.max.apply(null, arr)
}

export function min(arr) {
  arr = toNumbers(arr)
  return Math.min.apply(null, arr)
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

export function count(arr) {
  return arr.length
}

export const aggregators = {
  mean,
  sum,
  max,
  min,
  frequency,
  count
}

export function round(n, digits = 3) {
  if (!Number.isFinite(n)) {
    return n
  }
  digits = digits > 0 ? digits : 0
  const c = Math.pow(10, digits)
  return Math.round(n * c) / c
}

function toNumbers(arr) {
  return arr.map(normalizeNumber).filter(n => typeof n === 'number')
}

export function normalizeNumber(n) {
  if (n === null || n === undefined || n === 'NA') {
    n = null
  }
  if (n === 'Inf') {
    n = Infinity
  }
  if (n === '-Inf') {
    n = -Infinity
  }
  return n
}
