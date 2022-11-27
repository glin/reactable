import {
  classNames,
  getFirstDefined,
  getLeafColumns,
  convertRowsToV6,
  rowsToCSV,
  downloadCSV
} from '../utils'

test('classNames', () => {
  expect(classNames('')).toEqual('')
  expect(classNames('a', 'b', 'c')).toEqual('a b c')
  expect(classNames('a', '', 'b')).toEqual('a b')
  expect(classNames(null, 'a', undefined, 'b', '', 'c', 'd')).toEqual('a b c d')
})

test('getFirstDefined', () => {
  expect(getFirstDefined()).toEqual(undefined)
  expect(getFirstDefined(1, 2)).toEqual(1)
  expect(getFirstDefined(undefined, 2, 3)).toEqual(2)
  expect(getFirstDefined(null, undefined, false, true)).toEqual(false)
})

test('getLeafColumns', () => {
  expect(getLeafColumns({ name: 'col' })).toEqual([{ name: 'col' }])
  expect(getLeafColumns({ name: 'col', columns: [] })).toEqual([])
  expect(getLeafColumns({ name: 'col', columns: undefined })).toEqual([
    { name: 'col', columns: undefined }
  ])
  const colA = { name: 'a' }
  const colB = { name: 'b' }
  const colC = { name: 'c' }
  const colD = { name: 'd' }
  expect(getLeafColumns({ columns: [colA] })).toEqual([colA])
  expect(getLeafColumns({ columns: [colA, colB] })).toEqual([colA, colB])
  expect(
    getLeafColumns({
      columns: [{ columns: [colA, colB] }, { columns: [colC] }, colD]
    })
  ).toEqual([colA, colB, colC, colD])
})

test('convertRowsToV6', () => {
  expect(convertRowsToV6([])).toEqual([])
  expect(convertRowsToV6([{ values: {} }])).toEqual([{}])
  expect(convertRowsToV6([{ values: { a: 1, b: 2 } }])).toEqual([{ a: 1, b: 2 }])

  expect(
    convertRowsToV6([
      { values: { a: 1, b: 2 }, otherProps: 'shouldnotappear' },
      { values: { c: 'c', d: true } }
    ])
  ).toEqual([
    { a: 1, b: 2 },
    { c: 'c', d: true }
  ])

  // Sub rows
  expect(
    convertRowsToV6([
      {
        values: { a: 1, b: 2 },
        subRows: [{ values: { a: 33, b: 44 } }, { values: { e: 'f', g: 'h' } }]
      },
      {
        values: { A: 11, B: 22 },
        subRows: [{ values: { a: 33, b: 44 } }]
      },
      {
        values: { a: 3, b: 4 }
      }
    ])
  ).toEqual([
    {
      a: 1,
      b: 2,
      _subRows: [
        { a: 33, b: 44 },
        { e: 'f', g: 'h' }
      ]
    },
    { A: 11, B: 22, _subRows: [{ a: 33, b: 44 }] },
    { a: 3, b: 4 }
  ])

  // Multi-level sub rows
  expect(
    convertRowsToV6([
      {
        values: { a: 1, b: 2 },
        subRows: [
          { values: { a: 33, b: 44 }, subRows: [{ values: { a: 's', b: 't' } }] },
          { values: { e: 'f', g: 'h' } }
        ]
      },
      {
        values: { a: 3, b: 4 }
      }
    ])
  ).toEqual([
    {
      a: 1,
      b: 2,
      _subRows: [
        { a: 33, b: 44, _subRows: [{ a: 's', b: 't' }] },
        { e: 'f', g: 'h' }
      ]
    },
    { a: 3, b: 4 }
  ])
})

