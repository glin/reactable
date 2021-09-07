import { reactWidget } from 'reactR'
import Reactable from '../Reactable.v2'

jest.mock('reactR', () => ({
  reactWidget: jest.fn()
}))

import '../index.v2'

test('reactWidget', () => {
  expect(reactWidget).toHaveBeenCalledTimes(1)
  expect(reactWidget).toHaveBeenCalledWith('reactable', 'output', { Reactable })
})
