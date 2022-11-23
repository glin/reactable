import {
  sum,
  mean,
  max,
  min,
  maxNumber,
  minNumber,
  median,
  round,
  count,
  unique,
  frequency,
  getAggregateFunction
} from '../aggregators'

test('sum', () => {
  expect(sum([1, 2, 3, 4, -1])).toEqual(9)
  expect(sum([1])).toEqual(1)
  expect(sum([0.1, 0.2])).toEqual(0.3)
  expect(sum([1, 2, null])).toEqual(3)
  expect(sum([1, 2, NaN])).toEqual(3)
  expect(sum([1, 2, Infinity])).toEqual(Infinity)
  expect(sum([1, 2, -Infinity])).toEqual(-Infinity)
  expect(sum([])).toEqual(0)
})

test('mean', () => {
  expect(mean([1, 2, 3, 4, 0])).toEqual(2)
  expect(mean([1])).toEqual(1)
  expect(mean([0.1, 0.2])).toEqual(0.15)
  expect(mean([1, 2, null])).toEqual(1.5)
  expect(mean([1, 2, NaN])).toEqual(1.5)
  expect(mean([1, 2, Infinity])).toEqual(Infinity)
  expect(mean([1, 2, -Infinity])).toEqual(-Infinity)
  expect(mean([Infinity, -Infinity])).toEqual(NaN)
  expect(mean([])).toEqual(NaN)
})

test('maxNumber', () => {
  expect(maxNumber([1, 2, 3, 4, 0])).toEqual(4)
  expect(maxNumber([1])).toEqual(1)
  expect(maxNumber([0.1, 0.2])).toEqual(0.2)
  expect(maxNumber([1, 2, null])).toEqual(2)
  expect(maxNumber([1, 2, NaN])).toEqual(2)
  expect(maxNumber([1, 2, Infinity])).toEqual(Infinity)
  expect(maxNumber([1, 2, -Infinity])).toEqual(2)
  expect(maxNumber([])).toEqual(NaN)
})

test('minNumber', () => {
  expect(minNumber([1, 2, 3, 4, 0])).toEqual(0)
  expect(minNumber([1])).toEqual(1)
  expect(minNumber([-0.1, 0.2])).toEqual(-0.1)
  expect(minNumber([1, 2, null])).toEqual(1)
  expect(minNumber([1, 2, NaN])).toEqual(1)
  expect(minNumber([1, 2, Infinity])).toEqual(1)
  expect(minNumber([1, 2, -Infinity])).toEqual(-Infinity)
  expect(minNumber([])).toEqual(NaN)
})

test('median', () => {
  expect(median([1, 2, 3, 4, 0])).toEqual(2)
  expect(median([1])).toEqual(1)
  expect(median([-0.1, 0.2])).toEqual(0.05)
  expect(median([1, 2, null])).toEqual(1.5)
  expect(median([1, 2, NaN])).toEqual(1.5)
  expect(median([1, 2, Infinity])).toEqual(2)
  expect(median([Infinity, Infinity, -Infinity])).toEqual(Infinity)
  expect(median([Infinity, -Infinity])).toEqual(NaN)
  expect(median([])).toEqual(NaN)
})

test('round', () => {
  expect(round(1.123)).toEqual(1.123)
  expect(round(1.155, 2)).toEqual(1.16)
  expect(round(2, 0)).toEqual(2)
  expect(round(1)).toEqual(1)
  expect(round(0.1 + 0.2)).toEqual(0.3)
  expect(round(123.1, -5)).toEqual(123)
  expect(round(Infinity, 3)).toEqual(Infinity)
  expect(round(-Infinity, 3)).toEqual(-Infinity)
  expect(round(NaN, 3)).toEqual(NaN)
  expect(round(null, 3)).toEqual(null)
  expect(round(-1.123)).toEqual(-1.123)
  expect(round(-1.15, 1)).toEqual(-1.2)
  expect(round(-1.1, 0)).toEqual(-1)
  expect(round(-1.5, 0)).toEqual(-2)
})

