import { columnsToRows } from '../utils'

test('columnsToRows', () => {
  const columns = { a: [1, 2, 3], b: ['x', 'y', 'z'] }
  const rows = columnsToRows(columns)
  expect(rows).toEqual([{ a: 1, b: 'x' }, { a: 2, b: 'y' }, { a: 3, b: 'z' }])
})