test('rowsToCSV', () => {
  expect(rowsToCSV([])).toEqual('\n')
  expect(rowsToCSV([{ a: 'b' }])).toEqual('a\nb\n')
  expect(
    rowsToCSV([
      {
        str: 'str',
        num: 12,
        bool: true
      }
    ])
  ).toEqual('str,num,bool\nstr,12,true\n')

  // Dates should be serialized as ISO strings. In practice, date values are
  // represented in reactable as strings, not dates, though.
  expect(
    rowsToCSV([
      {
        date: new Date('1995-12-17T03:24:00Z'),
        date2: new Date('2022-01-01T00:00:00Z')
      }
    ])
  ).toEqual('date,date2\n1995-12-17T03:24:00.000Z,2022-01-01T00:00:00.000Z\n')

  // Objects and arrays should be serialized as JSON
  expect(
    rowsToCSV([
      {
        obj: { x: '', y: [1, 2] },
        arr: ['a', 34]
      }
    ])
  ).toEqual('obj,arr\n"{""x"":"""",""y"":[1,2]}","[""a"",34]"\n')

  // NAs/nulls should be serialized as empty strings, unless they're numeric
  expect(
    rowsToCSV([
      {
        emptyStr: '',
        null: null,
        numberNA: 'NA',
        numberNaN: 'NaN'
      }
    ])
  ).toEqual('emptyStr,null,numberNA,numberNaN\n,,NA,NaN\n')

  // CSV-unsafe characters
  expect(
    rowsToCSV([
      {
        comma: ',',
        dquote: '"',
        mix: '"ab,,cd""',
        '"comma, "': 'header'
      }
    ])
  ).toEqual('comma,dquote,mix,"""comma, """\n",","""","""ab,,cd""""",header\n')

  // Multiple rows
  expect(
    rowsToCSV([
      { a: 'a', b: 12, c: null },
      { a: 'b', b: -23, c: null },
      { a: 'C', b: 0, c: '' }
    ])
  ).toEqual('a,b,c\na,12,\nb,-23,\nC,0,\n')

  const rows = [
    { a: 'a', b: 12, c: null },
    { a: 'b', b: -23.55, c: '' }
  ]

  // Custom columns
  expect(rowsToCSV(rows, { columnIds: ['c', 'a'] })).toEqual(`c,a
,a
,b
`)

  // No headers
  expect(rowsToCSV(rows, { headers: false })).toEqual(`a,12,
b,-23.55,
`)

  // Custom separator/delimiter
  expect(rowsToCSV(rows, { sep: '\t' })).toEqual(`a\tb\tc
a\t12\t
b\t-23.55\t
`)
  expect(rowsToCSV([{ tab: 'a\tb', comma: ',' }], { sep: '\t' })).toEqual(`tab\tcomma
"a\tb"\t,
`)

  // Custom decimal separator
  expect(rowsToCSV(rows, { dec: ',' })).toEqual(`a,b,c
a,12,
b,"-23,55",
`)
  expect(rowsToCSV(rows, { sep: ';', dec: ',' })).toEqual(`a;b;c
a;12;
b;-23,55;
`)
})

describe('downloadCSV', () => {
  beforeEach(() => {
    window.URL.createObjectURL = jest.fn(() => 'test.csv')
    window.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    delete window.URL.createObjectURL
    delete window.URL.revokeObjectURL
  })

  test('downloads CSV in IE11', () => {
    window.navigator.msSaveBlob = jest.fn()
    downloadCSV('a,b\n1,2\n', 'test.csv')
    expect(window.navigator.msSaveBlob).toHaveBeenCalledTimes(1)
    expect(window.navigator.msSaveBlob).toHaveBeenCalledWith(
      new Blob(['a,b\n1,2\n'], { type: 'text/csv;charset=utf-8' }),
      'test.csv'
    )
    delete window.navigator.msSaveBlob
  })

  test('downloads CSV in all other browsers', () => {
    downloadCSV('a,b\n1,2\n', 'test.csv')
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(
      new Blob(['a,b\n1,2\n'], { type: 'text/csv;charset=utf-8' })
    )
    expect(window.URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('test.csv')
  })
})
