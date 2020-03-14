const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = (env, argv) => {
  // Set NODE_ENV for Babel
  process.env.NODE_ENV = argv.mode

  return {
    entry: path.join(__dirname, 'srcjs', 'index.js'),

    output: {
      filename: 'reactable.js',
      path: path.join(__dirname, 'inst', 'htmlwidgets')
    },

    optimization: {
      minimizer: [
        new TerserPlugin({
          extractComments: false
        }),
        new OptimizeCssAssetsPlugin()
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: 'reactable.css'
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
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: [require('autoprefixer')]
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
