import {
  classNames,
  getFirstDefined,
  getStrIncludesLocale,
  strIncludes,
  get,
  set,
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

test('strIncludes', () => {
  expect(strIncludes('asd', 'asd')).toEqual(true)
  expect(strIncludes('asd', 'as')).toEqual(true)
  expect(strIncludes('asd', 'ASD')).toEqual(true)
  expect(strIncludes('asd', 'SD')).toEqual(true)
  expect(strIncludes('asd', '')).toEqual(true)
  expect(strIncludes('bottle', 'botl')).toEqual(false)
  expect(strIncludes('bottle', ' botl')).toEqual(false)
  expect(strIncludes('bottle', 'bottle.')).toEqual(false)
  expect(strIncludes('bottle', 'bó')).toEqual(false)
  expect(strIncludes('', 'asd')).toEqual(false)
})

test('getStrIncludesLocale', () => {
  const strIncludesLocale = getStrIncludesLocale()
  expect(strIncludesLocale('SLÁN', 'slan')).toEqual(true)
  expect(strIncludesLocale('bottle', 'bó')).toEqual(true)
  expect(strIncludesLocale('BOTTLE', 'bó')).toEqual(true)
  expect(strIncludesLocale('asd', 'asd')).toEqual(true)
  expect(strIncludesLocale('asd', 'as')).toEqual(true)
  expect(strIncludesLocale('asd', 'ASD')).toEqual(true)
  expect(strIncludesLocale('asd', 'SD')).toEqual(true)
  expect(strIncludesLocale('asd', '')).toEqual(true)
  expect(strIncludesLocale('bottle', 'botl')).toEqual(false)
  expect(strIncludesLocale('bottle', ' botl')).toEqual(false)
  expect(strIncludesLocale('bottle', 'bottle.')).toEqual(false)
  expect(strIncludesLocale('', 'asd')).toEqual(false)
})

test('get', () => {
  expect(get({}, [])).toEqual({})
  expect(get({}, [0])).toEqual(undefined)
  expect(get({}, [0, 1, 2])).toEqual(undefined)
  expect(get({ 1: 3 }, [1])).toEqual(3)
  expect(get({ 1: 3 }, [2])).toEqual(undefined)
  expect(get({ 1: 3 }, [1, 5, 7])).toEqual(undefined)
  expect(get({ 1: { 2: { 3: 4 } } }, [1, 2, 3])).toEqual(4)
  expect(get({ 1: { 2: { 3: 4 } } }, [1, 2])).toEqual({ 3: 4 })
  expect(get({ 1: { 2: 3 }, 0: { 5: 7 } }, [0, 5])).toEqual(7)
})

test('set', () => {
  expect(set({}, [])).toEqual({})
  expect(set({}, [], 5)).toEqual({})
  expect(set({}, [1], 5)).toEqual({ 1: 5 })
  expect(set({}, [1, 2, 3], 5)).toEqual({ 1: { 2: { 3: 5 } } })
  expect(set({ 1: 2 }, [1], 5)).toEqual({ 1: 5 })
  expect(set({ 1: 2 }, [1, 3, 7], 9)).toEqual({ 1: { 3: { 7: 9 } } })
  expect(set({ 1: 2 }, [0, 0, 0], 9)).toEqual({ 1: 2, 0: { 0: { 0: 9 } } })
  // Should overwrite different types of values
  expect(set({ 0: 'column-id' }, [0, 0, 0], 9)).toEqual({ 0: { 0: { 0: 9 } } })
  expect(set({ 0: null }, [0, 0, 0], 9)).toEqual({ 0: { 0: { 0: 9 } } })
  expect(set({ 0: true }, [0, 0, 0], 9)).toEqual({ 0: { 0: { 0: 9 } } })
  expect(set({ 0: false }, [0, 0, 0], 9)).toEqual({ 0: { 0: { 0: 9 } } })
  // Deletes
  expect(set({ 1: 2 }, [1], undefined)).toEqual({})
  expect(set({ 1: { 2: { 3: 4 } }, 5: 6 }, [1, 2, 3], undefined)).toEqual({ 1: { 2: {} }, 5: 6 })
  // obj should not be modified
  const obj = { 1: 2 }
  set(obj, [1], 5)
  expect(obj[1]).toEqual(2)
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
  expect(rowsToCSV([])).toEqual('')
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
  expect(rowsToCSV([{ comma: ',', dquote: '"', mix: '"ab,,cd""', '"comma, "': 'header' }])).toEqual(
    'comma,dquote,mix,"""comma, """\n",","""","""ab,,cd""""",header\n'
  )

  // Multiple rows
  expect(
    rowsToCSV([
      { a: 'a', b: 12, c: null },
      { a: 'b', b: -23, c: null },
      { a: 'C', b: 0, c: '' }
    ])
  ).toEqual('a,b,c\na,12,\nb,-23,\nC,0,\n')
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
