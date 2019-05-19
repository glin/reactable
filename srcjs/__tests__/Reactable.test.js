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
      data={{
        a: [123, 246, -369],
        b: ['aa', 'bb', 'cc'],
        c: [true, false, null],
        d: ['2019-03-04', '1955-12-12', '2000-01-30']
      }}
      columns={[
        { Header: 'num', accessor: 'a', type: 'numeric' },
        { Header: 'str', accessor: 'b', type: 'character' },
        { Header: 'bool', accessor: 'c', type: 'logical' },
        { Header: 'date', accessor: 'd', type: 'date' }
      ]}
    />
  )
  const cellContent = [
    '123',
    '246',
    '-369',
    'aa',
    'bb',
    'cc',
    'true',
    'false',
    '2019-03-04',
    '1955-12-12',
    '2000-01-30'
  ]
  cellContent.forEach(content => {
    expect(getAllByText(content)).toHaveLength(1)
  })
})

describe('sorting', () => {
  it('sets aria-sort attributes', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 2], b: ['aa', 'bb'], c: [true, false] }}
        columns={[
          { Header: 'colA', accessor: 'a' },
          { Header: 'colB', accessor: 'b' },
          { Header: 'colC', accessor: 'c', sortable: false }
        ]}
      />
    )
    const headers = container.querySelectorAll('[aria-sort]')
    expect(headers.length).toEqual(2)
    expect(headers[0]).toHaveAttribute('aria-sort', 'none')
    expect(headers[1]).toHaveAttribute('aria-sort', 'none')
    expect(headers[0]).toHaveTextContent('colA')
    expect(headers[1]).toHaveTextContent('colB')

    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'descending')
  })

  it('shows sort indicators', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 2], b: ['aa', 'bb'], c: [true, false] }}
        columns={[
          { Header: 'colA', accessor: 'a', type: 'numeric' },
          { Header: 'colB', accessor: 'b' }
        ]}
      />
    )
    const numericSortIndicator = container.querySelectorAll('.rt-th .-sort-left')
    expect(numericSortIndicator).toHaveLength(1)
    const defaultSortIndicator = container.querySelectorAll('.rt-th .-sort-right')
    expect(defaultSortIndicator).toHaveLength(1)
  })
})

describe('filtering', () => {
  it('enables filtering', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [{ Header: 'a', accessor: 'a' }, { Header: 'b', accessor: 'b' }]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let filters = container.querySelectorAll('.rt-thead.-filters input')
    expect(filters).toHaveLength(0)
    rerender(<Reactable {...props} filterable />)
    filters = container.querySelectorAll('.rt-thead.-filters input')
    expect(filters).toHaveLength(2)
  })

  it('filters numeric columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: [111, 115, 32.11] }}
        columns={[{ Header: 'a', accessor: 'a', type: 'numeric' }]}
        filterable
        minRows={1}
      />
    )
    const filter = container.querySelector('.rt-thead.-filters input')

    fireEvent.change(filter, { target: { value: '11' } })
    let rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(2)
    expect(getByText('111')).toBeTruthy()
    expect(getByText('115')).toBeTruthy()

    // No matches
    fireEvent.change(filter, { target: { value: '5' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('No rows found')).toBeTruthy()

    // Clear filter
    fireEvent.change(filter, { target: { value: '' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(3)
  })

  it('filters string columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: ['ááád', 'bAb', 'CC'] }}
        columns={[
          { Header: 'a', accessor: 'a', type: 'factor' },
          { Header: 'b', accessor: 'b', type: 'character' }
        ]}
        filterable
        minRows={1}
      />
    )
    const filters = container.querySelectorAll('.rt-thead.-filters input')

    // Case-insensitive
    fireEvent.change(filters[0], { target: { value: 'Bb' } })
    let rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeTruthy()

    // Substring matches
    fireEvent.change(filters[0], { target: { value: 'c' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(2)
    expect(getByText('aaac')).toBeTruthy()
    expect(getByText('CCC')).toBeTruthy()

    // No matches
    fireEvent.change(filters[0], { target: { value: 'cccc' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('No rows found')).toBeTruthy()

    // Clear filter
    fireEvent.change(filters[0], { target: { value: '' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(3)

    // Locale-sensitive
    fireEvent.change(filters[1], { target: { value: 'a' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(2)
    expect(getByText('ááád')).toBeTruthy()
    expect(getByText('bAb')).toBeTruthy()
  })

  it('filters other columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['ááád', '123', 'acCC', '2018-03-05'] }}
        columns={[{ Header: 'a', accessor: 'a' }]}
        filterable
        minRows={1}
      />
    )
    const filter = container.querySelector('.rt-thead.-filters input')

    // Case-insensitive
    fireEvent.change(filter, { target: { value: 'acc' } })
    let rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('acCC')).toBeTruthy()

    // Substring matches
    fireEvent.change(filter, { target: { value: '03-05' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('2018-03-05')).toBeTruthy()

    // Not locale-sensitive
    fireEvent.change(filter, { target: { value: 'aaa' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(1)
    expect(getByText('No rows found')).toBeTruthy()

    // Clear filter
    fireEvent.change(filter, { target: { value: '' } })
    rows = container.querySelectorAll('.rt-tr-group')
    expect(rows).toHaveLength(4)
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

  it('renders empty row details', () => {
    const details = {
      render: ['', '']
    }
    const { container } = render(<Reactable {...props} details={details} />)
    const expanders = container.querySelectorAll('.rt-expander')
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
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

describe('footer rendering', () => {
  const data = { a: [1, 2] }

  it('renders a basic footer', () => {
    const columns = [
      {
        Header: 'a',
        accessor: 'a',
        footer: 'my-footer',
        footerClassName: 'my-footer',
        footerStyle: { color: 'red' }
      }
    ]
    const props = { data, columns }
    const { getByText } = render(<Reactable {...props} />)
    const footer = getByText('my-footer')
    expect(footer).toHaveClass('my-footer')
    expect(footer).toHaveStyle('color: red;')
  })

  it('render function', () => {
    const columns = [
      {
        Header: 'a',
        accessor: 'a',
        footer: colInfo => `rows: ${colInfo.data.length}`
      }
    ]
    const props = { data, columns }
    const { getByText } = render(<Reactable {...props} />)
    const footer = getByText('rows: 2')
    expect(footer).toBeTruthy()
  })
})
