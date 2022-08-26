const path = require('path')
const webpack = require('webpack')

module.exports = (env, argv) => {
  // Set NODE_ENV for Babel
  process.env.NODE_ENV = argv.mode

  return {
    // Target the minimum V8 version used by the V8 package in R across all supported platforms.
    // This is currently V8 6.2 (Chrome 62) on Windows R 3.5-4.1, or V8 6.8 on CentOS/RHEL 7 (Chrome 68),
    // which have full ES6 support. NOTE: this is not the same as the Node or web worker target.
    target: 'es6',

    entry: {
      'reactable.server': path.join(__dirname, 'srcjs', 'server.js')
    },

    output: {
      filename: '[name].js',
      path: path.join(__dirname, 'inst', 'htmlwidgets'),

      library: {
        name: 'Reactable',
        type: 'assign-properties'
      },

      // Required when using target: esX, and required to run in V8 (also compatible with web/web worker)
      chunkFormat: 'array-push'
    },

    resolve: {
      alias: {
        // Import react-table directly from the ESM source for tree shaking, since
        // react-table doesn't support tree shaking out of the box. Only worth it
        // because we've made so many custom/modified hooks, and this significantly
        // reduces bundle size.
        'react-table$': 'react-table/src/index.js',

        // reactR is an external in the client build, but must be bundled in the
        // server build for now because it assumes a browser environment.
        reactR$: path.join(__dirname, 'srcjs', 'reactR.js')
      },
      // Node polyfills for packages designed to run in in Node, but not V8
      fallback: {
        // For @emotion/server/create-instance
        buffer: require.resolve('buffer/'),
        // For @emotion/server/create-instance
        process: require.resolve('process/browser'),
        // For react-dom/server
        stream: require.resolve('stream-browserify'),
        // For @emotion/server/create-instance
        util: require.resolve('util/')
      }
    },

    plugins: [
      // Node polyfills for packages designed to run in in Node, but not V8
      new webpack.ProvidePlugin({
        // For @emotion/server/create-instance
        Buffer: ['buffer', 'Buffer'],
        // For @emotion/server/create-instance
        process: 'process/browser'
      })
    ],

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        },
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'node_modules/react-table'),
          use: 'babel-loader'
        }
        // CSS loaders omitted since the client build already extracts CSS to an external file
      ]
    },

    externals: [
      {
        // React is not external and must be bundled because reactR doesn't provide
        // react-dom/server, and the React/ReactDOMServer versions should ideally match.

        // Ignore CSS imports, which are included via the external CSS file
        './reactable.css': {},
        './react-table.css': {}
      }
    ],

    stats: {
      colors: true
    },

    devtool: 'source-map'
  }
}
