import {
  sum,
  mean,
  max,
  min,
  median,
  round,
  count,
  unique,
  frequency,
  aggregators,
  normalizeNumber
} from '../aggregators.v2'

test('sum', () => {
  expect(sum([1, 2, 3, 4, -1])).toEqual(9)
  expect(sum([1])).toEqual(1)
  expect(sum([0.1, 0.2])).toEqual(0.3)
  expect(sum([1, 2, 'NA'])).toEqual(3)
  expect(sum([1, 2, 'Inf'])).toEqual(Infinity)
  expect(sum([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(sum([])).toEqual(0)
  expect(aggregators.sum).toEqual(sum)
})

test('mean', () => {
  expect(mean([1, 2, 3, 4, 0])).toEqual(2)
  expect(mean([1])).toEqual(1)
  expect(mean([0.1, 0.2])).toEqual(0.15)
  expect(mean([1, 2, 'NA'])).toEqual(1.5)
  expect(mean([1, 2, 'Inf'])).toEqual(Infinity)
  expect(mean([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(mean(['Inf', '-Inf'])).toEqual(NaN)
  expect(mean([])).toEqual(NaN)
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

test('median', () => {
  expect(median([1, 2, 3, 4, 0])).toEqual(2)
  expect(median([1])).toEqual(1)
  expect(median([-0.1, 0.2])).toEqual(0.05)
  expect(median([1, 2, 'NA'])).toEqual(1.5)
  expect(median([1, 2, 'Inf'])).toEqual(2)
  expect(median(['Inf', 'Inf', '-Inf'])).toEqual(Infinity)
  expect(median(['Inf', '-Inf'])).toEqual(NaN)
  expect(median([])).toEqual(NaN)
  expect(aggregators.median).toEqual(median)
})

test('round', () => {
  expect(round(1.123)).toEqual(1.123)
  expect(round(1.155, 2)).toEqual(1.16)
  expect(round(2, 0)).toEqual(2)
  expect(round(1)).toEqual(1)
  expect(round(0.1 + 0.2)).toEqual(0.3)
  expect(round(123.1, -5)).toEqual(123)
  expect(round(Infinity, 3)).toEqual(Infinity)
  expect(round(NaN, 3)).toEqual(NaN)
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
  expect(normalizeNumber(-1.2345)).toEqual(-1.2345)
  expect(normalizeNumber(null)).toEqual(NaN)
  expect(normalizeNumber(undefined)).toEqual(NaN)
  expect(normalizeNumber('NA')).toEqual(NaN)
  expect(normalizeNumber('NaN')).toEqual(NaN)
  expect(normalizeNumber('Inf')).toEqual(Infinity)
  expect(normalizeNumber('-Inf')).toEqual(-Infinity)
  expect(normalizeNumber('12')).toEqual(12)
  expect(normalizeNumber('-12')).toEqual(-12)
})
