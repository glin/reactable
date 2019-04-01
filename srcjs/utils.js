// Convert column-based data to rows
// e.g. { a: [1, 2], b: ['x', 'y'] } to [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]
export function columnsToRows(columns) {
  const names = Object.keys(columns)
  const rows = new Array(columns[names[0]].length)
  for (let i = 0; i < rows.length; i++) {
    rows[i] = {}
    for (let name of names) {
      rows[i][name] = columns[name][i]
    }
  }
  return rows
}

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
