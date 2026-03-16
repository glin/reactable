import * as duckdb from '@duckdb/duckdb-wasm'

export class DuckDBEngine {
  constructor() {
    this.db = null
    this.conn = null
    this.totalRowCount = 0
  }

  async init(arrowBase64, wasmBasePath) {
    // Build bundle descriptor pointing to self-hosted WASM/worker files
    const bundles = {
      mvp: {
        mainModule: wasmBasePath + 'duckdb-mvp.wasm',
        mainWorker: wasmBasePath + 'duckdb-browser-mvp.worker.js'
      },
      eh: {
        mainModule: wasmBasePath + 'duckdb-eh.wasm',
        mainWorker: wasmBasePath + 'duckdb-browser-eh.worker.js'
      }
    }

    const bundle = await duckdb.selectBundle(bundles)
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    )
    const worker = new Worker(worker_url)
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
    this.db = new duckdb.AsyncDuckDB(logger, worker)
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    URL.revokeObjectURL(worker_url)

    // Decode base64 Arrow IPC and load into DuckDB
    const bytes = Uint8Array.from(atob(arrowBase64), c => c.charCodeAt(0))
    this.conn = await this.db.connect()
    await this.conn.insertArrowFromIPCStream(bytes, { name: 'reactable_data', create: true })

    // Get total row count
    const countResult = await this.conn.query('SELECT COUNT(*) as n FROM reactable_data')
    this.totalRowCount = Number(countResult.toArray()[0].n)
  }

  async query({ pageIndex, pageSize }) {
    const offset = pageIndex * pageSize
    const result = await this.conn.query(
      `SELECT * FROM reactable_data LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`
    )

    // Convert Arrow result to row objects
    const rows = result.toArray().map(row => row.toJSON())

    return {
      rows,
      rowCount: this.totalRowCount
    }
  }

  async destroy() {
    if (this.conn) {
      await this.conn.close()
      this.conn = null
    }
    if (this.db) {
      await this.db.terminate()
      this.db = null
    }
  }
}
