import {
  classNames,
  getFirstDefined,
  getStrIncludesLocale,
  strIncludes,
  get,
  set,
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
  // Deletes
  expect(set({ 1: 2 }, [1], undefined)).toEqual({})
  expect(set({ 1: { 2: { 3: 4 } }, 5: 6 }, [1, 2, 3], undefined)).toEqual({ 1: { 2: {} }, 5: 6 })
  // obj should not be modified
  const obj = { 1: 2 }
  set(obj, [1], 5)
  expect(obj[1]).toEqual(2)
})
