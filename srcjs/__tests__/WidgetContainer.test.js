import React from 'react'
import { render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import WidgetContainer from '../WidgetContainer'

afterEach(cleanup)

jest.useFakeTimers()

describe('static rendering', () => {
  beforeEach(() => {
    window.HTMLWidgets = { staticRender: jest.fn() }
  })

  afterEach(() => {
    delete window.HTMLWidgets
    // Ensure timers are cleared up
    jest.runAllTimers()
  })

  test('static widgets are rendered', () => {
    const { getByText } = render(
      <WidgetContainer>
        <div>xyz</div>
      </WidgetContainer>
    )
    expect(getByText('xyz')).toBeTruthy()
    expect(window.HTMLWidgets.staticRender).toHaveBeenCalledTimes(1)
  })

  test('static rendering should be throttled', () => {
    render(
      <WidgetContainer>
        <div>1</div>
      </WidgetContainer>
    )
    render(
      <WidgetContainer>
        <div>2</div>
      </WidgetContainer>
    )
    render(
      <WidgetContainer>
        <div>3</div>
      </WidgetContainer>
    )
    expect(window.HTMLWidgets.staticRender).toHaveBeenCalledTimes(1)
    jest.runAllTimers()
    expect(window.HTMLWidgets.staticRender).toHaveBeenCalledTimes(2)
  })
})

test('works without HTMLWidgets', () => {
  const { getByText } = render(
    <WidgetContainer>
      <div>xyz</div>
    </WidgetContainer>
  )
  expect(getByText('xyz')).toBeTruthy()
})
