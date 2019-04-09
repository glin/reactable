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

export const aggregators = {
  mean: arr => round(mean(arr)),
  sum: arr => round(sum(arr)),
  count: arr => arr.length
}

// Render a blank cell by default, rather than comma-separated values
export const DefaultAggregated = () => {
  return ''
}
