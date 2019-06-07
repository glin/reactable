import {
  sum,
  mean,
  max,
  min,
  round,
  count,
  unique,
  frequency,
  aggregators,
  normalizeNumber
} from '../aggregators'

test('sum', () => {
  expect(sum([1, 2, 3, 4, -1])).toEqual(9)
  expect(sum([1])).toEqual(1)
  expect(sum([0.1, 0.2])).toEqual(0.3)
  expect(sum([1, 2, 'NA'])).toEqual(3)
  expect(sum([1, 2, 'Inf'])).toEqual(Infinity)
  expect(sum([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(sum([])).toEqual('')
  expect(aggregators.sum).toEqual(sum)
})

test('mean', () => {
  expect(mean([1, 2, 3, 4, 0])).toEqual(2)
  expect(mean([1])).toEqual(1)
  expect(mean([0.1, 0.2])).toEqual(0.15)
  expect(mean([1, 2, 'NA'])).toEqual(1.5)
  expect(mean([1, 2, 'Inf'])).toEqual(Infinity)
  expect(mean([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(mean([])).toEqual('')
  expect(aggregators.mean).toEqual(mean)
})

test('max', () => {
  expect(max([1, 2, 3, 4, 0])).toEqual(4)
  expect(max([1])).toEqual(1)
  expect(max([0.1, 0.2])).toEqual(0.2)
  expect(max([1, 2, 'NA'])).toEqual(2)
  expect(max([1, 2, 'Inf'])).toEqual(Infinity)
  expect(max([1, 2, '-Inf'])).toEqual(2)
  expect(max([])).toEqual('')
  expect(aggregators.max).toEqual(max)
})

test('min', () => {
  expect(min([1, 2, 3, 4, 0])).toEqual(0)
  expect(min([1])).toEqual(1)
  expect(min([-0.1, 0.2])).toEqual(-0.1)
  expect(min([1, 2, 'NA'])).toEqual(1)
  expect(min([1, 2, 'Inf'])).toEqual(1)
  expect(min([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(min([])).toEqual('')
  expect(aggregators.min).toEqual(min)
})

test('round', () => {
  expect(round(1.123)).toEqual(1.123)
  expect(round(1.155, 2)).toEqual(1.16)
  expect(round(2, 0)).toEqual(2)
  expect(round(1)).toEqual(1)
  expect(round(0.1 + 0.2)).toEqual(0.3)
  expect(round(123.1, -5)).toEqual(123)
  expect(round(Infinity, 3)).toEqual(Infinity)
  expect(round('NA', 3)).toEqual('NA')
  expect(round(null, 3)).toEqual(null)
  expect(round(-1.123)).toEqual(-1.123)
  expect(round(-1.15, 1)).toEqual(-1.2)
  expect(round(-1.1, 0)).toEqual(-1)
  expect(round(-1.5, 0)).toEqual(-2)
})

test('count', () => {
  expect(count([])).toEqual(0)
  expect(count([1, 2, 3])).toEqual(3)
  expect(aggregators.count).toEqual(count)
})

test('unique', () => {
  expect(unique([])).toEqual('')
  expect(unique([1])).toEqual('1')
  expect(unique([1, 2, 3])).toEqual('1, 2, 3')
  expect(unique(['a', 'b', 'a'])).toEqual('a, b')
  expect(unique(['x', 'y', 'y', 'z', 'z', 'x'])).toEqual('x, y, z')
  expect(aggregators.unique).toEqual(unique)
})

test('frequency', () => {
  expect(frequency([1])).toEqual('1')
  expect(frequency([1, 2, 3])).toEqual('1, 2, 3')
  expect(frequency(['a', 'b', 'a'])).toEqual('a (2), b')
  expect(frequency(['x', 'y', 'y', 'z', 'z', 'x'])).toEqual('x (2), y (2), z (2)')
  expect(aggregators.frequency).toEqual(frequency)
})

test('normalizeNumber', () => {
  expect(normalizeNumber(1)).toEqual(1)
  expect(normalizeNumber(0)).toEqual(0)
  expect(normalizeNumber(-1)).toEqual(-1)
  expect(normalizeNumber(null)).toEqual(null)
  expect(normalizeNumber(undefined)).toEqual(null)
  expect(normalizeNumber('NA')).toEqual(null)
  expect(normalizeNumber('NaN')).toEqual(null)
  expect(normalizeNumber('Inf')).toEqual(Infinity)
  expect(normalizeNumber('-Inf')).toEqual(-Infinity)
  expect(normalizeNumber('12')).toEqual(12)
  expect(normalizeNumber('-12')).toEqual(-12)
})
