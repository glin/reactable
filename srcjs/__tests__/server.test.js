/**
 * @jest-environment node
 */

import { renderToHTML, setInitialProps, renderToData, resetTestRenderer } from '../server'

// These tests run in Node and are intentionally minimal. See test-reactable.R for
// more comprehensive tests that run in true V8 environments (different from Node).

describe('renderToHTML', () => {
  it('renders tables to HTML', () => {
    const inputString =
      '{"props":{"data":"{\\"Manufacturer\\":[\\"Acura\\",\\"Acura\\",\\"Audi\\"],\\"Model\\":[\\"Integra\\",\\"Legend\\",\\"90\\"],\\"Type\\":[\\"Small\\",\\"Midsize\\",\\"Compact\\"]}","columns":[{"id":"Manufacturer","name":"Manufacturer","type":"factor"},{"id":"Model","name":"Model","type":"factor"},{"id":"Type","name":"Type","type":"factor"}],"dataKey":"b540d0d929ae2ade6248d0cbb7f477fc"},"evals":[]}'
    const { html, css, ids } = renderToHTML(inputString)
    expect(html).toMatchSnapshot()
    expect(css).toEqual('')
    expect(ids).toEqual([])
  })

  it('renders tables to HTML with JS evals', () => {
    const inputString =
      '{"props":{"data":"{\\"Manufacturer\\":[\\"Acura\\",\\"Acura\\"],\\"Model\\":[\\"Integra\\",\\"Legend\\"]}","columns":[{"id":"Manufacturer","name":"Manufacturer","type":"factor"},{"id":"Model","name":"Model","type":"factor","cell":"cellInfo => cellInfo.value + \'__\'"}],"dataKey":"7951e598fecb5fa57c37a854a0917a7c"},"evals":["columns.1.cell"]}'
    const { html, css, ids } = renderToHTML(inputString)
    expect(html).toContain('Integra__')
    expect(html).toContain('Legend__')
    expect(html).toMatchSnapshot()
    expect(css).toEqual('')
    expect(ids).toEqual([])
  })

  it('renders tables to HTML with theme styles', () => {
    const inputString =
      '{"props":{"data":"{\\"Manufacturer\\":[\\"Acura\\",\\"Acura\\"],\\"Model\\":[\\"Integra\\",\\"Legend\\"]}","columns":[{"id":"Manufacturer","name":"Manufacturer","type":"factor"},{"id":"Model","name":"Model","type":"factor"}],"theme":{"color":"red","cellPadding":"1rem"},"dataKey":"01768d44dd8153352ff1cfa908f38d72"},"evals":[]}'
    const { html, css, ids } = renderToHTML(inputString)
    expect(html).toMatchSnapshot()
    expect(css).toEqual('.reactable-1galy0v{color:red;}.reactable-1rsvkai{padding:1rem;}')
    expect(ids).toEqual(['1galy0v', '1xdhyk6', '1rsvkai'])
  })
})

describe('renderToData', () => {
  beforeEach(() => {
    resetTestRenderer()
  })

  it('renders tables to data', () => {
    const propsJson = `{
      "props": {
        "data": {
          "Manufacturer": ["Acura", "Acura"],
          "Model": ["Integra", "Legend"],
          "Type": ["Small", "Midsize"]
        },
        "columns": [
          { "id": "Manufacturer", "name": "Manufacturer", "type": "factor" },
          { "id": "Model", "name": "Model", "type": "factor" },
          { "id": "Type", "name": "Type", "type": "factor" }
        ],
        "pagination": true,
        "paginateSubRows": false
      }
    }`
    setInitialProps(propsJson)

    const inputJson = `{
      "props": {
        "pageIndex": 0,
        "pageSize": 10
      }
    }`

    const data = renderToData(inputJson)
    const expected = {
      data: [
        { Manufacturer: 'Acura', Model: 'Integra', Type: 'Small', __state: { id: '0', index: 0 } },
        { Manufacturer: 'Acura', Model: 'Legend', Type: 'Midsize', __state: { id: '1', index: 1 } }
      ],
      pageCount: 1,
      rowCount: 2,
      maxRowCount: 2
    }
    expect(data).toEqual(expected)
  })

  it('renders tables to data with JS evals', () => {
    const propsJson = `{
      "props": {
        "data": {
          "Manufacturer": ["Acura", "Acura"],
          "Model": ["Integra", "Legend"],
          "Type": ["Small", "Midsize"]
        },
        "columns": [
          { "id": "Manufacturer", "name": "Manufacturer", "type": "factor" },
          { "id": "Model", "name": "Model", "type": "factor", "aggregate": "() => '__aggregated__'" },
          { "id": "Type", "name": "Type", "type": "factor" }
        ],
        "pagination": true,
        "paginateSubRows": false
      },
      "evals": ["columns.1.aggregate"]
    }`
    setInitialProps(propsJson)

    const inputJson = `{ "props": { "pageIndex": 0, "pageSize": 10, "groupBy": ["Manufacturer"] } }`
    const data = renderToData(inputJson)
    const expected = {
      data: [
        {
          '.subRows': [
            {
              Manufacturer: 'Acura',
              Model: 'Integra',
              Type: 'Small',
              __state: { id: '0', index: 0 }
            },
            {
              Manufacturer: 'Acura',
              Model: 'Legend',
              Type: 'Midsize',
              __state: { id: '1', index: 1 }
            }
          ],
          Manufacturer: 'Acura',
          Model: '__aggregated__',
          Type: null,
          __state: { grouped: true, id: 'Manufacturer:Acura' }
        }
      ],
      pageCount: 1,
      rowCount: 1,
      maxRowCount: 1
    }
    expect(data).toEqual(expected)
  })
})
