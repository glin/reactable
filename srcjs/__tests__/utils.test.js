import { classNames, getStrIncludesLocale, strIncludes } from '../utils'

test('classNames', () => {
  expect(classNames('')).toEqual('')
  expect(classNames('a', 'b', 'c')).toEqual('a b c')
  expect(classNames('a', '', 'b')).toEqual('a b')
  expect(classNames(null, 'a', undefined, 'b', '', 'c', 'd')).toEqual('a b c d')
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
