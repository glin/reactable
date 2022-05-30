const path = require('path')

module.exports = (env, argv) => {
  // Set NODE_ENV for Babel
  process.env.NODE_ENV = argv.mode

  return {
    entry: {
      reactable: path.join(__dirname, 'srcjs', 'index.js')
    },

    output: {
      filename: '[name].js',
      path: path.join(__dirname, 'inst', 'htmlwidgets'),
      library: {
        name: 'Reactable',
        type: 'assign-properties'
      }
    },

    resolve: {
      alias: {
        // Import react-table directly from the ESM source for tree shaking, since
        // react-table doesn't support tree shaking out of the box. Only worth it
        // because we've made so many custom/modified hooks, and this significantly
        // reduces bundle size.
        'react-table$': 'react-table/src/index.js'
      }
    },

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
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [require('autoprefixer'), require('cssnano')]
                }
              }
            }
          ]
        }
      ]
    },

    externals: {
      react: 'window.React',
      'react-dom': 'window.ReactDOM',
      reactR: 'window.reactR'
    },

    stats: {
      colors: true
    },

    devtool: 'source-map'
  }
}
