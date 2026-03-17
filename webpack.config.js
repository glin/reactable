const ClientConfig = require('./webpack.config.client')
const ServerConfig = require('./webpack.config.server')
const DuckDBConfig = require('./webpack.config.duckdb')

module.exports = [ClientConfig, ServerConfig, DuckDBConfig]
