import React from 'react'
import Reactable from '../Reactable'
import { render, fireEvent, cleanup } from 'react-testing-library'
import 'jest-dom/extend-expect'

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
    const { container, getByLabelText } = render(<Reactable {...props} selectable />)
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(3)
    const selectAllCheckbox = getByLabelText('Select all rows')
    const selectRow1Checkbox = getByLabelText('Select row 1')
    const selectRow2Checkbox = getByLabelText('Select row 2')

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
  })

  it('single select', () => {
    const { container, getByLabelText } = render(
      <Reactable {...props} selectable selectionType="single" />
    )
    expect(container.querySelectorAll('input[type=radio]')).toHaveLength(2)
    const selectRow1Radio = getByLabelText('Select row 1')
    const selectRow2Radio = getByLabelText('Select row 2')

    fireEvent.click(selectRow1Radio)
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(false)

    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(true)

    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)
  })
})
