import { columnsToRows, addColumnGroups, compareNumbers } from '../columns'

test('columnsToRows', () => {
  const columns = { a: [1, 2, 3], b: ['x', 'y', 'z'] }
  const rows = columnsToRows(columns)
  expect(rows).toEqual([{ a: 1, b: 'x' }, { a: 2, b: 'y' }, { a: 3, b: 'z' }])
})

describe('addColumnGroups', () => {
  test('adjacent group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const groups = [{ id: 'ab', columns: ['a', 'b'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { id: 'ab', columns: [{ id: 'a' }, { id: 'b' }] },
      { columns: [{ id: 'c' }] }
    ])
  })

  test('split group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const groups = [{ id: 'bd', columns: ['b', 'd'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { columns: [{ id: 'a' }] },
      { id: 'bd', columns: [{ id: 'b' }, { id: 'd' }] },
      { columns: [{ id: 'c' }] }
    ])
  })
})

test('compareNumbers', () => {
  const tests = [
    [0, 0, 0],
    [0, 1, -1],
    [1, 0, 1],
    [5, 5.01, -1],
    ['NA', 0, -1],
    [0, 'NA', 1],
    ['NA', 'NA', 0],
    ['Inf', 1, 1],
    ['-Inf', 1, -1],
    [1, 'Inf', -1],
    [-1, '-Inf', 1],
    ['Inf', 'Inf', 0],
    ['-Inf', '-Inf', 0],
    ['NA', 'Inf', -1],
    ['Inf', 'NA', 1],
    ['NA', '-Inf', -1],
    ['-Inf', 'NA', 1]
  ]
  tests.forEach(([a, b, order]) => {
    expect(compareNumbers(a, b)).toEqual(order)
  })
})
