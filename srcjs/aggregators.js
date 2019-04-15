export function sum(arr) {
  const result = arr.reduce((a, b) => a + b)
  // Adjust for precision errors
  return round(result, 12)
}

export function mean(arr) {
  const result = sum(arr) / arr.length
  // Adjust for precision errors
  return round(result, 12)
}

export function round(n, digits = 3) {
  if (!Number.isFinite(n)) {
    return n
  }
  digits = digits > 0 ? digits : 0
  const c = Math.pow(10, digits)
  return Math.round(n * c) / c
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
  frequency,
  count
}

// Render a blank cell by default, rather than comma-separated values
export const DefaultAggregated = () => {
  return ''
}
