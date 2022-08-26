/*
 * Extracted from htmlwidgets 1.5.4 (https://github.com/ramnathv/htmlwidgets/blob/v1.5.4/inst/www/htmlwidgets.js)
 * Copyright 2016 Ramnath Vaidyanathan, Joe Cheng, JJ Allaire, Yihui Xie, and Kenton Russell
 * Licensed under MIT (https://github.com/ramnathv/htmlwidgets/blob/v1.5.4/LICENSE)
 */

// Required to evaluate JS() expressions for statically rendered tables.
// Must be bundled because htmlwidgets.js needs to be run in a browser context
// and can't be sourced at runtime in V8 environment.
export function evaluateStringMember(o, member) {
  var parts = splitWithEscape(member, '.', '\\')
  for (var i = 0, l = parts.length; i < l; i++) {
    var part = parts[i]
    // part may be a character or 'numeric' member name
    if (o !== null && typeof o === 'object' && part in o) {
      if (i == l - 1) {
        // if we are at the end of the line then evalulate
        if (typeof o[part] === 'string') o[part] = tryEval(o[part])
      } else {
        // otherwise continue to next embedded object
        o = o[part]
      }
    }
  }
}

// Split value at splitChar, but allow splitChar to be escaped
// using escapeChar. Any other characters escaped by escapeChar
// will be included as usual (including escapeChar itself).
function splitWithEscape(value, splitChar, escapeChar) {
  var results = []
  var escapeMode = false
  var currentResult = ''
  for (var pos = 0; pos < value.length; pos++) {
    if (!escapeMode) {
      if (value[pos] === splitChar) {
        results.push(currentResult)
        currentResult = ''
      } else if (value[pos] === escapeChar) {
        escapeMode = true
      } else {
        currentResult += value[pos]
      }
    } else {
      currentResult += value[pos]
      escapeMode = false
    }
  }
  if (currentResult !== '') {
    results.push(currentResult)
  }
  return results
}

// Attempt eval() both with and without enclosing in parentheses.
// Note that enclosing coerces a function declaration into
// an expression that eval() can parse
// (otherwise, a SyntaxError is thrown)
function tryEval(code) {
  var result = null
  try {
    result = eval('(' + code + ')')
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error
    }
    try {
      result = eval(code)
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw error
      } else {
        throw e
      }
    }
  }
  return result
}
