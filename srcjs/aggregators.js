export function sum(arr) {
  return arr.reduce((a, b) => a + b)
}

export function mean(arr) {
  return sum(arr) / arr.length
}

export function round(n, digits = 3) {
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
  mean: arr => round(mean(arr)),
  sum: arr => round(sum(arr)),
  frequency,
  count
}

// Render a blank cell by default, rather than comma-separated values
export const DefaultAggregated = () => {
  return ''
}
