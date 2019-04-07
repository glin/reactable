import { sum, mean, round } from '../aggregators'

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
