import { getVisiblePages } from '../Pagination.v2'

describe('getVisiblePages', () => {
  test('6 pages or less', () => {
    expect(getVisiblePages(1, 0)).toEqual([])
    expect(getVisiblePages(1, 1)).toEqual([1])
    expect(getVisiblePages(null, 6)).toEqual([1, 2, 3, 4, 5, 6])
    expect(getVisiblePages(4, 6)).toEqual([1, 2, 3, 4, 5, 6])
    expect(getVisiblePages(6, 6)).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('7 pages or more, current page in first 4 pages', () => {
    expect(getVisiblePages(null, 7)).toEqual([1, 2, 3, 4, 5, 7])
    expect(getVisiblePages(null, 15)).toEqual([1, 2, 3, 4, 5, 15])
    for (let i = 1; i <= 4; i++) {
      expect(getVisiblePages(i, 7)).toEqual([1, 2, 3, 4, 5, 7])
    }
  })

  test('7 pages or more, current page in last 3 pages', () => {
    expect(getVisiblePages(13, 15)).toEqual([1, 12, 13, 14, 15])
    for (let i = 5; i <= 7; i++) {
      expect(getVisiblePages(i, 7)).toEqual([1, 4, 5, 6, 7])
    }
  })

  test('8 pages or more, current page after first 4 but before last 3 pages', () => {
    expect(getVisiblePages(5, 8)).toEqual([1, 4, 5, 6, 8])
    expect(getVisiblePages(12, 24)).toEqual([1, 11, 12, 13, 24])
    expect(getVisiblePages(8, 15)).toEqual([1, 7, 8, 9, 15])
  })
})
