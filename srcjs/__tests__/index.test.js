import { reactWidget } from '../reactR'

jest.mock('../reactR', () => ({
  reactWidget: jest.fn()
}))

import { Reactable, getState } from '../Reactable'
import * as reactable from '../index'

test('reactWidget', () => {
  expect(reactWidget).toHaveBeenCalledTimes(1)
  expect(reactWidget).toHaveBeenCalledWith('reactable', 'output', { Reactable })
})

test('reactable exports', () => {
  expect(reactable.getState).toEqual(getState)
})
