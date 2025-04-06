// Intl polyfill for reactable's column formatters when server-side rendering in V8

// Intl.NumberFormat
// https://formatjs.io/docs/polyfills/intl-numberformat

// Dependencies for Intl.NumberFormat - must be imported in this order
import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-pluralrules/polyfill'

import '@formatjs/intl-numberformat/polyfill'
// Current limitation: only locale data for en is included for now
import '@formatjs/intl-numberformat/locale-data/en'
