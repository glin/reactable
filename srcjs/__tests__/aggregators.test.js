import { sum, mean, max, min, round, frequency, count } from '../aggregators'

test('sum', () => {
  expect(sum([1, 2, 3, 4, -1])).toEqual(9)
  expect(sum([1])).toEqual(1)
  expect(sum([0.1, 0.2])).toEqual(0.3)
  expect(sum([1, 2, 'NA'])).toEqual(3)
  expect(sum([1, 2, 'Inf'])).toEqual(Infinity)
  expect(sum([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(sum([])).toEqual('')
})

test('mean', () => {
  expect(mean([1, 2, 3, 4, 0])).toEqual(2)
  expect(mean([1])).toEqual(1)
  expect(mean([0.1, 0.2])).toEqual(0.15)
  expect(mean([1, 2, 'NA'])).toEqual(1.5)
  expect(mean([1, 2, 'Inf'])).toEqual(Infinity)
  expect(mean([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(mean([])).toEqual('')
})

test('max', () => {
  expect(max([1, 2, 3, 4, 0])).toEqual(4)
  expect(max([1])).toEqual(1)
  expect(max([0.1, 0.2])).toEqual(0.2)
  expect(max([1, 2, 'NA'])).toEqual(2)
  expect(max([1, 2, 'Inf'])).toEqual(Infinity)
  expect(max([1, 2, '-Inf'])).toEqual(2)
  expect(max([])).toEqual('')
})

test('min', () => {
  expect(min([1, 2, 3, 4, 0])).toEqual(0)
  expect(min([1])).toEqual(1)
  expect(min([-0.1, 0.2])).toEqual(-0.1)
  expect(min([1, 2, 'NA'])).toEqual(1)
  expect(min([1, 2, 'Inf'])).toEqual(1)
  expect(min([1, 2, '-Inf'])).toEqual(-Infinity)
  expect(min([])).toEqual('')
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
})

test('frequency', () => {
  expect(frequency([1])).toEqual('1')
  expect(frequency([1, 2, 3])).toEqual('1, 2, 3')
  expect(frequency(['a', 'b', 'a'])).toEqual('a (2), b')
  expect(frequency(['x', 'y', 'y', 'z', 'z', 'x'])).toEqual('x (2), y (2), z (2)')
})

test('count', () => {
  expect(count([])).toEqual(0)
  expect(count([1, 2, 3])).toEqual(3)
})
