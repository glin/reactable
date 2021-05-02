export function sum(values) {
  const numbers = toNumbers(values)
  if (numbers.length === 0) {
    return 0
  }
  const result = numbers.reduce((a, b) => a + b, 0)
  // Adjust for precision errors
  return round(result, 12)
}

export function mean(values) {
  const numbers = toNumbers(values)
  if (numbers.length === 0) {
    return NaN
  }
  const result = sum(numbers) / numbers.length
  // Adjust for precision errors
  return round(result, 12)
}

export function max(values) {
  const numbers = toNumbers(values)
  if (numbers.length === 0) {
    return NaN
  }
  return Math.max.apply(null, numbers)
}

export function min(values) {
  const numbers = toNumbers(values)
  if (numbers.length === 0) {
    return NaN
  }
  return Math.min.apply(null, numbers)
}

export function median(values) {
  const numbers = toNumbers(values)
  if (numbers.length === 0) {
    return NaN
  }
  numbers.sort((a, b) => a - b)
  if (numbers.length % 2 === 1) {
    return numbers[(numbers.length - 1) / 2]
  } else {
    return mean(numbers.slice(numbers.length / 2 - 1, numbers.length / 2 + 1))
  }
}

export function count(values) {
  return values.length
}

export function unique(values) {
  return [...new Set(values)].join(', ')
}

export function frequency(values) {
  const counts = {}
  values.forEach(value => {
    counts[value] = counts[value] || 0
    counts[value] += 1
  })
  const strs = Object.keys(counts).map(val => {
    return val + (counts[val] > 1 ? ` (${counts[val]})` : '')
  })
  return strs.join(', ')
}

export const aggregators = {
  mean,
  sum,
  max,
  min,
  median,
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
  return (Math.sign(n) * Math.round(Math.abs(n) * c)) / c
}

function toNumbers(values) {
  return values.map(normalizeNumber).filter(n => !Number.isNaN(n))
}

export function normalizeNumber(n) {
  if (typeof n === 'number') {
    return n
  }
  if (n == null || isNA(n)) {
    return NaN
  }
  if (n === 'Inf') {
    return Infinity
  }
  if (n === '-Inf') {
    return -Infinity
  }
  return Number(n)
}

export function isNA(value) {
  return value === 'NA' || value === 'NaN'
}
