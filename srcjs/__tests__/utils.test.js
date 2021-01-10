import {
  classNames,
  getFirstDefined,
  getStrIncludesLocale,
  strIncludes,
  get,
  set,
  getLeafColumns,
  convertRowsToV6
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
