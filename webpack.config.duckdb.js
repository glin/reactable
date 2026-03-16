const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
  // Set NODE_ENV for Babel
  process.env.NODE_ENV = argv.mode

  return {
    entry: path.join(__dirname, 'srcjs', 'duckdb-entry.js'),

    output: {
      filename: 'reactable-duckdb.js',
      path: path.join(__dirname, 'inst', 'htmlwidgets', 'lib', 'duckdb-wasm')
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        }
      ]
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist', 'duckdb-mvp.wasm'),
            to: '.'
          },
          {
            from: path.join(__dirname, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist', 'duckdb-eh.wasm'),
            to: '.'
          },
          {
            from: path.join(
              __dirname,
              'node_modules',
              '@duckdb',
              'duckdb-wasm',
              'dist',
              'duckdb-browser-mvp.worker.js'
            ),
            to: '.'
          },
          {
            from: path.join(
              __dirname,
              'node_modules',
              '@duckdb',
              'duckdb-wasm',
              'dist',
              'duckdb-browser-eh.worker.js'
            ),
            to: '.'
          }
        ]
      })
    ],

    externals: {
      react: 'window.React',
      'react-dom': 'window.ReactDOM'
    },

    stats: {
      colors: true
    },

    devtool: 'source-map'
  }
}
