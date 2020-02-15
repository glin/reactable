import { renderTemplate } from '../language'

test('renderTemplate', () => {
  expect(renderTemplate(null)).toEqual(null)
  expect(renderTemplate(undefined)).toEqual(undefined)
  expect(renderTemplate('')).toEqual('')
  expect(renderTemplate('no params')).toEqual('no params')
  expect(renderTemplate('unused params', { a: 'param', b: 'param' })).toEqual('unused params')
  expect(renderTemplate('params {a} {b}', { a: 'A', b: 'param' })).toEqual('params A param')
  expect(renderTemplate('unmatched params {A} {b}', { a: 'A', b: 'param' })).toEqual(
    'unmatched params {A} param'
  )

  // Should support multiple params
  expect(renderTemplate('multiple params {a} {a}', { a: 'A' })).toEqual('multiple params A A')
  expect(renderTemplate('multiple p{{a}}rams {aa}', { a: 'aa', aa: 'AA' })).toEqual(
    'multiple p{aa}rams AA'
  )

  // Should support object params
  expect(
    renderTemplate('object params {obj} {str} {obj} ', { obj: { a: 1 }, str: 'string' })
  ).toEqual(['object params ', { a: 1 }, ' ', 'string', ' ', { a: 1 }, ' '])
})
