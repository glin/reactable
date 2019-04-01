export function sum(arr) {
  return arr.reduce((a, b) => a + b)
}

export function mean(arr) {
  return sum(arr) / arr.length
}

export function round(n, digits = 1) {
  return n.toFixed(digits)
}

export const aggregators = {
  mean: arr => round(mean(arr)),
  sum: arr => round(sum(arr)),
  count: arr => arr.length
}
