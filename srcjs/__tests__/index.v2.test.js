import { reactWidget } from 'reactR'

import Reactable, { getState } from '../Reactable.v2'
import * as reactable from '../index.v2'

jest.mock('reactR', () => ({
  reactWidget: jest.fn()
}))

test('reactWidget', () => {
  expect(reactWidget).toHaveBeenCalledTimes(1)
  expect(reactWidget).toHaveBeenCalledWith('reactable', 'output', { Reactable })
})

test('reactable exports', () => {
  expect(reactable.getState).toEqual(getState)
})