test('max', () => {
  expect(max([])).toEqual(undefined)
  expect(max(['a'])).toEqual('a')
  expect(max(['a', 'b', 'c'])).toEqual('c')
  expect(max(['A', null, 'C'])).toEqual('C')
  expect(max(['a', 'aaa', 'AAA'])).toEqual('aaa')
  expect(max(['2020-03-04', '2020-03-04', '2020-03-05'])).toEqual('2020-03-05')
  expect(max(['2021-03-01T19:00:00', '2021-03-01T19:00:01', '2020-12-01T19:00:00'])).toEqual(
    '2021-03-01T19:00:01'
  )
  expect(max([true, false, true, null])).toEqual(true)
  expect(
    max([
      ['a', 'b'],
      ['c', 'd', 'e']
    ])
  ).toEqual(['c', 'd', 'e'])
})

test('min', () => {
  expect(min([])).toEqual(undefined)
  expect(min(['a'])).toEqual('a')
  expect(min(['a', 'b', 'c'])).toEqual('a')
  expect(min(['A', null, 'C'])).toEqual('A')
  expect(min(['a', 'aaa', 'AAA'])).toEqual('AAA')
  expect(min(['2020-03-04', '2020-03-04', '2020-03-05'])).toEqual('2020-03-04')
  expect(min(['2020-03-01T19:00:00', '2020-03-01T19:00:01', '2021-12-01T19:00:00'])).toEqual(
    '2020-03-01T19:00:00'
  )
  expect(min([true, false, false, null])).toEqual(false)
  expect(
    min([
      ['a', 'b'],
      ['c', 'd', 'e']
    ])
  ).toEqual(['a', 'b'])
})

test('count', () => {
  expect(count([])).toEqual(0)
  expect(count([1, 2, 3])).toEqual(3)
})

test('unique', () => {
  expect(unique([])).toEqual('')
  expect(unique([1])).toEqual('1')
  expect(unique([1, 2, 3])).toEqual('1, 2, 3')
  expect(unique(['a', 'b', 'a'])).toEqual('a, b')
  expect(unique(['x', 'y', 'y', 'z', 'z', 'x'])).toEqual('x, y, z')
})

test('frequency', () => {
  expect(frequency([])).toEqual('')
  expect(frequency([1])).toEqual('1')
  expect(frequency([1, 2, 3])).toEqual('1, 2, 3')
  expect(frequency(['a', 'b', 'a'])).toEqual('a (2), b')
  expect(frequency(['x', 'y', 'y', 'z', 'z', 'x'])).toEqual('x (2), y (2), z (2)')
})

test('getAggregateFunction', () => {
  expect(getAggregateFunction('sum', 'numeric')).toEqual(sum)
  expect(getAggregateFunction('sum')).toEqual(undefined)
  expect(getAggregateFunction('mean', 'numeric')).toEqual(mean)
  expect(getAggregateFunction('mean')).toEqual(undefined)
  expect(getAggregateFunction('max', 'numeric')).toEqual(maxNumber)
  expect(getAggregateFunction('max')).toEqual(max)
  expect(getAggregateFunction('min', 'numeric')).toEqual(minNumber)
  expect(getAggregateFunction('min')).toEqual(min)
  expect(getAggregateFunction('median', 'numeric')).toEqual(median)
  expect(getAggregateFunction('median')).toEqual(undefined)
  expect(getAggregateFunction('count', 'numeric')).toEqual(count)
  expect(getAggregateFunction('count')).toEqual(count)
  expect(getAggregateFunction('unique', 'numeric')).toEqual(unique)
  expect(getAggregateFunction('unique')).toEqual(unique)
  expect(getAggregateFunction('frequency', 'numeric')).toEqual(frequency)
  expect(getAggregateFunction('frequency')).toEqual(frequency)
})
