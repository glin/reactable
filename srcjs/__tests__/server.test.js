/**
 * @jest-environment node
 */

import { renderToHTML } from '../server'

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
