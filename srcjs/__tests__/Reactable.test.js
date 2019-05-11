import React from 'react'
import reactR from 'reactR'
import Reactable from '../Reactable'
import { render, fireEvent, cleanup } from 'react-testing-library'
import 'jest-dom/extend-expect'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

afterEach(cleanup)

test('basic table rendering', () => {
  const { getAllByText } = render(
    <Reactable
      data={{ a: [123, 246, 369], b: ['aa', 'bb', 'cc'] }}
      columns={[{ Header: 'a', accessor: 'a' }, { Header: 'b', accessor: 'b' }]}
    />
  )
  const cellContent = ['123', '246', '369', 'aa', 'bb', 'cc']
  cellContent.forEach(content => {
    expect(getAllByText(content)).toHaveLength(1)
  })
})

describe('sorting', () => {
  it('sets aria-sort attributes', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['aa', 'bb', 'cc'] }}
        columns={[{ Header: 'a', accessor: 'a' }, { Header: 'b', accessor: 'b' }]}
      />
    )
    const headers = container.querySelectorAll('[aria-sort]')
    expect(headers.length).toEqual(2)
    expect(headers[0]).toHaveAttribute('aria-sort', 'none')
    expect(headers[1]).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'descending')
  })
})

test('table styles', () => {
  const props = { data: { a: [1, 2] }, columns: [{ Header: 'a', accessor: 'a' }] }
  const { container, rerender } = render(<Reactable {...props} />)
  const table = container.querySelector('.ReactTable')
  expect(table).not.toHaveClass('-outlined', '-bordered', '-striped', '-highlight', '-inline')

  rerender(<Reactable {...props} outlined />)
  expect(table).toHaveClass('-outlined')

  rerender(<Reactable {...props} bordered />)
  expect(table).toHaveClass('-bordered')

  rerender(<Reactable {...props} striped />)
  expect(table).toHaveClass('-striped')

  rerender(<Reactable {...props} highlight />)
  expect(table).toHaveClass('-highlight')

  rerender(<Reactable {...props} inline />)
  expect(table).toHaveClass('-inline')
})

describe('row selection', () => {
  beforeEach(() => {
    window.Shiny = { onInputChange: jest.fn() }
  })

  afterEach(() => {
    delete window.Shiny
  })

  const props = {
    data: { a: [1, 2] },
    columns: [{ Header: 'a', accessor: 'a' }]
  }

  it('not selectable by default', () => {
    const { container } = render(<Reactable {...props} />)
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(0)
    expect(container.querySelectorAll('input[type=radio]')).toHaveLength(0)
  })

  it('multiple select', () => {
    const { container, getByLabelText } = render(
      <Reactable {...props} selection="multiple" selectionId="selected" />
    )
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(3)
    const selectAllCheckbox = getByLabelText('Select all rows')
    const selectRow1Checkbox = getByLabelText('Select row 1')
    const selectRow2Checkbox = getByLabelText('Select row 2')

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])
  })

  it('single select', () => {
    const { container, getByLabelText } = render(
      <Reactable {...props} selection="single" selectionId="selected" />
    )
    expect(container.querySelectorAll('input[type=radio]')).toHaveLength(2)
    const selectRow1Radio = getByLabelText('Select row 1')
    const selectRow2Radio = getByLabelText('Select row 2')

    fireEvent.click(selectRow1Radio)
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1])

    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [2])

    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])
  })

  it('works without Shiny', () => {
    delete window.Shiny
    const { container, getByLabelText } = render(
      <Reactable {...props} selection="multiple" selectionId="selected" />
    )
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(3)
    const selectAllCheckbox = getByLabelText('Select all rows')
    const selectRow1Checkbox = getByLabelText('Select row 1')
    const selectRow2Checkbox = getByLabelText('Select row 2')

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
  })
})

describe('row details', () => {
  const props = {
    data: { a: [1, 2] },
    columns: [{ Header: 'a', accessor: 'a' }]
  }

  it('render function', () => {
    const details = {
      render: rowInfo => `row details: ${rowInfo.row.a}`,
      name: 'more',
      width: 50
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} details={details} />)
    expect(getByText('more')).toBeTruthy()
    const expanders = container.querySelectorAll('.rt-expander')
    expect(expanders).toHaveLength(2)

    expect(queryByText('row details: 1')).toEqual(null)
    fireEvent.click(expanders[0])
    expect(getByText('row details: 1')).toBeTruthy()

    expect(queryByText('row details: 2')).toEqual(null)
    fireEvent.click(expanders[1])
    expect(getByText('row details: 2')).toBeTruthy()
  })

  it('render function to html', () => {
    const details = {
      render: rowInfo => `<span class="row-details">row details: ${rowInfo.row.a}</span>`,
      html: true
    }
    const { container } = render(<Reactable {...props} details={details} />)
    const expanders = container.querySelectorAll('.rt-expander')
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const content = container.querySelectorAll('span.row-details')
    expect(content).toHaveLength(2)
    expect(content[0].innerHTML).toEqual('row details: 1')
    expect(content[1].innerHTML).toEqual('row details: 2')
  })

  it('render content html', () => {
    const details = {
      render: [
        '<span class="row-details">row details: 1</span>',
        '<span class="row-details">row details: 2</span>'
      ],
      html: true
    }
    const { container } = render(<Reactable {...props} details={details} />)
    const expanders = container.querySelectorAll('.rt-expander')
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const content = container.querySelectorAll('span.row-details')
    expect(content).toHaveLength(2)
    expect(content[0].innerHTML).toEqual('row details: 1')
    expect(content[1].innerHTML).toEqual('row details: 2')
  })

  it('render content conditional expanders', () => {
    const details = {
      render: ['row details: 1', null]
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} details={details} />)
    const expanders = container.querySelectorAll('.rt-expander')
    expect(expanders).toHaveLength(1)

    expect(queryByText('row details: 1')).toEqual(null)
    fireEvent.click(expanders[0])
    expect(getByText('row details: 1')).toBeTruthy()
  })

  it('handles Shiny elements in content', () => {
    window.Shiny = { bindAll: jest.fn(), unbindAll: jest.fn() }
    const details = {
      render: ['row details: 1']
    }
    const { container } = render(<Reactable {...props} details={details} />)
    const expanders = container.querySelectorAll('.rt-expander')
    expect(expanders).toHaveLength(1)
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(0)
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(1)
    delete window.Shiny
  })
})
