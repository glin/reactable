import { sum, mean, round, frequency, count, DefaultAggregated } from '../aggregators'

test('sum', () => {
  expect(sum([1, 2, 3, 4, -1])).toEqual(9)
  expect(sum([1])).toEqual(1)
})

test('mean', () => {
  expect(mean([1, 2, 3, 4, 0])).toEqual(2)
  expect(mean([1])).toEqual(1)
})

test('round', () => {
  expect(round(1.123)).toEqual(1.123)
  expect(round(1.155, 2)).toEqual(1.16)
  expect(round(2, 0)).toEqual(2)
  expect(round(1)).toEqual(1)
  expect(round(0.1 + 0.2)).toEqual(0.3)
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

test('defaultAggregated', () => {
  expect(DefaultAggregated()).toEqual('')
})