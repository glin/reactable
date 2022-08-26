module.exports = {
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '^reactR$': 'identity-obj-proxy'
  },
  // Transpile react-table since it's being imported directly from source (see webpack.config.js)
  transformIgnorePatterns: ['/node_modules/(?!react-table)'],
  testEnvironment: 'jsdom'
}
