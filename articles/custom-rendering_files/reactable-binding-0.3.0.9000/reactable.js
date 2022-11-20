/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _emotion_sheet__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @emotion/sheet */ "./node_modules/@emotion/sheet/dist/emotion-sheet.browser.esm.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Tokenizer.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Utility.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Middleware.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Serializer.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Enum.js");
/* harmony import */ var stylis__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! stylis */ "./node_modules/stylis/src/Parser.js");
/* harmony import */ var _emotion_weak_memoize__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @emotion/weak-memoize */ "./node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js");
/* harmony import */ var _emotion_memoize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @emotion/memoize */ "./node_modules/@emotion/cache/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js");





var last = function last(arr) {
  return arr.length ? arr[arr.length - 1] : null;
}; // based on https://github.com/thysultan/stylis.js/blob/e6843c373ebcbbfade25ebcc23f540ed8508da0a/src/Tokenizer.js#L239-L244


var identifierWithPointTracking = function identifierWithPointTracking(begin, points, index) {
  var previous = 0;
  var character = 0;

  while (true) {
    previous = character;
    character = (0,stylis__WEBPACK_IMPORTED_MODULE_3__.peek)(); // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1;
    }

    if ((0,stylis__WEBPACK_IMPORTED_MODULE_3__.token)(character)) {
      break;
    }

    (0,stylis__WEBPACK_IMPORTED_MODULE_3__.next)();
  }

  return (0,stylis__WEBPACK_IMPORTED_MODULE_3__.slice)(begin, stylis__WEBPACK_IMPORTED_MODULE_3__.position);
};

var toRules = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1;
  var character = 44;

  do {
    switch ((0,stylis__WEBPACK_IMPORTED_MODULE_3__.token)(character)) {
      case 0:
        // &\f
        if (character === 38 && (0,stylis__WEBPACK_IMPORTED_MODULE_3__.peek)() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1;
        }

        parsed[index] += identifierWithPointTracking(stylis__WEBPACK_IMPORTED_MODULE_3__.position - 1, points, index);
        break;

      case 2:
        parsed[index] += (0,stylis__WEBPACK_IMPORTED_MODULE_3__.delimit)(character);
        break;

      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = (0,stylis__WEBPACK_IMPORTED_MODULE_3__.peek)() === 58 ? '&\f' : '';
          points[index] = parsed[index].length;
          break;
        }

      // fallthrough

      default:
        parsed[index] += (0,stylis__WEBPACK_IMPORTED_MODULE_4__.from)(character);
    }
  } while (character = (0,stylis__WEBPACK_IMPORTED_MODULE_3__.next)());

  return parsed;
};

var getRules = function getRules(value, points) {
  return (0,stylis__WEBPACK_IMPORTED_MODULE_3__.dealloc)(toRules((0,stylis__WEBPACK_IMPORTED_MODULE_3__.alloc)(value), points));
}; // WeakSet would be more appropriate, but only WeakMap is supported in IE11


var fixedElements = /* #__PURE__ */new WeakMap();
var compat = function compat(element) {
  if (element.type !== 'rule' || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }

  var value = element.value,
      parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;

  while (parent.type !== 'rule') {
    parent = parent.parent;
    if (!parent) return;
  } // short-circuit for the simplest case


  if (element.props.length === 1 && value.charCodeAt(0) !== 58
  /* colon */
  && !fixedElements.get(parent)) {
    return;
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"


  if (isImplicitRule) {
    return;
  }

  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;

  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value;

    if ( // charcode for l
    value.charCodeAt(0) === 108 && // charcode for b
    value.charCodeAt(2) === 98) {
      // this ignores label
      element["return"] = '';
      element.value = '';
    }
  }
};
var ignoreFlag = 'emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason';

var isIgnoringComment = function isIgnoringComment(element) {
  return !!element && element.type === 'comm' && element.children.indexOf(ignoreFlag) > -1;
};

var createUnsafeSelectorsAlarm = function createUnsafeSelectorsAlarm(cache) {
  return function (element, index, children) {
    if (element.type !== 'rule') return;
    var unsafePseudoClasses = element.value.match(/(:first|:nth|:nth-last)-child/g);

    if (unsafePseudoClasses && cache.compat !== true) {
      var prevElement = index > 0 ? children[index - 1] : null;

      if (prevElement && isIgnoringComment(last(prevElement.children))) {
        return;
      }

      unsafePseudoClasses.forEach(function (unsafePseudoClass) {
        console.error("The pseudo class \"" + unsafePseudoClass + "\" is potentially unsafe when doing server-side rendering. Try changing it to \"" + unsafePseudoClass.split('-child')[0] + "-of-type\".");
      });
    }
  };
};

var isImportRule = function isImportRule(element) {
  return element.type.charCodeAt(1) === 105 && element.type.charCodeAt(0) === 64;
};

var isPrependedWithRegularRules = function isPrependedWithRegularRules(index, children) {
  for (var i = index - 1; i >= 0; i--) {
    if (!isImportRule(children[i])) {
      return true;
    }
  }

  return false;
}; // use this to remove incorrect elements from further processing
// so they don't get handed to the `sheet` (or anything else)
// as that could potentially lead to additional logs which in turn could be overhelming to the user


var nullifyElement = function nullifyElement(element) {
  element.type = '';
  element.value = '';
  element["return"] = '';
  element.children = '';
  element.props = '';
};

var incorrectImportAlarm = function incorrectImportAlarm(element, index, children) {
  if (!isImportRule(element)) {
    return;
  }

  if (element.parent) {
    console.error("`@import` rules can't be nested inside other rules. Please move it to the top level and put it before regular rules. Keep in mind that they can only be used within global styles.");
    nullifyElement(element);
  } else if (isPrependedWithRegularRules(index, children)) {
    console.error("`@import` rules can't be after other rules. Please put your `@import` rules before your other rules.");
    nullifyElement(element);
  }
};

var defaultStylisPlugins = [stylis__WEBPACK_IMPORTED_MODULE_5__.prefixer];

var createCache = function createCache(options) {
  var key = options.key;

  if ( true && !key) {
    throw new Error("You have to configure `key` for your cache. Please make sure it's unique (and not equal to 'css') as it's used for linking styles to your cache.\n" + "If multiple caches share the same key they might \"fight\" for each other's style elements.");
  }

  if ( key === 'css') {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])"); // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion');

      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return;
      }
      document.head.appendChild(node);
      node.setAttribute('data-s', '');
    });
  }

  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;

  if (true) {
    // $FlowFixMe
    if (/[^a-z-]/.test(key)) {
      throw new Error("Emotion key must only contain lower case alphabetical characters and - but \"" + key + "\" was passed");
    }
  }

  var inserted = {};
  var container;
  var nodesToHydrate = [];

  {
    container = options.container || document.head;
    Array.prototype.forEach.call( // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll("style[data-emotion^=\"" + key + " \"]"), function (node) {
      var attrib = node.getAttribute("data-emotion").split(' '); // $FlowFixMe

      for (var i = 1; i < attrib.length; i++) {
        inserted[attrib[i]] = true;
      }

      nodesToHydrate.push(node);
    });
  }

  var _insert;

  var omnipresentPlugins = [compat, removeLabel];

  if (true) {
    omnipresentPlugins.push(createUnsafeSelectorsAlarm({
      get compat() {
        return cache.compat;
      }

    }), incorrectImportAlarm);
  }

  {
    var currentSheet;
    var finalizingPlugins = [stylis__WEBPACK_IMPORTED_MODULE_6__.stringify,  true ? function (element) {
      if (!element.root) {
        if (element["return"]) {
          currentSheet.insert(element["return"]);
        } else if (element.value && element.type !== stylis__WEBPACK_IMPORTED_MODULE_7__.COMMENT) {
          // insert empty rule in non-production environments
          // so @emotion/jest can grab `key` from the (JS)DOM for caches without any rules inserted yet
          currentSheet.insert(element.value + "{}");
        }
      }
    } : 0];
    var serializer = (0,stylis__WEBPACK_IMPORTED_MODULE_5__.middleware)(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));

    var stylis = function stylis(styles) {
      return (0,stylis__WEBPACK_IMPORTED_MODULE_6__.serialize)((0,stylis__WEBPACK_IMPORTED_MODULE_8__.compile)(styles), serializer);
    };

    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet;

      if ( true && serialized.map !== undefined) {
        currentSheet = {
          insert: function insert(rule) {
            sheet.insert(rule + serialized.map);
          }
        };
      }

      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);

      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  }

  var cache = {
    key: key,
    sheet: new _emotion_sheet__WEBPACK_IMPORTED_MODULE_0__.StyleSheet({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};

/* harmony default export */ __webpack_exports__["default"] = (createCache);


/***/ }),

/***/ "./node_modules/@emotion/cache/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/@emotion/cache/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js ***!
  \***********************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function memoize(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

/* harmony default export */ __webpack_exports__["default"] = (memoize);


/***/ }),

/***/ "./node_modules/@emotion/css/create-instance/dist/emotion-css-create-instance.esm.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@emotion/css/create-instance/dist/emotion-css-create-instance.esm.js ***!
  \*******************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _emotion_cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @emotion/cache */ "./node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js");
/* harmony import */ var _emotion_serialize__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @emotion/serialize */ "./node_modules/@emotion/serialize/dist/emotion-serialize.browser.esm.js");
/* harmony import */ var _emotion_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @emotion/utils */ "./node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js");




function insertWithoutScoping(cache, serialized) {
  if (cache.inserted[serialized.name] === undefined) {
    return cache.insert('', serialized, cache.sheet, true);
  }
}

function merge(registered, css, className) {
  var registeredStyles = [];
  var rawClassName = (0,_emotion_utils__WEBPACK_IMPORTED_MODULE_2__.getRegisteredStyles)(registered, registeredStyles, className);

  if (registeredStyles.length < 2) {
    return className;
  }

  return rawClassName + css(registeredStyles);
}

var createEmotion = function createEmotion(options) {
  var cache = (0,_emotion_cache__WEBPACK_IMPORTED_MODULE_0__["default"])(options); // $FlowFixMe

  cache.sheet.speedy = function (value) {
    if ( true && this.ctr !== 0) {
      throw new Error('speedy must be changed before any rules are inserted');
    }

    this.isSpeedy = value;
  };

  cache.compat = true;

  var css = function css() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var serialized = (0,_emotion_serialize__WEBPACK_IMPORTED_MODULE_1__.serializeStyles)(args, cache.registered, undefined);
    (0,_emotion_utils__WEBPACK_IMPORTED_MODULE_2__.insertStyles)(cache, serialized, false);
    return cache.key + "-" + serialized.name;
  };

  var keyframes = function keyframes() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var serialized = (0,_emotion_serialize__WEBPACK_IMPORTED_MODULE_1__.serializeStyles)(args, cache.registered);
    var animation = "animation-" + serialized.name;
    insertWithoutScoping(cache, {
      name: serialized.name,
      styles: "@keyframes " + animation + "{" + serialized.styles + "}"
    });
    return animation;
  };

  var injectGlobal = function injectGlobal() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var serialized = (0,_emotion_serialize__WEBPACK_IMPORTED_MODULE_1__.serializeStyles)(args, cache.registered);
    insertWithoutScoping(cache, serialized);
  };

  var cx = function cx() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return merge(cache.registered, css, classnames(args));
  };

  return {
    css: css,
    cx: cx,
    injectGlobal: injectGlobal,
    keyframes: keyframes,
    hydrate: function hydrate(ids) {
      ids.forEach(function (key) {
        cache.inserted[key] = true;
      });
    },
    flush: function flush() {
      cache.registered = {};
      cache.inserted = {};
      cache.sheet.flush();
    },
    // $FlowFixMe
    sheet: cache.sheet,
    cache: cache,
    getRegisteredStyles: _emotion_utils__WEBPACK_IMPORTED_MODULE_2__.getRegisteredStyles.bind(null, cache.registered),
    merge: merge.bind(null, cache.registered, css)
  };
};

var classnames = function classnames(args) {
  var cls = '';

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (arg == null) continue;
    var toAdd = void 0;

    switch (typeof arg) {
      case 'boolean':
        break;

      case 'object':
        {
          if (Array.isArray(arg)) {
            toAdd = classnames(arg);
          } else {
            toAdd = '';

            for (var k in arg) {
              if (arg[k] && k) {
                toAdd && (toAdd += ' ');
                toAdd += k;
              }
            }
          }

          break;
        }

      default:
        {
          toAdd = arg;
        }
    }

    if (toAdd) {
      cls && (cls += ' ');
      cls += toAdd;
    }
  }

  return cls;
};

/* harmony default export */ __webpack_exports__["default"] = (createEmotion);


/***/ }),

/***/ "./node_modules/@emotion/hash/dist/emotion-hash.esm.js":
/*!*************************************************************!*\
  !*** ./node_modules/@emotion/hash/dist/emotion-hash.esm.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* eslint-disable */
// Inspired by https://github.com/garycourt/murmurhash-js
// Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
function murmur2(str) {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.
  // const m = 0x5bd1e995;
  // const r = 24;
  // Initialize the hash
  var h = 0; // Mix 4 bytes at a time into the hash

  var k,
      i = 0,
      len = str.length;

  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
    k ^=
    /* k >>> r: */
    k >>> 24;
    h =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Handle the last few bytes of the input array


  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h =
      /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.


  h ^= h >>> 13;
  h =
  /* Math.imul(h, m): */
  (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

/* harmony default export */ __webpack_exports__["default"] = (murmur2);


/***/ }),

/***/ "./node_modules/@emotion/serialize/dist/emotion-serialize.browser.esm.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@emotion/serialize/dist/emotion-serialize.browser.esm.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serializeStyles": function() { return /* binding */ serializeStyles; }
/* harmony export */ });
/* harmony import */ var _emotion_hash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @emotion/hash */ "./node_modules/@emotion/hash/dist/emotion-hash.esm.js");
/* harmony import */ var _emotion_unitless__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @emotion/unitless */ "./node_modules/@emotion/unitless/dist/emotion-unitless.esm.js");
/* harmony import */ var _emotion_memoize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @emotion/memoize */ "./node_modules/@emotion/serialize/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js");




var ILLEGAL_ESCAPE_SEQUENCE_ERROR = "You have illegal escape sequence in your template literal, most likely inside content's property value.\nBecause you write your CSS inside a JavaScript string you actually have to do double escaping, so for example \"content: '\\00d7';\" should become \"content: '\\\\00d7';\".\nYou can read more about this here:\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences";
var UNDEFINED_AS_OBJECT_KEY_ERROR = "You have passed in falsy value as style object's key (can happen when in example you pass unexported component as computed key).";
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;

var isCustomProperty = function isCustomProperty(property) {
  return property.charCodeAt(1) === 45;
};

var isProcessableValue = function isProcessableValue(value) {
  return value != null && typeof value !== 'boolean';
};

var processStyleName = /* #__PURE__ */(0,_emotion_memoize__WEBPACK_IMPORTED_MODULE_2__["default"])(function (styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, '-$&').toLowerCase();
});

var processStyleValue = function processStyleValue(key, value) {
  switch (key) {
    case 'animation':
    case 'animationName':
      {
        if (typeof value === 'string') {
          return value.replace(animationRegex, function (match, p1, p2) {
            cursor = {
              name: p1,
              styles: p2,
              next: cursor
            };
            return p1;
          });
        }
      }
  }

  if (_emotion_unitless__WEBPACK_IMPORTED_MODULE_1__["default"][key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0) {
    return value + 'px';
  }

  return value;
};

if (true) {
  var contentValuePattern = /(var|attr|counters?|url|(((repeating-)?(linear|radial))|conic)-gradient)\(|(no-)?(open|close)-quote/;
  var contentValues = ['normal', 'none', 'initial', 'inherit', 'unset'];
  var oldProcessStyleValue = processStyleValue;
  var msPattern = /^-ms-/;
  var hyphenPattern = /-(.)/g;
  var hyphenatedCache = {};

  processStyleValue = function processStyleValue(key, value) {
    if (key === 'content') {
      if (typeof value !== 'string' || contentValues.indexOf(value) === -1 && !contentValuePattern.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== '"' && value.charAt(0) !== "'")) {
        throw new Error("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"" + value + "\"'`");
      }
    }

    var processed = oldProcessStyleValue(key, value);

    if (processed !== '' && !isCustomProperty(key) && key.indexOf('-') !== -1 && hyphenatedCache[key] === undefined) {
      hyphenatedCache[key] = true;
      console.error("Using kebab-case for css properties in objects is not supported. Did you mean " + key.replace(msPattern, 'ms-').replace(hyphenPattern, function (str, _char) {
        return _char.toUpperCase();
      }) + "?");
    }

    return processed;
  };
}

var noComponentSelectorMessage = 'Component selectors can only be used in conjunction with ' + '@emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware ' + 'compiler transform.';

function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return '';
  }

  if (interpolation.__emotion_styles !== undefined) {
    if ( true && interpolation.toString() === 'NO_COMPONENT_SELECTOR') {
      throw new Error(noComponentSelectorMessage);
    }

    return interpolation;
  }

  switch (typeof interpolation) {
    case 'boolean':
      {
        return '';
      }

    case 'object':
      {
        if (interpolation.anim === 1) {
          cursor = {
            name: interpolation.name,
            styles: interpolation.styles,
            next: cursor
          };
          return interpolation.name;
        }

        if (interpolation.styles !== undefined) {
          var next = interpolation.next;

          if (next !== undefined) {
            // not the most efficient thing ever but this is a pretty rare case
            // and there will be very few iterations of this generally
            while (next !== undefined) {
              cursor = {
                name: next.name,
                styles: next.styles,
                next: cursor
              };
              next = next.next;
            }
          }

          var styles = interpolation.styles + ";";

          if ( true && interpolation.map !== undefined) {
            styles += interpolation.map;
          }

          return styles;
        }

        return createStringFromObject(mergedProps, registered, interpolation);
      }

    case 'function':
      {
        if (mergedProps !== undefined) {
          var previousCursor = cursor;
          var result = interpolation(mergedProps);
          cursor = previousCursor;
          return handleInterpolation(mergedProps, registered, result);
        } else if (true) {
          console.error('Functions that are interpolated in css calls will be stringified.\n' + 'If you want to have a css call based on props, create a function that returns a css call like this\n' + 'let dynamicStyle = (props) => css`color: ${props.color}`\n' + 'It can be called directly with props or interpolated in a styled call like this\n' + "let SomeComponent = styled('div')`${dynamicStyle}`");
        }

        break;
      }

    case 'string':
      if (true) {
        var matched = [];
        var replaced = interpolation.replace(animationRegex, function (match, p1, p2) {
          var fakeVarName = "animation" + matched.length;
          matched.push("const " + fakeVarName + " = keyframes`" + p2.replace(/^@keyframes animation-\w+/, '') + "`");
          return "${" + fakeVarName + "}";
        });

        if (matched.length) {
          console.error('`keyframes` output got interpolated into plain string, please wrap it with `css`.\n\n' + 'Instead of doing this:\n\n' + [].concat(matched, ["`" + replaced + "`"]).join('\n') + '\n\nYou should wrap it with `css` like this:\n\n' + ("css`" + replaced + "`"));
        }
      }

      break;
  } // finalize string values (regular strings and functions interpolated into css calls)


  if (registered == null) {
    return interpolation;
  }

  var cached = registered[interpolation];
  return cached !== undefined ? cached : interpolation;
}

function createStringFromObject(mergedProps, registered, obj) {
  var string = '';

  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var _key in obj) {
      var value = obj[_key];

      if (typeof value !== 'object') {
        if (registered != null && registered[value] !== undefined) {
          string += _key + "{" + registered[value] + "}";
        } else if (isProcessableValue(value)) {
          string += processStyleName(_key) + ":" + processStyleValue(_key, value) + ";";
        }
      } else {
        if (_key === 'NO_COMPONENT_SELECTOR' && "development" !== 'production') {
          throw new Error(noComponentSelectorMessage);
        }

        if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(_key) + ":" + processStyleValue(_key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);

          switch (_key) {
            case 'animation':
            case 'animationName':
              {
                string += processStyleName(_key) + ":" + interpolated + ";";
                break;
              }

            default:
              {
                if ( true && _key === 'undefined') {
                  console.error(UNDEFINED_AS_OBJECT_KEY_ERROR);
                }

                string += _key + "{" + interpolated + "}";
              }
          }
        }
      }
    }
  }

  return string;
}

var labelPattern = /label:\s*([^\s;\n{]+)\s*(;|$)/g;
var sourceMapPattern;

if (true) {
  sourceMapPattern = /\/\*#\ssourceMappingURL=data:application\/json;\S+\s+\*\//g;
} // this is the cursor for keyframes
// keyframes are stored on the SerializedStyles object as a linked list


var cursor;
var serializeStyles = function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }

  var stringMode = true;
  var styles = '';
  cursor = undefined;
  var strings = args[0];

  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    if ( true && strings[0] === undefined) {
      console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
    }

    styles += strings[0];
  } // we start at 1 since we've already handled the first arg


  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);

    if (stringMode) {
      if ( true && strings[i] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
      }

      styles += strings[i];
    }
  }

  var sourceMap;

  if (true) {
    styles = styles.replace(sourceMapPattern, function (match) {
      sourceMap = match;
      return '';
    });
  } // using a global regex with .exec is stateful so lastIndex has to be reset each time


  labelPattern.lastIndex = 0;
  var identifierName = '';
  var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

  while ((match = labelPattern.exec(styles)) !== null) {
    identifierName += '-' + // $FlowFixMe we know it's not null
    match[1];
  }

  var name = (0,_emotion_hash__WEBPACK_IMPORTED_MODULE_0__["default"])(styles) + identifierName;

  if (true) {
    // $FlowFixMe SerializedStyles type doesn't have toString property (and we don't want to add it)
    return {
      name: name,
      styles: styles,
      map: sourceMap,
      next: cursor,
      toString: function toString() {
        return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).";
      }
    };
  }

  return {
    name: name,
    styles: styles,
    next: cursor
  };
};




/***/ }),

/***/ "./node_modules/@emotion/serialize/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/@emotion/serialize/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js ***!
  \***************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function memoize(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

/* harmony default export */ __webpack_exports__["default"] = (memoize);


/***/ }),

/***/ "./node_modules/@emotion/sheet/dist/emotion-sheet.browser.esm.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@emotion/sheet/dist/emotion-sheet.browser.esm.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StyleSheet": function() { return /* binding */ StyleSheet; }
/* harmony export */ });
/*

Based off glamor's StyleSheet, thanks Sunil ❤️

high performance StyleSheet for css-in-js systems

- uses multiple style tags behind the scenes for millions of rules
- uses `insertRule` for appending in production for *much* faster performance

// usage

import { StyleSheet } from '@emotion/sheet'

let styleSheet = new StyleSheet({ key: '', container: document.head })

styleSheet.insert('#box { border: 1px solid red; }')
- appends a css rule into the stylesheet

styleSheet.flush()
- empties the stylesheet of all its contents

*/
// $FlowFixMe
function sheetForTag(tag) {
  if (tag.sheet) {
    // $FlowFixMe
    return tag.sheet;
  } // this weirdness brought to you by firefox

  /* istanbul ignore next */


  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      // $FlowFixMe
      return document.styleSheets[i];
    }
  }
}

function createStyleElement(options) {
  var tag = document.createElement('style');
  tag.setAttribute('data-emotion', options.key);

  if (options.nonce !== undefined) {
    tag.setAttribute('nonce', options.nonce);
  }

  tag.appendChild(document.createTextNode(''));
  tag.setAttribute('data-s', '');
  return tag;
}

var StyleSheet = /*#__PURE__*/function () {
  // Using Node instead of HTMLElement since container may be a ShadowRoot
  function StyleSheet(options) {
    var _this = this;

    this._insertTag = function (tag) {
      var before;

      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }

      _this.container.insertBefore(tag, before);

      _this.tags.push(tag);
    };

    this.isSpeedy = options.speedy === undefined ? "development" === 'production' : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }

  var _proto = StyleSheet.prototype;

  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };

  _proto.insert = function insert(rule) {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }

    var tag = this.tags[this.tags.length - 1];

    if (true) {
      var isImportRule = rule.charCodeAt(0) === 64 && rule.charCodeAt(1) === 105;

      if (isImportRule && this._alreadyInsertedOrderInsensitiveRule) {
        // this would only cause problem in speedy mode
        // but we don't want enabling speedy to affect the observable behavior
        // so we report this error at all times
        console.error("You're attempting to insert the following rule:\n" + rule + '\n\n`@import` rules must be before all other types of rules in a stylesheet but other rules have already been inserted. Please ensure that `@import` rules are before all other rules.');
      }
      this._alreadyInsertedOrderInsensitiveRule = this._alreadyInsertedOrderInsensitiveRule || !isImportRule;
    }

    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);

      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
        if ( true && !/:(-moz-placeholder|-moz-focus-inner|-moz-focusring|-ms-input-placeholder|-moz-read-write|-moz-read-only|-ms-clear){/.test(rule)) {
          console.error("There was a problem inserting the following rule: \"" + rule + "\"", e);
        }
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }

    this.ctr++;
  };

  _proto.flush = function flush() {
    // $FlowFixMe
    this.tags.forEach(function (tag) {
      return tag.parentNode && tag.parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;

    if (true) {
      this._alreadyInsertedOrderInsensitiveRule = false;
    }
  };

  return StyleSheet;
}();




/***/ }),

/***/ "./node_modules/@emotion/unitless/dist/emotion-unitless.esm.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@emotion/unitless/dist/emotion-unitless.esm.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var unitlessKeys = {
  animationIterationCount: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

/* harmony default export */ __webpack_exports__["default"] = (unitlessKeys);


/***/ }),

/***/ "./node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getRegisteredStyles": function() { return /* binding */ getRegisteredStyles; },
/* harmony export */   "insertStyles": function() { return /* binding */ insertStyles; },
/* harmony export */   "registerStyles": function() { return /* binding */ registerStyles; }
/* harmony export */ });
var isBrowser = "object" !== 'undefined';
function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = '';
  classNames.split(' ').forEach(function (className) {
    if (registered[className] !== undefined) {
      registeredStyles.push(registered[className] + ";");
    } else {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles(cache, serialized, isStringTag) {
  var className = cache.key + "-" + serialized.name;

  if ( // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (isStringTag === false || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  isBrowser === false ) && cache.registered[className] === undefined) {
    cache.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;

  if (cache.inserted[serialized.name] === undefined) {
    var current = serialized;

    do {
      var maybeStyles = cache.insert(serialized === current ? "." + className : '', current, cache.sheet, true);

      current = current.next;
    } while (current !== undefined);
  }
};




/***/ }),

/***/ "./node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js ***!
  \*****************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var weakMemoize = function weakMemoize(func) {
  // $FlowFixMe flow doesn't include all non-primitive types as allowed for weakmaps
  var cache = new WeakMap();
  return function (arg) {
    if (cache.has(arg)) {
      // $FlowFixMe
      return cache.get(arg);
    }

    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};

/* harmony default export */ __webpack_exports__["default"] = (weakMemoize);


/***/ }),

/***/ "./node_modules/react-table/src/aggregations.js":
/*!******************************************************!*\
  !*** ./node_modules/react-table/src/aggregations.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "average": function() { return /* binding */ average; },
/* harmony export */   "count": function() { return /* binding */ count; },
/* harmony export */   "max": function() { return /* binding */ max; },
/* harmony export */   "median": function() { return /* binding */ median; },
/* harmony export */   "min": function() { return /* binding */ min; },
/* harmony export */   "minMax": function() { return /* binding */ minMax; },
/* harmony export */   "sum": function() { return /* binding */ sum; },
/* harmony export */   "unique": function() { return /* binding */ unique; },
/* harmony export */   "uniqueCount": function() { return /* binding */ uniqueCount; }
/* harmony export */ });
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function sum(values, aggregatedValues) {
  // It's faster to just add the aggregations together instead of
  // process leaf nodes individually
  return aggregatedValues.reduce(function (sum, next) {
    return sum + (typeof next === 'number' ? next : 0);
  }, 0);
}
function min(values) {
  var min = values[0] || 0;
  values.forEach(function (value) {
    if (typeof value === 'number') {
      min = Math.min(min, value);
    }
  });
  return min;
}
function max(values) {
  var max = values[0] || 0;
  values.forEach(function (value) {
    if (typeof value === 'number') {
      max = Math.max(max, value);
    }
  });
  return max;
}
function minMax(values) {
  var min = values[0] || 0;
  var max = values[0] || 0;
  values.forEach(function (value) {
    if (typeof value === 'number') {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  });
  return "".concat(min, "..").concat(max);
}
function average(values) {
  return sum(null, values) / values.length;
}
function median(values) {
  if (!values.length) {
    return null;
  }

  var mid = Math.floor(values.length / 2);

  var nums = _toConsumableArray(values).sort(function (a, b) {
    return a - b;
  });

  return values.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}
function unique(values) {
  return Array.from(new Set(values).values());
}
function uniqueCount(values) {
  return new Set(values).size;
}
function count(values) {
  return values.length;
}

/***/ }),

/***/ "./node_modules/react-table/src/filterTypes.js":
/*!*****************************************************!*\
  !*** ./node_modules/react-table/src/filterTypes.js ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "between": function() { return /* binding */ between; },
/* harmony export */   "equals": function() { return /* binding */ equals; },
/* harmony export */   "exact": function() { return /* binding */ exact; },
/* harmony export */   "exactText": function() { return /* binding */ exactText; },
/* harmony export */   "exactTextCase": function() { return /* binding */ exactTextCase; },
/* harmony export */   "includes": function() { return /* binding */ includes; },
/* harmony export */   "includesAll": function() { return /* binding */ includesAll; },
/* harmony export */   "includesSome": function() { return /* binding */ includesSome; },
/* harmony export */   "includesValue": function() { return /* binding */ includesValue; },
/* harmony export */   "text": function() { return /* binding */ text; }
/* harmony export */ });
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var text = function text(rows, ids, filterValue) {
  rows = rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
    });
  });
  return rows;
};

text.autoRemove = function (val) {
  return !val;
};

var exactText = function exactText(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue !== undefined ? String(rowValue).toLowerCase() === String(filterValue).toLowerCase() : true;
    });
  });
};

exactText.autoRemove = function (val) {
  return !val;
};

var exactTextCase = function exactTextCase(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue !== undefined ? String(rowValue) === String(filterValue) : true;
    });
  });
};

exactTextCase.autoRemove = function (val) {
  return !val;
};

var includes = function includes(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue.includes(filterValue);
    });
  });
};

includes.autoRemove = function (val) {
  return !val || !val.length;
};

var includesAll = function includesAll(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue && rowValue.length && filterValue.every(function (val) {
        return rowValue.includes(val);
      });
    });
  });
};

includesAll.autoRemove = function (val) {
  return !val || !val.length;
};

var includesSome = function includesSome(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue && rowValue.length && filterValue.some(function (val) {
        return rowValue.includes(val);
      });
    });
  });
};

includesSome.autoRemove = function (val) {
  return !val || !val.length;
};

var includesValue = function includesValue(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return filterValue.includes(rowValue);
    });
  });
};

includesValue.autoRemove = function (val) {
  return !val || !val.length;
};

var exact = function exact(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue === filterValue;
    });
  });
};

exact.autoRemove = function (val) {
  return typeof val === 'undefined';
};

var equals = function equals(rows, ids, filterValue) {
  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id]; // eslint-disable-next-line eqeqeq

      return rowValue == filterValue;
    });
  });
};

equals.autoRemove = function (val) {
  return val == null;
};

var between = function between(rows, ids, filterValue) {
  var _ref = filterValue || [],
      _ref2 = _slicedToArray(_ref, 2),
      min = _ref2[0],
      max = _ref2[1];

  min = typeof min === 'number' ? min : -Infinity;
  max = typeof max === 'number' ? max : Infinity;

  if (min > max) {
    var temp = min;
    min = max;
    max = temp;
  }

  return rows.filter(function (row) {
    return ids.some(function (id) {
      var rowValue = row.values[id];
      return rowValue >= min && rowValue <= max;
    });
  });
};

between.autoRemove = function (val) {
  return !val || typeof val[0] !== 'number' && typeof val[1] !== 'number';
};

/***/ }),

/***/ "./node_modules/react-table/src/hooks/useColumnVisibility.js":
/*!*******************************************************************!*\
  !*** ./node_modules/react-table/src/hooks/useColumnVisibility.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useColumnVisibility": function() { return /* binding */ useColumnVisibility; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }



_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetHiddenColumns = 'resetHiddenColumns';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideColumn = 'toggleHideColumn';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setHiddenColumns = 'setHiddenColumns';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideAllColumns = 'toggleHideAllColumns';
var useColumnVisibility = function useColumnVisibility(hooks) {
  hooks.getToggleHiddenProps = [defaultGetToggleHiddenProps];
  hooks.getToggleHideAllColumnsProps = [defaultGetToggleHideAllColumnsProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstanceBeforeDimensions.push(useInstanceBeforeDimensions);
  hooks.headerGroupsDeps.push(function (deps, _ref) {
    var instance = _ref.instance;
    return [].concat(_toConsumableArray(deps), [instance.state.hiddenColumns]);
  });
  hooks.useInstance.push(useInstance);
};
useColumnVisibility.pluginName = 'useColumnVisibility';

var defaultGetToggleHiddenProps = function defaultGetToggleHiddenProps(props, _ref2) {
  var column = _ref2.column;
  return [props, {
    onChange: function onChange(e) {
      column.toggleHidden(!e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: column.isVisible,
    title: 'Toggle Column Visible'
  }];
};

var defaultGetToggleHideAllColumnsProps = function defaultGetToggleHideAllColumnsProps(props, _ref3) {
  var instance = _ref3.instance;
  return [props, {
    onChange: function onChange(e) {
      instance.toggleHideAllColumns(!e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: !instance.allColumnsHidden && !instance.state.hiddenColumns.length,
    title: 'Toggle All Columns Hidden',
    indeterminate: !instance.allColumnsHidden && instance.state.hiddenColumns.length
  }];
};

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      hiddenColumns: []
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetHiddenColumns) {
    return _objectSpread(_objectSpread({}, state), {}, {
      hiddenColumns: instance.initialState.hiddenColumns || []
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideColumn) {
    var should = typeof action.value !== 'undefined' ? action.value : !state.hiddenColumns.includes(action.columnId);
    var hiddenColumns = should ? [].concat(_toConsumableArray(state.hiddenColumns), [action.columnId]) : state.hiddenColumns.filter(function (d) {
      return d !== action.columnId;
    });
    return _objectSpread(_objectSpread({}, state), {}, {
      hiddenColumns: hiddenColumns
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setHiddenColumns) {
    return _objectSpread(_objectSpread({}, state), {}, {
      hiddenColumns: (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(action.value, state.hiddenColumns)
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideAllColumns) {
    var shouldAll = typeof action.value !== 'undefined' ? action.value : !state.hiddenColumns.length;
    return _objectSpread(_objectSpread({}, state), {}, {
      hiddenColumns: shouldAll ? instance.allColumns.map(function (d) {
        return d.id;
      }) : []
    });
  }
}

function useInstanceBeforeDimensions(instance) {
  var headers = instance.headers,
      hiddenColumns = instance.state.hiddenColumns;
  var isMountedRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(false);

  if (!isMountedRef.current) {}

  var handleColumn = function handleColumn(column, parentVisible) {
    column.isVisible = parentVisible && !hiddenColumns.includes(column.id);
    var totalVisibleHeaderCount = 0;

    if (column.headers && column.headers.length) {
      column.headers.forEach(function (subColumn) {
        return totalVisibleHeaderCount += handleColumn(subColumn, column.isVisible);
      });
    } else {
      totalVisibleHeaderCount = column.isVisible ? 1 : 0;
    }

    column.totalVisibleHeaderCount = totalVisibleHeaderCount;
    return totalVisibleHeaderCount;
  };

  var totalVisibleHeaderCount = 0;
  headers.forEach(function (subHeader) {
    return totalVisibleHeaderCount += handleColumn(subHeader, true);
  });
}

function useInstance(instance) {
  var columns = instance.columns,
      flatHeaders = instance.flatHeaders,
      dispatch = instance.dispatch,
      allColumns = instance.allColumns,
      getHooks = instance.getHooks,
      hiddenColumns = instance.state.hiddenColumns,
      _instance$autoResetHi = instance.autoResetHiddenColumns,
      autoResetHiddenColumns = _instance$autoResetHi === void 0 ? true : _instance$autoResetHi;
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  var allColumnsHidden = allColumns.length === hiddenColumns.length;
  var toggleHideColumn = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnId, value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideColumn,
      columnId: columnId,
      value: value
    });
  }, [dispatch]);
  var setHiddenColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setHiddenColumns,
      value: value
    });
  }, [dispatch]);
  var toggleHideAllColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideAllColumns,
      value: value
    });
  }, [dispatch]);
  var getToggleHideAllColumnsProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleHideAllColumnsProps, {
    instance: getInstance()
  });
  flatHeaders.forEach(function (column) {
    column.toggleHidden = function (value) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleHideColumn,
        columnId: column.id,
        value: value
      });
    };

    column.getToggleHiddenProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleHiddenProps, {
      instance: getInstance(),
      column: column
    });
  });
  var getAutoResetHiddenColumns = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetHiddenColumns);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetHiddenColumns()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetHiddenColumns
      });
    }
  }, [dispatch, columns]);
  Object.assign(instance, {
    allColumnsHidden: allColumnsHidden,
    toggleHideColumn: toggleHideColumn,
    setHiddenColumns: setHiddenColumns,
    toggleHideAllColumns: toggleHideAllColumns,
    getToggleHideAllColumnsProps: getToggleHideAllColumnsProps
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/hooks/useTable.js":
/*!********************************************************!*\
  !*** ./node_modules/react-table/src/hooks/useTable.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useTable": function() { return /* binding */ useTable; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _makeDefaultPluginHooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../makeDefaultPluginHooks */ "./node_modules/react-table/src/makeDefaultPluginHooks.js");
/* harmony import */ var _useColumnVisibility__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./useColumnVisibility */ "./node_modules/react-table/src/hooks/useColumnVisibility.js");
var _excluded = ["initialState", "defaultColumn", "getSubRows", "getRowId", "stateReducer", "useControlledState"];

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

 //





var defaultInitialState = {};
var defaultColumnInstance = {};

var defaultReducer = function defaultReducer(state, action, prevState) {
  return state;
};

var defaultGetSubRows = function defaultGetSubRows(row, index) {
  return row.subRows || [];
};

var defaultGetRowId = function defaultGetRowId(row, index, parent) {
  return "".concat(parent ? [parent.id, index].join('.') : index);
};

var defaultUseControlledState = function defaultUseControlledState(d) {
  return d;
};

function applyDefaults(props) {
  var _props$initialState = props.initialState,
      initialState = _props$initialState === void 0 ? defaultInitialState : _props$initialState,
      _props$defaultColumn = props.defaultColumn,
      defaultColumn = _props$defaultColumn === void 0 ? defaultColumnInstance : _props$defaultColumn,
      _props$getSubRows = props.getSubRows,
      getSubRows = _props$getSubRows === void 0 ? defaultGetSubRows : _props$getSubRows,
      _props$getRowId = props.getRowId,
      getRowId = _props$getRowId === void 0 ? defaultGetRowId : _props$getRowId,
      _props$stateReducer = props.stateReducer,
      stateReducer = _props$stateReducer === void 0 ? defaultReducer : _props$stateReducer,
      _props$useControlledS = props.useControlledState,
      useControlledState = _props$useControlledS === void 0 ? defaultUseControlledState : _props$useControlledS,
      rest = _objectWithoutProperties(props, _excluded);

  return _objectSpread(_objectSpread({}, rest), {}, {
    initialState: initialState,
    defaultColumn: defaultColumn,
    getSubRows: getSubRows,
    getRowId: getRowId,
    stateReducer: stateReducer,
    useControlledState: useControlledState
  });
}

var useTable = function useTable(props) {
  for (var _len = arguments.length, plugins = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    plugins[_key - 1] = arguments[_key];
  }

  // Apply default props
  props = applyDefaults(props); // Add core plugins

  plugins = [_useColumnVisibility__WEBPACK_IMPORTED_MODULE_4__.useColumnVisibility].concat(_toConsumableArray(plugins)); // Create the table instance

  var instanceRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef({}); // Create a getter for the instance (helps avoid a lot of potential memory leaks)

  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(instanceRef.current); // Assign the props, plugins and hooks to the instance

  Object.assign(getInstance(), _objectSpread(_objectSpread({}, props), {}, {
    plugins: plugins,
    hooks: (0,_makeDefaultPluginHooks__WEBPACK_IMPORTED_MODULE_3__["default"])()
  })); // Allow plugins to register hooks as early as possible

  plugins.filter(Boolean).forEach(function (plugin) {
    plugin(getInstance().hooks);
  }); // Consume all hooks and make a getter for them

  var getHooks = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(getInstance().hooks);
  getInstance().getHooks = getHooks;
  delete getInstance().hooks; // Allow useOptions hooks to modify the options coming into the table

  Object.assign(getInstance(), (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().useOptions, applyDefaults(props)));

  var _getInstance = getInstance(),
      data = _getInstance.data,
      userColumns = _getInstance.columns,
      initialState = _getInstance.initialState,
      defaultColumn = _getInstance.defaultColumn,
      getSubRows = _getInstance.getSubRows,
      getRowId = _getInstance.getRowId,
      stateReducer = _getInstance.stateReducer,
      useControlledState = _getInstance.useControlledState; // Setup user reducer ref


  var getStateReducer = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(stateReducer); // Build the reducer

  var reducer = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (state, action) {
    // Detect invalid actions
    if (!action.type) {
      console.info({
        action: action
      });
      throw new Error('Unknown Action 👆');
    } // Reduce the state from all plugin reducers


    return [].concat(_toConsumableArray(getHooks().stateReducers), _toConsumableArray(Array.isArray(getStateReducer()) ? getStateReducer() : [getStateReducer()])).reduce(function (s, handler) {
      return handler(s, action, state, getInstance()) || s;
    }, state);
  }, [getHooks, getStateReducer, getInstance]); // Start the reducer

  var _React$useReducer = react__WEBPACK_IMPORTED_MODULE_0___default().useReducer(reducer, undefined, function () {
    return reducer(initialState, {
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.init
    });
  }),
      _React$useReducer2 = _slicedToArray(_React$useReducer, 2),
      reducerState = _React$useReducer2[0],
      dispatch = _React$useReducer2[1]; // Allow the user to control the final state with hooks


  var state = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)([].concat(_toConsumableArray(getHooks().useControlledState), [useControlledState]), reducerState, {
    instance: getInstance()
  });
  Object.assign(getInstance(), {
    state: state,
    dispatch: dispatch
  }); // Decorate All the columns

  var columns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_1__.linkColumnStructure)((0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().columns, userColumns, {
      instance: getInstance()
    }));
  }, [getHooks, getInstance, userColumns].concat(_toConsumableArray((0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().columnsDeps, [], {
    instance: getInstance()
  }))));
  getInstance().columns = columns; // Get the flat list of all columns and allow hooks to decorate
  // those columns (and trigger this memoization via deps)

  var allColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().allColumns, (0,_utils__WEBPACK_IMPORTED_MODULE_1__.flattenColumns)(columns), {
      instance: getInstance()
    }).map(_utils__WEBPACK_IMPORTED_MODULE_1__.assignColumnAccessor);
  }, [columns, getHooks, getInstance].concat(_toConsumableArray((0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().allColumnsDeps, [], {
    instance: getInstance()
  }))));
  getInstance().allColumns = allColumns; // Access the row model using initial columns

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var rows = [];
    var flatRows = [];
    var rowsById = {};

    var allColumnsQueue = _toConsumableArray(allColumns);

    while (allColumnsQueue.length) {
      var column = allColumnsQueue.shift();
      accessRowsForColumn({
        data: data,
        rows: rows,
        flatRows: flatRows,
        rowsById: rowsById,
        column: column,
        getRowId: getRowId,
        getSubRows: getSubRows,
        accessValueHooks: getHooks().accessValue,
        getInstance: getInstance
      });
    }

    return [rows, flatRows, rowsById];
  }, [allColumns, data, getRowId, getSubRows, getHooks, getInstance]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 3),
      rows = _React$useMemo2[0],
      flatRows = _React$useMemo2[1],
      rowsById = _React$useMemo2[2];

  Object.assign(getInstance(), {
    rows: rows,
    initialRows: _toConsumableArray(rows),
    flatRows: flatRows,
    rowsById: rowsById // materializedColumns,

  });
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.loopHooks)(getHooks().useInstanceAfterData, getInstance()); // Get the flat list of all columns AFTER the rows
  // have been access, and allow hooks to decorate
  // those columns (and trigger this memoization via deps)

  var visibleColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().visibleColumns, allColumns, {
      instance: getInstance()
    }).map(function (d) {
      return (0,_utils__WEBPACK_IMPORTED_MODULE_1__.decorateColumn)(d, defaultColumn);
    });
  }, [getHooks, allColumns, getInstance, defaultColumn].concat(_toConsumableArray((0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().visibleColumnsDeps, [], {
    instance: getInstance()
  })))); // Combine new visible columns with all columns

  allColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var columns = _toConsumableArray(visibleColumns);

    allColumns.forEach(function (column) {
      if (!columns.find(function (d) {
        return d.id === column.id;
      })) {
        columns.push(column);
      }
    });
    return columns;
  }, [allColumns, visibleColumns]);
  getInstance().allColumns = allColumns;

  if (true) {
    var duplicateColumns = allColumns.filter(function (column, i) {
      return allColumns.findIndex(function (d) {
        return d.id === column.id;
      }) !== i;
    });

    if (duplicateColumns.length) {
      console.info(allColumns);
      throw new Error("Duplicate columns were found with ids: \"".concat(duplicateColumns.map(function (d) {
        return d.id;
      }).join(', '), "\" in the columns array above"));
    }
  } // Make the headerGroups


  var headerGroups = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().headerGroups, (0,_utils__WEBPACK_IMPORTED_MODULE_1__.makeHeaderGroups)(visibleColumns, defaultColumn), getInstance());
  }, [getHooks, visibleColumns, defaultColumn, getInstance].concat(_toConsumableArray((0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(getHooks().headerGroupsDeps, [], {
    instance: getInstance()
  }))));
  getInstance().headerGroups = headerGroups; // Get the first level of headers

  var headers = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return headerGroups.length ? headerGroups[0].headers : [];
  }, [headerGroups]);
  getInstance().headers = headers; // Provide a flat header list for utilities

  getInstance().flatHeaders = headerGroups.reduce(function (all, headerGroup) {
    return [].concat(_toConsumableArray(all), _toConsumableArray(headerGroup.headers));
  }, []);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.loopHooks)(getHooks().useInstanceBeforeDimensions, getInstance()); // Filter columns down to visible ones

  var visibleColumnsDep = visibleColumns.filter(function (d) {
    return d.isVisible;
  }).map(function (d) {
    return d.id;
  }).sort().join('_');
  visibleColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return visibleColumns.filter(function (d) {
      return d.isVisible;
    });
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [visibleColumns, visibleColumnsDep]);
  getInstance().visibleColumns = visibleColumns; // Header Visibility is needed by this point

  var _calculateHeaderWidth = calculateHeaderWidths(headers),
      _calculateHeaderWidth2 = _slicedToArray(_calculateHeaderWidth, 3),
      totalColumnsMinWidth = _calculateHeaderWidth2[0],
      totalColumnsWidth = _calculateHeaderWidth2[1],
      totalColumnsMaxWidth = _calculateHeaderWidth2[2];

  getInstance().totalColumnsMinWidth = totalColumnsMinWidth;
  getInstance().totalColumnsWidth = totalColumnsWidth;
  getInstance().totalColumnsMaxWidth = totalColumnsMaxWidth;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.loopHooks)(getHooks().useInstance, getInstance()) // Each materialized header needs to be assigned a render function and other
  // prop getter properties here.
  ;
  [].concat(_toConsumableArray(getInstance().flatHeaders), _toConsumableArray(getInstance().allColumns)).forEach(function (column) {
    // Give columns/headers rendering power
    column.render = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makeRenderer)(getInstance(), column); // Give columns/headers a default getHeaderProps

    column.getHeaderProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getHeaderProps, {
      instance: getInstance(),
      column: column
    }); // Give columns/headers a default getFooterProps

    column.getFooterProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getFooterProps, {
      instance: getInstance(),
      column: column
    });
  });
  getInstance().headerGroups = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return headerGroups.filter(function (headerGroup, i) {
      // Filter out any headers and headerGroups that don't have visible columns
      headerGroup.headers = headerGroup.headers.filter(function (column) {
        var recurse = function recurse(headers) {
          return headers.filter(function (column) {
            if (column.headers) {
              return recurse(column.headers);
            }

            return column.isVisible;
          }).length;
        };

        if (column.headers) {
          return recurse(column.headers);
        }

        return column.isVisible;
      }); // Give headerGroups getRowProps

      if (headerGroup.headers.length) {
        headerGroup.getHeaderGroupProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getHeaderGroupProps, {
          instance: getInstance(),
          headerGroup: headerGroup,
          index: i
        });
        headerGroup.getFooterGroupProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getFooterGroupProps, {
          instance: getInstance(),
          headerGroup: headerGroup,
          index: i
        });
        return true;
      }

      return false;
    });
  }, [headerGroups, getInstance, getHooks]);
  getInstance().footerGroups = _toConsumableArray(getInstance().headerGroups).reverse(); // The prepareRow function is absolutely necessary and MUST be called on
  // any rows the user wishes to be displayed.

  getInstance().prepareRow = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (row) {
    row.getRowProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getRowProps, {
      instance: getInstance(),
      row: row
    }); // Build the visible cells for each row

    row.allCells = allColumns.map(function (column) {
      var value = row.values[column.id];
      var cell = {
        column: column,
        row: row,
        value: value
      }; // Give each cell a getCellProps base

      cell.getCellProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getCellProps, {
        instance: getInstance(),
        cell: cell
      }); // Give each cell a renderer function (supports multiple renderers)

      cell.render = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makeRenderer)(getInstance(), column, {
        row: row,
        cell: cell,
        value: value
      });
      return cell;
    });
    row.cells = visibleColumns.map(function (column) {
      return row.allCells.find(function (cell) {
        return cell.column.id === column.id;
      });
    }); // need to apply any row specific hooks (useExpanded requires this)

    (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.loopHooks)(getHooks().prepareRow, row, {
      instance: getInstance()
    });
  }, [getHooks, getInstance, allColumns, visibleColumns]);
  getInstance().getTableProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getTableProps, {
    instance: getInstance()
  });
  getInstance().getTableBodyProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getTableBodyProps, {
    instance: getInstance()
  });
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.loopHooks)(getHooks().useFinalInstance, getInstance());
  return getInstance();
};

function calculateHeaderWidths(headers) {
  var left = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var sumTotalMinWidth = 0;
  var sumTotalWidth = 0;
  var sumTotalMaxWidth = 0;
  var sumTotalFlexWidth = 0;
  headers.forEach(function (header) {
    var subHeaders = header.headers;
    header.totalLeft = left;

    if (subHeaders && subHeaders.length) {
      var _calculateHeaderWidth3 = calculateHeaderWidths(subHeaders, left),
          _calculateHeaderWidth4 = _slicedToArray(_calculateHeaderWidth3, 4),
          totalMinWidth = _calculateHeaderWidth4[0],
          totalWidth = _calculateHeaderWidth4[1],
          totalMaxWidth = _calculateHeaderWidth4[2],
          totalFlexWidth = _calculateHeaderWidth4[3];

      header.totalMinWidth = totalMinWidth;
      header.totalWidth = totalWidth;
      header.totalMaxWidth = totalMaxWidth;
      header.totalFlexWidth = totalFlexWidth;
    } else {
      header.totalMinWidth = header.minWidth;
      header.totalWidth = Math.min(Math.max(header.minWidth, header.width), header.maxWidth);
      header.totalMaxWidth = header.maxWidth;
      header.totalFlexWidth = header.canResize ? header.totalWidth : 0;
    }

    if (header.isVisible) {
      left += header.totalWidth;
      sumTotalMinWidth += header.totalMinWidth;
      sumTotalWidth += header.totalWidth;
      sumTotalMaxWidth += header.totalMaxWidth;
      sumTotalFlexWidth += header.totalFlexWidth;
    }
  });
  return [sumTotalMinWidth, sumTotalWidth, sumTotalMaxWidth, sumTotalFlexWidth];
}

function accessRowsForColumn(_ref) {
  var data = _ref.data,
      rows = _ref.rows,
      flatRows = _ref.flatRows,
      rowsById = _ref.rowsById,
      column = _ref.column,
      getRowId = _ref.getRowId,
      getSubRows = _ref.getSubRows,
      accessValueHooks = _ref.accessValueHooks,
      getInstance = _ref.getInstance;

  // Access the row's data column-by-column
  // We do it this way so we can incrementally add materialized
  // columns after the first pass and avoid excessive looping
  var accessRow = function accessRow(originalRow, rowIndex) {
    var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var parent = arguments.length > 3 ? arguments[3] : undefined;
    var parentRows = arguments.length > 4 ? arguments[4] : undefined;
    // Keep the original reference around
    var original = originalRow;
    var id = getRowId(originalRow, rowIndex, parent);
    var row = rowsById[id]; // If the row hasn't been created, let's make it

    if (!row) {
      row = {
        id: id,
        original: original,
        index: rowIndex,
        depth: depth,
        cells: [{}] // This is a dummy cell

      }; // Override common array functions (and the dummy cell's getCellProps function)
      // to show an error if it is accessed without calling prepareRow

      row.cells.map = _utils__WEBPACK_IMPORTED_MODULE_1__.unpreparedAccessWarning;
      row.cells.filter = _utils__WEBPACK_IMPORTED_MODULE_1__.unpreparedAccessWarning;
      row.cells.forEach = _utils__WEBPACK_IMPORTED_MODULE_1__.unpreparedAccessWarning;
      row.cells[0].getCellProps = _utils__WEBPACK_IMPORTED_MODULE_1__.unpreparedAccessWarning; // Create the cells and values

      row.values = {}; // Push this row into the parentRows array

      parentRows.push(row); // Keep track of every row in a flat array

      flatRows.push(row); // Also keep track of every row by its ID

      rowsById[id] = row; // Get the original subrows

      row.originalSubRows = getSubRows(originalRow, rowIndex); // Then recursively access them

      if (row.originalSubRows) {
        var subRows = [];
        row.originalSubRows.forEach(function (d, i) {
          return accessRow(d, i, depth + 1, row, subRows);
        }); // Keep the new subRows array on the row

        row.subRows = subRows;
      }
    } else if (row.subRows) {
      // If the row exists, then it's already been accessed
      // Keep recursing, but don't worry about passing the
      // accumlator array (those rows already exist)
      row.originalSubRows.forEach(function (d, i) {
        return accessRow(d, i, depth + 1, row);
      });
    } // If the column has an accessor, use it to get a value


    if (column.accessor) {
      row.values[column.id] = column.accessor(originalRow, rowIndex, row, parentRows, data);
    } // Allow plugins to manipulate the column value


    row.values[column.id] = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.reduceHooks)(accessValueHooks, row.values[column.id], {
      row: row,
      column: column,
      instance: getInstance()
    }, true);
  };

  data.forEach(function (originalRow, rowIndex) {
    return accessRow(originalRow, rowIndex, 0, undefined, rows);
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/index.js":
/*!***********************************************!*\
  !*** ./node_modules/react-table/src/index.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_UNSTABLE_usePivotColumns": function() { return /* reexport safe */ _plugin_hooks_UNSTABLE_usePivotColumns__WEBPACK_IMPORTED_MODULE_8__._UNSTABLE_usePivotColumns; },
/* harmony export */   "actions": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions; },
/* harmony export */   "defaultColumn": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.defaultColumn; },
/* harmony export */   "defaultGroupByFn": function() { return /* reexport safe */ _plugin_hooks_useGroupBy__WEBPACK_IMPORTED_MODULE_5__.defaultGroupByFn; },
/* harmony export */   "defaultOrderByFn": function() { return /* reexport safe */ _plugin_hooks_useSortBy__WEBPACK_IMPORTED_MODULE_6__.defaultOrderByFn; },
/* harmony export */   "defaultRenderer": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.defaultRenderer; },
/* harmony export */   "emptyRenderer": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.emptyRenderer; },
/* harmony export */   "ensurePluginOrder": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.ensurePluginOrder; },
/* harmony export */   "flexRender": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.flexRender; },
/* harmony export */   "functionalUpdate": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.functionalUpdate; },
/* harmony export */   "loopHooks": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.loopHooks; },
/* harmony export */   "makePropGetter": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.makePropGetter; },
/* harmony export */   "makeRenderer": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.makeRenderer; },
/* harmony export */   "reduceHooks": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.reduceHooks; },
/* harmony export */   "safeUseLayoutEffect": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.safeUseLayoutEffect; },
/* harmony export */   "useAbsoluteLayout": function() { return /* reexport safe */ _plugin_hooks_useAbsoluteLayout__WEBPACK_IMPORTED_MODULE_13__.useAbsoluteLayout; },
/* harmony export */   "useAsyncDebounce": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.useAsyncDebounce; },
/* harmony export */   "useBlockLayout": function() { return /* reexport safe */ _plugin_hooks_useBlockLayout__WEBPACK_IMPORTED_MODULE_14__.useBlockLayout; },
/* harmony export */   "useColumnOrder": function() { return /* reexport safe */ _plugin_hooks_useColumnOrder__WEBPACK_IMPORTED_MODULE_11__.useColumnOrder; },
/* harmony export */   "useExpanded": function() { return /* reexport safe */ _plugin_hooks_useExpanded__WEBPACK_IMPORTED_MODULE_2__.useExpanded; },
/* harmony export */   "useFilters": function() { return /* reexport safe */ _plugin_hooks_useFilters__WEBPACK_IMPORTED_MODULE_3__.useFilters; },
/* harmony export */   "useFlexLayout": function() { return /* reexport safe */ _plugin_hooks_useFlexLayout__WEBPACK_IMPORTED_MODULE_15__.useFlexLayout; },
/* harmony export */   "useGetLatest": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.useGetLatest; },
/* harmony export */   "useGlobalFilter": function() { return /* reexport safe */ _plugin_hooks_useGlobalFilter__WEBPACK_IMPORTED_MODULE_4__.useGlobalFilter; },
/* harmony export */   "useGridLayout": function() { return /* reexport safe */ _plugin_hooks_useGridLayout__WEBPACK_IMPORTED_MODULE_16__.useGridLayout; },
/* harmony export */   "useGroupBy": function() { return /* reexport safe */ _plugin_hooks_useGroupBy__WEBPACK_IMPORTED_MODULE_5__.useGroupBy; },
/* harmony export */   "useMountedLayoutEffect": function() { return /* reexport safe */ _publicUtils__WEBPACK_IMPORTED_MODULE_0__.useMountedLayoutEffect; },
/* harmony export */   "usePagination": function() { return /* reexport safe */ _plugin_hooks_usePagination__WEBPACK_IMPORTED_MODULE_7__.usePagination; },
/* harmony export */   "useResizeColumns": function() { return /* reexport safe */ _plugin_hooks_useResizeColumns__WEBPACK_IMPORTED_MODULE_12__.useResizeColumns; },
/* harmony export */   "useRowSelect": function() { return /* reexport safe */ _plugin_hooks_useRowSelect__WEBPACK_IMPORTED_MODULE_9__.useRowSelect; },
/* harmony export */   "useRowState": function() { return /* reexport safe */ _plugin_hooks_useRowState__WEBPACK_IMPORTED_MODULE_10__.useRowState; },
/* harmony export */   "useSortBy": function() { return /* reexport safe */ _plugin_hooks_useSortBy__WEBPACK_IMPORTED_MODULE_6__.useSortBy; },
/* harmony export */   "useTable": function() { return /* reexport safe */ _hooks_useTable__WEBPACK_IMPORTED_MODULE_1__.useTable; }
/* harmony export */ });
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _hooks_useTable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./hooks/useTable */ "./node_modules/react-table/src/hooks/useTable.js");
/* harmony import */ var _plugin_hooks_useExpanded__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./plugin-hooks/useExpanded */ "./node_modules/react-table/src/plugin-hooks/useExpanded.js");
/* harmony import */ var _plugin_hooks_useFilters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./plugin-hooks/useFilters */ "./node_modules/react-table/src/plugin-hooks/useFilters.js");
/* harmony import */ var _plugin_hooks_useGlobalFilter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./plugin-hooks/useGlobalFilter */ "./node_modules/react-table/src/plugin-hooks/useGlobalFilter.js");
/* harmony import */ var _plugin_hooks_useGroupBy__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./plugin-hooks/useGroupBy */ "./node_modules/react-table/src/plugin-hooks/useGroupBy.js");
/* harmony import */ var _plugin_hooks_useSortBy__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./plugin-hooks/useSortBy */ "./node_modules/react-table/src/plugin-hooks/useSortBy.js");
/* harmony import */ var _plugin_hooks_usePagination__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./plugin-hooks/usePagination */ "./node_modules/react-table/src/plugin-hooks/usePagination.js");
/* harmony import */ var _plugin_hooks_UNSTABLE_usePivotColumns__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./plugin-hooks/_UNSTABLE_usePivotColumns */ "./node_modules/react-table/src/plugin-hooks/_UNSTABLE_usePivotColumns.js");
/* harmony import */ var _plugin_hooks_useRowSelect__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./plugin-hooks/useRowSelect */ "./node_modules/react-table/src/plugin-hooks/useRowSelect.js");
/* harmony import */ var _plugin_hooks_useRowState__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./plugin-hooks/useRowState */ "./node_modules/react-table/src/plugin-hooks/useRowState.js");
/* harmony import */ var _plugin_hooks_useColumnOrder__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./plugin-hooks/useColumnOrder */ "./node_modules/react-table/src/plugin-hooks/useColumnOrder.js");
/* harmony import */ var _plugin_hooks_useResizeColumns__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./plugin-hooks/useResizeColumns */ "./node_modules/react-table/src/plugin-hooks/useResizeColumns.js");
/* harmony import */ var _plugin_hooks_useAbsoluteLayout__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./plugin-hooks/useAbsoluteLayout */ "./node_modules/react-table/src/plugin-hooks/useAbsoluteLayout.js");
/* harmony import */ var _plugin_hooks_useBlockLayout__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./plugin-hooks/useBlockLayout */ "./node_modules/react-table/src/plugin-hooks/useBlockLayout.js");
/* harmony import */ var _plugin_hooks_useFlexLayout__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./plugin-hooks/useFlexLayout */ "./node_modules/react-table/src/plugin-hooks/useFlexLayout.js");
/* harmony import */ var _plugin_hooks_useGridLayout__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./plugin-hooks/useGridLayout */ "./node_modules/react-table/src/plugin-hooks/useGridLayout.js");


















/***/ }),

/***/ "./node_modules/react-table/src/makeDefaultPluginHooks.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-table/src/makeDefaultPluginHooks.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ makeDefaultPluginHooks; }
/* harmony export */ });
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultGetTableProps = function defaultGetTableProps(props) {
  return _objectSpread({
    role: 'table'
  }, props);
};

var defaultGetTableBodyProps = function defaultGetTableBodyProps(props) {
  return _objectSpread({
    role: 'rowgroup'
  }, props);
};

var defaultGetHeaderProps = function defaultGetHeaderProps(props, _ref) {
  var column = _ref.column;
  return _objectSpread({
    key: "header_".concat(column.id),
    colSpan: column.totalVisibleHeaderCount,
    role: 'columnheader'
  }, props);
};

var defaultGetFooterProps = function defaultGetFooterProps(props, _ref2) {
  var column = _ref2.column;
  return _objectSpread({
    key: "footer_".concat(column.id),
    colSpan: column.totalVisibleHeaderCount
  }, props);
};

var defaultGetHeaderGroupProps = function defaultGetHeaderGroupProps(props, _ref3) {
  var index = _ref3.index;
  return _objectSpread({
    key: "headerGroup_".concat(index),
    role: 'row'
  }, props);
};

var defaultGetFooterGroupProps = function defaultGetFooterGroupProps(props, _ref4) {
  var index = _ref4.index;
  return _objectSpread({
    key: "footerGroup_".concat(index)
  }, props);
};

var defaultGetRowProps = function defaultGetRowProps(props, _ref5) {
  var row = _ref5.row;
  return _objectSpread({
    key: "row_".concat(row.id),
    role: 'row'
  }, props);
};

var defaultGetCellProps = function defaultGetCellProps(props, _ref6) {
  var cell = _ref6.cell;
  return _objectSpread({
    key: "cell_".concat(cell.row.id, "_").concat(cell.column.id),
    role: 'cell'
  }, props);
};

function makeDefaultPluginHooks() {
  return {
    useOptions: [],
    stateReducers: [],
    useControlledState: [],
    columns: [],
    columnsDeps: [],
    allColumns: [],
    allColumnsDeps: [],
    accessValue: [],
    materializedColumns: [],
    materializedColumnsDeps: [],
    useInstanceAfterData: [],
    visibleColumns: [],
    visibleColumnsDeps: [],
    headerGroups: [],
    headerGroupsDeps: [],
    useInstanceBeforeDimensions: [],
    useInstance: [],
    prepareRow: [],
    getTableProps: [defaultGetTableProps],
    getTableBodyProps: [defaultGetTableBodyProps],
    getHeaderGroupProps: [defaultGetHeaderGroupProps],
    getFooterGroupProps: [defaultGetFooterGroupProps],
    getHeaderProps: [defaultGetHeaderProps],
    getFooterProps: [defaultGetFooterProps],
    getRowProps: [defaultGetRowProps],
    getCellProps: [defaultGetCellProps],
    useFinalInstance: []
  };
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/_UNSTABLE_usePivotColumns.js":
/*!********************************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/_UNSTABLE_usePivotColumns.js ***!
  \********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_UNSTABLE_usePivotColumns": function() { return /* binding */ _UNSTABLE_usePivotColumns; }
/* harmony export */ });
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* istanbul ignore file */

 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.resetPivot = 'resetPivot';
_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.togglePivot = 'togglePivot';
var _UNSTABLE_usePivotColumns = function _UNSTABLE_usePivotColumns(hooks) {
  hooks.getPivotToggleProps = [defaultGetPivotToggleProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstanceAfterData.push(useInstanceAfterData);
  hooks.allColumns.push(allColumns);
  hooks.accessValue.push(accessValue);
  hooks.materializedColumns.push(materializedColumns);
  hooks.materializedColumnsDeps.push(materializedColumnsDeps);
  hooks.visibleColumns.push(visibleColumns);
  hooks.visibleColumnsDeps.push(visibleColumnsDeps);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
};
_UNSTABLE_usePivotColumns.pluginName = 'usePivotColumns';
var defaultPivotColumns = [];

var defaultGetPivotToggleProps = function defaultGetPivotToggleProps(props, _ref) {
  var header = _ref.header;
  return [props, {
    onClick: header.canPivot ? function (e) {
      e.persist();
      header.togglePivot();
    } : undefined,
    style: {
      cursor: header.canPivot ? 'pointer' : undefined
    },
    title: 'Toggle Pivot'
  }];
}; // Reducer


function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.init) {
    return _objectSpread({
      pivotColumns: defaultPivotColumns
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.resetPivot) {
    return _objectSpread(_objectSpread({}, state), {}, {
      pivotColumns: instance.initialState.pivotColumns || defaultPivotColumns
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.togglePivot) {
    var columnId = action.columnId,
        setPivot = action.value;
    var resolvedPivot = typeof setPivot !== 'undefined' ? setPivot : !state.pivotColumns.includes(columnId);

    if (resolvedPivot) {
      return _objectSpread(_objectSpread({}, state), {}, {
        pivotColumns: [].concat(_toConsumableArray(state.pivotColumns), [columnId])
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      pivotColumns: state.pivotColumns.filter(function (d) {
        return d !== columnId;
      })
    });
  }
}

function useInstanceAfterData(instance) {
  instance.allColumns.forEach(function (column) {
    column.isPivotSource = instance.state.pivotColumns.includes(column.id);
  });
}

function allColumns(columns, _ref2) {
  var instance = _ref2.instance;
  columns.forEach(function (column) {
    column.isPivotSource = instance.state.pivotColumns.includes(column.id);
    column.uniqueValues = new Set();
  });
  return columns;
}

function accessValue(value, _ref3) {
  var column = _ref3.column;

  if (column.uniqueValues && typeof value !== 'undefined') {
    column.uniqueValues.add(value);
  }

  return value;
}

function materializedColumns(materialized, _ref4) {
  var instance = _ref4.instance;
  var allColumns = instance.allColumns,
      state = instance.state;

  if (!state.pivotColumns.length || !state.groupBy || !state.groupBy.length) {
    return materialized;
  }

  var pivotColumns = state.pivotColumns.map(function (id) {
    return allColumns.find(function (d) {
      return d.id === id;
    });
  }).filter(Boolean);
  var sourceColumns = allColumns.filter(function (d) {
    return !d.isPivotSource && !state.groupBy.includes(d.id) && !state.pivotColumns.includes(d.id);
  });

  var buildPivotColumns = function buildPivotColumns() {
    var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var parent = arguments.length > 1 ? arguments[1] : undefined;
    var pivotFilters = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var pivotColumn = pivotColumns[depth];

    if (!pivotColumn) {
      return sourceColumns.map(function (sourceColumn) {
        // TODO: We could offer support here for renesting pivoted
        // columns inside copies of their header groups. For now,
        // that seems like it would be (1) overkill on nesting, considering
        // you already get nesting for every pivot level and (2)
        // really hard. :)
        return _objectSpread(_objectSpread({}, sourceColumn), {}, {
          canPivot: false,
          isPivoted: true,
          parent: parent,
          depth: depth,
          id: "".concat(parent ? "".concat(parent.id, ".").concat(sourceColumn.id) : sourceColumn.id),
          accessor: function accessor(originalRow, i, row) {
            if (pivotFilters.every(function (filter) {
              return filter(row);
            })) {
              return row.values[sourceColumn.id];
            }
          }
        });
      });
    }

    var uniqueValues = Array.from(pivotColumn.uniqueValues).sort();
    return uniqueValues.map(function (uniqueValue) {
      var columnGroup = _objectSpread(_objectSpread({}, pivotColumn), {}, {
        Header: pivotColumn.PivotHeader || typeof pivotColumn.header === 'string' ? "".concat(pivotColumn.Header, ": ").concat(uniqueValue) : uniqueValue,
        isPivotGroup: true,
        parent: parent,
        depth: depth,
        id: parent ? "".concat(parent.id, ".").concat(pivotColumn.id, ".").concat(uniqueValue) : "".concat(pivotColumn.id, ".").concat(uniqueValue),
        pivotValue: uniqueValue
      });

      columnGroup.columns = buildPivotColumns(depth + 1, columnGroup, [].concat(_toConsumableArray(pivotFilters), [function (row) {
        return row.values[pivotColumn.id] === uniqueValue;
      }]));
      return columnGroup;
    });
  };

  var newMaterialized = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.flattenColumns)(buildPivotColumns());
  return [].concat(_toConsumableArray(materialized), _toConsumableArray(newMaterialized));
}

function materializedColumnsDeps(deps, _ref5) {
  var _ref5$instance$state = _ref5.instance.state,
      pivotColumns = _ref5$instance$state.pivotColumns,
      groupBy = _ref5$instance$state.groupBy;
  return [].concat(_toConsumableArray(deps), [pivotColumns, groupBy]);
}

function visibleColumns(visibleColumns, _ref6) {
  var state = _ref6.instance.state;
  visibleColumns = visibleColumns.filter(function (d) {
    return !d.isPivotSource;
  });

  if (state.pivotColumns.length && state.groupBy && state.groupBy.length) {
    visibleColumns = visibleColumns.filter(function (column) {
      return column.isGrouped || column.isPivoted;
    });
  }

  return visibleColumns;
}

function visibleColumnsDeps(deps, _ref7) {
  var instance = _ref7.instance;
  return [].concat(_toConsumableArray(deps), [instance.state.pivotColumns, instance.state.groupBy]);
}

function useInstance(instance) {
  var columns = instance.columns,
      allColumns = instance.allColumns,
      flatHeaders = instance.flatHeaders,
      getHooks = instance.getHooks,
      plugins = instance.plugins,
      dispatch = instance.dispatch,
      _instance$autoResetPi = instance.autoResetPivot,
      autoResetPivot = _instance$autoResetPi === void 0 ? true : _instance$autoResetPi,
      manaulPivot = instance.manaulPivot,
      disablePivot = instance.disablePivot,
      defaultCanPivot = instance.defaultCanPivot;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_0__.ensurePluginOrder)(plugins, ['useGroupBy'], 'usePivotColumns');
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_0__.useGetLatest)(instance);
  allColumns.forEach(function (column) {
    var accessor = column.accessor,
        defaultColumnPivot = column.defaultPivot,
        columnDisablePivot = column.disablePivot;
    column.canPivot = accessor ? (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFirstDefined)(column.canPivot, columnDisablePivot === true ? false : undefined, disablePivot === true ? false : undefined, true) : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFirstDefined)(column.canPivot, defaultColumnPivot, defaultCanPivot, false);

    if (column.canPivot) {
      column.togglePivot = function () {
        return instance.togglePivot(column.id);
      };
    }

    column.Aggregated = column.Aggregated || column.Cell;
  });

  var togglePivot = function togglePivot(columnId, value) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.togglePivot,
      columnId: columnId,
      value: value
    });
  };

  flatHeaders.forEach(function (header) {
    header.getPivotToggleProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_0__.makePropGetter)(getHooks().getPivotToggleProps, {
      instance: getInstance(),
      header: header
    });
  });
  var getAutoResetPivot = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_0__.useGetLatest)(autoResetPivot);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_0__.useMountedLayoutEffect)(function () {
    if (getAutoResetPivot()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.resetPivot
      });
    }
  }, [dispatch, manaulPivot ? null : columns]);
  Object.assign(instance, {
    togglePivot: togglePivot
  });
}

function prepareRow(row) {
  row.allCells.forEach(function (cell) {
    // Grouped cells are in the pivotColumns and the pivot cell for the row
    cell.isPivoted = cell.column.isPivoted;
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useAbsoluteLayout.js":
/*!************************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useAbsoluteLayout.js ***!
  \************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useAbsoluteLayout": function() { return /* binding */ useAbsoluteLayout; }
/* harmony export */ });
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var cellStyles = {
  position: 'absolute',
  top: 0
};
var useAbsoluteLayout = function useAbsoluteLayout(hooks) {
  hooks.getTableBodyProps.push(getRowStyles);
  hooks.getRowProps.push(getRowStyles);
  hooks.getHeaderGroupProps.push(getRowStyles);
  hooks.getFooterGroupProps.push(getRowStyles);
  hooks.getHeaderProps.push(function (props, _ref) {
    var column = _ref.column;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        left: "".concat(column.totalLeft, "px"),
        width: "".concat(column.totalWidth, "px")
      })
    }];
  });
  hooks.getCellProps.push(function (props, _ref2) {
    var cell = _ref2.cell;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        left: "".concat(cell.column.totalLeft, "px"),
        width: "".concat(cell.column.totalWidth, "px")
      })
    }];
  });
  hooks.getFooterProps.push(function (props, _ref3) {
    var column = _ref3.column;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        left: "".concat(column.totalLeft, "px"),
        width: "".concat(column.totalWidth, "px")
      })
    }];
  });
};
useAbsoluteLayout.pluginName = 'useAbsoluteLayout';

var getRowStyles = function getRowStyles(props, _ref4) {
  var instance = _ref4.instance;
  return [props, {
    style: {
      position: 'relative',
      width: "".concat(instance.totalColumnsWidth, "px")
    }
  }];
};

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useBlockLayout.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useBlockLayout.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useBlockLayout": function() { return /* binding */ useBlockLayout; }
/* harmony export */ });
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var cellStyles = {
  display: 'inline-block',
  boxSizing: 'border-box'
};

var getRowStyles = function getRowStyles(props, _ref) {
  var instance = _ref.instance;
  return [props, {
    style: {
      display: 'flex',
      width: "".concat(instance.totalColumnsWidth, "px")
    }
  }];
};

var useBlockLayout = function useBlockLayout(hooks) {
  hooks.getRowProps.push(getRowStyles);
  hooks.getHeaderGroupProps.push(getRowStyles);
  hooks.getFooterGroupProps.push(getRowStyles);
  hooks.getHeaderProps.push(function (props, _ref2) {
    var column = _ref2.column;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        width: "".concat(column.totalWidth, "px")
      })
    }];
  });
  hooks.getCellProps.push(function (props, _ref3) {
    var cell = _ref3.cell;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        width: "".concat(cell.column.totalWidth, "px")
      })
    }];
  });
  hooks.getFooterProps.push(function (props, _ref4) {
    var column = _ref4.column;
    return [props, {
      style: _objectSpread(_objectSpread({}, cellStyles), {}, {
        width: "".concat(column.totalWidth, "px")
      })
    }];
  });
};
useBlockLayout.pluginName = 'useBlockLayout';

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useColumnOrder.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useColumnOrder.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useColumnOrder": function() { return /* binding */ useColumnOrder; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }


 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetColumnOrder = 'resetColumnOrder';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setColumnOrder = 'setColumnOrder';
var useColumnOrder = function useColumnOrder(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.visibleColumnsDeps.push(function (deps, _ref) {
    var instance = _ref.instance;
    return [].concat(_toConsumableArray(deps), [instance.state.columnOrder]);
  });
  hooks.visibleColumns.push(visibleColumns);
  hooks.useInstance.push(useInstance);
};
useColumnOrder.pluginName = 'useColumnOrder';

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      columnOrder: []
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetColumnOrder) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnOrder: instance.initialState.columnOrder || []
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setColumnOrder) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnOrder: (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(action.columnOrder, state.columnOrder)
    });
  }
}

function visibleColumns(columns, _ref2) {
  var columnOrder = _ref2.instance.state.columnOrder;

  // If there is no order, return the normal columns
  if (!columnOrder || !columnOrder.length) {
    return columns;
  }

  var columnOrderCopy = _toConsumableArray(columnOrder); // If there is an order, make a copy of the columns


  var columnsCopy = _toConsumableArray(columns); // And make a new ordered array of the columns


  var columnsInOrder = []; // Loop over the columns and place them in order into the new array

  var _loop = function _loop() {
    var targetColumnId = columnOrderCopy.shift();
    var foundIndex = columnsCopy.findIndex(function (d) {
      return d.id === targetColumnId;
    });

    if (foundIndex > -1) {
      columnsInOrder.push(columnsCopy.splice(foundIndex, 1)[0]);
    }
  };

  while (columnsCopy.length && columnOrderCopy.length) {
    _loop();
  } // If there are any columns left, add them to the end


  return [].concat(columnsInOrder, _toConsumableArray(columnsCopy));
}

function useInstance(instance) {
  var dispatch = instance.dispatch;
  instance.setColumnOrder = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnOrder) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setColumnOrder,
      columnOrder: columnOrder
    });
  }, [dispatch]);
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useExpanded.js":
/*!******************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useExpanded.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useExpanded": function() { return /* binding */ useExpanded; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetExpanded = 'resetExpanded';
_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleRowExpanded = 'toggleRowExpanded';
_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleAllRowsExpanded = 'toggleAllRowsExpanded';
var useExpanded = function useExpanded(hooks) {
  hooks.getToggleAllRowsExpandedProps = [defaultGetToggleAllRowsExpandedProps];
  hooks.getToggleRowExpandedProps = [defaultGetToggleRowExpandedProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
};
useExpanded.pluginName = 'useExpanded';

var defaultGetToggleAllRowsExpandedProps = function defaultGetToggleAllRowsExpandedProps(props, _ref) {
  var instance = _ref.instance;
  return [props, {
    onClick: function onClick(e) {
      instance.toggleAllRowsExpanded();
    },
    style: {
      cursor: 'pointer'
    },
    title: 'Toggle All Rows Expanded'
  }];
};

var defaultGetToggleRowExpandedProps = function defaultGetToggleRowExpandedProps(props, _ref2) {
  var row = _ref2.row;
  return [props, {
    onClick: function onClick() {
      row.toggleRowExpanded();
    },
    style: {
      cursor: 'pointer'
    },
    title: 'Toggle Row Expanded'
  }];
}; // Reducer


function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.init) {
    return _objectSpread({
      expanded: {}
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetExpanded) {
    return _objectSpread(_objectSpread({}, state), {}, {
      expanded: instance.initialState.expanded || {}
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleAllRowsExpanded) {
    var value = action.value;
    var rowsById = instance.rowsById;
    var isAllRowsExpanded = Object.keys(rowsById).length === Object.keys(state.expanded).length;
    var expandAll = typeof value !== 'undefined' ? value : !isAllRowsExpanded;

    if (expandAll) {
      var expanded = {};
      Object.keys(rowsById).forEach(function (rowId) {
        expanded[rowId] = true;
      });
      return _objectSpread(_objectSpread({}, state), {}, {
        expanded: expanded
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      expanded: {}
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleRowExpanded) {
    var id = action.id,
        setExpanded = action.value;
    var exists = state.expanded[id];
    var shouldExist = typeof setExpanded !== 'undefined' ? setExpanded : !exists;

    if (!exists && shouldExist) {
      return _objectSpread(_objectSpread({}, state), {}, {
        expanded: _objectSpread(_objectSpread({}, state.expanded), {}, _defineProperty({}, id, true))
      });
    } else if (exists && !shouldExist) {
      var _state$expanded = state.expanded,
          _ = _state$expanded[id],
          rest = _objectWithoutProperties(_state$expanded, [id].map(_toPropertyKey));

      return _objectSpread(_objectSpread({}, state), {}, {
        expanded: rest
      });
    } else {
      return state;
    }
  }
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      rowsById = instance.rowsById,
      _instance$manualExpan = instance.manualExpandedKey,
      manualExpandedKey = _instance$manualExpan === void 0 ? 'expanded' : _instance$manualExpan,
      _instance$paginateExp = instance.paginateExpandedRows,
      paginateExpandedRows = _instance$paginateExp === void 0 ? true : _instance$paginateExp,
      _instance$expandSubRo = instance.expandSubRows,
      expandSubRows = _instance$expandSubRo === void 0 ? true : _instance$expandSubRo,
      _instance$autoResetEx = instance.autoResetExpanded,
      autoResetExpanded = _instance$autoResetEx === void 0 ? true : _instance$autoResetEx,
      getHooks = instance.getHooks,
      plugins = instance.plugins,
      expanded = instance.state.expanded,
      dispatch = instance.dispatch;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.ensurePluginOrder)(plugins, ['useSortBy', 'useGroupBy', 'usePivotColumns', 'useGlobalFilter'], 'useExpanded');
  var getAutoResetExpanded = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(autoResetExpanded);
  var isAllRowsExpanded = Boolean(Object.keys(rowsById).length && Object.keys(expanded).length);

  if (isAllRowsExpanded) {
    if (Object.keys(rowsById).some(function (id) {
      return !expanded[id];
    })) {
      isAllRowsExpanded = false;
    }
  } // Bypass any effects from firing when this changes


  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useMountedLayoutEffect)(function () {
    if (getAutoResetExpanded()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetExpanded
      });
    }
  }, [dispatch, data]);
  var toggleRowExpanded = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (id, value) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleRowExpanded,
      id: id,
      value: value
    });
  }, [dispatch]);
  var toggleAllRowsExpanded = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.toggleAllRowsExpanded,
      value: value
    });
  }, [dispatch]);
  var expandedRows = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (paginateExpandedRows) {
      return (0,_utils__WEBPACK_IMPORTED_MODULE_1__.expandRows)(rows, {
        manualExpandedKey: manualExpandedKey,
        expanded: expanded,
        expandSubRows: expandSubRows
      });
    }

    return rows;
  }, [paginateExpandedRows, rows, manualExpandedKey, expanded, expandSubRows]);
  var expandedDepth = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return findExpandedDepth(expanded);
  }, [expanded]);
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(instance);
  var getToggleAllRowsExpandedProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getToggleAllRowsExpandedProps, {
    instance: getInstance()
  });
  Object.assign(instance, {
    preExpandedRows: rows,
    expandedRows: expandedRows,
    rows: expandedRows,
    expandedDepth: expandedDepth,
    isAllRowsExpanded: isAllRowsExpanded,
    toggleRowExpanded: toggleRowExpanded,
    toggleAllRowsExpanded: toggleAllRowsExpanded,
    getToggleAllRowsExpandedProps: getToggleAllRowsExpandedProps
  });
}

function prepareRow(row, _ref3) {
  var getHooks = _ref3.instance.getHooks,
      instance = _ref3.instance;

  row.toggleRowExpanded = function (set) {
    return instance.toggleRowExpanded(row.id, set);
  };

  row.getToggleRowExpandedProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.makePropGetter)(getHooks().getToggleRowExpandedProps, {
    instance: instance,
    row: row
  });
}

function findExpandedDepth(expanded) {
  var maxDepth = 0;
  Object.keys(expanded).forEach(function (id) {
    var splitId = id.split('.');
    maxDepth = Math.max(maxDepth, splitId.length);
  });
  return maxDepth;
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useFilters.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useFilters.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useFilters": function() { return /* binding */ useFilters; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _filterTypes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../filterTypes */ "./node_modules/react-table/src/filterTypes.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetFilters = 'resetFilters';
_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setFilter = 'setFilter';
_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setAllFilters = 'setAllFilters';
var useFilters = function useFilters(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
};
useFilters.pluginName = 'useFilters';

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.init) {
    return _objectSpread({
      filters: []
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetFilters) {
    return _objectSpread(_objectSpread({}, state), {}, {
      filters: instance.initialState.filters || []
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setFilter) {
    var columnId = action.columnId,
        filterValue = action.filterValue;
    var allColumns = instance.allColumns,
        userFilterTypes = instance.filterTypes;
    var column = allColumns.find(function (d) {
      return d.id === columnId;
    });

    if (!column) {
      throw new Error("React-Table: Could not find a column with id: ".concat(columnId));
    }

    var filterMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFilterMethod)(column.filter, userFilterTypes || {}, _filterTypes__WEBPACK_IMPORTED_MODULE_3__);
    var previousfilter = state.filters.find(function (d) {
      return d.id === columnId;
    });
    var newFilter = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.functionalUpdate)(filterValue, previousfilter && previousfilter.value); //

    if ((0,_utils__WEBPACK_IMPORTED_MODULE_1__.shouldAutoRemoveFilter)(filterMethod.autoRemove, newFilter, column)) {
      return _objectSpread(_objectSpread({}, state), {}, {
        filters: state.filters.filter(function (d) {
          return d.id !== columnId;
        })
      });
    }

    if (previousfilter) {
      return _objectSpread(_objectSpread({}, state), {}, {
        filters: state.filters.map(function (d) {
          if (d.id === columnId) {
            return {
              id: columnId,
              value: newFilter
            };
          }

          return d;
        })
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      filters: [].concat(_toConsumableArray(state.filters), [{
        id: columnId,
        value: newFilter
      }])
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setAllFilters) {
    var filters = action.filters;
    var _allColumns = instance.allColumns,
        _userFilterTypes = instance.filterTypes;
    return _objectSpread(_objectSpread({}, state), {}, {
      // Filter out undefined values
      filters: (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.functionalUpdate)(filters, state.filters).filter(function (filter) {
        var column = _allColumns.find(function (d) {
          return d.id === filter.id;
        });

        var filterMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFilterMethod)(column.filter, _userFilterTypes || {}, _filterTypes__WEBPACK_IMPORTED_MODULE_3__);

        if ((0,_utils__WEBPACK_IMPORTED_MODULE_1__.shouldAutoRemoveFilter)(filterMethod.autoRemove, filter.value, column)) {
          return false;
        }

        return true;
      })
    });
  }
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      flatRows = instance.flatRows,
      rowsById = instance.rowsById,
      allColumns = instance.allColumns,
      userFilterTypes = instance.filterTypes,
      manualFilters = instance.manualFilters,
      _instance$defaultCanF = instance.defaultCanFilter,
      defaultCanFilter = _instance$defaultCanF === void 0 ? false : _instance$defaultCanF,
      disableFilters = instance.disableFilters,
      filters = instance.state.filters,
      dispatch = instance.dispatch,
      _instance$autoResetFi = instance.autoResetFilters,
      autoResetFilters = _instance$autoResetFi === void 0 ? true : _instance$autoResetFi;
  var setFilter = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnId, filterValue) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setFilter,
      columnId: columnId,
      filterValue: filterValue
    });
  }, [dispatch]);
  var setAllFilters = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (filters) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setAllFilters,
      filters: filters
    });
  }, [dispatch]);
  allColumns.forEach(function (column) {
    var id = column.id,
        accessor = column.accessor,
        columnDefaultCanFilter = column.defaultCanFilter,
        columnDisableFilters = column.disableFilters; // Determine if a column is filterable

    column.canFilter = accessor ? (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFirstDefined)(columnDisableFilters === true ? false : undefined, disableFilters === true ? false : undefined, true) : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFirstDefined)(columnDefaultCanFilter, defaultCanFilter, false); // Provide the column a way of updating the filter value

    column.setFilter = function (val) {
      return setFilter(column.id, val);
    }; // Provide the current filter value to the column for
    // convenience


    var found = filters.find(function (d) {
      return d.id === id;
    });
    column.filterValue = found && found.value;
  });

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (manualFilters || !filters.length) {
      return [rows, flatRows, rowsById];
    }

    var filteredFlatRows = [];
    var filteredRowsById = {}; // Filters top level and nested rows

    var filterRows = function filterRows(rows) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var filteredRows = rows;
      filteredRows = filters.reduce(function (filteredSoFar, _ref) {
        var columnId = _ref.id,
            filterValue = _ref.value;
        // Find the filters column
        var column = allColumns.find(function (d) {
          return d.id === columnId;
        });

        if (!column) {
          return filteredSoFar;
        }

        if (depth === 0) {
          column.preFilteredRows = filteredSoFar;
        }

        var filterMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFilterMethod)(column.filter, userFilterTypes || {}, _filterTypes__WEBPACK_IMPORTED_MODULE_3__);

        if (!filterMethod) {
          console.warn("Could not find a valid 'column.filter' for column with the ID: ".concat(column.id, "."));
          return filteredSoFar;
        } // Pass the rows, id, filterValue and column to the filterMethod
        // to get the filtered rows back


        column.filteredRows = filterMethod(filteredSoFar, [columnId], filterValue);
        return column.filteredRows;
      }, rows); // Apply the filter to any subRows
      // We technically could do this recursively in the above loop,
      // but that would severely hinder the API for the user, since they
      // would be required to do that recursion in some scenarios

      filteredRows.forEach(function (row) {
        filteredFlatRows.push(row);
        filteredRowsById[row.id] = row;

        if (!row.subRows) {
          return;
        }

        row.subRows = row.subRows && row.subRows.length > 0 ? filterRows(row.subRows, depth + 1) : row.subRows;
      });
      return filteredRows;
    };

    return [filterRows(rows), filteredFlatRows, filteredRowsById];
  }, [manualFilters, filters, rows, flatRows, rowsById, allColumns, userFilterTypes]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 3),
      filteredRows = _React$useMemo2[0],
      filteredFlatRows = _React$useMemo2[1],
      filteredRowsById = _React$useMemo2[2];

  react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    // Now that each filtered column has it's partially filtered rows,
    // lets assign the final filtered rows to all of the other columns
    var nonFilteredColumns = allColumns.filter(function (column) {
      return !filters.find(function (d) {
        return d.id === column.id;
      });
    }); // This essentially enables faceted filter options to be built easily
    // using every column's preFilteredRows value

    nonFilteredColumns.forEach(function (column) {
      column.preFilteredRows = filteredRows;
      column.filteredRows = filteredRows;
    });
  }, [filteredRows, filters, allColumns]);
  var getAutoResetFilters = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(autoResetFilters);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useMountedLayoutEffect)(function () {
    if (getAutoResetFilters()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetFilters
      });
    }
  }, [dispatch, manualFilters ? null : data]);
  Object.assign(instance, {
    preFilteredRows: rows,
    preFilteredFlatRows: flatRows,
    preFilteredRowsById: rowsById,
    filteredRows: filteredRows,
    filteredFlatRows: filteredFlatRows,
    filteredRowsById: filteredRowsById,
    rows: filteredRows,
    flatRows: filteredFlatRows,
    rowsById: filteredRowsById,
    setFilter: setFilter,
    setAllFilters: setAllFilters
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useFlexLayout.js":
/*!********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useFlexLayout.js ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useFlexLayout": function() { return /* binding */ useFlexLayout; }
/* harmony export */ });
function useFlexLayout(hooks) {
  hooks.getTableProps.push(getTableProps);
  hooks.getRowProps.push(getRowStyles);
  hooks.getHeaderGroupProps.push(getRowStyles);
  hooks.getFooterGroupProps.push(getRowStyles);
  hooks.getHeaderProps.push(getHeaderProps);
  hooks.getCellProps.push(getCellProps);
  hooks.getFooterProps.push(getFooterProps);
}
useFlexLayout.pluginName = 'useFlexLayout';

var getTableProps = function getTableProps(props, _ref) {
  var instance = _ref.instance;
  return [props, {
    style: {
      minWidth: "".concat(instance.totalColumnsMinWidth, "px")
    }
  }];
};

var getRowStyles = function getRowStyles(props, _ref2) {
  var instance = _ref2.instance;
  return [props, {
    style: {
      display: 'flex',
      flex: '1 0 auto',
      minWidth: "".concat(instance.totalColumnsMinWidth, "px")
    }
  }];
};

var getHeaderProps = function getHeaderProps(props, _ref3) {
  var column = _ref3.column;
  return [props, {
    style: {
      boxSizing: 'border-box',
      flex: column.totalFlexWidth ? "".concat(column.totalFlexWidth, " 0 auto") : undefined,
      minWidth: "".concat(column.totalMinWidth, "px"),
      width: "".concat(column.totalWidth, "px")
    }
  }];
};

var getCellProps = function getCellProps(props, _ref4) {
  var cell = _ref4.cell;
  return [props, {
    style: {
      boxSizing: 'border-box',
      flex: "".concat(cell.column.totalFlexWidth, " 0 auto"),
      minWidth: "".concat(cell.column.totalMinWidth, "px"),
      width: "".concat(cell.column.totalWidth, "px")
    }
  }];
};

var getFooterProps = function getFooterProps(props, _ref5) {
  var column = _ref5.column;
  return [props, {
    style: {
      boxSizing: 'border-box',
      flex: column.totalFlexWidth ? "".concat(column.totalFlexWidth, " 0 auto") : undefined,
      minWidth: "".concat(column.totalMinWidth, "px"),
      width: "".concat(column.totalWidth, "px")
    }
  }];
};

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useGlobalFilter.js":
/*!**********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useGlobalFilter.js ***!
  \**********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useGlobalFilter": function() { return /* binding */ useGlobalFilter; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _filterTypes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../filterTypes */ "./node_modules/react-table/src/filterTypes.js");
var _excluded = ["globalFilter"];

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetGlobalFilter = 'resetGlobalFilter';
_publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setGlobalFilter = 'setGlobalFilter';
var useGlobalFilter = function useGlobalFilter(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
};
useGlobalFilter.pluginName = 'useGlobalFilter';

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetGlobalFilter) {
    return _objectSpread(_objectSpread({}, state), {}, {
      globalFilter: instance.initialState.globalFilter || undefined
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setGlobalFilter) {
    var filterValue = action.filterValue;
    var userFilterTypes = instance.userFilterTypes;
    var filterMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFilterMethod)(instance.globalFilter, userFilterTypes || {}, _filterTypes__WEBPACK_IMPORTED_MODULE_3__);
    var newFilter = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.functionalUpdate)(filterValue, state.globalFilter); //

    if ((0,_utils__WEBPACK_IMPORTED_MODULE_1__.shouldAutoRemoveFilter)(filterMethod.autoRemove, newFilter)) {
      var globalFilter = state.globalFilter,
          stateWithoutGlobalFilter = _objectWithoutProperties(state, _excluded);

      return stateWithoutGlobalFilter;
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      globalFilter: newFilter
    });
  }
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      flatRows = instance.flatRows,
      rowsById = instance.rowsById,
      allColumns = instance.allColumns,
      userFilterTypes = instance.filterTypes,
      globalFilter = instance.globalFilter,
      manualGlobalFilter = instance.manualGlobalFilter,
      globalFilterValue = instance.state.globalFilter,
      dispatch = instance.dispatch,
      _instance$autoResetGl = instance.autoResetGlobalFilter,
      autoResetGlobalFilter = _instance$autoResetGl === void 0 ? true : _instance$autoResetGl,
      disableGlobalFilter = instance.disableGlobalFilter;
  var setGlobalFilter = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (filterValue) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.setGlobalFilter,
      filterValue: filterValue
    });
  }, [dispatch]); // TODO: Create a filter cache for incremental high speed multi-filtering
  // This gets pretty complicated pretty fast, since you have to maintain a
  // cache for each row group (top-level rows, and each row's recursive subrows)
  // This would make multi-filtering a lot faster though. Too far?

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (manualGlobalFilter || typeof globalFilterValue === 'undefined') {
      return [rows, flatRows, rowsById];
    }

    var filteredFlatRows = [];
    var filteredRowsById = {};
    var filterMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFilterMethod)(globalFilter, userFilterTypes || {}, _filterTypes__WEBPACK_IMPORTED_MODULE_3__);

    if (!filterMethod) {
      console.warn("Could not find a valid 'globalFilter' option.");
      return rows;
    }

    allColumns.forEach(function (column) {
      var columnDisableGlobalFilter = column.disableGlobalFilter;
      column.canFilter = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getFirstDefined)(columnDisableGlobalFilter === true ? false : undefined, disableGlobalFilter === true ? false : undefined, true);
    });
    var filterableColumns = allColumns.filter(function (c) {
      return c.canFilter === true;
    }); // Filters top level and nested rows

    var filterRows = function filterRows(filteredRows) {
      filteredRows = filterMethod(filteredRows, filterableColumns.map(function (d) {
        return d.id;
      }), globalFilterValue);
      filteredRows.forEach(function (row) {
        filteredFlatRows.push(row);
        filteredRowsById[row.id] = row;
        row.subRows = row.subRows && row.subRows.length ? filterRows(row.subRows) : row.subRows;
      });
      return filteredRows;
    };

    return [filterRows(rows), filteredFlatRows, filteredRowsById];
  }, [manualGlobalFilter, globalFilterValue, globalFilter, userFilterTypes, allColumns, rows, flatRows, rowsById, disableGlobalFilter]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 3),
      globalFilteredRows = _React$useMemo2[0],
      globalFilteredFlatRows = _React$useMemo2[1],
      globalFilteredRowsById = _React$useMemo2[2];

  var getAutoResetGlobalFilter = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useGetLatest)(autoResetGlobalFilter);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_2__.useMountedLayoutEffect)(function () {
    if (getAutoResetGlobalFilter()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_2__.actions.resetGlobalFilter
      });
    }
  }, [dispatch, manualGlobalFilter ? null : data]);
  Object.assign(instance, {
    preGlobalFilteredRows: rows,
    preGlobalFilteredFlatRows: flatRows,
    preGlobalFilteredRowsById: rowsById,
    globalFilteredRows: globalFilteredRows,
    globalFilteredFlatRows: globalFilteredFlatRows,
    globalFilteredRowsById: globalFilteredRowsById,
    rows: globalFilteredRows,
    flatRows: globalFilteredFlatRows,
    rowsById: globalFilteredRowsById,
    setGlobalFilter: setGlobalFilter,
    disableGlobalFilter: disableGlobalFilter
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useGridLayout.js":
/*!********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useGridLayout.js ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useGridLayout": function() { return /* binding */ useGridLayout; }
/* harmony export */ });
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnStartResizing = 'columnStartResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnResizing = 'columnResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnDoneResizing = 'columnDoneResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.resetResize = 'resetResize';
function useGridLayout(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.getTableProps.push(getTableProps);
  hooks.getHeaderProps.push(getHeaderProps);
  hooks.getRowProps.push(getRowProps);
}
useGridLayout.pluginName = 'useGridLayout';

var getTableProps = function getTableProps(props, _ref) {
  var instance = _ref.instance;
  var gridTemplateColumns = instance.visibleColumns.map(function (column) {
    var _instance$state$colum;

    if (instance.state.gridLayout.columnWidths[column.id]) return "".concat(instance.state.gridLayout.columnWidths[column.id], "px"); // When resizing, lock the width of all unset columns
    // instead of using user-provided width or defaultColumn width,
    // which could potentially be 'auto' or 'fr' units that don't scale linearly

    if ((_instance$state$colum = instance.state.columnResizing) !== null && _instance$state$colum !== void 0 && _instance$state$colum.isResizingColumn) return "".concat(instance.state.gridLayout.startWidths[column.id], "px");
    if (typeof column.width === 'number') return "".concat(column.width, "px");
    return column.width;
  });
  return [props, {
    style: {
      display: "grid",
      gridTemplateColumns: gridTemplateColumns.join(" ")
    }
  }];
};

var getHeaderProps = function getHeaderProps(props, _ref2) {
  var column = _ref2.column;
  return [props, {
    id: "header-cell-".concat(column.id),
    style: {
      position: "sticky",
      //enables a scroll wrapper to be placed around the table and have sticky headers
      gridColumn: "span ".concat(column.totalVisibleHeaderCount)
    }
  }];
};

var getRowProps = function getRowProps(props, _ref3) {
  var row = _ref3.row;

  if (row.isExpanded) {
    return [props, {
      style: {
        gridColumn: "1 / ".concat(row.cells.length + 1)
      }
    }];
  }

  return [props, {}];
};

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.init) {
    return _objectSpread({
      gridLayout: {
        columnWidths: {}
      }
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.resetResize) {
    return _objectSpread(_objectSpread({}, state), {}, {
      gridLayout: {
        columnWidths: {}
      }
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnStartResizing) {
    var columnId = action.columnId,
        headerIdWidths = action.headerIdWidths;
    var columnWidth = getElementWidth(columnId);

    if (columnWidth !== undefined) {
      var startWidths = instance.visibleColumns.reduce(function (acc, column) {
        return _objectSpread(_objectSpread({}, acc), {}, _defineProperty({}, column.id, getElementWidth(column.id)));
      }, {});
      var minWidths = instance.visibleColumns.reduce(function (acc, column) {
        return _objectSpread(_objectSpread({}, acc), {}, _defineProperty({}, column.id, column.minWidth));
      }, {});
      var maxWidths = instance.visibleColumns.reduce(function (acc, column) {
        return _objectSpread(_objectSpread({}, acc), {}, _defineProperty({}, column.id, column.maxWidth));
      }, {});
      var headerIdGridWidths = headerIdWidths.map(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 1),
            headerId = _ref5[0];

        return [headerId, getElementWidth(headerId)];
      });
      return _objectSpread(_objectSpread({}, state), {}, {
        gridLayout: _objectSpread(_objectSpread({}, state.gridLayout), {}, {
          startWidths: startWidths,
          minWidths: minWidths,
          maxWidths: maxWidths,
          headerIdGridWidths: headerIdGridWidths,
          columnWidth: columnWidth
        })
      });
    } else {
      return state;
    }
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnResizing) {
    var clientX = action.clientX;
    var startX = state.columnResizing.startX;

    var _state$gridLayout = state.gridLayout,
        _columnWidth = _state$gridLayout.columnWidth,
        _minWidths = _state$gridLayout.minWidths,
        _maxWidths = _state$gridLayout.maxWidths,
        _state$gridLayout$hea = _state$gridLayout.headerIdGridWidths,
        _headerIdGridWidths = _state$gridLayout$hea === void 0 ? [] : _state$gridLayout$hea;

    var deltaX = clientX - startX;
    var percentageDeltaX = deltaX / _columnWidth;
    var newColumnWidths = {};

    _headerIdGridWidths.forEach(function (_ref6) {
      var _ref7 = _slicedToArray(_ref6, 2),
          headerId = _ref7[0],
          headerWidth = _ref7[1];

      newColumnWidths[headerId] = Math.min(Math.max(_minWidths[headerId], headerWidth + headerWidth * percentageDeltaX), _maxWidths[headerId]);
    });

    return _objectSpread(_objectSpread({}, state), {}, {
      gridLayout: _objectSpread(_objectSpread({}, state.gridLayout), {}, {
        columnWidths: _objectSpread(_objectSpread({}, state.gridLayout.columnWidths), newColumnWidths)
      })
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_0__.actions.columnDoneResizing) {
    return _objectSpread(_objectSpread({}, state), {}, {
      gridLayout: _objectSpread(_objectSpread({}, state.gridLayout), {}, {
        startWidths: {},
        minWidths: {},
        maxWidths: {}
      })
    });
  }
}

function getElementWidth(columnId) {
  var _document$getElementB;

  var width = (_document$getElementB = document.getElementById("header-cell-".concat(columnId))) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.offsetWidth;

  if (width !== undefined) {
    return width;
  }
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useGroupBy.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useGroupBy.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultGroupByFn": function() { return /* binding */ defaultGroupByFn; },
/* harmony export */   "useGroupBy": function() { return /* binding */ useGroupBy; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _aggregations__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../aggregations */ "./node_modules/react-table/src/aggregations.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }





var emptyArray = [];
var emptyObject = {}; // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.resetGroupBy = 'resetGroupBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.setGroupBy = 'setGroupBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.toggleGroupBy = 'toggleGroupBy';
var useGroupBy = function useGroupBy(hooks) {
  hooks.getGroupByToggleProps = [defaultGetGroupByToggleProps];
  hooks.stateReducers.push(reducer);
  hooks.visibleColumnsDeps.push(function (deps, _ref) {
    var instance = _ref.instance;
    return [].concat(_toConsumableArray(deps), [instance.state.groupBy]);
  });
  hooks.visibleColumns.push(visibleColumns);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
};
useGroupBy.pluginName = 'useGroupBy';

var defaultGetGroupByToggleProps = function defaultGetGroupByToggleProps(props, _ref2) {
  var header = _ref2.header;
  return [props, {
    onClick: header.canGroupBy ? function (e) {
      e.persist();
      header.toggleGroupBy();
    } : undefined,
    style: {
      cursor: header.canGroupBy ? 'pointer' : undefined
    },
    title: 'Toggle GroupBy'
  }];
}; // Reducer


function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.init) {
    return _objectSpread({
      groupBy: []
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.resetGroupBy) {
    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: instance.initialState.groupBy || []
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.setGroupBy) {
    var value = action.value;
    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: value
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.toggleGroupBy) {
    var columnId = action.columnId,
        setGroupBy = action.value;
    var resolvedGroupBy = typeof setGroupBy !== 'undefined' ? setGroupBy : !state.groupBy.includes(columnId);

    if (resolvedGroupBy) {
      return _objectSpread(_objectSpread({}, state), {}, {
        groupBy: [].concat(_toConsumableArray(state.groupBy), [columnId])
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: state.groupBy.filter(function (d) {
        return d !== columnId;
      })
    });
  }
}

function visibleColumns(columns, _ref3) {
  var groupBy = _ref3.instance.state.groupBy;
  // Sort grouped columns to the start of the column list
  // before the headers are built
  var groupByColumns = groupBy.map(function (g) {
    return columns.find(function (col) {
      return col.id === g;
    });
  }).filter(Boolean);
  var nonGroupByColumns = columns.filter(function (col) {
    return !groupBy.includes(col.id);
  });
  columns = [].concat(_toConsumableArray(groupByColumns), _toConsumableArray(nonGroupByColumns));
  columns.forEach(function (column) {
    column.isGrouped = groupBy.includes(column.id);
    column.groupedIndex = groupBy.indexOf(column.id);
  });
  return columns;
}

var defaultUserAggregations = {};

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      flatRows = instance.flatRows,
      rowsById = instance.rowsById,
      allColumns = instance.allColumns,
      flatHeaders = instance.flatHeaders,
      _instance$groupByFn = instance.groupByFn,
      groupByFn = _instance$groupByFn === void 0 ? defaultGroupByFn : _instance$groupByFn,
      manualGroupBy = instance.manualGroupBy,
      _instance$aggregation = instance.aggregations,
      userAggregations = _instance$aggregation === void 0 ? defaultUserAggregations : _instance$aggregation,
      plugins = instance.plugins,
      groupBy = instance.state.groupBy,
      dispatch = instance.dispatch,
      _instance$autoResetGr = instance.autoResetGroupBy,
      autoResetGroupBy = _instance$autoResetGr === void 0 ? true : _instance$autoResetGr,
      disableGroupBy = instance.disableGroupBy,
      defaultCanGroupBy = instance.defaultCanGroupBy,
      getHooks = instance.getHooks;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_3__.ensurePluginOrder)(plugins, ['useColumnOrder', 'useFilters'], 'useGroupBy');
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_3__.useGetLatest)(instance);
  allColumns.forEach(function (column) {
    var accessor = column.accessor,
        defaultColumnGroupBy = column.defaultGroupBy,
        columnDisableGroupBy = column.disableGroupBy;
    column.canGroupBy = accessor ? (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(column.canGroupBy, columnDisableGroupBy === true ? false : undefined, disableGroupBy === true ? false : undefined, true) : (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(column.canGroupBy, defaultColumnGroupBy, defaultCanGroupBy, false);

    if (column.canGroupBy) {
      column.toggleGroupBy = function () {
        return instance.toggleGroupBy(column.id);
      };
    }

    column.Aggregated = column.Aggregated || column.Cell;
  });
  var toggleGroupBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnId, value) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.toggleGroupBy,
      columnId: columnId,
      value: value
    });
  }, [dispatch]);
  var setGroupBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.setGroupBy,
      value: value
    });
  }, [dispatch]);
  flatHeaders.forEach(function (header) {
    header.getGroupByToggleProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_3__.makePropGetter)(getHooks().getGroupByToggleProps, {
      instance: getInstance(),
      header: header
    });
  });

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (manualGroupBy || !groupBy.length) {
      return [rows, flatRows, rowsById, emptyArray, emptyObject, flatRows, rowsById];
    } // Ensure that the list of filtered columns exist


    var existingGroupBy = groupBy.filter(function (g) {
      return allColumns.find(function (col) {
        return col.id === g;
      });
    }); // Find the columns that can or are aggregating
    // Uses each column to aggregate rows into a single value

    var aggregateRowsToValues = function aggregateRowsToValues(leafRows, groupedRows, depth) {
      var values = {};
      allColumns.forEach(function (column) {
        // Don't aggregate columns that are in the groupBy
        if (existingGroupBy.includes(column.id)) {
          values[column.id] = groupedRows[0] ? groupedRows[0].values[column.id] : null;
          return;
        } // Aggregate the values


        var aggregateFn = typeof column.aggregate === 'function' ? column.aggregate : userAggregations[column.aggregate] || _aggregations__WEBPACK_IMPORTED_MODULE_1__[column.aggregate];

        if (aggregateFn) {
          // Get the columnValues to aggregate
          var groupedValues = groupedRows.map(function (row) {
            return row.values[column.id];
          }); // Get the columnValues to aggregate

          var leafValues = leafRows.map(function (row) {
            var columnValue = row.values[column.id];

            if (!depth && column.aggregateValue) {
              var aggregateValueFn = typeof column.aggregateValue === 'function' ? column.aggregateValue : userAggregations[column.aggregateValue] || _aggregations__WEBPACK_IMPORTED_MODULE_1__[column.aggregateValue];

              if (!aggregateValueFn) {
                console.info({
                  column: column
                });
                throw new Error("React Table: Invalid column.aggregateValue option for column listed above");
              }

              columnValue = aggregateValueFn(columnValue, row, column);
            }

            return columnValue;
          });
          values[column.id] = aggregateFn(leafValues, groupedValues);
        } else if (column.aggregate) {
          console.info({
            column: column
          });
          throw new Error("React Table: Invalid column.aggregate option for column listed above");
        } else {
          values[column.id] = null;
        }
      });
      return values;
    };

    var groupedFlatRows = [];
    var groupedRowsById = {};
    var onlyGroupedFlatRows = [];
    var onlyGroupedRowsById = {};
    var nonGroupedFlatRows = [];
    var nonGroupedRowsById = {}; // Recursively group the data

    var groupUpRecursively = function groupUpRecursively(rows) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var parentId = arguments.length > 2 ? arguments[2] : undefined;

      // This is the last level, just return the rows
      if (depth === existingGroupBy.length) {
        return rows.map(function (row) {
          return _objectSpread(_objectSpread({}, row), {}, {
            depth: depth
          });
        });
      }

      var columnId = existingGroupBy[depth]; // Group the rows together for this level

      var rowGroupsMap = groupByFn(rows, columnId); // Peform aggregations for each group

      var aggregatedGroupedRows = Object.entries(rowGroupsMap).map(function (_ref4, index) {
        var _ref5 = _slicedToArray(_ref4, 2),
            groupByVal = _ref5[0],
            groupedRows = _ref5[1];

        var id = "".concat(columnId, ":").concat(groupByVal);
        id = parentId ? "".concat(parentId, ">").concat(id) : id; // First, Recurse to group sub rows before aggregation

        var subRows = groupUpRecursively(groupedRows, depth + 1, id); // Flatten the leaf rows of the rows in this group

        var leafRows = depth ? (0,_utils__WEBPACK_IMPORTED_MODULE_2__.flattenBy)(groupedRows, 'leafRows') : groupedRows;
        var values = aggregateRowsToValues(leafRows, groupedRows, depth);
        var row = {
          id: id,
          isGrouped: true,
          groupByID: columnId,
          groupByVal: groupByVal,
          values: values,
          subRows: subRows,
          leafRows: leafRows,
          depth: depth,
          index: index
        };
        subRows.forEach(function (subRow) {
          groupedFlatRows.push(subRow);
          groupedRowsById[subRow.id] = subRow;

          if (subRow.isGrouped) {
            onlyGroupedFlatRows.push(subRow);
            onlyGroupedRowsById[subRow.id] = subRow;
          } else {
            nonGroupedFlatRows.push(subRow);
            nonGroupedRowsById[subRow.id] = subRow;
          }
        });
        return row;
      });
      return aggregatedGroupedRows;
    };

    var groupedRows = groupUpRecursively(rows);
    groupedRows.forEach(function (subRow) {
      groupedFlatRows.push(subRow);
      groupedRowsById[subRow.id] = subRow;

      if (subRow.isGrouped) {
        onlyGroupedFlatRows.push(subRow);
        onlyGroupedRowsById[subRow.id] = subRow;
      } else {
        nonGroupedFlatRows.push(subRow);
        nonGroupedRowsById[subRow.id] = subRow;
      }
    }); // Assign the new data

    return [groupedRows, groupedFlatRows, groupedRowsById, onlyGroupedFlatRows, onlyGroupedRowsById, nonGroupedFlatRows, nonGroupedRowsById];
  }, [manualGroupBy, groupBy, rows, flatRows, rowsById, allColumns, userAggregations, groupByFn]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 7),
      groupedRows = _React$useMemo2[0],
      groupedFlatRows = _React$useMemo2[1],
      groupedRowsById = _React$useMemo2[2],
      onlyGroupedFlatRows = _React$useMemo2[3],
      onlyGroupedRowsById = _React$useMemo2[4],
      nonGroupedFlatRows = _React$useMemo2[5],
      nonGroupedRowsById = _React$useMemo2[6];

  var getAutoResetGroupBy = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_3__.useGetLatest)(autoResetGroupBy);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_3__.useMountedLayoutEffect)(function () {
    if (getAutoResetGroupBy()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_3__.actions.resetGroupBy
      });
    }
  }, [dispatch, manualGroupBy ? null : data]);
  Object.assign(instance, {
    preGroupedRows: rows,
    preGroupedFlatRow: flatRows,
    preGroupedRowsById: rowsById,
    groupedRows: groupedRows,
    groupedFlatRows: groupedFlatRows,
    groupedRowsById: groupedRowsById,
    onlyGroupedFlatRows: onlyGroupedFlatRows,
    onlyGroupedRowsById: onlyGroupedRowsById,
    nonGroupedFlatRows: nonGroupedFlatRows,
    nonGroupedRowsById: nonGroupedRowsById,
    rows: groupedRows,
    flatRows: groupedFlatRows,
    rowsById: groupedRowsById,
    toggleGroupBy: toggleGroupBy,
    setGroupBy: setGroupBy
  });
}

function prepareRow(row) {
  row.allCells.forEach(function (cell) {
    var _row$subRows;

    // Grouped cells are in the groupBy and the pivot cell for the row
    cell.isGrouped = cell.column.isGrouped && cell.column.id === row.groupByID; // Placeholder cells are any columns in the groupBy that are not grouped

    cell.isPlaceholder = !cell.isGrouped && cell.column.isGrouped; // Aggregated cells are not grouped, not repeated, but still have subRows

    cell.isAggregated = !cell.isGrouped && !cell.isPlaceholder && ((_row$subRows = row.subRows) === null || _row$subRows === void 0 ? void 0 : _row$subRows.length);
  });
}

function defaultGroupByFn(rows, columnId) {
  return rows.reduce(function (prev, row, i) {
    // TODO: Might want to implement a key serializer here so
    // irregular column values can still be grouped if needed?
    var resKey = "".concat(row.values[columnId]);
    prev[resKey] = Array.isArray(prev[resKey]) ? prev[resKey] : [];
    prev[resKey].push(row);
    return prev;
  }, {});
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/usePagination.js":
/*!********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/usePagination.js ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "usePagination": function() { return /* binding */ usePagination; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

 //



var pluginName = 'usePagination'; // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage = 'resetPage';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage = 'gotoPage';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize = 'setPageSize';
var usePagination = function usePagination(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
};
usePagination.pluginName = pluginName;

function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      pageSize: 10,
      pageIndex: 0
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage) {
    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: instance.initialState.pageIndex || 0
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage) {
    var pageCount = instance.pageCount,
        page = instance.page;
    var newPageIndex = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(action.pageIndex, state.pageIndex);
    var canNavigate = false;

    if (newPageIndex > state.pageIndex) {
      // next page
      canNavigate = pageCount === -1 ? page.length >= state.pageSize : newPageIndex < pageCount;
    } else if (newPageIndex < state.pageIndex) {
      // prev page
      canNavigate = newPageIndex > -1;
    }

    if (!canNavigate) {
      return state;
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: newPageIndex
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize) {
    var pageSize = action.pageSize;
    var topRowIndex = state.pageSize * state.pageIndex;
    var pageIndex = Math.floor(topRowIndex / pageSize);
    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: pageIndex,
      pageSize: pageSize
    });
  }
}

function useInstance(instance) {
  var rows = instance.rows,
      _instance$autoResetPa = instance.autoResetPage,
      autoResetPage = _instance$autoResetPa === void 0 ? true : _instance$autoResetPa,
      _instance$manualExpan = instance.manualExpandedKey,
      manualExpandedKey = _instance$manualExpan === void 0 ? 'expanded' : _instance$manualExpan,
      plugins = instance.plugins,
      userPageCount = instance.pageCount,
      _instance$paginateExp = instance.paginateExpandedRows,
      paginateExpandedRows = _instance$paginateExp === void 0 ? true : _instance$paginateExp,
      _instance$expandSubRo = instance.expandSubRows,
      expandSubRows = _instance$expandSubRo === void 0 ? true : _instance$expandSubRo,
      _instance$state = instance.state,
      pageSize = _instance$state.pageSize,
      pageIndex = _instance$state.pageIndex,
      expanded = _instance$state.expanded,
      globalFilter = _instance$state.globalFilter,
      filters = _instance$state.filters,
      groupBy = _instance$state.groupBy,
      sortBy = _instance$state.sortBy,
      dispatch = instance.dispatch,
      data = instance.data,
      manualPagination = instance.manualPagination;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useGlobalFilter', 'useFilters', 'useGroupBy', 'useSortBy', 'useExpanded'], 'usePagination');
  var getAutoResetPage = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetPage);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetPage()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage
      });
    }
  }, [dispatch, manualPagination ? null : data, globalFilter, filters, groupBy, sortBy]);
  var pageCount = manualPagination ? userPageCount : Math.ceil(rows.length / pageSize);
  var pageOptions = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return pageCount > 0 ? _toConsumableArray(new Array(pageCount)).fill(null).map(function (d, i) {
      return i;
    }) : [];
  }, [pageCount]);
  var page = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var page;

    if (manualPagination) {
      page = rows;
    } else {
      var pageStart = pageSize * pageIndex;
      var pageEnd = pageStart + pageSize;
      page = rows.slice(pageStart, pageEnd);
    }

    if (paginateExpandedRows) {
      return page;
    }

    return (0,_utils__WEBPACK_IMPORTED_MODULE_2__.expandRows)(page, {
      manualExpandedKey: manualExpandedKey,
      expanded: expanded,
      expandSubRows: expandSubRows
    });
  }, [expandSubRows, expanded, manualExpandedKey, manualPagination, pageIndex, pageSize, paginateExpandedRows, rows]);
  var canPreviousPage = pageIndex > 0;
  var canNextPage = pageCount === -1 ? page.length >= pageSize : pageIndex < pageCount - 1;
  var gotoPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (pageIndex) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage,
      pageIndex: pageIndex
    });
  }, [dispatch]);
  var previousPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return gotoPage(function (old) {
      return old - 1;
    });
  }, [gotoPage]);
  var nextPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return gotoPage(function (old) {
      return old + 1;
    });
  }, [gotoPage]);
  var setPageSize = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (pageSize) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize,
      pageSize: pageSize
    });
  }, [dispatch]);
  Object.assign(instance, {
    pageOptions: pageOptions,
    pageCount: pageCount,
    page: page,
    canPreviousPage: canPreviousPage,
    canNextPage: canNextPage,
    gotoPage: gotoPage,
    previousPage: previousPage,
    nextPage: nextPage,
    setPageSize: setPageSize
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useResizeColumns.js":
/*!***********************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useResizeColumns.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useResizeColumns": function() { return /* binding */ useResizeColumns; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



 // Default Column

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.defaultColumn.canResize = true; // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing = 'columnStartResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing = 'columnResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing = 'columnDoneResizing';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize = 'resetResize';
var useResizeColumns = function useResizeColumns(hooks) {
  hooks.getResizerProps = [defaultGetResizerProps];
  hooks.getHeaderProps.push({
    style: {
      position: 'relative'
    }
  });
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.useInstanceBeforeDimensions.push(useInstanceBeforeDimensions);
};

var defaultGetResizerProps = function defaultGetResizerProps(props, _ref) {
  var instance = _ref.instance,
      header = _ref.header;
  var dispatch = instance.dispatch;

  var onResizeStart = function onResizeStart(e, header) {
    var isTouchEvent = false;

    if (e.type === 'touchstart') {
      // lets not respond to multiple touches (e.g. 2 or 3 fingers)
      if (e.touches && e.touches.length > 1) {
        return;
      }

      isTouchEvent = true;
    }

    var headersToResize = getLeafHeaders(header);
    var headerIdWidths = headersToResize.map(function (d) {
      return [d.id, d.totalWidth];
    });
    var clientX = isTouchEvent ? Math.round(e.touches[0].clientX) : e.clientX;
    var raf;
    var mostRecentClientX;

    var dispatchEnd = function dispatchEnd() {
      window.cancelAnimationFrame(raf);
      raf = null;
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing
      });
    };

    var dispatchMove = function dispatchMove() {
      window.cancelAnimationFrame(raf);
      raf = null;
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing,
        clientX: mostRecentClientX
      });
    };

    var scheduleDispatchMoveOnNextAnimationFrame = function scheduleDispatchMoveOnNextAnimationFrame(clientXPos) {
      mostRecentClientX = clientXPos;

      if (!raf) {
        raf = window.requestAnimationFrame(dispatchMove);
      }
    };

    var handlersAndEvents = {
      mouse: {
        moveEvent: 'mousemove',
        moveHandler: function moveHandler(e) {
          return scheduleDispatchMoveOnNextAnimationFrame(e.clientX);
        },
        upEvent: 'mouseup',
        upHandler: function upHandler(e) {
          document.removeEventListener('mousemove', handlersAndEvents.mouse.moveHandler);
          document.removeEventListener('mouseup', handlersAndEvents.mouse.upHandler);
          dispatchEnd();
        }
      },
      touch: {
        moveEvent: 'touchmove',
        moveHandler: function moveHandler(e) {
          if (e.cancelable) {
            e.preventDefault();
            e.stopPropagation();
          }

          scheduleDispatchMoveOnNextAnimationFrame(e.touches[0].clientX);
          return false;
        },
        upEvent: 'touchend',
        upHandler: function upHandler(e) {
          document.removeEventListener(handlersAndEvents.touch.moveEvent, handlersAndEvents.touch.moveHandler);
          document.removeEventListener(handlersAndEvents.touch.upEvent, handlersAndEvents.touch.moveHandler);
          dispatchEnd();
        }
      }
    };
    var events = isTouchEvent ? handlersAndEvents.touch : handlersAndEvents.mouse;
    var passiveIfSupported = (0,_utils__WEBPACK_IMPORTED_MODULE_2__.passiveEventSupported)() ? {
      passive: false
    } : false;
    document.addEventListener(events.moveEvent, events.moveHandler, passiveIfSupported);
    document.addEventListener(events.upEvent, events.upHandler, passiveIfSupported);
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing,
      columnId: header.id,
      columnWidth: header.totalWidth,
      headerIdWidths: headerIdWidths,
      clientX: clientX
    });
  };

  return [props, {
    onMouseDown: function onMouseDown(e) {
      return e.persist() || onResizeStart(e, header);
    },
    onTouchStart: function onTouchStart(e) {
      return e.persist() || onResizeStart(e, header);
    },
    style: {
      cursor: 'col-resize'
    },
    draggable: false,
    role: 'separator'
  }];
};

useResizeColumns.pluginName = 'useResizeColumns';

function reducer(state, action) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      columnResizing: {
        columnWidths: {}
      }
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: {
        columnWidths: {}
      }
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing) {
    var clientX = action.clientX,
        columnId = action.columnId,
        columnWidth = action.columnWidth,
        headerIdWidths = action.headerIdWidths;
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        startX: clientX,
        headerIdWidths: headerIdWidths,
        columnWidth: columnWidth,
        isResizingColumn: columnId
      })
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing) {
    var _clientX = action.clientX;

    var _state$columnResizing = state.columnResizing,
        startX = _state$columnResizing.startX,
        _columnWidth = _state$columnResizing.columnWidth,
        _state$columnResizing2 = _state$columnResizing.headerIdWidths,
        _headerIdWidths = _state$columnResizing2 === void 0 ? [] : _state$columnResizing2;

    var deltaX = _clientX - startX;
    var percentageDeltaX = deltaX / _columnWidth;
    var newColumnWidths = {};

    _headerIdWidths.forEach(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          headerId = _ref3[0],
          headerWidth = _ref3[1];

      newColumnWidths[headerId] = Math.max(headerWidth + headerWidth * percentageDeltaX, 0);
    });

    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        columnWidths: _objectSpread(_objectSpread({}, state.columnResizing.columnWidths), newColumnWidths)
      })
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        startX: null,
        isResizingColumn: null
      })
    });
  }
}

var useInstanceBeforeDimensions = function useInstanceBeforeDimensions(instance) {
  var flatHeaders = instance.flatHeaders,
      disableResizing = instance.disableResizing,
      getHooks = instance.getHooks,
      columnResizing = instance.state.columnResizing;
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  flatHeaders.forEach(function (header) {
    var canResize = (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(header.disableResizing === true ? false : undefined, disableResizing === true ? false : undefined, true);
    header.canResize = canResize;
    header.width = columnResizing.columnWidths[header.id] || header.originalWidth || header.width;
    header.isResizing = columnResizing.isResizingColumn === header.id;

    if (canResize) {
      header.getResizerProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getResizerProps, {
        instance: getInstance(),
        header: header
      });
    }
  });
};

function useInstance(instance) {
  var plugins = instance.plugins,
      dispatch = instance.dispatch,
      _instance$autoResetRe = instance.autoResetResize,
      autoResetResize = _instance$autoResetRe === void 0 ? true : _instance$autoResetRe,
      columns = instance.columns;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useAbsoluteLayout'], 'useResizeColumns');
  var getAutoResetResize = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetResize);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetResize()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize
      });
    }
  }, [columns]);
  var resetResizing = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize
    });
  }, [dispatch]);
  Object.assign(instance, {
    resetResizing: resetResizing
  });
}

function getLeafHeaders(header) {
  var leafHeaders = [];

  var recurseHeader = function recurseHeader(header) {
    if (header.columns && header.columns.length) {
      header.columns.map(recurseHeader);
    }

    leafHeaders.push(header);
  };

  recurseHeader(header);
  return leafHeaders;
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useRowSelect.js":
/*!*******************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useRowSelect.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useRowSelect": function() { return /* binding */ useRowSelect; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



var pluginName = 'useRowSelect'; // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows = 'resetSelectedRows';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected = 'toggleAllRowsSelected';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected = 'toggleRowSelected';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected = 'toggleAllPageRowsSelected';
var useRowSelect = function useRowSelect(hooks) {
  hooks.getToggleRowSelectedProps = [defaultGetToggleRowSelectedProps];
  hooks.getToggleAllRowsSelectedProps = [defaultGetToggleAllRowsSelectedProps];
  hooks.getToggleAllPageRowsSelectedProps = [defaultGetToggleAllPageRowsSelectedProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
};
useRowSelect.pluginName = pluginName;

var defaultGetToggleRowSelectedProps = function defaultGetToggleRowSelectedProps(props, _ref) {
  var instance = _ref.instance,
      row = _ref.row;
  var _instance$manualRowSe = instance.manualRowSelectedKey,
      manualRowSelectedKey = _instance$manualRowSe === void 0 ? 'isSelected' : _instance$manualRowSe;
  var checked = false;

  if (row.original && row.original[manualRowSelectedKey]) {
    checked = true;
  } else {
    checked = row.isSelected;
  }

  return [props, {
    onChange: function onChange(e) {
      row.toggleRowSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: checked,
    title: 'Toggle Row Selected',
    indeterminate: row.isSomeSelected
  }];
};

var defaultGetToggleAllRowsSelectedProps = function defaultGetToggleAllRowsSelectedProps(props, _ref2) {
  var instance = _ref2.instance;
  return [props, {
    onChange: function onChange(e) {
      instance.toggleAllRowsSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllRowsSelected,
    title: 'Toggle All Rows Selected',
    indeterminate: Boolean(!instance.isAllRowsSelected && Object.keys(instance.state.selectedRowIds).length)
  }];
};

var defaultGetToggleAllPageRowsSelectedProps = function defaultGetToggleAllPageRowsSelectedProps(props, _ref3) {
  var instance = _ref3.instance;
  return [props, {
    onChange: function onChange(e) {
      instance.toggleAllPageRowsSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllPageRowsSelected,
    title: 'Toggle All Current Page Rows Selected',
    indeterminate: Boolean(!instance.isAllPageRowsSelected && instance.page.some(function (_ref4) {
      var id = _ref4.id;
      return instance.state.selectedRowIds[id];
    }))
  }];
}; // eslint-disable-next-line max-params


function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      selectedRowIds: {}
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows) {
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: instance.initialState.selectedRowIds || {}
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected) {
    var setSelected = action.value;
    var isAllRowsSelected = instance.isAllRowsSelected,
        rowsById = instance.rowsById,
        _instance$nonGroupedR = instance.nonGroupedRowsById,
        nonGroupedRowsById = _instance$nonGroupedR === void 0 ? rowsById : _instance$nonGroupedR;
    var selectAll = typeof setSelected !== 'undefined' ? setSelected : !isAllRowsSelected; // Only remove/add the rows that are visible on the screen
    //  Leave all the other rows that are selected alone.

    var selectedRowIds = Object.assign({}, state.selectedRowIds);

    if (selectAll) {
      Object.keys(nonGroupedRowsById).forEach(function (rowId) {
        selectedRowIds[rowId] = true;
      });
    } else {
      Object.keys(nonGroupedRowsById).forEach(function (rowId) {
        delete selectedRowIds[rowId];
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: selectedRowIds
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected) {
    var id = action.id,
        _setSelected = action.value;
    var _rowsById = instance.rowsById,
        _instance$selectSubRo = instance.selectSubRows,
        selectSubRows = _instance$selectSubRo === void 0 ? true : _instance$selectSubRo,
        getSubRows = instance.getSubRows;
    var isSelected = state.selectedRowIds[id];
    var shouldExist = typeof _setSelected !== 'undefined' ? _setSelected : !isSelected;

    if (isSelected === shouldExist) {
      return state;
    }

    var newSelectedRowIds = _objectSpread({}, state.selectedRowIds);

    var handleRowById = function handleRowById(id) {
      var row = _rowsById[id];

      if (row) {
        if (!row.isGrouped) {
          if (shouldExist) {
            newSelectedRowIds[id] = true;
          } else {
            delete newSelectedRowIds[id];
          }
        }

        if (selectSubRows && getSubRows(row)) {
          return getSubRows(row).forEach(function (row) {
            return handleRowById(row.id);
          });
        }
      }
    };

    handleRowById(id);
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: newSelectedRowIds
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected) {
    var _setSelected2 = action.value;

    var page = instance.page,
        _rowsById2 = instance.rowsById,
        _instance$selectSubRo2 = instance.selectSubRows,
        _selectSubRows = _instance$selectSubRo2 === void 0 ? true : _instance$selectSubRo2,
        isAllPageRowsSelected = instance.isAllPageRowsSelected,
        _getSubRows = instance.getSubRows;

    var _selectAll = typeof _setSelected2 !== 'undefined' ? _setSelected2 : !isAllPageRowsSelected;

    var _newSelectedRowIds = _objectSpread({}, state.selectedRowIds);

    var _handleRowById = function _handleRowById(id) {
      var row = _rowsById2[id];

      if (!row.isGrouped) {
        if (_selectAll) {
          _newSelectedRowIds[id] = true;
        } else {
          delete _newSelectedRowIds[id];
        }
      }

      if (_selectSubRows && _getSubRows(row)) {
        return _getSubRows(row).forEach(function (row) {
          return _handleRowById(row.id);
        });
      }
    };

    page.forEach(function (row) {
      return _handleRowById(row.id);
    });
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: _newSelectedRowIds
    });
  }

  return state;
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      getHooks = instance.getHooks,
      plugins = instance.plugins,
      rowsById = instance.rowsById,
      _instance$nonGroupedR2 = instance.nonGroupedRowsById,
      nonGroupedRowsById = _instance$nonGroupedR2 === void 0 ? rowsById : _instance$nonGroupedR2,
      _instance$autoResetSe = instance.autoResetSelectedRows,
      autoResetSelectedRows = _instance$autoResetSe === void 0 ? true : _instance$autoResetSe,
      selectedRowIds = instance.state.selectedRowIds,
      _instance$selectSubRo3 = instance.selectSubRows,
      selectSubRows = _instance$selectSubRo3 === void 0 ? true : _instance$selectSubRo3,
      dispatch = instance.dispatch,
      page = instance.page,
      getSubRows = instance.getSubRows;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useFilters', 'useGroupBy', 'useSortBy', 'useExpanded', 'usePagination'], 'useRowSelect');
  var selectedFlatRows = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var selectedFlatRows = [];
    rows.forEach(function (row) {
      var isSelected = selectSubRows ? getRowIsSelected(row, selectedRowIds, getSubRows) : !!selectedRowIds[row.id];
      row.isSelected = !!isSelected;
      row.isSomeSelected = isSelected === null;

      if (isSelected) {
        selectedFlatRows.push(row);
      }
    });
    return selectedFlatRows;
  }, [rows, selectSubRows, selectedRowIds, getSubRows]);
  var isAllRowsSelected = Boolean(Object.keys(nonGroupedRowsById).length && Object.keys(selectedRowIds).length);
  var isAllPageRowsSelected = isAllRowsSelected;

  if (isAllRowsSelected) {
    if (Object.keys(nonGroupedRowsById).some(function (id) {
      return !selectedRowIds[id];
    })) {
      isAllRowsSelected = false;
    }
  }

  if (!isAllRowsSelected) {
    if (page && page.length && page.some(function (_ref5) {
      var id = _ref5.id;
      return !selectedRowIds[id];
    })) {
      isAllPageRowsSelected = false;
    }
  }

  var getAutoResetSelectedRows = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetSelectedRows);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetSelectedRows()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows
      });
    }
  }, [dispatch, data]);
  var toggleAllRowsSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected,
      value: value
    });
  }, [dispatch]);
  var toggleAllPageRowsSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected,
      value: value
    });
  }, [dispatch]);
  var toggleRowSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (id, value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected,
      id: id,
      value: value
    });
  }, [dispatch]);
  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  var getToggleAllRowsSelectedProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleAllRowsSelectedProps, {
    instance: getInstance()
  });
  var getToggleAllPageRowsSelectedProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleAllPageRowsSelectedProps, {
    instance: getInstance()
  });
  Object.assign(instance, {
    selectedFlatRows: selectedFlatRows,
    isAllRowsSelected: isAllRowsSelected,
    isAllPageRowsSelected: isAllPageRowsSelected,
    toggleRowSelected: toggleRowSelected,
    toggleAllRowsSelected: toggleAllRowsSelected,
    getToggleAllRowsSelectedProps: getToggleAllRowsSelectedProps,
    getToggleAllPageRowsSelectedProps: getToggleAllPageRowsSelectedProps,
    toggleAllPageRowsSelected: toggleAllPageRowsSelected
  });
}

function prepareRow(row, _ref6) {
  var instance = _ref6.instance;

  row.toggleRowSelected = function (set) {
    return instance.toggleRowSelected(row.id, set);
  };

  row.getToggleRowSelectedProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(instance.getHooks().getToggleRowSelectedProps, {
    instance: instance,
    row: row
  });
}

function getRowIsSelected(row, selectedRowIds, getSubRows) {
  if (selectedRowIds[row.id]) {
    return true;
  }

  var subRows = getSubRows(row);

  if (subRows && subRows.length) {
    var allChildrenSelected = true;
    var someSelected = false;
    subRows.forEach(function (subRow) {
      // Bail out early if we know both of these
      if (someSelected && !allChildrenSelected) {
        return;
      }

      if (getRowIsSelected(subRow, selectedRowIds, getSubRows)) {
        someSelected = true;
      } else {
        allChildrenSelected = false;
      }
    });
    return allChildrenSelected ? true : someSelected ? null : false;
  }

  return false;
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useRowState.js":
/*!******************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useRowState.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "useRowState": function() { return /* binding */ useRowState; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var defaultInitialRowStateAccessor = function defaultInitialRowStateAccessor(row) {
  return {};
};

var defaultInitialCellStateAccessor = function defaultInitialCellStateAccessor(cell) {
  return {};
}; // Actions


_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setRowState = 'setRowState';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setCellState = 'setCellState';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetRowState = 'resetRowState';
var useRowState = function useRowState(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
};
useRowState.pluginName = 'useRowState';

function reducer(state, action, previousState, instance) {
  var _instance$initialRowS = instance.initialRowStateAccessor,
      initialRowStateAccessor = _instance$initialRowS === void 0 ? defaultInitialRowStateAccessor : _instance$initialRowS,
      _instance$initialCell = instance.initialCellStateAccessor,
      initialCellStateAccessor = _instance$initialCell === void 0 ? defaultInitialCellStateAccessor : _instance$initialCell,
      rowsById = instance.rowsById;

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      rowState: {}
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetRowState) {
    return _objectSpread(_objectSpread({}, state), {}, {
      rowState: instance.initialState.rowState || {}
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setRowState) {
    var rowId = action.rowId,
        value = action.value;
    var oldRowState = typeof state.rowState[rowId] !== 'undefined' ? state.rowState[rowId] : initialRowStateAccessor(rowsById[rowId]);
    return _objectSpread(_objectSpread({}, state), {}, {
      rowState: _objectSpread(_objectSpread({}, state.rowState), {}, _defineProperty({}, rowId, (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(value, oldRowState)))
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setCellState) {
    var _oldRowState$cellStat, _rowsById$_rowId, _rowsById$_rowId$cell;

    var _rowId = action.rowId,
        columnId = action.columnId,
        _value = action.value;

    var _oldRowState = typeof state.rowState[_rowId] !== 'undefined' ? state.rowState[_rowId] : initialRowStateAccessor(rowsById[_rowId]);

    var oldCellState = typeof (_oldRowState === null || _oldRowState === void 0 ? void 0 : (_oldRowState$cellStat = _oldRowState.cellState) === null || _oldRowState$cellStat === void 0 ? void 0 : _oldRowState$cellStat[columnId]) !== 'undefined' ? _oldRowState.cellState[columnId] : initialCellStateAccessor((_rowsById$_rowId = rowsById[_rowId]) === null || _rowsById$_rowId === void 0 ? void 0 : (_rowsById$_rowId$cell = _rowsById$_rowId.cells) === null || _rowsById$_rowId$cell === void 0 ? void 0 : _rowsById$_rowId$cell.find(function (cell) {
      return cell.column.id === columnId;
    }));
    return _objectSpread(_objectSpread({}, state), {}, {
      rowState: _objectSpread(_objectSpread({}, state.rowState), {}, _defineProperty({}, _rowId, _objectSpread(_objectSpread({}, _oldRowState), {}, {
        cellState: _objectSpread(_objectSpread({}, _oldRowState.cellState || {}), {}, _defineProperty({}, columnId, (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(_value, oldCellState)))
      })))
    });
  }
}

function useInstance(instance) {
  var _instance$autoResetRo = instance.autoResetRowState,
      autoResetRowState = _instance$autoResetRo === void 0 ? true : _instance$autoResetRo,
      data = instance.data,
      dispatch = instance.dispatch;
  var setRowState = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (rowId, value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setRowState,
      rowId: rowId,
      value: value
    });
  }, [dispatch]);
  var setCellState = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (rowId, columnId, value) {
    return dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setCellState,
      rowId: rowId,
      columnId: columnId,
      value: value
    });
  }, [dispatch]);
  var getAutoResetRowState = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetRowState);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetRowState()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetRowState
      });
    }
  }, [data]);
  Object.assign(instance, {
    setRowState: setRowState,
    setCellState: setCellState
  });
}

function prepareRow(row, _ref) {
  var instance = _ref.instance;
  var _instance$initialRowS2 = instance.initialRowStateAccessor,
      initialRowStateAccessor = _instance$initialRowS2 === void 0 ? defaultInitialRowStateAccessor : _instance$initialRowS2,
      _instance$initialCell2 = instance.initialCellStateAccessor,
      initialCellStateAccessor = _instance$initialCell2 === void 0 ? defaultInitialCellStateAccessor : _instance$initialCell2,
      rowState = instance.state.rowState;

  if (row) {
    row.state = typeof rowState[row.id] !== 'undefined' ? rowState[row.id] : initialRowStateAccessor(row);

    row.setState = function (updater) {
      return instance.setRowState(row.id, updater);
    };

    row.cells.forEach(function (cell) {
      if (!row.state.cellState) {
        row.state.cellState = {};
      }

      cell.state = typeof row.state.cellState[cell.column.id] !== 'undefined' ? row.state.cellState[cell.column.id] : initialCellStateAccessor(cell);

      cell.setState = function (updater) {
        return instance.setCellState(row.id, cell.column.id, updater);
      };
    });
  }
}

/***/ }),

/***/ "./node_modules/react-table/src/plugin-hooks/useSortBy.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-table/src/plugin-hooks/useSortBy.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultOrderByFn": function() { return /* binding */ defaultOrderByFn; },
/* harmony export */   "useSortBy": function() { return /* binding */ useSortBy; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../publicUtils */ "./node_modules/react-table/src/publicUtils.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./node_modules/react-table/src/utils.js");
/* harmony import */ var _sortTypes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../sortTypes */ "./node_modules/react-table/src/sortTypes.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




 // Actions

_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSortBy = 'resetSortBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setSortBy = 'setSortBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleSortBy = 'toggleSortBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.clearSortBy = 'clearSortBy';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.defaultColumn.sortType = 'alphanumeric';
_publicUtils__WEBPACK_IMPORTED_MODULE_1__.defaultColumn.sortDescFirst = false;
var useSortBy = function useSortBy(hooks) {
  hooks.getSortByToggleProps = [defaultGetSortByToggleProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
};
useSortBy.pluginName = 'useSortBy';

var defaultGetSortByToggleProps = function defaultGetSortByToggleProps(props, _ref) {
  var instance = _ref.instance,
      column = _ref.column;
  var _instance$isMultiSort = instance.isMultiSortEvent,
      isMultiSortEvent = _instance$isMultiSort === void 0 ? function (e) {
    return e.shiftKey;
  } : _instance$isMultiSort;
  return [props, {
    onClick: column.canSort ? function (e) {
      e.persist();
      column.toggleSortBy(undefined, !instance.disableMultiSort && isMultiSortEvent(e));
    } : undefined,
    style: {
      cursor: column.canSort ? 'pointer' : undefined
    },
    title: column.canSort ? 'Toggle SortBy' : undefined
  }];
}; // Reducer


function reducer(state, action, previousState, instance) {
  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      sortBy: []
    }, state);
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSortBy) {
    return _objectSpread(_objectSpread({}, state), {}, {
      sortBy: instance.initialState.sortBy || []
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.clearSortBy) {
    var sortBy = state.sortBy;
    var newSortBy = sortBy.filter(function (d) {
      return d.id !== action.columnId;
    });
    return _objectSpread(_objectSpread({}, state), {}, {
      sortBy: newSortBy
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setSortBy) {
    var _sortBy = action.sortBy;
    return _objectSpread(_objectSpread({}, state), {}, {
      sortBy: _sortBy
    });
  }

  if (action.type === _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleSortBy) {
    var columnId = action.columnId,
        desc = action.desc,
        multi = action.multi;
    var allColumns = instance.allColumns,
        disableMultiSort = instance.disableMultiSort,
        disableSortRemove = instance.disableSortRemove,
        disableMultiRemove = instance.disableMultiRemove,
        _instance$maxMultiSor = instance.maxMultiSortColCount,
        maxMultiSortColCount = _instance$maxMultiSor === void 0 ? Number.MAX_SAFE_INTEGER : _instance$maxMultiSor;
    var _sortBy2 = state.sortBy; // Find the column for this columnId

    var column = allColumns.find(function (d) {
      return d.id === columnId;
    });
    var sortDescFirst = column.sortDescFirst; // Find any existing sortBy for this column

    var existingSortBy = _sortBy2.find(function (d) {
      return d.id === columnId;
    });

    var existingIndex = _sortBy2.findIndex(function (d) {
      return d.id === columnId;
    });

    var hasDescDefined = typeof desc !== 'undefined' && desc !== null;
    var _newSortBy = []; // What should we do with this sort action?

    var sortAction;

    if (!disableMultiSort && multi) {
      if (existingSortBy) {
        sortAction = 'toggle';
      } else {
        sortAction = 'add';
      }
    } else {
      // Normal mode
      if (existingIndex !== _sortBy2.length - 1 || _sortBy2.length !== 1) {
        sortAction = 'replace';
      } else if (existingSortBy) {
        sortAction = 'toggle';
      } else {
        sortAction = 'replace';
      }
    } // Handle toggle states that will remove the sortBy


    if (sortAction === 'toggle' && // Must be toggling
    !disableSortRemove && // If disableSortRemove, disable in general
    !hasDescDefined && ( // Must not be setting desc
    multi ? !disableMultiRemove : true) && ( // If multi, don't allow if disableMultiRemove
    existingSortBy && // Finally, detect if it should indeed be removed
    existingSortBy.desc && !sortDescFirst || !existingSortBy.desc && sortDescFirst)) {
      sortAction = 'remove';
    }

    if (sortAction === 'replace') {
      _newSortBy = [{
        id: columnId,
        desc: hasDescDefined ? desc : sortDescFirst
      }];
    } else if (sortAction === 'add') {
      _newSortBy = [].concat(_toConsumableArray(_sortBy2), [{
        id: columnId,
        desc: hasDescDefined ? desc : sortDescFirst
      }]); // Take latest n columns

      _newSortBy.splice(0, _newSortBy.length - maxMultiSortColCount);
    } else if (sortAction === 'toggle') {
      // This flips (or sets) the
      _newSortBy = _sortBy2.map(function (d) {
        if (d.id === columnId) {
          return _objectSpread(_objectSpread({}, d), {}, {
            desc: hasDescDefined ? desc : !existingSortBy.desc
          });
        }

        return d;
      });
    } else if (sortAction === 'remove') {
      _newSortBy = _sortBy2.filter(function (d) {
        return d.id !== columnId;
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      sortBy: _newSortBy
    });
  }
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      flatRows = instance.flatRows,
      allColumns = instance.allColumns,
      _instance$orderByFn = instance.orderByFn,
      orderByFn = _instance$orderByFn === void 0 ? defaultOrderByFn : _instance$orderByFn,
      userSortTypes = instance.sortTypes,
      manualSortBy = instance.manualSortBy,
      defaultCanSort = instance.defaultCanSort,
      disableSortBy = instance.disableSortBy,
      flatHeaders = instance.flatHeaders,
      sortBy = instance.state.sortBy,
      dispatch = instance.dispatch,
      plugins = instance.plugins,
      getHooks = instance.getHooks,
      _instance$autoResetSo = instance.autoResetSortBy,
      autoResetSortBy = _instance$autoResetSo === void 0 ? true : _instance$autoResetSo;
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useFilters', 'useGlobalFilter', 'useGroupBy', 'usePivotColumns'], 'useSortBy');
  var setSortBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (sortBy) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.setSortBy,
      sortBy: sortBy
    });
  }, [dispatch]); // Updates sorting based on a columnId, desc flag and multi flag

  var toggleSortBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnId, desc, multi) {
    dispatch({
      type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.toggleSortBy,
      columnId: columnId,
      desc: desc,
      multi: multi
    });
  }, [dispatch]); // use reference to avoid memory leak in #1608

  var getInstance = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance); // Add the getSortByToggleProps method to columns and headers

  flatHeaders.forEach(function (column) {
    var accessor = column.accessor,
        defaultColumnCanSort = column.canSort,
        columnDisableSortBy = column.disableSortBy,
        id = column.id;
    var canSort = accessor ? (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(columnDisableSortBy === true ? false : undefined, disableSortBy === true ? false : undefined, true) : (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(defaultCanSort, defaultColumnCanSort, false);
    column.canSort = canSort;

    if (column.canSort) {
      column.toggleSortBy = function (desc, multi) {
        return toggleSortBy(column.id, desc, multi);
      };

      column.clearSortBy = function () {
        dispatch({
          type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.clearSortBy,
          columnId: column.id
        });
      };
    }

    column.getSortByToggleProps = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getSortByToggleProps, {
      instance: getInstance(),
      column: column
    });
    var columnSort = sortBy.find(function (d) {
      return d.id === id;
    });
    column.isSorted = !!columnSort;
    column.sortedIndex = sortBy.findIndex(function (d) {
      return d.id === id;
    });
    column.isSortedDesc = column.isSorted ? columnSort.desc : undefined;
  });

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (manualSortBy || !sortBy.length) {
      return [rows, flatRows];
    }

    var sortedFlatRows = []; // Filter out sortBys that correspond to non existing columns

    var availableSortBy = sortBy.filter(function (sort) {
      return allColumns.find(function (col) {
        return col.id === sort.id;
      });
    });

    var sortData = function sortData(rows) {
      // Use the orderByFn to compose multiple sortBy's together.
      // This will also perform a stable sorting using the row index
      // if needed.
      var sortedData = orderByFn(rows, availableSortBy.map(function (sort) {
        // Support custom sorting methods for each column
        var column = allColumns.find(function (d) {
          return d.id === sort.id;
        });

        if (!column) {
          throw new Error("React-Table: Could not find a column with id: ".concat(sort.id, " while sorting"));
        }

        var sortType = column.sortType; // Look up sortBy functions in this order:
        // column function
        // column string lookup on user sortType
        // column string lookup on built-in sortType
        // default function
        // default string lookup on user sortType
        // default string lookup on built-in sortType

        var sortMethod = (0,_utils__WEBPACK_IMPORTED_MODULE_2__.isFunction)(sortType) || (userSortTypes || {})[sortType] || _sortTypes__WEBPACK_IMPORTED_MODULE_3__[sortType];

        if (!sortMethod) {
          throw new Error("React-Table: Could not find a valid sortType of '".concat(sortType, "' for column '").concat(sort.id, "'."));
        } // Return the correct sortFn.
        // This function should always return in ascending order


        return function (a, b) {
          return sortMethod(a, b, sort.id, sort.desc);
        };
      }), // Map the directions
      availableSortBy.map(function (sort) {
        // Detect and use the sortInverted option
        var column = allColumns.find(function (d) {
          return d.id === sort.id;
        });

        if (column && column.sortInverted) {
          return sort.desc;
        }

        return !sort.desc;
      })); // If there are sub-rows, sort them

      sortedData.forEach(function (row) {
        sortedFlatRows.push(row);

        if (!row.subRows || row.subRows.length === 0) {
          return;
        }

        row.subRows = sortData(row.subRows);
      });
      return sortedData;
    };

    return [sortData(rows), sortedFlatRows];
  }, [manualSortBy, sortBy, rows, flatRows, allColumns, orderByFn, userSortTypes]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 2),
      sortedRows = _React$useMemo2[0],
      sortedFlatRows = _React$useMemo2[1];

  var getAutoResetSortBy = (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetSortBy);
  (0,_publicUtils__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetSortBy()) {
      dispatch({
        type: _publicUtils__WEBPACK_IMPORTED_MODULE_1__.actions.resetSortBy
      });
    }
  }, [manualSortBy ? null : data]);
  Object.assign(instance, {
    preSortedRows: rows,
    preSortedFlatRows: flatRows,
    sortedRows: sortedRows,
    sortedFlatRows: sortedFlatRows,
    rows: sortedRows,
    flatRows: sortedFlatRows,
    setSortBy: setSortBy,
    toggleSortBy: toggleSortBy
  });
}

function defaultOrderByFn(arr, funcs, dirs) {
  return _toConsumableArray(arr).sort(function (rowA, rowB) {
    for (var i = 0; i < funcs.length; i += 1) {
      var sortFn = funcs[i];
      var desc = dirs[i] === false || dirs[i] === 'desc';
      var sortInt = sortFn(rowA, rowB);

      if (sortInt !== 0) {
        return desc ? -sortInt : sortInt;
      }
    }

    return dirs[0] ? rowA.index - rowB.index : rowB.index - rowA.index;
  });
}

/***/ }),

/***/ "./node_modules/react-table/src/publicUtils.js":
/*!*****************************************************!*\
  !*** ./node_modules/react-table/src/publicUtils.js ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "actions": function() { return /* binding */ actions; },
/* harmony export */   "defaultColumn": function() { return /* binding */ defaultColumn; },
/* harmony export */   "defaultRenderer": function() { return /* binding */ defaultRenderer; },
/* harmony export */   "emptyRenderer": function() { return /* binding */ emptyRenderer; },
/* harmony export */   "ensurePluginOrder": function() { return /* binding */ ensurePluginOrder; },
/* harmony export */   "flexRender": function() { return /* binding */ flexRender; },
/* harmony export */   "functionalUpdate": function() { return /* binding */ functionalUpdate; },
/* harmony export */   "loopHooks": function() { return /* binding */ loopHooks; },
/* harmony export */   "makePropGetter": function() { return /* binding */ makePropGetter; },
/* harmony export */   "makeRenderer": function() { return /* binding */ makeRenderer; },
/* harmony export */   "reduceHooks": function() { return /* binding */ reduceHooks; },
/* harmony export */   "safeUseLayoutEffect": function() { return /* binding */ safeUseLayoutEffect; },
/* harmony export */   "useAsyncDebounce": function() { return /* binding */ useAsyncDebounce; },
/* harmony export */   "useGetLatest": function() { return /* binding */ useGetLatest; },
/* harmony export */   "useMountedLayoutEffect": function() { return /* binding */ useMountedLayoutEffect; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _excluded = ["style", "className"];

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return generator._invoke = function (innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; }(innerFn, self, context), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; this._invoke = function (method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (object) { var keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, catch: function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }


var renderErr = 'Renderer Error ☝️';
var actions = {
  init: 'init'
};
var defaultRenderer = function defaultRenderer(_ref) {
  var _ref$value = _ref.value,
      value = _ref$value === void 0 ? '' : _ref$value;
  return value;
};
var emptyRenderer = function emptyRenderer() {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, "\xA0");
};
var defaultColumn = {
  Cell: defaultRenderer,
  width: 150,
  minWidth: 0,
  maxWidth: Number.MAX_SAFE_INTEGER
};

function mergeProps() {
  for (var _len = arguments.length, propList = new Array(_len), _key = 0; _key < _len; _key++) {
    propList[_key] = arguments[_key];
  }

  return propList.reduce(function (props, next) {
    var style = next.style,
        className = next.className,
        rest = _objectWithoutProperties(next, _excluded);

    props = _objectSpread(_objectSpread({}, props), rest);

    if (style) {
      props.style = props.style ? _objectSpread(_objectSpread({}, props.style || {}), style || {}) : style;
    }

    if (className) {
      props.className = props.className ? props.className + ' ' + className : className;
    }

    if (props.className === '') {
      delete props.className;
    }

    return props;
  }, {});
}

function handlePropGetter(prevProps, userProps, meta) {
  // Handle a lambda, pass it the previous props
  if (typeof userProps === 'function') {
    return handlePropGetter({}, userProps(prevProps, meta));
  } // Handle an array, merge each item as separate props


  if (Array.isArray(userProps)) {
    return mergeProps.apply(void 0, [prevProps].concat(_toConsumableArray(userProps)));
  } // Handle an object by default, merge the two objects


  return mergeProps(prevProps, userProps);
}

var makePropGetter = function makePropGetter(hooks) {
  var meta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function () {
    var userProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return [].concat(_toConsumableArray(hooks), [userProps]).reduce(function (prev, next) {
      return handlePropGetter(prev, next, _objectSpread(_objectSpread({}, meta), {}, {
        userProps: userProps
      }));
    }, {});
  };
};
var reduceHooks = function reduceHooks(hooks, initial) {
  var meta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var allowUndefined = arguments.length > 3 ? arguments[3] : undefined;
  return hooks.reduce(function (prev, next) {
    var nextValue = next(prev, meta);

    if (true) {
      if (!allowUndefined && typeof nextValue === 'undefined') {
        console.info(next);
        throw new Error('React Table: A reducer hook ☝️ just returned undefined! This is not allowed.');
      }
    }

    return nextValue;
  }, initial);
};
var loopHooks = function loopHooks(hooks, context) {
  var meta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return hooks.forEach(function (hook) {
    var nextValue = hook(context, meta);

    if (true) {
      if (typeof nextValue !== 'undefined') {
        console.info(hook, nextValue);
        throw new Error('React Table: A loop-type hook ☝️ just returned a value! This is not allowed.');
      }
    }
  });
};
function ensurePluginOrder(plugins, befores, pluginName, afters) {
  if ( true && afters) {
    throw new Error("Defining plugins in the \"after\" section of ensurePluginOrder is no longer supported (see plugin ".concat(pluginName, ")"));
  }

  var pluginIndex = plugins.findIndex(function (plugin) {
    return plugin.pluginName === pluginName;
  });

  if (pluginIndex === -1) {
    if (true) {
      throw new Error("The plugin \"".concat(pluginName, "\" was not found in the plugin list!\nThis usually means you need to need to name your plugin hook by setting the 'pluginName' property of the hook function, eg:\n\n  ").concat(pluginName, ".pluginName = '").concat(pluginName, "'\n"));
    }
  }

  befores.forEach(function (before) {
    var beforeIndex = plugins.findIndex(function (plugin) {
      return plugin.pluginName === before;
    });

    if (beforeIndex > -1 && beforeIndex > pluginIndex) {
      if (true) {
        throw new Error("React Table: The ".concat(pluginName, " plugin hook must be placed after the ").concat(before, " plugin hook!"));
      }
    }
  });
}
function functionalUpdate(updater, old) {
  return typeof updater === 'function' ? updater(old) : updater;
}
function useGetLatest(obj) {
  var ref = react__WEBPACK_IMPORTED_MODULE_0___default().useRef();
  ref.current = obj;
  return react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return ref.current;
  }, []);
} // SSR has issues with useLayoutEffect still, so use useEffect during SSR

var safeUseLayoutEffect = typeof document !== 'undefined' ? (react__WEBPACK_IMPORTED_MODULE_0___default().useLayoutEffect) : (react__WEBPACK_IMPORTED_MODULE_0___default().useEffect);
function useMountedLayoutEffect(fn, deps) {
  var mountedRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(false);
  safeUseLayoutEffect(function () {
    if (mountedRef.current) {
      fn();
    }

    mountedRef.current = true; // eslint-disable-next-line
  }, deps);
}
function useAsyncDebounce(defaultFn) {
  var defaultWait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var debounceRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef({});
  var getDefaultFn = useGetLatest(defaultFn);
  var getDefaultWait = useGetLatest(defaultWait);
  return react__WEBPACK_IMPORTED_MODULE_0___default().useCallback( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var _len2,
        args,
        _key2,
        _args2 = arguments;

    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            for (_len2 = _args2.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = _args2[_key2];
            }

            if (!debounceRef.current.promise) {
              debounceRef.current.promise = new Promise(function (resolve, reject) {
                debounceRef.current.resolve = resolve;
                debounceRef.current.reject = reject;
              });
            }

            if (debounceRef.current.timeout) {
              clearTimeout(debounceRef.current.timeout);
            }

            debounceRef.current.timeout = setTimeout( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      delete debounceRef.current.timeout;
                      _context.prev = 1;
                      _context.t0 = debounceRef.current;
                      _context.next = 5;
                      return getDefaultFn().apply(void 0, args);

                    case 5:
                      _context.t1 = _context.sent;

                      _context.t0.resolve.call(_context.t0, _context.t1);

                      _context.next = 12;
                      break;

                    case 9:
                      _context.prev = 9;
                      _context.t2 = _context["catch"](1);
                      debounceRef.current.reject(_context.t2);

                    case 12:
                      _context.prev = 12;
                      delete debounceRef.current.promise;
                      return _context.finish(12);

                    case 15:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[1, 9, 12, 15]]);
            })), getDefaultWait());
            return _context2.abrupt("return", debounceRef.current.promise);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  })), [getDefaultFn, getDefaultWait]);
}
function makeRenderer(instance, column) {
  var meta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return function (type) {
    var userProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var Comp = typeof type === 'string' ? column[type] : type;

    if (typeof Comp === 'undefined') {
      console.info(column);
      throw new Error(renderErr);
    }

    return flexRender(Comp, _objectSpread(_objectSpread(_objectSpread({}, instance), {}, {
      column: column
    }, meta), userProps));
  };
}
function flexRender(Comp, props) {
  return isReactComponent(Comp) ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Comp, props) : Comp;
}

function isReactComponent(component) {
  return isClassComponent(component) || typeof component === 'function' || isExoticComponent(component);
}

function isClassComponent(component) {
  return typeof component === 'function' && function () {
    var proto = Object.getPrototypeOf(component);
    return proto.prototype && proto.prototype.isReactComponent;
  }();
}

function isExoticComponent(component) {
  return _typeof(component) === 'object' && _typeof(component.$$typeof) === 'symbol' && ['react.memo', 'react.forward_ref'].includes(component.$$typeof.description);
}

/***/ }),

/***/ "./node_modules/react-table/src/sortTypes.js":
/*!***************************************************!*\
  !*** ./node_modules/react-table/src/sortTypes.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "alphanumeric": function() { return /* binding */ alphanumeric; },
/* harmony export */   "basic": function() { return /* binding */ basic; },
/* harmony export */   "datetime": function() { return /* binding */ datetime; },
/* harmony export */   "number": function() { return /* binding */ number; },
/* harmony export */   "string": function() { return /* binding */ string; }
/* harmony export */ });
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var reSplitAlphaNumeric = /([0-9]+)/gm; // Mixed sorting is slow, but very inclusive of many edge cases.
// It handles numbers, mixed alphanumeric combinations, and even
// null, undefined, and Infinity

var alphanumeric = function alphanumeric(rowA, rowB, columnId) {
  var _getRowValuesByColumn = getRowValuesByColumnID(rowA, rowB, columnId),
      _getRowValuesByColumn2 = _slicedToArray(_getRowValuesByColumn, 2),
      a = _getRowValuesByColumn2[0],
      b = _getRowValuesByColumn2[1]; // Force to strings (or "" for unsupported types)


  a = toString(a);
  b = toString(b); // Split on number groups, but keep the delimiter
  // Then remove falsey split values

  a = a.split(reSplitAlphaNumeric).filter(Boolean);
  b = b.split(reSplitAlphaNumeric).filter(Boolean); // While

  while (a.length && b.length) {
    var aa = a.shift();
    var bb = b.shift();
    var an = parseInt(aa, 10);
    var bn = parseInt(bb, 10);
    var combo = [an, bn].sort(); // Both are string

    if (isNaN(combo[0])) {
      if (aa > bb) {
        return 1;
      }

      if (bb > aa) {
        return -1;
      }

      continue;
    } // One is a string, one is a number


    if (isNaN(combo[1])) {
      return isNaN(an) ? -1 : 1;
    } // Both are numbers


    if (an > bn) {
      return 1;
    }

    if (bn > an) {
      return -1;
    }
  }

  return a.length - b.length;
};
function datetime(rowA, rowB, columnId) {
  var _getRowValuesByColumn3 = getRowValuesByColumnID(rowA, rowB, columnId),
      _getRowValuesByColumn4 = _slicedToArray(_getRowValuesByColumn3, 2),
      a = _getRowValuesByColumn4[0],
      b = _getRowValuesByColumn4[1];

  a = a.getTime();
  b = b.getTime();
  return compareBasic(a, b);
}
function basic(rowA, rowB, columnId) {
  var _getRowValuesByColumn5 = getRowValuesByColumnID(rowA, rowB, columnId),
      _getRowValuesByColumn6 = _slicedToArray(_getRowValuesByColumn5, 2),
      a = _getRowValuesByColumn6[0],
      b = _getRowValuesByColumn6[1];

  return compareBasic(a, b);
}
function string(rowA, rowB, columnId) {
  var _getRowValuesByColumn7 = getRowValuesByColumnID(rowA, rowB, columnId),
      _getRowValuesByColumn8 = _slicedToArray(_getRowValuesByColumn7, 2),
      a = _getRowValuesByColumn8[0],
      b = _getRowValuesByColumn8[1];

  a = a.split('').filter(Boolean);
  b = b.split('').filter(Boolean);

  while (a.length && b.length) {
    var aa = a.shift();
    var bb = b.shift();
    var alower = aa.toLowerCase();
    var blower = bb.toLowerCase(); // Case insensitive comparison until characters match

    if (alower > blower) {
      return 1;
    }

    if (blower > alower) {
      return -1;
    } // If lowercase characters are identical


    if (aa > bb) {
      return 1;
    }

    if (bb > aa) {
      return -1;
    }

    continue;
  }

  return a.length - b.length;
}
function number(rowA, rowB, columnId) {
  var _getRowValuesByColumn9 = getRowValuesByColumnID(rowA, rowB, columnId),
      _getRowValuesByColumn10 = _slicedToArray(_getRowValuesByColumn9, 2),
      a = _getRowValuesByColumn10[0],
      b = _getRowValuesByColumn10[1];

  var replaceNonNumeric = /[^0-9.]/gi;
  a = Number(String(a).replace(replaceNonNumeric, ''));
  b = Number(String(b).replace(replaceNonNumeric, ''));
  return compareBasic(a, b);
} // Utils

function compareBasic(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

function getRowValuesByColumnID(row1, row2, columnId) {
  return [row1.values[columnId], row2.values[columnId]];
}

function toString(a) {
  if (typeof a === 'number') {
    if (isNaN(a) || a === Infinity || a === -Infinity) {
      return '';
    }

    return String(a);
  }

  if (typeof a === 'string') {
    return a;
  }

  return '';
}

/***/ }),

/***/ "./node_modules/react-table/src/utils.js":
/*!***********************************************!*\
  !*** ./node_modules/react-table/src/utils.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "assignColumnAccessor": function() { return /* binding */ assignColumnAccessor; },
/* harmony export */   "decorateColumn": function() { return /* binding */ decorateColumn; },
/* harmony export */   "expandRows": function() { return /* binding */ expandRows; },
/* harmony export */   "findMaxDepth": function() { return /* binding */ findMaxDepth; },
/* harmony export */   "flattenBy": function() { return /* binding */ flattenBy; },
/* harmony export */   "flattenColumns": function() { return /* binding */ flattenColumns; },
/* harmony export */   "getBy": function() { return /* binding */ getBy; },
/* harmony export */   "getElementDimensions": function() { return /* binding */ getElementDimensions; },
/* harmony export */   "getFilterMethod": function() { return /* binding */ getFilterMethod; },
/* harmony export */   "getFirstDefined": function() { return /* binding */ getFirstDefined; },
/* harmony export */   "isFunction": function() { return /* binding */ isFunction; },
/* harmony export */   "linkColumnStructure": function() { return /* binding */ linkColumnStructure; },
/* harmony export */   "makeHeaderGroups": function() { return /* binding */ makeHeaderGroups; },
/* harmony export */   "passiveEventSupported": function() { return /* binding */ passiveEventSupported; },
/* harmony export */   "shouldAutoRemoveFilter": function() { return /* binding */ shouldAutoRemoveFilter; },
/* harmony export */   "unpreparedAccessWarning": function() { return /* binding */ unpreparedAccessWarning; }
/* harmony export */ });
/* harmony import */ var _publicUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./publicUtils */ "./node_modules/react-table/src/publicUtils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

 // Find the depth of the columns

function findMaxDepth(columns) {
  var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return columns.reduce(function (prev, curr) {
    if (curr.columns) {
      return Math.max(prev, findMaxDepth(curr.columns, depth + 1));
    }

    return depth;
  }, 0);
} // Build the visible columns, headers and flat column list

function linkColumnStructure(columns, parent) {
  var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  return columns.map(function (column) {
    column = _objectSpread(_objectSpread({}, column), {}, {
      parent: parent,
      depth: depth
    });
    assignColumnAccessor(column);

    if (column.columns) {
      column.columns = linkColumnStructure(column.columns, column, depth + 1);
    }

    return column;
  });
}
function flattenColumns(columns) {
  return flattenBy(columns, 'columns');
}
function assignColumnAccessor(column) {
  // First check for string accessor
  var id = column.id,
      accessor = column.accessor,
      Header = column.Header;

  if (typeof accessor === 'string') {
    id = id || accessor;
    var accessorPath = accessor.split('.');

    accessor = function accessor(row) {
      return getBy(row, accessorPath);
    };
  }

  if (!id && typeof Header === 'string' && Header) {
    id = Header;
  }

  if (!id && column.columns) {
    console.error(column);
    throw new Error('A column ID (or unique "Header" value) is required!');
  }

  if (!id) {
    console.error(column);
    throw new Error('A column ID (or string accessor) is required!');
  }

  Object.assign(column, {
    id: id,
    accessor: accessor
  });
  return column;
}
function decorateColumn(column, userDefaultColumn) {
  if (!userDefaultColumn) {
    throw new Error();
  }

  Object.assign(column, _objectSpread(_objectSpread(_objectSpread({
    // Make sure there is a fallback header, just in case
    Header: _publicUtils__WEBPACK_IMPORTED_MODULE_0__.emptyRenderer,
    Footer: _publicUtils__WEBPACK_IMPORTED_MODULE_0__.emptyRenderer
  }, _publicUtils__WEBPACK_IMPORTED_MODULE_0__.defaultColumn), userDefaultColumn), column));
  Object.assign(column, {
    originalWidth: column.width
  });
  return column;
} // Build the header groups from the bottom up

function makeHeaderGroups(allColumns, defaultColumn) {
  var additionalHeaderProperties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {
    return {};
  };
  var headerGroups = [];
  var scanColumns = allColumns;
  var uid = 0;

  var getUID = function getUID() {
    return uid++;
  };

  var _loop = function _loop() {
    // The header group we are creating
    var headerGroup = {
      headers: []
    }; // The parent columns we're going to scan next

    var parentColumns = [];
    var hasParents = scanColumns.some(function (d) {
      return d.parent;
    }); // Scan each column for parents

    scanColumns.forEach(function (column) {
      // What is the latest (last) parent column?
      var latestParentColumn = [].concat(parentColumns).reverse()[0];
      var newParent;

      if (hasParents) {
        // If the column has a parent, add it if necessary
        if (column.parent) {
          newParent = _objectSpread(_objectSpread({}, column.parent), {}, {
            originalId: column.parent.id,
            id: "".concat(column.parent.id, "_").concat(getUID()),
            headers: [column]
          }, additionalHeaderProperties(column));
        } else {
          // If other columns have parents, we'll need to add a place holder if necessary
          var originalId = "".concat(column.id, "_placeholder");
          newParent = decorateColumn(_objectSpread({
            originalId: originalId,
            id: "".concat(column.id, "_placeholder_").concat(getUID()),
            placeholderOf: column,
            headers: [column]
          }, additionalHeaderProperties(column)), defaultColumn);
        } // If the resulting parent columns are the same, just add
        // the column and increment the header span


        if (latestParentColumn && latestParentColumn.originalId === newParent.originalId) {
          latestParentColumn.headers.push(column);
        } else {
          parentColumns.push(newParent);
        }
      }

      headerGroup.headers.push(column);
    });
    headerGroups.push(headerGroup); // Start scanning the parent columns

    scanColumns = parentColumns;
  };

  while (scanColumns.length) {
    _loop();
  }

  return headerGroups.reverse();
}
var pathObjCache = new Map();
function getBy(obj, path, def) {
  if (!path) {
    return obj;
  }

  var cacheKey = typeof path === 'function' ? path : JSON.stringify(path);

  var pathObj = pathObjCache.get(cacheKey) || function () {
    var pathObj = makePathArray(path);
    pathObjCache.set(cacheKey, pathObj);
    return pathObj;
  }();

  var val;

  try {
    val = pathObj.reduce(function (cursor, pathPart) {
      return cursor[pathPart];
    }, obj);
  } catch (e) {// continue regardless of error
  }

  return typeof val !== 'undefined' ? val : def;
}
function getFirstDefined() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  for (var i = 0; i < args.length; i += 1) {
    if (typeof args[i] !== 'undefined') {
      return args[i];
    }
  }
}
function getElementDimensions(element) {
  var rect = element.getBoundingClientRect();
  var style = window.getComputedStyle(element);
  var margins = {
    left: parseInt(style.marginLeft),
    right: parseInt(style.marginRight)
  };
  var padding = {
    left: parseInt(style.paddingLeft),
    right: parseInt(style.paddingRight)
  };
  return {
    left: Math.ceil(rect.left),
    width: Math.ceil(rect.width),
    outerWidth: Math.ceil(rect.width + margins.left + margins.right + padding.left + padding.right),
    marginLeft: margins.left,
    marginRight: margins.right,
    paddingLeft: padding.left,
    paddingRight: padding.right,
    scrollWidth: element.scrollWidth
  };
}
function isFunction(a) {
  if (typeof a === 'function') {
    return a;
  }
}
function flattenBy(arr, key) {
  var flat = [];

  var recurse = function recurse(arr) {
    arr.forEach(function (d) {
      if (!d[key]) {
        flat.push(d);
      } else {
        recurse(d[key]);
      }
    });
  };

  recurse(arr);
  return flat;
}
function expandRows(rows, _ref) {
  var manualExpandedKey = _ref.manualExpandedKey,
      expanded = _ref.expanded,
      _ref$expandSubRows = _ref.expandSubRows,
      expandSubRows = _ref$expandSubRows === void 0 ? true : _ref$expandSubRows;
  var expandedRows = [];

  var handleRow = function handleRow(row) {
    var addToExpandedRows = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    row.isExpanded = row.original && row.original[manualExpandedKey] || expanded[row.id];
    row.canExpand = row.subRows && !!row.subRows.length;

    if (addToExpandedRows) {
      expandedRows.push(row);
    }

    if (row.subRows && row.subRows.length && row.isExpanded) {
      row.subRows.forEach(function (row) {
        return handleRow(row, expandSubRows);
      });
    }
  };

  rows.forEach(function (row) {
    return handleRow(row);
  });
  return expandedRows;
}
function getFilterMethod(filter, userFilterTypes, filterTypes) {
  return isFunction(filter) || userFilterTypes[filter] || filterTypes[filter] || filterTypes.text;
}
function shouldAutoRemoveFilter(autoRemove, value, column) {
  return autoRemove ? autoRemove(value, column) : typeof value === 'undefined';
}
function unpreparedAccessWarning() {
  throw new Error('React-Table: You have not called prepareRow(row) one or more rows you are attempting to render.');
}
var passiveSupported = null;
function passiveEventSupported() {
  // memoize support to avoid adding multiple test events
  if (typeof passiveSupported === 'boolean') return passiveSupported;
  var supported = false;

  try {
    var options = {
      get passive() {
        supported = true;
        return false;
      }

    };
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    supported = false;
  }

  passiveSupported = supported;
  return passiveSupported;
} //

var reOpenBracket = /\[/g;
var reCloseBracket = /\]/g;

function makePathArray(obj) {
  return flattenDeep(obj) // remove all periods in parts
  .map(function (d) {
    return String(d).replace('.', '_');
  }) // join parts using period
  .join('.') // replace brackets with periods
  .replace(reOpenBracket, '.').replace(reCloseBracket, '') // split it back out on periods
  .split('.');
}

function flattenDeep(arr) {
  var newArr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (!Array.isArray(arr)) {
    newArr.push(arr);
  } else {
    for (var i = 0; i < arr.length; i += 1) {
      flattenDeep(arr[i], newArr);
    }
  }

  return newArr;
}

/***/ }),

/***/ "./srcjs/Pagination.js":
/*!*****************************!*\
  !*** ./srcjs/Pagination.js ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Pagination; },
/* harmony export */   "getVisiblePages": function() { return /* binding */ getVisiblePages; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _theme__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./theme */ "./srcjs/theme.js");
/* harmony import */ var _language__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./language */ "./srcjs/language.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _excluded = ["isCurrent", "className"];

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }







var PageButton = function PageButton(_ref) {
  var isCurrent = _ref.isCurrent,
      className = _ref.className,
      props = _objectWithoutProperties(_ref, _excluded);

  className = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.classNames)(className, 'rt-page-button', isCurrent ? ' rt-page-button-current' : null);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", _extends({
    type: "button",
    className: className
  }, props), props.children);
};

PageButton.propTypes = {
  isCurrent: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().bool),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
  children: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().node)
}; // Get visible pages from current page (1-based) and total page count

function getVisiblePages(page, totalPages) {
  // 6 pages or less
  if (totalPages <= 6) {
    return _toConsumableArray(Array(totalPages)).map(function (_, i) {
      return i + 1;
    });
  }

  if (page <= 4) {
    // First 4 pages: 1 2 3 *4* 5 ... 7
    return [1, 2, 3, 4, 5, totalPages];
  } else if (totalPages - page < 3) {
    // Last 3 pages: 1 ... 4 *5* 6 7
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  } else {
    // Middle 3 pages: 1 ... 4 *5* 6 ... 8
    return [1, page - 1, page, page + 1, totalPages];
  }
}

var Pagination = /*#__PURE__*/function (_React$Component) {
  _inherits(Pagination, _React$Component);

  var _super = _createSuper(Pagination);

  function Pagination(props) {
    var _this;

    _classCallCheck(this, Pagination);

    _this = _super.call(this, props);
    _this.changePage = _this.changePage.bind(_assertThisInitialized(_this));
    _this.applyPage = _this.applyPage.bind(_assertThisInitialized(_this));
    _this.state = {
      pageJumpValue: props.page + 1,
      prevPage: props.page
    };
    return _this;
  }

  _createClass(Pagination, [{
    key: "changePage",
    value: function changePage(newPage) {
      var currentPage = this.props.page + 1;

      if (newPage === currentPage) {
        return;
      }

      this.props.onPageChange(newPage - 1);
    }
  }, {
    key: "applyPage",
    value: function applyPage(e) {
      if (e) {
        e.preventDefault();
      }

      var newPage = this.state.pageJumpValue;

      if (newPage !== '') {
        this.changePage(newPage);
      } else {
        // Reset page jump if new value is blank or invalid. (Some browsers
        // allow non-numeric characters with input type="number").
        var currentPage = this.props.page + 1;
        this.setState({
          pageJumpValue: currentPage
        });
      }
    }
  }, {
    key: "renderPageInfo",
    value: function renderPageInfo(_ref2) {
      var page = _ref2.page,
          pageSize = _ref2.pageSize,
          pageRowCount = _ref2.pageRowCount,
          rowCount = _ref2.rowCount,
          language = _ref2.language;
      var rowStart = Math.min(page * pageSize + 1, rowCount); // When pagination is disabled, pageSize is unused and the number of rows
      // on the page can exceed the page size.

      var rowEnd = Math.max(Math.min(page * pageSize + pageSize, rowCount), pageRowCount);
      var pageInfo = (0,_language__WEBPACK_IMPORTED_MODULE_2__.renderTemplate)(language.pageInfo, {
        rowStart: rowStart,
        rowEnd: rowEnd,
        rows: rowCount
      });
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "rt-page-info",
        "aria-live": "polite"
      }, pageInfo);
    }
  }, {
    key: "renderPageSizeOptions",
    value: function renderPageSizeOptions(_ref3) {
      var pageSize = _ref3.pageSize,
          pageSizeOptions = _ref3.pageSizeOptions,
          onPageSizeChange = _ref3.onPageSizeChange,
          language = _ref3.language;
      var selector = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
        key: "page-size-select",
        className: "rt-page-size-select",
        "aria-label": language.pageSizeOptionsLabel,
        onChange: function onChange(e) {
          return onPageSizeChange(Number(e.target.value));
        },
        value: pageSize
      }, pageSizeOptions.map(function (option, i) {
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
          key: i,
          value: option
        }, option);
      }));
      var elements = (0,_language__WEBPACK_IMPORTED_MODULE_2__.renderTemplate)(language.pageSizeOptions, {
        rows: selector
      });
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "rt-page-size"
      }, elements);
    }
  }, {
    key: "renderPageJump",
    value: function renderPageJump(_ref4) {
      var onChange = _ref4.onChange,
          value = _ref4.value,
          onBlur = _ref4.onBlur,
          onKeyPress = _ref4.onKeyPress,
          inputType = _ref4.inputType,
          language = _ref4.language;
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
        key: "page-jump",
        className: "rt-page-jump",
        "aria-label": language.pageJumpLabel,
        type: inputType,
        onChange: onChange,
        value: value,
        onBlur: onBlur,
        onKeyPress: onKeyPress
      });
    }
  }, {
    key: "getPageJumpProperties",
    value: function getPageJumpProperties() {
      var _this2 = this;

      return {
        onKeyPress: function onKeyPress(e) {
          if (e.which === 13 || e.keyCode === 13) {
            _this2.applyPage();
          }
        },
        onBlur: this.applyPage,
        value: this.state.pageJumpValue,
        onChange: function onChange(e) {
          var value = e.target.value;

          if (value === '') {
            _this2.setState({
              pageJumpValue: value
            });

            return;
          }

          var newPage = Number(value);

          if (!Number.isNaN(newPage)) {
            var nearestValidPage = Math.min(Math.max(newPage, 1), Math.max(_this2.props.pages, 1));

            _this2.setState({
              pageJumpValue: nearestValidPage
            });
          }
        },
        inputType: 'number',
        language: this.props.language
      };
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var _this$props = this.props,
          paginationType = _this$props.paginationType,
          showPageSizeOptions = _this$props.showPageSizeOptions,
          showPageInfo = _this$props.showPageInfo,
          page = _this$props.page,
          pages = _this$props.pages,
          canPrevious = _this$props.canPrevious,
          canNext = _this$props.canNext,
          theme = _this$props.theme,
          language = _this$props.language;
      var pageInfo = showPageInfo ? this.renderPageInfo(this.props) : null;
      var pageSizeOptions = showPageSizeOptions ? this.renderPageSizeOptions(this.props) : null;
      var currentPage = page + 1;
      var visiblePages = getVisiblePages(currentPage, pages);
      var pageNumbers;

      if (paginationType === 'numbers') {
        var pageButtons = [];
        visiblePages.forEach(function (page, index) {
          var isCurrent = currentPage === page;
          var pageButton = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PageButton, {
            key: page,
            isCurrent: isCurrent,
            onClick: _this3.changePage.bind(null, page) // Change aria-label to work around issue with aria-current changes
            // not being recognized in NVDA + Chrome. https://github.com/nvaccess/nvda/issues/10728
            ,
            "aria-label": (0,_language__WEBPACK_IMPORTED_MODULE_2__.renderTemplate)(language.pageNumberLabel, {
              page: page
            }) + (isCurrent ? ' ' : ''),
            "aria-current": isCurrent ? 'page' : null
          }, page);

          if (page - visiblePages[index - 1] > 1) {
            pageButtons.push( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
              className: "rt-page-ellipsis",
              key: "ellipsis-".concat(page),
              role: "separator"
            }, "..."));
          }

          pageButtons.push(pageButton);
        });
        pageNumbers = pageButtons;
      } else {
        var _page = paginationType === 'jump' ? this.renderPageJump(this.getPageJumpProperties()) : currentPage;

        var totalPages = Math.max(pages, 1);
        pageNumbers = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
          className: "rt-page-numbers"
        }, (0,_language__WEBPACK_IMPORTED_MODULE_2__.renderTemplate)(language.pageNumbers, {
          page: _page,
          pages: totalPages
        }));
      }

      var prevButton = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PageButton, {
        className: "rt-prev-button",
        onClick: function onClick() {
          if (!canPrevious) return;

          _this3.changePage(currentPage - 1);
        },
        disabled: !canPrevious,
        "aria-disabled": !canPrevious ? 'true' : null,
        "aria-label": language.pagePreviousLabel
      }, language.pagePrevious);
      var nextButton = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PageButton, {
        className: "rt-next-button",
        onClick: function onClick() {
          if (!canNext) return;

          _this3.changePage(currentPage + 1);
        },
        disabled: !canNext,
        "aria-disabled": !canNext ? 'true' : null,
        "aria-label": language.pageNextLabel
      }, language.pageNext);
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: (0,_utils__WEBPACK_IMPORTED_MODULE_3__.classNames)('rt-pagination', (0,_theme__WEBPACK_IMPORTED_MODULE_1__.css)(theme.paginationStyle))
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "rt-pagination-info"
      }, pageInfo, pageSizeOptions), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "rt-pagination-nav"
      }, prevButton, pageNumbers, nextButton));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, state) {
      // Update page jump value if page changes (e.g. from page size change).
      // Track previous page so we only update on prop changes.
      if (props.page !== state.prevPage) {
        return {
          pageJumpValue: props.page + 1,
          prevPage: props.page
        };
      }

      return null;
    }
  }]);

  return Pagination;
}((react__WEBPACK_IMPORTED_MODULE_0___default().Component));


Pagination.propTypes = {
  paginationType: prop_types__WEBPACK_IMPORTED_MODULE_4___default().oneOf(['numbers', 'jump', 'simple']),
  pageSizeOptions: prop_types__WEBPACK_IMPORTED_MODULE_4___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_4___default().number)),
  showPageSizeOptions: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().bool),
  showPageInfo: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().bool),
  page: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().number.isRequired),
  pages: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().number.isRequired),
  pageSize: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().number.isRequired),
  pageRowCount: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().number.isRequired),
  canPrevious: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().bool.isRequired),
  canNext: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().bool.isRequired),
  onPageChange: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().func.isRequired),
  onPageSizeChange: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().func.isRequired),
  rowCount: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().number.isRequired),
  theme: prop_types__WEBPACK_IMPORTED_MODULE_4___default().shape({
    paginationStyle: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().object)
  }),
  language: prop_types__WEBPACK_IMPORTED_MODULE_4___default().shape({
    pageNext: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pagePrevious: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageNumbers: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageInfo: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageSizeOptions: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageNextLabel: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pagePreviousLabel: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageNumberLabel: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageJumpLabel: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
    pageSizeOptionsLabel: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string)
  })
};
Pagination.defaultProps = {
  paginationType: 'numbers',
  pageSizeOptions: [10, 25, 50, 100],
  showPageInfo: true,
  language: _language__WEBPACK_IMPORTED_MODULE_2__.defaultLanguage
};

/***/ }),

/***/ "./srcjs/Reactable.js":
/*!****************************!*\
  !*** ./srcjs/Reactable.js ***!
  \****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Reactable; },
/* harmony export */   "downloadDataCSV": function() { return /* binding */ downloadDataCSV; },
/* harmony export */   "getInstance": function() { return /* binding */ getInstance; },
/* harmony export */   "getState": function() { return /* binding */ getState; },
/* harmony export */   "onStateChange": function() { return /* binding */ onStateChange; },
/* harmony export */   "setAllFilters": function() { return /* binding */ setAllFilters; },
/* harmony export */   "setData": function() { return /* binding */ setData; },
/* harmony export */   "setFilter": function() { return /* binding */ setFilter; },
/* harmony export */   "setGroupBy": function() { return /* binding */ setGroupBy; },
/* harmony export */   "setMeta": function() { return /* binding */ setMeta; },
/* harmony export */   "setSearch": function() { return /* binding */ setSearch; },
/* harmony export */   "toggleAllRowsExpanded": function() { return /* binding */ toggleAllRowsExpanded; },
/* harmony export */   "toggleGroupBy": function() { return /* binding */ toggleGroupBy; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_18__);
/* harmony import */ var reactR__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! reactR */ "reactR");
/* harmony import */ var reactR__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(reactR__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Pagination__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Pagination */ "./srcjs/Pagination.js");
/* harmony import */ var _WidgetContainer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./WidgetContainer */ "./srcjs/WidgetContainer.js");
/* harmony import */ var _useFlexLayout__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./useFlexLayout */ "./srcjs/useFlexLayout.js");
/* harmony import */ var _useStickyColumns__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./useStickyColumns */ "./srcjs/useStickyColumns.js");
/* harmony import */ var _useGroupBy__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./useGroupBy */ "./srcjs/useGroupBy.js");
/* harmony import */ var _useResizeColumns__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./useResizeColumns */ "./srcjs/useResizeColumns.js");
/* harmony import */ var _useRowSelect__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./useRowSelect */ "./srcjs/useRowSelect.js");
/* harmony import */ var _usePagination__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./usePagination */ "./srcjs/usePagination.js");
/* harmony import */ var _useMeta__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./useMeta */ "./srcjs/useMeta.js");
/* harmony import */ var _columns__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./columns */ "./srcjs/columns.js");
/* harmony import */ var _language__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./language */ "./srcjs/language.js");
/* harmony import */ var _theme__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./theme */ "./srcjs/theme.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
/* harmony import */ var _react_table_css__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./react-table.css */ "./srcjs/react-table.css");
/* harmony import */ var _reactable_css__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./reactable.css */ "./srcjs/reactable.css");
var _excluded = ["data", "columns", "columnGroups", "sortable", "defaultSortDesc", "showSortIcon", "showSortable", "filterable", "resizable", "theme", "language", "dataKey"],
    _excluded2 = ["className"],
    _excluded3 = ["className"],
    _excluded4 = ["className"],
    _excluded5 = ["className"],
    _excluded6 = ["className"],
    _excluded7 = ["className"],
    _excluded8 = ["className"],
    _excluded9 = ["canSort", "sortDescFirst", "isSorted", "isSortedDesc", "toggleSortBy", "canResize", "isResizing", "className", "innerClassName", "children"],
    _excluded10 = ["className", "innerClassName", "children"],
    _excluded11 = ["padding"],
    _excluded12 = ["onMouseDown", "onTouchStart", "className"],
    _excluded13 = ["className"],
    _excluded14 = ["state"],
    _excluded15 = ["key"],
    _excluded16 = ["key"],
    _excluded17 = ["key"],
    _excluded18 = ["key"];

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }




















var tableInstances = {};
function getInstance(tableId) {
  if (!tableId) {
    throw new Error('A reactable table ID must be provided');
  }

  var getInstance = tableInstances[tableId];

  if (!getInstance) {
    throw new Error("reactable instance '".concat(tableId, "' not found"));
  }

  return getInstance();
}
function getState(tableId) {
  return getInstance(tableId).state;
}
function setFilter(tableId, columnId, value) {
  getInstance(tableId).setFilter(columnId, value);
}
function setAllFilters(tableId, value) {
  getInstance(tableId).setAllFilters(value);
}
function setSearch(tableId, value) {
  getInstance(tableId).setGlobalFilter(value);
}
function toggleGroupBy(tableId, columnId, isGrouped) {
  getInstance(tableId).toggleGroupBy(columnId, isGrouped);
}
function setGroupBy(tableId, columnIds) {
  getInstance(tableId).setGroupBy(columnIds);
}
function toggleAllRowsExpanded(tableId, isExpanded) {
  getInstance(tableId).toggleAllRowsExpanded(isExpanded);
}
function downloadDataCSV(tableId) {
  var filename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'data.csv';
  getInstance(tableId).downloadDataCSV(filename);
}
function setMeta(tableId, meta) {
  getInstance(tableId).setMeta(meta);
}
function setData(tableId, data, options) {
  getInstance(tableId).setData(data, options);
}
function onStateChange(tableId, listenerFn) {
  return getInstance(tableId).onStateChange(listenerFn);
}
function Reactable(_ref) {
  var data = _ref.data,
      columns = _ref.columns,
      columnGroups = _ref.columnGroups,
      sortable = _ref.sortable,
      defaultSortDesc = _ref.defaultSortDesc,
      showSortIcon = _ref.showSortIcon,
      showSortable = _ref.showSortable,
      filterable = _ref.filterable,
      resizable = _ref.resizable,
      theme = _ref.theme,
      language = _ref.language,
      dataKey = _ref.dataKey,
      rest = _objectWithoutProperties(_ref, _excluded);

  data = (0,_columns__WEBPACK_IMPORTED_MODULE_12__.columnsToRows)(data);
  columns = (0,_columns__WEBPACK_IMPORTED_MODULE_12__.buildColumnDefs)(columns, columnGroups, {
    sortable: sortable,
    defaultSortDesc: defaultSortDesc,
    showSortIcon: showSortIcon,
    showSortable: showSortable,
    filterable: filterable,
    resizable: resizable
  });
  theme = (0,_theme__WEBPACK_IMPORTED_MODULE_14__.createTheme)(theme) || {};
  language = _objectSpread(_objectSpread({}, _language__WEBPACK_IMPORTED_MODULE_13__.defaultLanguage), language);

  for (var key in language) {
    language[key] = language[key] || null;
  }

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Table, _extends({
    data: data,
    columns: columns,
    theme: theme,
    language: language // Reset all state when the data changes. By default, most of the table state
    // persists when the data changes (sorted, filtered, grouped state, etc.).
    ,
    key: dataKey
  }, rest));
}
var RootComponent = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().forwardRef(function RootComponent(_ref2, ref) {
  var className = _ref2.className,
      rest = _objectWithoutProperties(_ref2, _excluded2);

  // Keep ReactTable class for legacy compatibility (deprecated in v0.3.0)
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    ref: ref,
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('Reactable', 'ReactTable', className)
  }, rest));
});
var TableComponent = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().forwardRef(function TableComponent(_ref3, ref) {
  var className = _ref3.className,
      rest = _objectWithoutProperties(_ref3, _excluded3);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    ref: ref,
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-table', className),
    role: "table"
  }, rest));
});

function TheadComponent(_ref4) {
  var className = _ref4.className,
      rest = _objectWithoutProperties(_ref4, _excluded4);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-thead', className),
    role: "rowgroup"
  }, rest));
}

function TbodyComponent(_ref5) {
  var className = _ref5.className,
      rest = _objectWithoutProperties(_ref5, _excluded5);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tbody', className),
    role: "rowgroup"
  }, rest));
}

function TfootComponent(_ref6) {
  var className = _ref6.className,
      rest = _objectWithoutProperties(_ref6, _excluded6);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tfoot', className),
    role: "rowgroup"
  }, rest));
}

function TrGroupComponent(_ref7) {
  var className = _ref7.className,
      rest = _objectWithoutProperties(_ref7, _excluded7);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tr-group', className)
  }, rest));
}

function TrComponent(_ref8) {
  var className = _ref8.className,
      rest = _objectWithoutProperties(_ref8, _excluded8);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tr', className),
    role: "row"
  }, rest));
}

var ThComponent = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().forwardRef(function ThComponent(props, ref) {
  var canSort = props.canSort,
      sortDescFirst = props.sortDescFirst,
      isSorted = props.isSorted,
      isSortedDesc = props.isSortedDesc,
      toggleSortBy = props.toggleSortBy,
      canResize = props.canResize,
      isResizing = props.isResizing,
      className = props.className,
      innerClassName = props.innerClassName,
      children = props.children,
      thProps = _objectWithoutProperties(props, _excluded9);

  var _React$useState = react__WEBPACK_IMPORTED_MODULE_0___default().useState(false),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      skipNextSort = _React$useState2[0],
      setSkipNextSort = _React$useState2[1];

  if (canSort) {
    var currentSortOrder = isSorted ? isSortedDesc ? 'descending' : 'ascending' : 'none';
    var defaultSortOrder = sortDescFirst ? 'descending' : 'ascending';

    var toggleSort = function toggleSort(isMultiSort) {
      var sortDesc = isSorted ? !isSortedDesc : sortDescFirst; // Allow sort clearing if multi-sorting

      if (isMultiSort) {
        sortDesc = null;
      }

      toggleSortBy && toggleSortBy(sortDesc, isMultiSort);
    };

    thProps = _objectSpread(_objectSpread({}, thProps), {}, {
      'aria-sort': currentSortOrder,
      tabIndex: '0',
      onClick: function onClick(e) {
        if (!skipNextSort) {
          toggleSort(e.shiftKey);
        }
      },
      onKeyPress: function onKeyPress(e) {
        var keyCode = e.which || e.keyCode;

        if (keyCode === 13 || keyCode === 32) {
          toggleSort(e.shiftKey);
        }
      },
      onMouseUp: function onMouseUp() {
        // Prevent resizer clicks from toggling sort (since resizer is in the header)
        if (isResizing) {
          setSkipNextSort(true);
        } else {
          setSkipNextSort(false);
        }
      },
      onMouseDown: function onMouseDown(e) {
        // Prevent text selection on double clicks, only when sorting
        if (e.detail > 1 || e.shiftKey) {
          e.preventDefault();
        }
      },
      // Focus indicator for keyboard navigation
      'data-sort-hint': isSorted ? null : defaultSortOrder
    });
  } // The inner wrapper is a block container that prevents the outer flex container from
  // breaking text overflow and ellipsis truncation. Text nodes can't shrink below their
  // minimum content size.


  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-th', canResize && 'rt-th-resizable', className),
    role: "columnheader",
    ref: ref
  }, thProps), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-th-inner', innerClassName)
  }, children));
});
ThComponent.propTypes = {
  defaultSortOrder: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  canSort: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  sortDescFirst: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  isSorted: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  isSortedDesc: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  toggleSortBy: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func),
  canResize: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  isResizing: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  innerClassName: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  children: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().node)
};

function TdComponent(_ref9) {
  var className = _ref9.className,
      innerClassName = _ref9.innerClassName,
      children = _ref9.children,
      rest = _objectWithoutProperties(_ref9, _excluded10);

  // The inner wrapper is a block container that prevents the outer flex container from
  // breaking text overflow and ellipsis truncation. Text nodes can't shrink below their
  // minimum content size.
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-td', className),
    role: "cell"
  }, rest), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-td-inner', innerClassName)
  }, children));
} // Get class names for a cell theme. Padding is set on the inner wrapper to prevent
// the inner wrapper (with overflow hidden) from clipping borders, box shadows, etc.


function getCellTheme(style) {
  if (!style) {
    return {};
  }

  if (style.padding != null) {
    var padding = style.padding,
        cellStyle = _objectWithoutProperties(style, _excluded11);

    return {
      className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(cellStyle),
      innerClassName: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)({
        padding: padding
      })
    };
  }

  return {
    className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(style)
  };
}

function ResizerComponent(_ref10) {
  var onMouseDown = _ref10.onMouseDown,
      onTouchStart = _ref10.onTouchStart,
      className = _ref10.className,
      rest = _objectWithoutProperties(_ref10, _excluded12);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-resizer', className),
    onMouseDown: onMouseDown,
    onTouchStart: onTouchStart,
    "aria-hidden": true
  }, rest));
}

ResizerComponent.propTypes = {
  onMouseDown: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func),
  onTouchStart: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

var RowDetails = /*#__PURE__*/function (_React$Component) {
  _inherits(RowDetails, _React$Component);

  var _super = _createSuper(RowDetails);

  function RowDetails() {
    _classCallCheck(this, RowDetails);

    return _super.apply(this, arguments);
  }

  _createClass(RowDetails, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (window.Shiny && window.Shiny.bindAll) {
        window.Shiny.bindAll(this.el);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (window.Shiny && window.Shiny.unbindAll) {
        window.Shiny.unbindAll(this.el);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this = this;

      var _this$props = this.props,
          children = _this$props.children,
          html = _this$props.html;
      var props = {
        ref: function ref(el) {
          return _this.el = el;
        }
      };

      if (html) {
        props = _objectSpread(_objectSpread({}, props), {}, {
          dangerouslySetInnerHTML: {
            __html: html
          }
        });
      } else {
        props = _objectSpread(_objectSpread({}, props), {}, {
          children: children
        });
      }

      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
        className: "rt-tr-details"
      }, props));
    }
  }]);

  return RowDetails;
}((react__WEBPACK_IMPORTED_MODULE_0___default().Component));

RowDetails.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().node),
  html: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

function ExpanderComponent(_ref11) {
  var isExpanded = _ref11.isExpanded,
      className = _ref11.className,
      ariaLabel = _ref11['aria-label'];
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "rt-expander-button",
    "aria-label": ariaLabel,
    "aria-expanded": isExpanded ? 'true' : 'false'
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-expander', isExpanded && 'rt-expander-open', className),
    tabIndex: "-1",
    "aria-hidden": "true"
  }, "\u200B"));
}

ExpanderComponent.propTypes = {
  isExpanded: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  'aria-label': (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

function FilterComponent(_ref12) {
  var filterValue = _ref12.filterValue,
      setFilter = _ref12.setFilter,
      className = _ref12.className,
      placeholder = _ref12.placeholder,
      ariaLabel = _ref12['aria-label'];
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "text",
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-filter', className),
    value: filterValue || '' // Filter value must be undefined (not empty string) to clear the filter
    ,
    onChange: function onChange(e) {
      return setFilter(e.target.value || undefined);
    },
    placeholder: placeholder,
    "aria-label": ariaLabel
  });
}

FilterComponent.propTypes = {
  filterValue: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  setFilter: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func.isRequired),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  placeholder: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  'aria-label': (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

function SearchComponent(_ref13) {
  var searchValue = _ref13.searchValue,
      setSearch = _ref13.setSearch,
      className = _ref13.className,
      placeholder = _ref13.placeholder,
      ariaLabel = _ref13['aria-label'];
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "text",
    value: searchValue || '' // Search value must be undefined (not empty string) to clear the search
    ,
    onChange: function onChange(e) {
      return setSearch(e.target.value || undefined);
    },
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-search', className),
    placeholder: placeholder,
    "aria-label": ariaLabel
  });
}

SearchComponent.propTypes = {
  searchValue: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  setSearch: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func.isRequired),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  placeholder: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  'aria-label': (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

function NoDataComponent(_ref14) {
  var className = _ref14.className,
      rest = _objectWithoutProperties(_ref14, _excluded13);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-no-data', className),
    "aria-live": "assertive"
  }, rest));
}

function SelectInputComponent(_ref15) {
  var type = _ref15.type,
      checked = _ref15.checked,
      onChange = _ref15.onChange,
      ariaLabel = _ref15['aria-label'];
  // Use zero-width space character to properly align checkboxes with first
  // line of text in other cells, even if the text spans multiple lines.
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "rt-select"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: type,
    checked: checked,
    onChange: onChange,
    className: "rt-select-input",
    "aria-label": ariaLabel
  }), "\u200B");
}

SelectInputComponent.propTypes = {
  type: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOf(['checkbox', 'radio']).isRequired,
  checked: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  onChange: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func),
  'aria-label': (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};

function Table(_ref16) {
  var originalData = _ref16.data,
      columns = _ref16.columns,
      groupBy = _ref16.groupBy,
      searchable = _ref16.searchable,
      searchMethod = _ref16.searchMethod,
      defaultSorted = _ref16.defaultSorted,
      pagination = _ref16.pagination,
      paginationType = _ref16.paginationType,
      showPagination = _ref16.showPagination,
      showPageSizeOptions = _ref16.showPageSizeOptions,
      showPageInfo = _ref16.showPageInfo,
      defaultPageSize = _ref16.defaultPageSize,
      pageSizeOptions = _ref16.pageSizeOptions,
      minRows = _ref16.minRows,
      paginateSubRows = _ref16.paginateSubRows,
      defaultExpanded = _ref16.defaultExpanded,
      selection = _ref16.selection,
      defaultSelected = _ref16.defaultSelected,
      selectionId = _ref16.selectionId,
      onClick = _ref16.onClick,
      outlined = _ref16.outlined,
      bordered = _ref16.bordered,
      borderless = _ref16.borderless,
      compact = _ref16.compact,
      nowrap = _ref16.nowrap,
      striped = _ref16.striped,
      highlight = _ref16.highlight,
      className = _ref16.className,
      style = _ref16.style,
      rowClassName = _ref16.rowClassName,
      rowStyle = _ref16.rowStyle,
      inline = _ref16.inline,
      width = _ref16.width,
      height = _ref16.height,
      theme = _ref16.theme,
      language = _ref16.language,
      initialMeta = _ref16.meta,
      crosstalkKey = _ref16.crosstalkKey,
      crosstalkGroup = _ref16.crosstalkGroup,
      crosstalkId = _ref16.crosstalkId,
      elementId = _ref16.elementId,
      nested = _ref16.nested;

  var _React$useState3 = react__WEBPACK_IMPORTED_MODULE_0___default().useState(null),
      _React$useState4 = _slicedToArray(_React$useState3, 2),
      newData = _React$useState4[0],
      setNewData = _React$useState4[1];

  var data = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return newData ? newData : originalData;
  }, [newData, originalData]);
  var dataColumns = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return columns.reduce(function (cols, col) {
      return cols.concat((0,_utils__WEBPACK_IMPORTED_MODULE_15__.getLeafColumns)(col));
    }, []);
  }, [columns]); // Must be memoized to prevent re-filtering on every render

  var globalFilter = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (searchMethod) {
      return searchMethod;
    }

    return function globalFilter(rows, columnIds, searchValue) {
      var matchers = dataColumns.reduce(function (obj, col) {
        obj[col.id] = col.createMatcher(searchValue);
        return obj;
      }, {});
      rows = rows.filter(function (row) {
        var _iterator = _createForOfIteratorHelper(columnIds),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var id = _step.value;
            var value = row.values[id];

            if (matchers[id](value)) {
              return true;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
      return rows;
    };
  }, [dataColumns, searchMethod]);

  var useRowSelectColumn = function useRowSelectColumn(hooks) {
    if (selection) {
      hooks.visibleColumns.push(function (columns) {
        var selectionCol = _objectSpread(_objectSpread({}, columns.find(function (col) {
          return col.selectable;
        })), {}, {
          selectable: true,
          // Disable sorting, filtering, and searching for selection columns
          disableSortBy: true,
          filterable: false,
          disableFilters: true,
          disableGlobalFilter: true
        }); // Make selection column the first column, even before grouped columns


        return [selectionCol].concat(_toConsumableArray(columns.filter(function (col) {
          return !col.selectable;
        })));
      });
    }
  };

  var useCrosstalkColumn = function useCrosstalkColumn(hooks) {
    if (crosstalkGroup) {
      hooks.visibleColumns.push(function (columns) {
        var ctCol = {
          id: crosstalkId,
          filter: function filter(rows, id, value) {
            if (!value) {
              return rows;
            }

            return rows.filter(function (row) {
              if (value.includes(row.index)) {
                return true;
              }
            });
          },
          disableGlobalFilter: true
        };
        return columns.concat(ctCol);
      });
      hooks.stateReducers.push(function (state) {
        if (!state.hiddenColumns.includes(crosstalkId)) {
          return _objectSpread(_objectSpread({}, state), {}, {
            hiddenColumns: state.hiddenColumns.concat(crosstalkId)
          });
        }

        return state;
      });
    }
  };

  var _useMeta = (0,_useMeta__WEBPACK_IMPORTED_MODULE_11__["default"])(initialMeta),
      _useMeta2 = _slicedToArray(_useMeta, 2),
      meta = _useMeta2[0],
      setMeta = _useMeta2[1];

  var _useTable = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useTable)({
    columns: columns,
    data: data,
    initialState: {
      hiddenColumns: dataColumns.filter(function (col) {
        return col.show === false;
      }).map(function (col) {
        return col.id;
      }),
      groupBy: groupBy || [],
      sortBy: defaultSorted || [],
      pageSize: defaultPageSize,
      selectedRowIds: defaultSelected ? defaultSelected.reduce(function (obj, index) {
        return _objectSpread(_objectSpread({}, obj), {}, _defineProperty({}, index, true));
      }, {}) : {}
    },
    globalFilter: globalFilter,
    paginateExpandedRows: paginateSubRows ? true : false,
    disablePagination: !pagination,
    getSubRows: _columns__WEBPACK_IMPORTED_MODULE_12__.getSubRows,
    // Disable manual row expansion
    manualExpandedKey: null,
    // Maintain grouped state when the data changes
    autoResetGroupBy: false,
    // Maintain sorted state when the data changes
    autoResetSortBy: false,
    // Maintain expanded state when groupBy, sortBy, defaultPageSize change.
    // Expanded state is still reset when the data changes via dataKey or updateReactable.
    autoResetExpanded: false,
    // Maintain filtered state when the data changes
    autoResetFilters: false,
    autoResetGlobalFilter: false,
    // Maintain selected state when groupBy, sortBy, defaultPageSize change.
    // Selected state is still reset when the data changes via dataKey or updateReactable.
    autoResetSelectedRows: false,
    // Maintain resized state when the data changes
    autoResetResize: false,
    // Reset current page when the data changes (e.g., sorting, filtering, searching)
    autoResetPage: true
  }, _useResizeColumns__WEBPACK_IMPORTED_MODULE_8__["default"], _useFlexLayout__WEBPACK_IMPORTED_MODULE_5__["default"], _useStickyColumns__WEBPACK_IMPORTED_MODULE_6__["default"], react_table__WEBPACK_IMPORTED_MODULE_1__.useFilters, react_table__WEBPACK_IMPORTED_MODULE_1__.useGlobalFilter, _useGroupBy__WEBPACK_IMPORTED_MODULE_7__["default"], react_table__WEBPACK_IMPORTED_MODULE_1__.useSortBy, react_table__WEBPACK_IMPORTED_MODULE_1__.useExpanded, _usePagination__WEBPACK_IMPORTED_MODULE_10__["default"], _useRowSelect__WEBPACK_IMPORTED_MODULE_9__["default"], useRowSelectColumn, useCrosstalkColumn),
      state = _useTable.state,
      instance = _objectWithoutProperties(_useTable, _excluded14); // Update table when default values change (preserves behavior from v6)


  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    var setSortBy = instance.setSortBy;
    setSortBy(defaultSorted || []);
  }, [instance.setSortBy, defaultSorted]);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    var setGroupBy = instance.setGroupBy;
    setGroupBy(groupBy || []);
  }, [instance.setGroupBy, groupBy]);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    var setPageSize = instance.setPageSize;
    setPageSize(defaultPageSize);
  }, [instance.setPageSize, defaultPageSize]);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    var setRowsSelected = instance.setRowsSelected;
    setRowsSelected((defaultSelected || []).map(function (index) {
      return String(index);
    }));
  }, [instance.setRowsSelected, defaultSelected]);
  var rowsById = instance.preFilteredRowsById || instance.rowsById;
  var selectedRowIndexes = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return Object.keys(state.selectedRowIds).reduce(function (indexes, id) {
      var row = rowsById[id];

      if (row) {
        indexes.push(row.index);
      }

      return indexes;
    }, []);
  }, [state.selectedRowIds, rowsById]); // Update Shiny on selected row changes (deprecated in v0.2.0)

  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    if (!selection) {
      return;
    } // Convert to R's 1-based indices


    var selectedIndexes = selectedRowIndexes.map(function (index) {
      return index + 1;
    });

    if (selectionId && window.Shiny) {
      window.Shiny.onInputChange(selectionId, selectedIndexes);
    }
  }, [selectedRowIndexes, selection, selectionId]); // Reset searched state when table is no longer searchable

  var searchableRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(searchable);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    if (searchableRef.current && !searchable) {
      var setGlobalFilter = instance.setGlobalFilter;
      setGlobalFilter(undefined);
    }

    searchableRef.current = searchable;
  }, [searchable, instance.setGlobalFilter]);

  var makeSearch = function makeSearch() {
    if (!searchable) {
      return null;
    }

    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SearchComponent, {
      searchValue: state.globalFilter,
      setSearch: instance.setGlobalFilter,
      className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.searchInputStyle),
      placeholder: language.searchPlaceholder,
      "aria-label": language.searchLabel
    });
  };

  var rowData = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.convertRowsToV6)(instance.rows);
  var stateInfo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return _objectSpread(_objectSpread({}, state), {}, {
      searchValue: state.globalFilter,
      meta: meta,
      // For v6 compatibility
      sorted: state.sortBy,
      pageRows: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.convertRowsToV6)(instance.page),
      sortedData: rowData,
      data: data,
      page: state.pageIndex,
      pageSize: state.pageSize,
      pages: instance.pageCount,
      selected: selectedRowIndexes
    });
  }, [state, meta, instance.page, rowData, data, instance.pageCount, selectedRowIndexes]);

  var makeThead = function makeThead() {
    var theadProps = instance.getTheadProps();
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TheadComponent, theadProps, makeHeaders(), makeFilters());
  }; // Get actual width of the column for resizing


  var headerRefs = react__WEBPACK_IMPORTED_MODULE_0___default().useRef({});

  var handleHeader = function handleHeader(column) {
    column.getDOMWidth = function () {
      return headerRefs.current[column.id].getBoundingClientRect().width;
    };

    if (column.headers && column.headers.length) {
      column.headers.forEach(function (col) {
        return handleHeader(col);
      });
    }
  };

  instance.headers.forEach(handleHeader);

  var makeHeaders = function makeHeaders() {
    return instance.headerGroups.map(function (headerGroup, i) {
      var isGroupHeader = i < instance.headerGroups.length - 1;

      var _headerGroup$getHeade = headerGroup.getHeaderGroupProps({
        className: isGroupHeader ? 'rt-tr-group-header' : 'rt-tr-header'
      }),
          headerGroupKey = _headerGroup$getHeade.key,
          headerGroupProps = _objectWithoutProperties(_headerGroup$getHeade, _excluded15);

      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrComponent, _extends({
        key: headerGroupKey
      }, headerGroupProps), headerGroup.headers.map(function (column) {
        column = _objectSpread(_objectSpread({}, column), {}, {
          column: column,
          // Deprecated in v0.3.0
          data: rowData // Deprecated in v0.3.0

        });
        var header = typeof column.Header === 'function' ? column.Header(column, stateInfo) : column.render('Header');
        var headerProps = {
          // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
          colSpan: null,
          ref: function ref(el) {
            return headerRefs.current[column.id] = el;
          }
        };

        if (isGroupHeader) {
          var _getCellTheme = getCellTheme(theme.groupHeaderStyle),
              themeClass = _getCellTheme.className,
              innerClassName = _getCellTheme.innerClassName;

          headerProps = _objectSpread(_objectSpread({}, headerProps), {}, {
            'aria-colspan': column.totalVisibleHeaderCount,
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(!column.isUngrouped ? 'rt-th-group' : 'rt-th-group-none', column.headerClassName, themeClass),
            innerClassName: innerClassName,
            style: column.headerStyle,
            canResize: column.canResize
          });
        } else {
          var _getCellTheme2 = getCellTheme(theme.headerStyle),
              _themeClass = _getCellTheme2.className,
              _innerClassName = _getCellTheme2.innerClassName;

          headerProps = _objectSpread(_objectSpread({}, headerProps), {}, {
            // Assign cell role to selectable column headers to prevent input labels
            // from being read as column names ("select all rows column").
            role: column.selectable ? 'cell' : 'columnheader',
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(column.headerClassName, _themeClass),
            innerClassName: _innerClassName,
            style: column.headerStyle,
            canResize: column.canResize,
            isResizing: column.isResizing
          });

          if (column.canSort) {
            headerProps = _objectSpread(_objectSpread({}, headerProps), {}, {
              'aria-label': (0,_language__WEBPACK_IMPORTED_MODULE_13__.renderTemplate)(language.sortLabel, {
                name: column.name
              }),
              canSort: column.canSort,
              sortDescFirst: column.sortDescFirst,
              isSorted: column.isSorted,
              isSortedDesc: column.isSortedDesc,
              // Use toggleSortBy instead of getSortByToggleProps() for more control over sorting
              toggleSortBy: column.toggleSortBy
            });
          }
        }

        var resizer;

        if (column.canResize) {
          var _column$getResizerPro = column.getResizerProps(),
              _onMouseDown = _column$getResizerPro.onMouseDown,
              onTouchStart = _column$getResizerPro.onTouchStart;

          resizer = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ResizerComponent, {
            onMouseDown: function onMouseDown(e) {
              _onMouseDown(e); // Prevent resizer from highlighting text


              e.preventDefault();
            },
            onTouchStart: onTouchStart,
            onClick: function onClick(e) {
              // Prevent resizer from toggling sorting
              e.stopPropagation();
            }
          });
        }

        if (column.selectable && selection === 'multiple' && instance.rows.length > 0) {
          var toggleAllRowsSelected = function toggleAllRowsSelected() {
            return instance.toggleAllRowsSelected();
          };

          headerProps = _objectSpread(_objectSpread({}, headerProps), {}, {
            onClick: toggleAllRowsSelected,
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(headerProps.className, 'rt-td-select')
          });
          header = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SelectInputComponent, {
            type: "checkbox",
            checked: instance.isAllRowsSelected,
            onChange: toggleAllRowsSelected,
            "aria-label": language.selectAllRowsLabel
          });
        }

        var _column$getHeaderProp = column.getHeaderProps(headerProps),
            key = _column$getHeaderProp.key,
            resolvedHeaderProps = _objectWithoutProperties(_column$getHeaderProp, _excluded16);

        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ThComponent, _extends({
          key: key
        }, resolvedHeaderProps), header, resizer);
      }));
    });
  }; // Use column.filterable over column.canFilter because useGlobalFilter
  // currently sets canFilter to true on columns with disableFilters = true.
  // https://github.com/tannerlinsley/react-table/issues/2787


  var isFilterable = instance.visibleColumns.some(function (col) {
    return col.filterable;
  }); // Reset filtered state when table is no longer filterable

  var filterableRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(isFilterable);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    if (filterableRef.current && !isFilterable) {
      var _setAllFilters = instance.setAllFilters;

      _setAllFilters(instance.visibleColumns.map(function (col) {
        return {
          id: col.id,
          value: undefined
        };
      }));
    }

    filterableRef.current = isFilterable;
  }, [isFilterable, instance.visibleColumns, instance.setAllFilters]);

  var makeFilters = function makeFilters() {
    if (!isFilterable) {
      return null;
    }

    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrComponent, {
      className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tr-filters', (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.rowStyle))
    }, instance.visibleColumns.map(function (column) {
      var filter; // Use column.filterable over column.canFilter because useGlobalFilter
      // currently sets canFilter to true on columns with disableFilters = true.
      // https://github.com/TanStack/react-table/issues/2787

      if (column.filterable) {
        if (column.filterInput != null) {
          var filterInput;

          if (typeof column.filterInput === 'function') {
            filterInput = column.filterInput(column, stateInfo);
          } else {
            filterInput = (0,reactR__WEBPACK_IMPORTED_MODULE_2__.hydrate)({
              Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
              WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_4__["default"]
            }, column.filterInput);
          }

          if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(filterInput)) {
            filter = filterInput;
          } else if (column.html) {
            filter = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_columns__WEBPACK_IMPORTED_MODULE_12__.RawHTML, {
              html: filterInput
            });
          }
        } else {
          filter = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(FilterComponent, {
            filterValue: column.filterValue,
            setFilter: column.setFilter,
            className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.filterInputStyle),
            placeholder: language.filterPlaceholder,
            "aria-label": (0,_language__WEBPACK_IMPORTED_MODULE_13__.renderTemplate)(language.filterLabel, {
              name: column.name
            })
          });
        }
      }

      var _getCellTheme3 = getCellTheme(theme.filterCellStyle),
          themeClass = _getCellTheme3.className,
          innerClassName = _getCellTheme3.innerClassName;

      var filterCellProps = {
        role: 'cell',
        // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
        colSpan: null,
        className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-td-filter', column.headerClassName, themeClass),
        innerClassName: innerClassName,
        style: column.headerStyle
      };

      var _column$getHeaderProp2 = column.getHeaderProps(filterCellProps),
          key = _column$getHeaderProp2.key,
          resolvedFilterCellProps = _objectWithoutProperties(_column$getHeaderProp2, _excluded17);

      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TdComponent, _extends({
        key: key
      }, resolvedFilterCellProps), filter);
    }));
  };

  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    var toggleAllRowsExpanded = instance.toggleAllRowsExpanded;

    if (defaultExpanded) {
      toggleAllRowsExpanded(true);
    } else {
      toggleAllRowsExpanded(false);
    }
  }, [instance.toggleAllRowsExpanded, defaultExpanded]); // Track expanded columns for multiple row details

  var _React$useState5 = react__WEBPACK_IMPORTED_MODULE_0___default().useState({}),
      _React$useState6 = _slicedToArray(_React$useState5, 2),
      expandedColumns = _React$useState6[0],
      setExpandedColumns = _React$useState6[1];

  var makeRowDetails = function makeRowDetails(rowInfo, state) {
    // Ensure that row is expanded and not a grouped row. Row details are
    // currently not supported on grouped rows.
    if (!rowInfo.isExpanded || rowInfo.isGrouped) {
      return null;
    }

    var expandedId = expandedColumns[rowInfo.id];
    var expandedCol;

    if (expandedId != null) {
      expandedCol = instance.visibleColumns.find(function (col) {
        return col.id === expandedId;
      });
    } else {
      // When expanding all rows, default to the first column with details
      expandedCol = instance.visibleColumns.find(function (col) {
        return col.details;
      });
    } // Ensure that row details exist. Rows may have expanded state even though
    // there are no row details (when defaultExpanded = true).


    if (!expandedCol) {
      return null;
    }

    var _expandedCol = expandedCol,
        details = _expandedCol.details,
        html = _expandedCol.html;
    var props = {};

    if (typeof details === 'function') {
      var content = details(rowInfo, state);

      if (html) {
        props.html = content;
      }

      props.children = content;
    } else if (Array.isArray(details)) {
      var _content = details[rowInfo.index];

      if (_content == null) {
        // No content to render. Although this row has no expander, it may still
        // have expanded state (when defaultExpanded = true).
        return null;
      }

      if (html) {
        props.html = _content;
      }

      props.children = (0,reactR__WEBPACK_IMPORTED_MODULE_2__.hydrate)({
        Reactable: Reactable,
        Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
        WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_4__["default"]
      }, _content);
    } // Set key to force updates when expanding a different column or changing page


    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RowDetails, _extends({
      key: "".concat(expandedCol.id, "_").concat(rowInfo.index)
    }, props));
  };

  var makeTbody = function makeTbody() {
    var hasStickyColumns = instance.visibleColumns.some(function (column) {
      return column.sticky;
    });
    var rowHighlightClass = hasStickyColumns ? 'rt-tr-highlight-sticky' : 'rt-tr-highlight';
    var rowStripedClass = hasStickyColumns ? 'rt-tr-striped-sticky' : 'rt-tr-striped';
    var rows = instance.page.map(function (row, viewIndex) {
      instance.prepareRow(row); // toggleRowSelected that supports single selection

      var toggleRowSelected = function toggleRowSelected(set) {
        if (set == null) {
          set = !row.isSelected;
        }

        if (selection === 'single') {
          instance.setRowsSelected([]);
        }

        row.toggleRowSelected(set);
      };

      var rowInfo = _objectSpread(_objectSpread({}, row), {}, {
        toggleRowSelected: toggleRowSelected,
        // For v6 compatibility
        viewIndex: viewIndex,
        row: row.values,
        // Deprecated in v0.3.0
        subRows: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.convertRowsToV6)(row.subRows),
        aggregated: row.isGrouped,
        expanded: row.isExpanded,
        level: row.depth,
        selected: row.isSelected,
        page: state.pageIndex // Deprecated in v0.3.0

      });

      var rowProps = {
        className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(striped && (viewIndex % 2 ? null : rowStripedClass), highlight && rowHighlightClass, row.isSelected && 'rt-tr-selected', (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.rowStyle))
      };

      if (rowClassName) {
        var rowCls;

        if (typeof rowClassName === 'function') {
          rowCls = rowClassName(rowInfo, stateInfo);
        } else if (Array.isArray(rowClassName)) {
          rowCls = rowClassName[rowInfo.index];
        } else {
          rowCls = rowClassName;
        }

        rowProps.className = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(rowProps.className, rowCls);
      }

      if (rowStyle) {
        if (typeof rowStyle === 'function') {
          rowProps.style = rowStyle(rowInfo, stateInfo);
        } else if (Array.isArray(rowStyle)) {
          rowProps.style = rowStyle[rowInfo.index];
        } else {
          rowProps.style = rowStyle;
        }
      }

      var rowDetails = makeRowDetails(rowInfo, stateInfo);
      var expandedId;

      if (row.isExpanded) {
        if (expandedColumns[row.id] != null) {
          expandedId = expandedColumns[row.id];
        } else {
          // When expanding all rows, default to the first column with details
          var expandedCol = instance.visibleColumns.find(function (col) {
            return col.details;
          });
          expandedId = expandedCol ? expandedCol.id : null;
        }
      }

      var resolvedRowProps = row.getRowProps(rowProps);
      return (
        /*#__PURE__*/
        // Use relative row index for key (like in v6) rather than row index (v7)
        // for better rerender performance, especially with a large number of rows.
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrGroupComponent, {
          key: "".concat(row.depth, "_").concat(viewIndex),
          className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.rowGroupStyle)
        }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrComponent, _extends({}, resolvedRowProps, {
          key: undefined
        }), row.cells.map(function (cell, colIndex) {
          var column = cell.column;
          var cellProps = column.getProps ? column.getProps(rowInfo, column, stateInfo) : {};

          var _getCellTheme4 = getCellTheme(theme.cellStyle),
              themeClass = _getCellTheme4.className,
              innerClassName = _getCellTheme4.innerClassName;

          cellProps = _objectSpread(_objectSpread({}, cellProps), {}, {
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(cellProps.className, themeClass),
            innerClassName: innerClassName,
            role: column.rowHeader ? 'rowheader' : 'cell'
          });

          var cellInfo = _objectSpread(_objectSpread({}, cell), {}, {
            column: column,
            filterValue: column.filterValue
          }, rowInfo);

          var value;

          if (cell.isGrouped) {
            value = column.Grouped ? column.Grouped(cellInfo, stateInfo) : cellInfo.value;
          } else if (cell.isAggregated) {
            value = column.Aggregated ? column.Aggregated(cellInfo, stateInfo) : cell.render('Aggregated');
          } else if (cell.isPlaceholder) {
            value = '';
          } else {
            value = column.Cell ? column.Cell(cellInfo, stateInfo) : cell.render('Cell');
          }

          var hasDetails;

          if (column.details && !row.isGrouped) {
            if (Array.isArray(column.details) && column.details[row.index] == null) {// Don't expand rows without content
            } else {
              hasDetails = true;
            }
          }

          var expander;

          if (hasDetails) {
            var isExpanded = row.isExpanded && expandedId === column.id;
            cellProps = _objectSpread(_objectSpread({}, cellProps), {}, {
              onClick: function onClick() {
                if (isExpanded) {
                  row.toggleRowExpanded(false);

                  var newExpandedColumns = _objectSpread({}, expandedColumns);

                  delete newExpandedColumns[row.id];
                  setExpandedColumns(newExpandedColumns);
                } else {
                  row.toggleRowExpanded(true);

                  var _newExpandedColumns = _objectSpread(_objectSpread({}, expandedColumns), {}, _defineProperty({}, row.id, column.id));

                  setExpandedColumns(_newExpandedColumns);
                }
              },
              className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(cellProps.className, 'rt-td-expandable')
            }); // Hide overflow ellipsis and prevent text selection on expander-only columns

            if (value === _columns__WEBPACK_IMPORTED_MODULE_12__.emptyValue) {
              cellProps.style = _objectSpread({
                textOverflow: 'clip',
                userSelect: 'none'
              }, cellProps.style);
            }

            var expanderProps = {
              isExpanded: isExpanded,
              className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.expanderStyle),
              'aria-label': language.detailsExpandLabel
            };
            expander = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ExpanderComponent, expanderProps);
          } else if (cell.isGrouped) {
            var _isExpanded = row.isExpanded;
            cellProps = _objectSpread(_objectSpread({}, cellProps), {}, {
              onClick: function onClick() {
                return row.toggleRowExpanded();
              },
              className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(cellProps.className, 'rt-td-expandable')
            });
            var _expanderProps = {
              isExpanded: _isExpanded,
              className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.expanderStyle),
              'aria-label': language.groupExpandLabel
            };
            expander = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ExpanderComponent, _expanderProps);
          } else if (cell.column.isGrouped && row.canExpand) {
            // Make all grouped column cells expandable (including placeholders)
            cellProps = _objectSpread(_objectSpread({}, cellProps), {}, {
              onClick: function onClick() {
                return row.toggleRowExpanded();
              },
              className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(cellProps.className, 'rt-td-expandable')
            });
          }

          var canRowSelect = selection === 'multiple' || selection === 'single' && !cell.isAggregated;

          if (column.selectable && canRowSelect) {
            cellProps = _objectSpread(_objectSpread({}, cellProps), {}, {
              onClick: function onClick() {
                return toggleRowSelected();
              },
              className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(cellProps.className, 'rt-td-select')
            });
            var ariaLabel;

            if (cell.isAggregated) {
              ariaLabel = language.selectAllSubRowsLabel;
            } else {
              ariaLabel = language.selectRowLabel;
            }

            value = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SelectInputComponent, {
              type: selection === 'multiple' ? 'checkbox' : 'radio',
              checked: row.isSelected,
              onChange: function onChange() {
                return toggleRowSelected();
              },
              "aria-label": ariaLabel
            });
          } // Add cell click actions. Don't override existing click actions.


          if (onClick && !cellProps.onClick) {
            if (onClick === 'expand') {
              cellProps.onClick = function () {
                return row.toggleRowExpanded();
              };
            } else if (onClick === 'select' && canRowSelect) {
              cellProps.onClick = function () {
                return toggleRowSelected();
              };
            } else if (typeof onClick === 'function') {
              cellProps.onClick = function () {
                return onClick(rowInfo, column, stateInfo);
              };
            }
          }

          var resolvedCellProps = cell.getCellProps(cellProps);
          return (
            /*#__PURE__*/
            // Use column ID for key (like in v6) rather than row index (v7)
            // for better rerender performance, especially with a large number of rows.
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TdComponent, _extends({}, resolvedCellProps, {
              key: "".concat(colIndex, "_").concat(column.id)
            }), expander, value)
          );
        })), rowDetails)
      );
    });
    var padRows; // Leave at least one row to show the no data message properly

    minRows = minRows ? Math.max(minRows, 1) : 1;
    var padRowCount = Math.max(minRows - instance.page.length, 0);

    if (padRowCount > 0) {
      padRows = _toConsumableArray(Array(padRowCount)).map(function (_, viewIndex) {
        var rowProps = {
          className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tr-pad', (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.rowStyle))
        };

        if (rowClassName) {
          var rowCls;

          if (typeof rowClassName === 'function') {
            rowCls = rowClassName(undefined, stateInfo);
          } else if (Array.isArray(rowClassName)) {// rowClassName not used for pad rows
          } else {
            rowCls = rowClassName;
          }

          rowProps.className = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(rowProps.className, rowCls);
        }

        if (rowStyle) {
          if (typeof rowStyle === 'function') {
            rowProps.style = rowStyle(undefined, stateInfo);
          } else if (Array.isArray(rowStyle)) {// rowStyle not used for pad rows
          } else {
            rowProps.style = rowStyle;
          }
        }

        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrGroupComponent, {
          key: viewIndex,
          className: (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.rowGroupStyle),
          "aria-hidden": true
        }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrComponent, rowProps, instance.visibleColumns.map(function (column) {
          var _getCellTheme5 = getCellTheme(theme.cellStyle),
              themeClass = _getCellTheme5.className,
              innerClassName = _getCellTheme5.innerClassName;

          var cellProps = {
            className: themeClass
          }; // Get layout styles (flex, sticky) from footer props. useFlexLayout
          // doesn't have built-in support for pad cells.

          var _column$getFooterProp = column.getFooterProps(cellProps),
              className = _column$getFooterProp.className,
              style = _column$getFooterProp.style;

          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TdComponent, {
            key: "".concat(viewIndex, "_").concat(column.id),
            className: className,
            innerClassName: innerClassName,
            style: style
          }, "\xA0");
        })));
      });
    }

    var className = (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.tableBodyStyle);
    var noData;

    if (instance.rows.length === 0) {
      noData = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(NoDataComponent, null, language.noData); // Hide cell borders when table has no data

      className = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-tbody-no-data', className);
    } else {
      // Must be on the page for the ARIA live region to be announced
      noData = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(NoDataComponent, null);
    }

    var tbodyProps = instance.getTableBodyProps({
      className: className
    });
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TbodyComponent, tbodyProps, rows, padRows, noData);
  };

  var makeTfoot = function makeTfoot() {
    var hasFooters = instance.visibleColumns.some(function (column) {
      return column.footer != null;
    });

    if (!hasFooters) {
      return null;
    }

    var tfootProps = instance.getTfootProps();
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TfootComponent, tfootProps, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TrComponent, null, instance.visibleColumns.map(function (column) {
      column = _objectSpread(_objectSpread({}, column), {}, {
        column: column,
        // Deprecated in v0.3.0
        data: rowData // Deprecated in v0.3.0

      });
      var footer = typeof column.Footer === 'function' ? column.Footer(column, stateInfo) : column.render('Footer');

      var _getCellTheme6 = getCellTheme(theme.footerStyle),
          themeClass = _getCellTheme6.className,
          innerClassName = _getCellTheme6.innerClassName;

      var footerProps = {
        className: (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)('rt-td-footer', column.footerClassName, themeClass),
        innerClassName: innerClassName,
        style: column.footerStyle,
        role: column.rowHeader ? 'rowheader' : 'cell',
        // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
        colSpan: null
      };

      var _column$getFooterProp2 = column.getFooterProps(footerProps),
          key = _column$getFooterProp2.key,
          resolvedFooterProps = _objectWithoutProperties(_column$getFooterProp2, _excluded18);

      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TdComponent, _extends({
        key: key
      }, resolvedFooterProps), footer);
    })));
  }; // Track the max number of rows for auto-shown pagination. Unfortunately, the max
  // number of rows can't be determined up front in a grouped and filtered table
  // because grouping happens after filtering (and swapping these hooks would
  // disable dynamic aggregation). Instead, we track the max number of rows
  // per dataset, so at least the pagination doesn't disappear upon filtering.


  var maxRowCount = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(paginateSubRows ? instance.flatRows.length : instance.rows.length);
  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    maxRowCount.current = 0;
  }, [data]);
  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    var rowCount = paginateSubRows ? instance.flatRows.length : instance.rows.length;

    if (rowCount > maxRowCount.current) {
      maxRowCount.current = rowCount;
    }
  }, [paginateSubRows, instance.flatRows, instance.rows]);

  var makePagination = function makePagination() {
    if (showPagination === false) {
      return null;
    } else if (!pagination && showPagination == null) {
      // Unpaginated tables can still have a visible pagination bar (e.g., for page info)
      return null;
    } else if (pagination && showPagination == null) {
      // Auto-hide pagination if the entire table fits on one page
      var minPageSize = showPageSizeOptions ? Math.min.apply(Math, [state.pageSize].concat(_toConsumableArray(pageSizeOptions || []))) : state.pageSize;

      if (maxRowCount.current <= minPageSize) {
        return null;
      }
    }

    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_Pagination__WEBPACK_IMPORTED_MODULE_3__["default"], {
      paginationType: paginationType,
      pageSizeOptions: pageSizeOptions,
      showPageInfo: showPageInfo,
      showPageSizeOptions: showPageSizeOptions,
      page: state.pageIndex,
      pages: instance.pageCount,
      pageSize: state.pageSize,
      pageRowCount: instance.pageRowCount,
      canNext: instance.canNextPage,
      canPrevious: instance.canPreviousPage,
      onPageChange: instance.gotoPage,
      onPageSizeChange: instance.setPageSize,
      rowCount: instance.rows.length,
      theme: theme,
      language: language
    });
  }; // Add keyboard-only focus styles


  var rootElement = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(null);
  var keyboardActiveProps = {
    onMouseDown: function onMouseDown() {
      rootElement.current.classList.remove('rt-keyboard-active');
    },
    onKeyDown: function onKeyDown() {
      rootElement.current.classList.add('rt-keyboard-active');
    },
    onKeyUp: function onKeyUp(e) {
      // Detect keyboard use when tabbing into the table
      var keyCode = e.which || e.keyCode;

      if (keyCode === 9) {
        rootElement.current.classList.add('rt-keyboard-active');
      }
    }
  }; // Provide keyboard access to scrollable tables. Make the table focusable,
  // but only when it has a scrollbar.

  var tableElement = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(null);

  var _React$useState7 = react__WEBPACK_IMPORTED_MODULE_0___default().useState(false),
      _React$useState8 = _slicedToArray(_React$useState7, 2),
      tableHasScrollbar = _React$useState8[0],
      setTableHasScrollbar = _React$useState8[1];

  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    var checkTableHasScrollbar = function checkTableHasScrollbar() {
      var _tableElement$current = tableElement.current,
          scrollHeight = _tableElement$current.scrollHeight,
          clientHeight = _tableElement$current.clientHeight,
          scrollWidth = _tableElement$current.scrollWidth,
          clientWidth = _tableElement$current.clientWidth;
      var hasScrollbar = scrollHeight > clientHeight || scrollWidth > clientWidth;
      setTableHasScrollbar(hasScrollbar);
    };

    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(function () {
        checkTableHasScrollbar();
      });
      resizeObserver.observe(tableElement.current);
      return function cleanup() {
        resizeObserver.disconnect();
      };
    } else {
      // Degrade gracefully on older browsers (e.g., Safari < 13)
      checkTableHasScrollbar();
    }
  }, []); // Send reactable state to Shiny for getReactableState

  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    // Ignore nested tables that aren't Shiny outputs
    if (!window.Shiny || !window.Shiny.onInputChange || nested) {
      return;
    } // Ensure this is a Shiny output, not a static rendered table in Shiny


    var outputId = rootElement.current.parentElement.getAttribute('data-reactable-output');

    if (!outputId) {
      return;
    } // Convert to R's 1-based indices


    var selectedIndexes = stateInfo.selected.map(function (index) {
      return index + 1;
    }); // Convert to R's 1-based indices

    var page = stateInfo.page + 1; // Convert sortBy array to named list of "asc" and "desc"

    var sorted = stateInfo.sorted.length > 0 ? {} : null;

    var _iterator2 = _createForOfIteratorHelper(stateInfo.sorted),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var sortInfo = _step2.value;
        sorted[sortInfo.id] = sortInfo.desc ? 'desc' : 'asc';
      } // NOTE: any object arrays will be simplified into vectors by jsonlite by default. Avoid sending
      // arrays without transforming them first, or adding a custom input type and input handler.

    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    var state = {
      page: page,
      pageSize: stateInfo.pageSize,
      pages: stateInfo.pages,
      sorted: sorted,
      selected: selectedIndexes
    }; // Shiny.onInputChange has built-in debouncing, so it's not strictly necessary to
    // debounce rapid state changes here.

    Object.keys(state).forEach(function (prop) {
      // NOTE: output IDs must always come first to work with Shiny modules
      window.Shiny.onInputChange("".concat(outputId, "__reactable__").concat(prop), state[prop]);
    });
  }, [nested, stateInfo.page, stateInfo.pageSize, stateInfo.pages, stateInfo.sorted, stateInfo.selected]); // Getter for the latest page count

  var getPageCount = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance.pageCount); // Add Shiny message handler for updateReactable

  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    // Ignore nested tables that aren't Shiny outputs
    if (!window.Shiny || nested) {
      return;
    } // Ensure this is a Shiny output, not a static rendered table in Shiny


    var outputId = rootElement.current.parentElement.getAttribute('data-reactable-output');

    if (!outputId) {
      return;
    }

    var setRowsSelected = instance.setRowsSelected;
    var gotoPage = instance.gotoPage;
    var toggleAllRowsExpanded = instance.toggleAllRowsExpanded;

    var updateState = function updateState(newState) {
      if (newState.jsEvals) {
        var _iterator3 = _createForOfIteratorHelper(newState.jsEvals),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var key = _step3.value;
            window.HTMLWidgets.evaluateStringMember(newState, key);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }

      if (newState.data != null) {
        var _data = (0,_columns__WEBPACK_IMPORTED_MODULE_12__.columnsToRows)(newState.data);

        setNewData(_data);
      }

      if (newState.selected != null) {
        var selectedRowIds = newState.selected.map(function (index) {
          return String(index);
        });
        setRowsSelected(selectedRowIds);
      }

      if (newState.page != null) {
        // Get the latest page count in case a data update changes the number of pages
        var nearestValidPage = Math.min(Math.max(newState.page, 0), Math.max(getPageCount() - 1, 0));
        gotoPage(nearestValidPage);
      }

      if (newState.expanded != null) {
        if (newState.expanded) {
          toggleAllRowsExpanded(true);
        } else {
          toggleAllRowsExpanded(false);
        }
      }

      if (newState.meta !== undefined) {
        setMeta(newState.meta);
      }
    };

    window.Shiny.addCustomMessageHandler("__reactable__".concat(outputId), updateState);
  }, [nested, instance.setRowsSelected, instance.gotoPage, instance.toggleAllRowsExpanded, getPageCount, setMeta]); // Set up Crosstalk and apply initial selection/filtering.
  // useLayoutEffect so the hook runs in order with other useLayoutEffect hooks.

  var ctRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef(null);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    if (!crosstalkGroup || !window.crosstalk) {
      return;
    }

    var ct = {};
    ct.selection = new window.crosstalk.SelectionHandle(crosstalkGroup);
    ct.filter = new window.crosstalk.FilterHandle(crosstalkGroup); // Keep track of selected and filtered state updated by other widgets.
    // SelectionHandle and FilterHandle also track state, but will include changes
    // coming from the table as well.

    ct.selected = ct.selection.value;
    ct.filtered = ct.filter.filteredKeys;
    ctRef.current = ct;
    var rowByKey = (crosstalkKey || []).reduce(function (obj, key, index) {
      obj[key] = index;
      return obj;
    }, {});
    var setFilter = instance.setFilter;
    var setRowsSelected = instance.setRowsSelected;

    var applyCrosstalkFilter = function applyCrosstalkFilter() {
      // Selection value is an array of keys, or null or empty array if empty
      // Filter value is an an array of keys, or null if empty
      var selectedKeys = ct.selected && ct.selected.length > 0 ? ct.selected : null;
      var filteredKeys = ct.filtered;
      var keys;

      if (!selectedKeys && !filteredKeys) {
        keys = null;
      } else if (!selectedKeys) {
        keys = filteredKeys;
      } else if (!filteredKeys) {
        keys = selectedKeys;
      } else {
        keys = selectedKeys.filter(function (key) {
          return filteredKeys.includes(key);
        });
      }

      var filteredRows = keys ? keys.map(function (key) {
        return rowByKey[key];
      }) : null;
      setFilter(crosstalkId, filteredRows);
    };

    var setCrosstalkSelection = function setCrosstalkSelection(value) {
      if (ct.selected !== value) {
        ct.selected = value;
        applyCrosstalkFilter();
      }
    };

    var setCrosstalkFilter = function setCrosstalkFilter(value) {
      if (ct.filtered !== value) {
        ct.filtered = value;
        applyCrosstalkFilter();
      }
    };

    ct.selection.on('change', function (e) {
      if (e.sender !== ct.selection) {
        setCrosstalkSelection(e.value); // Selections from other widgets should clear table selection state

        ct.skipNextSelection = true;
        setRowsSelected([]);
      } else {
        // Selections from table should clear selections from other widgets
        setCrosstalkSelection(null);
      }
    });
    ct.filter.on('change', function (e) {
      if (e.sender !== ct.filter) {
        setCrosstalkFilter(e.value);
      }
    }); // Apply initial filter/selection for dynamically rendered tables (e.g., nested tables, Shiny outputs)

    if (ct.selected || ct.filtered) {
      applyCrosstalkFilter();
    }

    return function cleanup() {
      // Prevent errors from other widgets from breaking the table, e.g.,
      // https://github.com/ropensci/plotly/issues/1346
      try {
        ct.selection.close();
      } catch (e) {
        console.error('Error closing Crosstalk selection handle:', e);
      }

      try {
        ct.filter.close();
      } catch (e) {
        console.error('Error closing Crosstalk filter handle:', e);
      }
    };
  }, [crosstalkKey, crosstalkGroup, crosstalkId, instance.setFilter, instance.setRowsSelected]); // Don't set Crosstalk selection on initial render

  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    if (!ctRef.current) {
      return;
    }

    if (!defaultSelected) {
      ctRef.current.skipNextSelection = true;
    }
  }, [defaultSelected]); // Set Crosstalk selection. useLayoutEffect to avoid visual flickering when
  // selecting a row and clearing a pre-existing selection at the same time.

  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.safeUseLayoutEffect)(function () {
    if (!ctRef.current || !selection) {
      return;
    }

    var ct = ctRef.current; // Some selections don't update Crosstalk state, like selection clears from
    // other widget selections

    if (ct.skipNextSelection) {
      ct.skipNextSelection = false;
      return;
    }

    var selectedKeys = Object.keys(state.selectedRowIds).map(function (id) {
      return crosstalkKey[rowsById[id].index];
    }); // Prevent errors from other widgets from breaking the table, e.g.,
    // https://github.com/ropensci/plotly/issues/1346

    try {
      ct.selection.set(selectedKeys);
    } catch (e) {
      console.error('Error selecting Crosstalk keys:', e);
    }
  }, [state.selectedRowIds, rowsById, selection, crosstalkKey]); // Expose a limited JavaScript API to the table instance

  instance.state = stateInfo;

  instance.downloadDataCSV = function () {
    var filename = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'data.csv';
    // Ensure rows are flattened and ignore sort order. Unlike instance.flatRows,
    // instance.preGroupedRows excludes aggregated rows and uses the original data order.
    // Also ignore columns without data (e.g., selection or details columns) using
    // row.original rather than row.values.
    var csv = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.rowsToCSV)(instance.preGroupedRows.map(function (row) {
      return row.original;
    }));
    (0,_utils__WEBPACK_IMPORTED_MODULE_15__.downloadCSV)(csv, filename);
  };

  instance.setMeta = setMeta;

  instance.setData = function (data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    options = Object.assign({
      resetSelected: true,
      resetExpanded: false
    }, options);

    if (_typeof(data) !== 'object' || data == null) {
      throw new Error('data must be an array of row objects or an object containing column arrays');
    }

    if (!Array.isArray(data)) {
      data = (0,_columns__WEBPACK_IMPORTED_MODULE_12__.columnsToRows)(data);
    }

    setNewData(data);

    if (options.resetSelected) {
      instance.setRowsSelected([]);
    }

    if (options.resetExpanded) {
      instance.toggleAllRowsExpanded(false);
    }
  };

  var stateCallbacks = react__WEBPACK_IMPORTED_MODULE_0___default().useRef([]);

  instance.onStateChange = function (listenerFn) {
    if (typeof listenerFn !== 'function') {
      throw new Error('listenerFn must be a function');
    }

    stateCallbacks.current.push(listenerFn);
    return function cancel() {
      stateCallbacks.current = stateCallbacks.current.filter(function (cb) {
        return cb !== listenerFn;
      });
    };
  }; // Debounce rapid state changes. Some actions can cause the table to render twice, e.g., when
  // sorting and the pageIndex is automatically reset to 0 via an internal side effect.


  var onStateChange = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.useAsyncDebounce)(function (state) {
    stateCallbacks.current.forEach(function (cb) {
      cb(state);
    });
  }, 0);
  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    onStateChange(stateInfo);
  }, [stateInfo, onStateChange]);
  var getTableInstance = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(function () {
    // For static rendered tables, the instance ID is the element ID. For Shiny outputs,
    // the instance ID is the Shiny output ID, although the element ID may override it.
    var instanceId = elementId;

    if (!instanceId) {
      instanceId = rootElement.current.parentElement.getAttribute('data-reactable-output');
    }

    if (!instanceId) {
      return;
    }

    tableInstances[instanceId] = getTableInstance;
    return function cleanup() {
      delete tableInstances[instanceId];
    };
  }, [elementId, getTableInstance]);
  className = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)(className, (0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.style), outlined && 'rt-outlined', bordered && 'rt-bordered', borderless && 'rt-borderless', compact && 'rt-compact', nowrap && 'rt-nowrap', inline && ' rt-inline');
  style = _objectSpread({
    width: width,
    height: height
  }, style);
  var isResizing = state.columnResizing.isResizingColumn != null;
  var tableClassName = (0,_utils__WEBPACK_IMPORTED_MODULE_15__.classNames)((0,_theme__WEBPACK_IMPORTED_MODULE_14__.css)(theme.tableStyle), isResizing && 'rt-resizing');
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RootComponent, _extends({
    ref: rootElement
  }, keyboardActiveProps, {
    className: className,
    style: style
  }), makeSearch(), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TableComponent, {
    ref: tableElement,
    tabIndex: tableHasScrollbar ? 0 : null,
    className: tableClassName
  }, makeThead(), makeTbody(), makeTfoot()), makePagination());
}

Reactable.propTypes = {
  data: prop_types__WEBPACK_IMPORTED_MODULE_18___default().objectOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().array)).isRequired,
  columns: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().object)).isRequired,
  columnGroups: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().object)),
  groupBy: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)),
  sortable: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  resizable: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  filterable: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  searchable: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  searchMethod: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func),
  defaultSortDesc: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  defaultSorted: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf(prop_types__WEBPACK_IMPORTED_MODULE_18___default().shape({
    id: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
    desc: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool)
  })),
  pagination: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  defaultPageSize: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().number),
  pageSizeOptions: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().number)),
  paginationType: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOf(['numbers', 'jump', 'simple']),
  showPagination: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  showPageSizeOptions: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  showPageInfo: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  minRows: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().number),
  paginateSubRows: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  defaultExpanded: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  selection: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOf(['multiple', 'single']),
  selectionId: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  // Deprecated in v0.3.0
  defaultSelected: prop_types__WEBPACK_IMPORTED_MODULE_18___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_18___default().number)),
  onClick: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOf(['expand', 'select']), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func)]),
  outlined: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  bordered: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  borderless: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  striped: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  highlight: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  compact: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  nowrap: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  showSortIcon: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  showSortable: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  className: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  style: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().object),
  rowClassName: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOfType([(prop_types__WEBPACK_IMPORTED_MODULE_18___default().string), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().array)]),
  rowStyle: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOfType([(prop_types__WEBPACK_IMPORTED_MODULE_18___default().object), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().func), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().array)]),
  inline: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  width: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOfType([(prop_types__WEBPACK_IMPORTED_MODULE_18___default().string), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().number)]),
  height: prop_types__WEBPACK_IMPORTED_MODULE_18___default().oneOfType([(prop_types__WEBPACK_IMPORTED_MODULE_18___default().string), (prop_types__WEBPACK_IMPORTED_MODULE_18___default().number)]),
  theme: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().object),
  language: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().object),
  meta: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().object),
  crosstalkKey: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().array),
  crosstalkGroup: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  crosstalkId: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  elementId: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string),
  nested: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().bool),
  dataKey: (prop_types__WEBPACK_IMPORTED_MODULE_18___default().string)
};
Reactable.defaultProps = {
  sortable: true,
  pagination: true,
  defaultPageSize: 10,
  paginationType: 'numbers',
  pageSizeOptions: [10, 25, 50, 100],
  showPageInfo: true,
  minRows: 1,
  showSortIcon: true,
  crosstalkId: '__crosstalk__'
};

/***/ }),

/***/ "./srcjs/WidgetContainer.js":
/*!**********************************!*\
  !*** ./srcjs/WidgetContainer.js ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WidgetContainer; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }





var WidgetContainer = /*#__PURE__*/function (_React$Component) {
  _inherits(WidgetContainer, _React$Component);

  var _super = _createSuper(WidgetContainer);

  function WidgetContainer() {
    _classCallCheck(this, WidgetContainer);

    return _super.apply(this, arguments);
  }

  _createClass(WidgetContainer, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.staticRender();
    }
  }, {
    key: "staticRender",
    value: function staticRender() {
      if (!window.HTMLWidgets) {
        return;
      }

      if (!WidgetContainer.throttled) {
        window.HTMLWidgets.staticRender(); // Throttle static rendering since it targets the entire document

        WidgetContainer.throttled = true;
        setTimeout(function () {
          if (WidgetContainer.lastCall) {
            window.HTMLWidgets.staticRender();
          }

          WidgetContainer.throttled = false;
          WidgetContainer.lastCall = false;
        });
      } else {
        WidgetContainer.lastCall = true;
      }
    }
  }, {
    key: "render",
    value: function render() {
      // Don't serialize HTML widget HTML/scripts when server-side rendering:
      // 1. Most HTML widgets are client-side rendered and wouldn't benefit much from SSR.
      // 2. This keeps the initial HTML payload slim, as the widget script data would be
      //    unnecessarily duplicated.
      // 3. Problems can occur when multiple instances of the same HTML widget type
      //    are embedded in different tables, and the global HTMLWidgets.staticRender()
      //    renders HTML widgets in other tables before those other tables are hydrated
      //    (each table lives in its own React root). When other tables are hydrated,
      //    the HTML widgets there will get wiped out, but not rerendered on the next
      //    staticRender() because the root widget element is already marked as
      //    html-widget-static-bound. This also helps keep the initial HTML payload slim,
      //    as the widget script data would get unnecessarily duplicated.
      if (!(0,_utils__WEBPACK_IMPORTED_MODULE_1__.isBrowser)()) {
        return null;
      }

      return this.props.children;
    }
  }]);

  return WidgetContainer;
}((react__WEBPACK_IMPORTED_MODULE_0___default().Component));


WidgetContainer.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().node)
};

/***/ }),

/***/ "./srcjs/aggregators.js":
/*!******************************!*\
  !*** ./srcjs/aggregators.js ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "count": function() { return /* binding */ count; },
/* harmony export */   "frequency": function() { return /* binding */ frequency; },
/* harmony export */   "getAggregateFunction": function() { return /* binding */ getAggregateFunction; },
/* harmony export */   "isNA": function() { return /* binding */ isNA; },
/* harmony export */   "max": function() { return /* binding */ max; },
/* harmony export */   "maxNumber": function() { return /* binding */ maxNumber; },
/* harmony export */   "mean": function() { return /* binding */ mean; },
/* harmony export */   "median": function() { return /* binding */ median; },
/* harmony export */   "min": function() { return /* binding */ min; },
/* harmony export */   "minNumber": function() { return /* binding */ minNumber; },
/* harmony export */   "normalizeNumber": function() { return /* binding */ normalizeNumber; },
/* harmony export */   "round": function() { return /* binding */ round; },
/* harmony export */   "sum": function() { return /* binding */ sum; },
/* harmony export */   "unique": function() { return /* binding */ unique; }
/* harmony export */ });
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function sum(values) {
  var numbers = toNumbers(values);

  if (numbers.length === 0) {
    return 0;
  }

  var result = numbers.reduce(function (a, b) {
    return a + b;
  }, 0); // Adjust for floating-point precision errors

  return round(result, 12);
}
function mean(values) {
  var numbers = toNumbers(values);

  if (numbers.length === 0) {
    return NaN;
  }

  var result = sum(numbers) / numbers.length; // Adjust for floating-point precision errors

  return round(result, 12);
}
function maxNumber(values) {
  var numbers = toNumbers(values);

  if (numbers.length === 0) {
    return NaN;
  }

  return Math.max.apply(null, numbers);
}
function minNumber(values) {
  var numbers = toNumbers(values);

  if (numbers.length === 0) {
    return NaN;
  }

  return Math.min.apply(null, numbers);
}
function median(values) {
  var numbers = toNumbers(values);

  if (numbers.length === 0) {
    return NaN;
  }

  numbers.sort(function (a, b) {
    return a - b;
  });

  if (numbers.length % 2 === 1) {
    return numbers[(numbers.length - 1) / 2];
  } else {
    return mean(numbers.slice(numbers.length / 2 - 1, numbers.length / 2 + 1));
  }
}
function max(values) {
  var maxValue;
  values.forEach(function (value) {
    if (maxValue == null || value > maxValue) {
      maxValue = value;
    }
  });
  return maxValue;
}
function min(values) {
  var minValue;
  values.forEach(function (value) {
    if (minValue == null || value < minValue) {
      minValue = value;
    }
  });
  return minValue;
}
function count(values) {
  return values.length;
}
function unique(values) {
  return _toConsumableArray(new Set(values)).join(', ');
}
function frequency(values) {
  var counts = {};
  values.forEach(function (value) {
    counts[value] = counts[value] || 0;
    counts[value] += 1;
  });
  var strs = Object.keys(counts).map(function (val) {
    return val + (counts[val] > 1 ? " (".concat(counts[val], ")") : '');
  });
  return strs.join(', ');
}
var numericAggregators = {
  mean: mean,
  sum: sum,
  max: maxNumber,
  min: minNumber,
  median: median
};
var defaultAggregators = {
  max: max,
  min: min,
  count: count,
  unique: unique,
  frequency: frequency
};
function getAggregateFunction(name, type) {
  if (type === 'numeric' && numericAggregators[name]) {
    return numericAggregators[name];
  }

  return defaultAggregators[name];
}
function round(n) {
  var digits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;

  if (!Number.isFinite(n)) {
    return n;
  }

  digits = digits > 0 ? digits : 0;
  var c = Math.pow(10, digits); // Round away from zero rather than up (Math.round rounds -1.5 to -1)

  return Math.sign(n) * Math.round(Math.abs(n) * c) / c;
}

function toNumbers(values) {
  return values.map(normalizeNumber).filter(function (n) {
    return !Number.isNaN(n);
  });
}

function normalizeNumber(n) {
  if (typeof n === 'number') {
    return n;
  }

  if (n == null || isNA(n)) {
    return NaN;
  }

  if (n === 'Inf') {
    return Infinity;
  }

  if (n === '-Inf') {
    return -Infinity;
  }

  return Number(n);
}
function isNA(value) {
  return value === 'NA' || value === 'NaN';
}

/***/ }),

/***/ "./srcjs/columns.js":
/*!**************************!*\
  !*** ./srcjs/columns.js ***!
  \**************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RawHTML": function() { return /* binding */ RawHTML; },
/* harmony export */   "addColumnGroups": function() { return /* binding */ addColumnGroups; },
/* harmony export */   "buildColumnDefs": function() { return /* binding */ buildColumnDefs; },
/* harmony export */   "columnsToRows": function() { return /* binding */ columnsToRows; },
/* harmony export */   "createCompareFunction": function() { return /* binding */ createCompareFunction; },
/* harmony export */   "createStartsWithMatcher": function() { return /* binding */ createStartsWithMatcher; },
/* harmony export */   "createSubstringMatcher": function() { return /* binding */ createSubstringMatcher; },
/* harmony export */   "emptyValue": function() { return /* binding */ emptyValue; },
/* harmony export */   "formatValue": function() { return /* binding */ formatValue; },
/* harmony export */   "getSubRows": function() { return /* binding */ getSubRows; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var reactR__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! reactR */ "reactR");
/* harmony import */ var reactR__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(reactR__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _WidgetContainer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./WidgetContainer */ "./srcjs/WidgetContainer.js");
/* harmony import */ var _aggregators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./aggregators */ "./srcjs/aggregators.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
var _excluded = ["html", "className"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }





 // Use zero-width spaces to preserve the height of empty cells

var emptyValue = "\u200B"; // Override default subRows property

var subRowsKey = '.subRows';
function getSubRows(row) {
  return row[subRowsKey] || [];
} // Convert column-based data to rows
// e.g. { a: [1, 2], b: ['x', 'y'] } to [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]

function columnsToRows(columns) {
  var names = Object.keys(columns);

  if (names.length === 0) {
    return [];
  }

  var rows = new Array(columns[names[0]].length);

  for (var i = 0; i < rows.length; i++) {
    rows[i] = {};

    var _iterator = _createForOfIteratorHelper(names),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var name = _step.value;
        var value = columns[name][i];

        if (name === subRowsKey) {
          if (value instanceof Object) {
            rows[i][name] = columnsToRows(value);
          }
        } else {
          rows[i][name] = value;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  return rows;
}
function RawHTML(_ref) {
  var html = _ref.html,
      className = _ref.className,
      props = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", _extends({
    // Ensure text is truncated with ellipsis when text wrapping is off
    className: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)('rt-text-content', className),
    dangerouslySetInnerHTML: {
      __html: html
    }
  }, props));
}
function buildColumnDefs(columns, groups) {
  var tableProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var sortable = tableProps.sortable,
      defaultSortDesc = tableProps.defaultSortDesc,
      showSortIcon = tableProps.showSortIcon,
      showSortable = tableProps.showSortable,
      filterable = tableProps.filterable,
      resizable = tableProps.resizable;
  columns = columns.map(function (column) {
    var col = _objectSpread({}, column); // Always access column data by ID, not a path with periods or brackets


    col.accessor = function (row) {
      return row[col.id];
    };

    if (typeof col.aggregate === 'string') {
      col.aggregate = (0,_aggregators__WEBPACK_IMPORTED_MODULE_3__.getAggregateFunction)(col.aggregate, col.type);
    }

    var sortMethod = createCompareFunction({
      type: col.type,
      naLast: col.sortNALast
    });

    col.sortType = function sortType(a, b, id, desc) {
      return sortMethod(a.values[id], b.values[id], desc);
    }; // Translate v6 props (e.g. sortable) to v7 (e.g. disableSortBy)


    col.sortable = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(col.sortable, sortable);
    col.disableSortBy = !col.sortable;
    col.defaultSortDesc = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(col.defaultSortDesc, defaultSortDesc);
    col.sortDescFirst = col.defaultSortDesc;
    col.filterable = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(col.filterable, filterable);
    col.disableFilters = !col.filterable;

    if (col.searchable === false) {
      col.disableGlobalFilter = true;
    } // Disable searching for hidden columns by default, but still allow it if requested


    if (col.show === false && col.searchable !== true) {
      col.disableGlobalFilter = true;
    } // Default column filters
    //  - numeric columns: string starts with
    //  - other columns: case-insensitive substring


    if (col.type === 'numeric') {
      col.createMatcher = createStartsWithMatcher;
    } else {
      col.createMatcher = createSubstringMatcher;
    }

    col.filter = function (rows, columnIds, filterValue) {
      // For individual column filters, columnIds will always contain one column ID
      var id = columnIds[0];

      if (typeof col.filterMethod === 'function') {
        return col.filterMethod(rows, id, filterValue);
      }

      var match = col.createMatcher(filterValue);
      return rows.filter(function (row) {
        var value = row.values[id];
        return match(value);
      });
    };

    if (col.type === 'numeric') {
      // Right-align numbers by default
      col.align = col.align || 'right';
    } else {
      col.align = col.align || 'left';
    }

    col.vAlign = col.vAlign || 'top';
    col.headerVAlign = col.headerVAlign || 'top';
    var width = col.width,
        minWidth = col.minWidth,
        maxWidth = col.maxWidth;
    col.minWidth = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(width, minWidth, 100);
    col.maxWidth = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(width, maxWidth, Number.MAX_SAFE_INTEGER); // maxWidth takes priority over minWidth

    col.minWidth = Math.min(col.minWidth, col.maxWidth); // Start column width at min width / flex width, like in v6

    col.width = col.minWidth;
    col.resizable = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getFirstDefined)(col.resizable, resizable); // Disable resizing on fixed width columns

    if (col.minWidth === col.maxWidth) {
      col.resizable = false;
    }

    col.disableResizing = !col.resizable;

    col.Cell = function Cell(cellInfo, state) {
      var value = cellInfo.value;
      var isMissingValue = value == null || col.type === 'numeric' && (0,_aggregators__WEBPACK_IMPORTED_MODULE_3__.isNA)(value);

      if (isMissingValue) {
        value = col.na;
      }

      if (!isMissingValue && col.format && col.format.cell) {
        value = formatValue(value, col.format.cell);
      }

      if (col.cell) {
        if (typeof col.cell === 'function') {
          value = col.cell(_objectSpread(_objectSpread({}, cellInfo), {}, {
            value: value
          }), state);
        } // Make sure we don't render aggregated cells for R renderers


        if (Array.isArray(col.cell) && !cellInfo.aggregated) {
          value = col.cell[cellInfo.index];

          if (value) {
            value = (0,reactR__WEBPACK_IMPORTED_MODULE_1__.hydrate)({
              Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
              WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_2__["default"]
            }, value);
          }
        }
      } // Use zero-width spaces to preserve the height of blank cells


      if (value == null || value === '') {
        value = emptyValue;
      }

      var content;

      if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(value)) {
        content = value;
      } else if (col.html) {
        // Render inline to align with the expander
        content = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
          style: {
            display: 'inline'
          },
          html: value
        });
      } else {
        content = String(value);
      }

      return content;
    };

    if (col.grouped) {
      col.Grouped = function Grouped(cellInfo, state) {
        var value = cellInfo.value;
        var isMissingValue = value == null || col.type === 'numeric' && (0,_aggregators__WEBPACK_IMPORTED_MODULE_3__.isNA)(value);

        if (isMissingValue) {
          value = col.na;
        }

        if (!isMissingValue && col.format && col.format.cell) {
          value = formatValue(value, col.format.cell);
        }

        value = col.grouped(_objectSpread(_objectSpread({}, cellInfo), {}, {
          value: value
        }), state); // Use zero-width spaces to preserve the height of blank cells

        if (value == null || value === '') {
          value = emptyValue;
        }

        var content;

        if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(value)) {
          content = value;
        } else if (col.html) {
          // Render inline to align with the expander
          content = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
            style: {
              display: 'inline'
            },
            html: value
          });
        } else {
          content = String(value);
        }

        return content;
      };
    } else {
      // Render grouped values the same as regular cells
      col.Grouped = function Grouped(cellInfo, state) {
        var value = col.Cell(cellInfo, state);
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, value, cellInfo.subRows && " (".concat(cellInfo.subRows.length, ")"));
      };
    }

    col.Aggregated = function Aggregated(cellInfo, state) {
      var value = cellInfo.value;

      if (value != null && col.format && col.format.aggregated) {
        value = formatValue(value, col.format.aggregated);
      }

      if (col.aggregated) {
        value = col.aggregated(_objectSpread(_objectSpread({}, cellInfo), {}, {
          value: value
        }), state);
      }

      if (value == null) {
        value = '';
      }

      var content;

      if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(value)) {
        content = value;
      } else if (col.html) {
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
          html: value
        });
      } else {
        content = String(value);
      }

      return content;
    };

    col.Header = function Header(column, state) {
      var header = col.name;

      if (col.header != null) {
        if (typeof col.header === 'function') {
          header = col.header(column, state);
        } else {
          header = (0,reactR__WEBPACK_IMPORTED_MODULE_1__.hydrate)({
            Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
            WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_2__["default"]
          }, col.header);
        }
      }

      var content;

      if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(header)) {
        content = header;
      } else if (col.html) {
        content = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
          html: header
        });
      } else {
        content = header != null ? String(header) : '';
      } // Add sort icon to column header


      if (col.sortable && showSortIcon) {
        var sortClass = showSortable ? 'rt-sort' : ''; // Ensure text is truncated with an ellipsis when text wrapping is off.
        // The outer container is a flex container, so we need to wrap text in a
        // block element to allow text to shrink below their minimum content size.

        content = col.html ? content : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
          className: "rt-text-content"
        }, content);

        if (col.align === 'right') {
          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
            className: "rt-sort-header"
          }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(sortClass, 'rt-sort-left'),
            "aria-hidden": "true"
          }), content);
        } else {
          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
            className: "rt-sort-header"
          }, content, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
            className: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(sortClass, 'rt-sort-right'),
            "aria-hidden": "true"
          }));
        }
      }

      return content;
    };

    if (col.footer != null) {
      col.Footer = function Footer(column, state) {
        var footer;

        if (typeof col.footer === 'function') {
          footer = col.footer(column, state);
        } else {
          footer = (0,reactR__WEBPACK_IMPORTED_MODULE_1__.hydrate)({
            Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
            WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_2__["default"]
          }, col.footer);
        }

        if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(footer)) {
          return footer;
        } else if (col.html) {
          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
            html: footer
          });
        } else {
          return footer != null ? String(footer) : '';
        }
      };
    } else {
      // Set default content for an empty footer (otherwise defaults to &nbsp;)
      col.Footer = emptyValue;
    }

    var colAlignClass = getAlignClass(col.align);
    var cellVAlignClass = getVAlignClass(col.vAlign);
    var headerVAlignClass = getVAlignClass(col.headerVAlign);
    col.headerClassName = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(colAlignClass, headerVAlignClass, col.headerClassName);
    col.footerClassName = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(colAlignClass, cellVAlignClass, col.footerClassName);

    col.getProps = function (rowInfo, column, state) {
      var props = {
        className: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(colAlignClass, cellVAlignClass)
      };

      if (col.className) {
        var className;

        if (typeof col.className === 'function') {
          className = col.className(rowInfo, column, state);
        } else if (Array.isArray(col.className)) {
          className = col.className[rowInfo.index];
        } else {
          className = col.className;
        }

        props.className = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(props.className, className);
      }

      if (col.style) {
        var style;

        if (typeof col.style === 'function') {
          style = col.style(rowInfo, column, state);
        } else if (Array.isArray(col.style)) {
          style = col.style[rowInfo.index];
        } else {
          style = col.style;
        }

        props.style = style;
      }

      return props;
    };

    return col;
  });

  if (groups) {
    columns = addColumnGroups(columns, groups);
    columns.forEach(function (col, i) {
      // The column group ID is arbitrary and just has to be unique
      col.id = "group_".concat(i);

      if (col.name != null || col.header != null) {
        col.Header = function Header(column, state) {
          var header = col.name;

          if (col.header) {
            if (typeof col.header === 'function') {
              header = col.header(column, state);
            } else {
              header = (0,reactR__WEBPACK_IMPORTED_MODULE_1__.hydrate)({
                Fragment: react__WEBPACK_IMPORTED_MODULE_0__.Fragment,
                WidgetContainer: _WidgetContainer__WEBPACK_IMPORTED_MODULE_2__["default"]
              }, col.header);
            }
          }

          if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(header)) {
            return header;
          } else if (col.html) {
            return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RawHTML, {
              html: header
            });
          } else {
            return header != null ? String(header) : '';
          }
        };
      } else {
        col.Header = emptyValue;
      } // Enable resizing if a single leaf column can be resized


      var leafColumns = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getLeafColumns)(col);

      if (leafColumns.every(function (col) {
        return col.disableResizing;
      })) {
        col.disableResizing = true;
      }

      col.align = col.align || 'center';
      col.headerVAlign = col.headerVAlign || 'top';
      var colAlignClass = getAlignClass(col.align);
      var headerVAlignClass = getVAlignClass(col.headerVAlign);
      col.headerClassName = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.classNames)(colAlignClass, headerVAlignClass, col.headerClassName);
    });
  }

  return columns;
} // Add groups to an array of column definitions

function addColumnGroups(columns, groups) {
  groups.forEach(function (group) {
    group = _objectSpread({}, group);
    var groupIds = group.columns;
    group.columns = [];
    columns = columns.reduce(function (newCols, col) {
      if (col.id === groupIds[0]) {
        newCols.push(group);
        group.columns.push(col);
      } else if (groupIds.includes(col.id)) {
        group.columns.push(col);
      } else {
        newCols.push(col);
      }

      return newCols;
    }, []);
  }); // Create column groups for ungrouped columns, combining adjacent columns

  var newCols = [];
  var lastGroup;
  columns.forEach(function (col) {
    if (col.columns) {
      // Already a header group
      newCols.push(col);
      lastGroup = null;
    } else {
      // Individual column
      if (!lastGroup) {
        lastGroup = {
          columns: [],
          isUngrouped: true
        };
        newCols.push(lastGroup);
      }

      lastGroup.columns.push(col);
    }
  });
  columns = newCols;
  return columns;
} // Compare function that handles numbers (NAs and Inf/-Inf) and optionally
// sorts missing values (NA, NaN, NULL) last.

function createCompareFunction() {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      type = _ref2.type,
      naLast = _ref2.naLast;

  return function compare(a, b, desc) {
    if (type === 'numeric') {
      a = (0,_aggregators__WEBPACK_IMPORTED_MODULE_3__.normalizeNumber)(a);
      b = (0,_aggregators__WEBPACK_IMPORTED_MODULE_3__.normalizeNumber)(b);
      a = Number.isNaN(a) ? null : a;
      b = Number.isNaN(b) ? null : b;
    } else {
      a = typeof a === 'string' ? a.toLowerCase() : a;
      b = typeof b === 'string' ? b.toLowerCase() : b;
    }

    if (a === b) {
      return 0;
    }

    if (a == null) {
      if (naLast) return desc ? -1 : 1;
      return -1;
    }

    if (b == null) {
      if (naLast) return desc ? 1 : -1;
      return 1;
    }

    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1;
    }

    return 0;
  };
}
function formatValue(value, options) {
  var prefix = options.prefix,
      suffix = options.suffix,
      digits = options.digits,
      separators = options.separators,
      percent = options.percent,
      currency = options.currency,
      datetime = options.datetime,
      date = options.date,
      time = options.time,
      hour12 = options.hour12,
      locales = options.locales;

  if (typeof value === 'number') {
    if (separators || percent || currency || digits != null || locales) {
      // While Number.toLocaleString supports up to 20 fraction digits,
      // IE11 only supports up to 18 digits when formatting as percentages.
      var maximumFractionDigits = 18;
      var _options = {
        useGrouping: separators ? true : false
      };

      if (percent) {
        _options.style = 'percent'; // Use lower fraction digits to mitigate floating-point precision errors with
        // percent formatting, which can happen when using the Intl polyfill in V8.
        // This is the same as the rounding digits used by the aggregators.

        maximumFractionDigits = 12;
      }

      if (currency) {
        _options.style = 'currency';
        _options.currency = currency;
      } else if (digits != null) {
        _options.minimumFractionDigits = Math.min(digits, maximumFractionDigits);
        _options.maximumFractionDigits = Math.min(digits, maximumFractionDigits);
      } else {
        _options.maximumFractionDigits = maximumFractionDigits;
      }

      value = value.toLocaleString(locales || undefined, _options);
    }
  }

  if (datetime || date || time) {
    locales = locales || undefined;
    var _options2 = {};

    if (hour12 != null) {
      _options2.hour12 = hour12;
    }

    if (datetime) {
      value = new Date(value).toLocaleString(locales, _options2);
    } else if (date) {
      // Format YYYY-MM-DD dates in local time, not UTC.
      // Ignore ISO 8601 dates otherwise, i.e., YYYY-MM-DDTHH:MM:SS[Z]
      // http://blog.dygraphs.com/2012/03/javascript-and-dates-what-mess.html
      if (value.includes('-') && !value.includes('T') && !value.includes('Z')) {
        value = value.replace(/-/g, '/');
      }

      value = new Date(value).toLocaleDateString(locales, _options2);
    } else if (time) {
      value = new Date(value).toLocaleTimeString(locales, _options2);
    }
  }

  if (prefix != null) {
    value = value != null ? value : '';
    value = String(prefix) + value;
  }

  if (suffix != null) {
    value = value != null ? value : '';
    value = value + String(suffix);
  }

  return value;
}
function createStartsWithMatcher(str) {
  var regex = new RegExp('^' + (0,_utils__WEBPACK_IMPORTED_MODULE_4__.escapeRegExp)(str), 'i');
  return function (value) {
    // Ignore columns without data (don't match on "undefined"). This shouldn't
    // happen unless a data-less column (e.g., selection) is manually filtered via API.
    if (value === undefined) {
      return false;
    }

    return regex.test(value);
  };
}
function createSubstringMatcher(str) {
  var regex = new RegExp((0,_utils__WEBPACK_IMPORTED_MODULE_4__.escapeRegExp)(str), 'i');
  return function (value) {
    // Ignore columns without data (don't match on "undefined"). This shouldn't
    // happen unless a data-less column (e.g., selection) is manually filtered via API.
    if (value === undefined) {
      return false;
    }

    return regex.test(value);
  };
}

function getAlignClass(align) {
  return "rt-align-".concat(align);
}

function getVAlignClass(vAlign) {
  if (vAlign === 'top') {
    return '';
  }

  return "rt-valign-".concat(vAlign);
}

/***/ }),

/***/ "./srcjs/language.js":
/*!***************************!*\
  !*** ./srcjs/language.js ***!
  \***************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultLanguage": function() { return /* binding */ defaultLanguage; },
/* harmony export */   "renderTemplate": function() { return /* binding */ renderTemplate; }
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var defaultLanguage = {
  // Sorting
  sortLabel: 'Sort {name}',
  // Filters
  filterPlaceholder: '',
  filterLabel: 'Filter {name}',
  // Search
  searchPlaceholder: 'Search',
  searchLabel: 'Search',
  // Tables
  noData: 'No rows found',
  // Pagination
  pageNext: 'Next',
  pagePrevious: 'Previous',
  pageNumbers: '{page} of {pages}',
  pageInfo: "{rowStart}".concat(String.fromCharCode(0x2013), "{rowEnd} of {rows} rows"),
  pageSizeOptions: 'Show {rows}',
  pageNextLabel: 'Next page',
  pagePreviousLabel: 'Previous page',
  pageNumberLabel: 'Page {page}',
  pageJumpLabel: 'Go to page',
  pageSizeOptionsLabel: 'Rows per page',
  // Column groups
  groupExpandLabel: 'Toggle group',
  // Row details
  detailsExpandLabel: 'Toggle details',
  // Selection
  selectAllRowsLabel: 'Select all rows',
  selectAllSubRowsLabel: 'Select all rows in group',
  selectRowLabel: 'Select row',
  // Deprecated in v0.3.0
  defaultGroupHeader: 'Grouped',
  detailsCollapseLabel: 'Toggle details',
  deselectAllRowsLabel: 'Deselect all rows',
  deselectAllSubRowsLabel: 'Deselect all rows in group',
  deselectRowLabel: 'Deselect row'
};
function renderTemplate(template) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!template || !params) {
    return template;
  }

  var keys = Object.keys(params);
  var separator = '(' + keys.map(function (key) {
    return "{".concat(key, "}");
  }).join('|') + ')';
  var strings = template.split(new RegExp(separator));
  var templateParams = keys.reduce(function (obj, key) {
    obj["{".concat(key, "}")] = params[key];
    return obj;
  }, {});
  var rendered = strings.map(function (s) {
    return templateParams[s] != null ? templateParams[s] : s;
  });

  if (rendered.some(function (val) {
    return _typeof(val) === 'object';
  })) {
    return rendered;
  }

  return rendered.join('');
}

/***/ }),

/***/ "./srcjs/reactR.js":
/*!*************************!*\
  !*** ./srcjs/reactR.js ***!
  \*************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hydrate": function() { return /* binding */ hydrate; },
/* harmony export */   "reactWidget": function() { return /* binding */ reactWidget; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "react-dom");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/*
 * Adapted from reactR 0.4.4 (https://github.com/react-R/reactR/blob/v0.4.4/srcjs/widget.js)
 * Copyright 2018 Kent Russell
 * Licensed under MIT (https://github.com/react-R/reactR/blob/v0.4.4/LICENSE)
 */

 // Modified reactWidget() that additionally supports hydration of server-rendered markup.

function reactWidget(name, type, components) {
  window.HTMLWidgets.widget({
    name: name,
    type: type,
    factory: function factory(el) {
      return {
        renderValue: function renderValue(value) {
          if (el.hasAttribute('data-react-ssr')) {
            react_dom__WEBPACK_IMPORTED_MODULE_1___default().hydrate(hydrate(components, value.tag), el);
          } else {
            react_dom__WEBPACK_IMPORTED_MODULE_1___default().render(hydrate(components, value.tag), el);
          }
        },
        resize: function resize() {// resize() is required, but unused
        }
      };
    }
  });
} // Must be bundled because react-tools.js needs to be run in a browser context
// and can't be sourced at runtime in V8.

function hydrate(components, tag) {
  if (typeof tag === 'string') return tag;

  if (tag.name[0] === tag.name[0].toUpperCase() && !components[tag.name]) {
    throw new Error('Unknown component: ' + tag.name);
  }

  var elem = components[tag.name] || tag.name;
  var args = [elem, tag.attribs];

  var _iterator = _createForOfIteratorHelper(tag.children),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var child = _step.value;
      args.push(hydrate(components, child));
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement.apply((react__WEBPACK_IMPORTED_MODULE_0___default()), args);
}

/***/ }),

/***/ "./srcjs/theme.js":
/*!************************!*\
  !*** ./srcjs/theme.js ***!
  \************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createTheme": function() { return /* binding */ createTheme; },
/* harmony export */   "css": function() { return /* binding */ css; },
/* harmony export */   "getEmotion": function() { return /* binding */ getEmotion; },
/* harmony export */   "resetEmotion": function() { return /* binding */ resetEmotion; }
/* harmony export */ });
/* harmony import */ var _emotion_css_create_instance__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @emotion/css/create-instance */ "./node_modules/@emotion/css/create-instance/dist/emotion-css-create-instance.esm.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



function createTheme(options) {
  if (!options) return null;
  var color = options.color,
      backgroundColor = options.backgroundColor,
      borderColor = options.borderColor,
      borderWidth = options.borderWidth,
      stripedColor = options.stripedColor,
      highlightColor = options.highlightColor,
      cellPadding = options.cellPadding,
      style = options.style,
      _options$tableBorderC = options.tableBorderColor,
      tableBorderColor = _options$tableBorderC === void 0 ? borderColor : _options$tableBorderC,
      _options$tableBorderW = options.tableBorderWidth,
      tableBorderWidth = _options$tableBorderW === void 0 ? borderWidth : _options$tableBorderW,
      tableStyle = options.tableStyle,
      _options$headerBorder = options.headerBorderColor,
      headerBorderColor = _options$headerBorder === void 0 ? borderColor : _options$headerBorder,
      _options$headerBorder2 = options.headerBorderWidth,
      headerBorderWidth = _options$headerBorder2 === void 0 ? borderWidth : _options$headerBorder2,
      headerStyle = options.headerStyle,
      _options$groupHeaderB = options.groupHeaderBorderColor,
      groupHeaderBorderColor = _options$groupHeaderB === void 0 ? borderColor : _options$groupHeaderB,
      _options$groupHeaderB2 = options.groupHeaderBorderWidth,
      groupHeaderBorderWidth = _options$groupHeaderB2 === void 0 ? borderWidth : _options$groupHeaderB2,
      groupHeaderStyle = options.groupHeaderStyle,
      tableBodyStyle = options.tableBodyStyle,
      rowGroupStyle = options.rowGroupStyle,
      rowStyle = options.rowStyle,
      rowStripedStyle = options.rowStripedStyle,
      rowHighlightStyle = options.rowHighlightStyle,
      rowSelectedStyle = options.rowSelectedStyle,
      _options$cellBorderCo = options.cellBorderColor,
      cellBorderColor = _options$cellBorderCo === void 0 ? borderColor : _options$cellBorderCo,
      _options$cellBorderWi = options.cellBorderWidth,
      cellBorderWidth = _options$cellBorderWi === void 0 ? borderWidth : _options$cellBorderWi,
      cellStyle = options.cellStyle,
      _options$footerBorder = options.footerBorderColor,
      footerBorderColor = _options$footerBorder === void 0 ? borderColor : _options$footerBorder,
      _options$footerBorder2 = options.footerBorderWidth,
      footerBorderWidth = _options$footerBorder2 === void 0 ? borderWidth : _options$footerBorder2,
      footerStyle = options.footerStyle,
      inputStyle = options.inputStyle,
      filterInputStyle = options.filterInputStyle,
      searchInputStyle = options.searchInputStyle,
      selectStyle = options.selectStyle,
      paginationStyle = options.paginationStyle,
      pageButtonStyle = options.pageButtonStyle,
      pageButtonHoverStyle = options.pageButtonHoverStyle,
      pageButtonActiveStyle = options.pageButtonActiveStyle,
      pageButtonCurrentStyle = options.pageButtonCurrentStyle;
  var expanderColor = getFirstDefinedProp([cellStyle, rowStyle, tableBodyStyle, tableStyle, style], 'color', color);
  var selectColor = getFirstDefinedProp([selectStyle, style], 'color', color); // Allow easier override of header border width in an outlined/bordered table

  headerBorderWidth = getFirstDefinedProp([headerStyle], 'borderWidth', headerBorderWidth);
  var css = {
    style: _objectSpread({
      color: color,
      backgroundColor: backgroundColor
    }, style),
    tableStyle: _objectSpread({
      borderColor: tableBorderColor,
      borderWidth: tableBorderWidth
    }, tableStyle),
    headerStyle: _objectSpread(_objectSpread({
      borderColor: headerBorderColor,
      borderWidth: headerBorderWidth,
      padding: cellPadding
    }, headerStyle), {}, {
      '.rt-bordered &, .rt-outlined &': {
        borderWidth: headerBorderWidth
      }
    }),
    groupHeaderStyle: _objectSpread(_objectSpread({
      // For vertical borders
      borderColor: groupHeaderBorderColor,
      borderWidth: groupHeaderBorderWidth,
      padding: cellPadding
    }, groupHeaderStyle), {}, {
      // For horizontal borders
      '&::after': {
        backgroundColor: groupHeaderBorderColor,
        height: groupHeaderBorderWidth
      },
      '.rt-bordered &': {
        borderWidth: groupHeaderBorderWidth
      }
    }),
    tableBodyStyle: tableBodyStyle,
    rowGroupStyle: rowGroupStyle,
    rowStyle: _objectSpread(_objectSpread({}, rowStyle), {}, {
      '&.rt-tr-striped': _objectSpread({
        backgroundColor: stripedColor
      }, rowStripedStyle),
      '&.rt-tr-highlight:hover': _objectSpread({
        backgroundColor: highlightColor
      }, rowHighlightStyle),
      '&.rt-tr-selected': _objectSpread({}, rowSelectedStyle)
    }),
    cellStyle: _objectSpread({
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      padding: cellPadding
    }, cellStyle),
    footerStyle: _objectSpread({
      borderColor: footerBorderColor,
      borderWidth: footerBorderWidth,
      padding: cellPadding
    }, footerStyle),
    filterCellStyle: _objectSpread({
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      padding: cellPadding
    }, cellStyle),
    expanderStyle: {
      '&::after': {
        borderTopColor: expanderColor
      }
    },
    filterInputStyle: _objectSpread(_objectSpread({}, inputStyle), filterInputStyle),
    searchInputStyle: _objectSpread(_objectSpread({}, inputStyle), searchInputStyle),
    paginationStyle: _objectSpread(_objectSpread({
      borderTopColor: cellBorderColor,
      borderTopWidth: cellBorderWidth
    }, paginationStyle), {}, {
      '.rt-page-jump': _objectSpread({}, inputStyle),
      '.rt-page-size-select': _objectSpread(_objectSpread({}, selectStyle), {}, {
        '@supports (-moz-appearance: none)': {
          backgroundImage: selectColor && "url('data:image/svg+xml;charset=US-ASCII," + "<svg width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\">" + // Colors should be URL encoded since they may contain # or parentheses
          "<path fill=\"".concat(urlEncode(selectColor), "\" d=\"M24 1.5l-12 21-12-21h24z\"/></svg>')")
        }
      }),
      '.rt-page-button': _objectSpread({}, pageButtonStyle),
      '.rt-page-button:not(:disabled):hover': _objectSpread({}, pageButtonHoverStyle),
      '.rt-page-button:not(:disabled):active': _objectSpread({}, pageButtonActiveStyle),
      '.rt-keyboard-active & .rt-page-button:not(:disabled):focus': _objectSpread({}, pageButtonHoverStyle),
      '.rt-page-button-current': _objectSpread({}, pageButtonCurrentStyle)
    })
  };
  removeEmptyProps(css);
  return css;
}

function getFirstDefinedProp(objects, prop, defaultVal) {
  var found = objects.find(function (x) {
    return x && x[prop] != null;
  });
  return found ? found[prop] : defaultVal;
} // URL encoder that escapes parentheses (for data URLs)


function urlEncode(str) {
  return encodeURIComponent(str).replace('(', '%28').replace(')', '%29');
} // Remove undefined/null properties and empty objects


function removeEmptyProps(obj) {
  for (var _i = 0, _Object$entries = Object.entries(obj); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        value = _Object$entries$_i[1];

    if (_typeof(value) === 'object') {
      removeEmptyProps(value);

      if (Object.keys(value).length === 0) {
        delete obj[key];
      }
    } else if (value == null) {
      delete obj[key];
    }
  }
} // Defer Emotion initialization until DOM is loaded and theming is used


var emotion;
function getEmotion() {
  if (emotion) {
    return emotion;
  } // Emotion appends style tags to head by default. Instead, we insert styles
  // immediately after the reactable stylesheet for two reasons:
  //
  // 1. Some HTML documents (pkgdown) may place htmlDependencies in the body
  //    instead of head, causing Emotion theme styles in head to come before the
  //    the reactable stylesheet and not override default styles properly.
  //    R Markdown and Shiny put htmlDependencies in head properly.
  // 2. User styles in head may be overrided by the theme since Emotion appends to
  //    the end of head, after any existing styles in head. This is not as important
  //    as reason 1, however.


  var container;
  var insertionPoint;

  if ((0,_utils__WEBPACK_IMPORTED_MODULE_1__.isBrowser)()) {
    var _iterator = _createForOfIteratorHelper(document.querySelectorAll('link')),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var link = _step.value;
        var filename = link.href.substring(link.href.lastIndexOf('/') + 1);

        if (link.rel === 'stylesheet' && filename === 'reactable.css') {
          container = link.parentElement;
          insertionPoint = link;
          break;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  emotion = (0,_emotion_css_create_instance__WEBPACK_IMPORTED_MODULE_0__["default"])({
    // Class prefix and unique key to prevent conflicts with other Emotion instances
    key: 'reactable',
    container: container,
    insertionPoint: insertionPoint
  });
  return emotion;
} // Reset Emotion instance and styles, intended for testing use only

function resetEmotion() {
  if (emotion) {
    emotion.flush();
    emotion = null;
  }
} // Emotion css wrapper that returns null instead of an unused class

function css() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var emotion = getEmotion();
  args = args.filter(function (arg) {
    return arg != null;
  });
  return args.length ? emotion.css(args) : null;
}

/***/ }),

/***/ "./srcjs/useFlexLayout.js":
/*!********************************!*\
  !*** ./srcjs/useFlexLayout.js ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useFlexLayout; }
/* harmony export */ });
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
// useFlexLayout modified to:
// - Fix flex widths when resizing is disabled (don't use column.totalFlexWidth)
// - Support resizing to actual min and max column widths (not flex widths)
// - Set min width on thead/tbody/tfoot instead of table for responsive, horizontal scrolling.
//   Tables should use the new instance.getTheadProps and instance.getTfootProps for this.
// - Include resized widths in table min width to prevent glitches with sticky headers/footers
// - Exclude redundant styles

function useFlexLayout(hooks) {
  hooks.getTheadProps = [getRowGroupStyles];
  hooks.getTfootProps = [getRowGroupStyles];
  hooks.getTableBodyProps.push(getRowGroupStyles);
  hooks.getRowProps.push(getRowStyles);
  hooks.getHeaderGroupProps.push(getRowStyles);
  hooks.getFooterGroupProps.push(getRowStyles);
  hooks.getHeaderProps.push(getHeaderProps);
  hooks.getCellProps.push(getCellProps);
  hooks.getFooterProps.push(getFooterProps);
  hooks.useInstance.push(useInstance);
}
useFlexLayout.pluginName = 'useFlexLayout'; // Set min-width for thead and tfoot. Include resized widths in min width
// (using totalColumnsWidth over totalColumnsMinWidth) so cells don't overlap
// with sticky headers and footers when the total resized width is greater than
// the total min width.

var getRowGroupStyles = function getRowGroupStyles(props, _ref) {
  var instance = _ref.instance;
  return [props, {
    style: {
      minWidth: asPx(instance.totalColumnsWidth)
    }
  }];
};

var getRowStyles = function getRowStyles(props, _ref2) {
  var instance = _ref2.instance;
  return [props, {
    style: {
      flex: '1 0 auto',
      minWidth: asPx(instance.totalColumnsWidth)
    }
  }];
};

var getHeaderProps = function getHeaderProps(props, _ref3) {
  var column = _ref3.column;
  // Don't set max width if MAX_SAFE_INTEGER (the default for column.maxWidth)
  var maxWidth = column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? column.totalMaxWidth : null;
  return [props, {
    style: {
      flex: "".concat(column.flexWidth, " 0 auto"),
      minWidth: asPx(column.totalMinWidth),
      width: asPx(column.totalWidth),
      maxWidth: asPx(maxWidth)
    }
  }];
};

var getCellProps = function getCellProps(props, _ref4) {
  var cell = _ref4.cell;
  var maxWidth = cell.column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? cell.column.totalMaxWidth : null;
  return [props, {
    style: {
      flex: "".concat(cell.column.flexWidth, " 0 auto"),
      minWidth: asPx(cell.column.totalMinWidth),
      width: asPx(cell.column.totalWidth),
      maxWidth: asPx(maxWidth)
    }
  }];
};

var getFooterProps = function getFooterProps(props, _ref5) {
  var column = _ref5.column;
  var maxWidth = column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? column.totalMaxWidth : null;
  return [props, {
    style: {
      flex: "".concat(column.flexWidth, " 0 auto"),
      minWidth: asPx(column.totalMinWidth),
      width: asPx(column.totalWidth),
      maxWidth: asPx(maxWidth)
    }
  }];
};

function useInstance(instance) {
  var headers = instance.headers,
      state = instance.state,
      getHooks = instance.getHooks;
  var resizedWidths = state.columnResizing.columnWidths; // Manually calculate flex widths instead of using column.totalFlexWidth

  function calculateFlexWidths(columns) {
    var totalFlexWidth = 0;
    columns.forEach(function (column) {
      if (column.headers) {
        column.flexWidth = calculateFlexWidths(column.headers);
      } else {
        // If the column has been resized or has fixed width, flex width = 0.
        // Otherwise, flex width = min width.
        if (resizedWidths[column.id] != null) {
          column.flexWidth = 0;
        } else {
          var isFixedWidth = column.totalMinWidth === column.totalMaxWidth;
          column.flexWidth = isFixedWidth ? 0 : column.totalMinWidth;
        }
      }

      if (column.isVisible) {
        totalFlexWidth += column.flexWidth;
      }
    });
    return totalFlexWidth;
  }

  calculateFlexWidths(headers);
  var getInstance = (0,react_table__WEBPACK_IMPORTED_MODULE_0__.useGetLatest)(instance);
  var getTheadProps = (0,react_table__WEBPACK_IMPORTED_MODULE_0__.makePropGetter)(getHooks().getTheadProps, {
    instance: getInstance()
  });
  var getTfootProps = (0,react_table__WEBPACK_IMPORTED_MODULE_0__.makePropGetter)(getHooks().getTfootProps, {
    instance: getInstance()
  });
  Object.assign(instance, {
    getTheadProps: getTheadProps,
    getTfootProps: getTfootProps
  });
}

function asPx(value) {
  return typeof value === 'number' ? "".concat(value, "px") : undefined;
}

/***/ }),

/***/ "./srcjs/useGroupBy.js":
/*!*****************************!*\
  !*** ./srcjs/useGroupBy.js ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useGroupBy; },
/* harmony export */   "defaultGroupByFn": function() { return /* binding */ defaultGroupByFn; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// useGroupBy hook modified to:
// - Pass row objects and aggregated row objects to aggregate functions
// - Include groupBy columns in aggregations
// - Set nesting depth for leaf rows
// - Omit row index properties on aggregated rows


 // Not using any built-in aggregations

var aggregations = {};
var emptyArray = [];
var emptyObject = {}; // Actions

react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetGroupBy = 'resetGroupBy';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setGroupBy = 'setGroupBy';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleGroupBy = 'toggleGroupBy';
function useGroupBy(hooks) {
  hooks.getGroupByToggleProps = [defaultGetGroupByToggleProps];
  hooks.stateReducers.push(reducer);
  hooks.visibleColumnsDeps.push(function (deps, _ref) {
    var instance = _ref.instance;
    return [].concat(_toConsumableArray(deps), [instance.state.groupBy]);
  });
  hooks.visibleColumns.push(visibleColumns);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
}
useGroupBy.pluginName = 'useGroupBy';

var defaultGetGroupByToggleProps = function defaultGetGroupByToggleProps(props, _ref2) {
  var header = _ref2.header;
  return [props, {
    onClick: header.canGroupBy ? function (e) {
      e.persist();
      header.toggleGroupBy();
    } : undefined,
    style: {
      cursor: header.canGroupBy ? 'pointer' : undefined
    },
    title: 'Toggle GroupBy'
  }];
}; // Reducer


function reducer(state, action, previousState, instance) {
  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      groupBy: []
    }, state);
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetGroupBy) {
    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: instance.initialState.groupBy || []
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setGroupBy) {
    var value = action.value;
    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: value
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleGroupBy) {
    var columnId = action.columnId,
        setGroupBy = action.value;
    var resolvedGroupBy = typeof setGroupBy !== 'undefined' ? setGroupBy : !state.groupBy.includes(columnId);

    if (resolvedGroupBy) {
      return _objectSpread(_objectSpread({}, state), {}, {
        groupBy: [].concat(_toConsumableArray(state.groupBy), [columnId])
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      groupBy: state.groupBy.filter(function (d) {
        return d !== columnId;
      })
    });
  }
}

function visibleColumns(columns, _ref3) {
  var groupBy = _ref3.instance.state.groupBy;
  // Sort grouped columns to the start of the column list
  // before the headers are built
  var groupByColumns = groupBy.map(function (g) {
    return columns.find(function (col) {
      return col.id === g;
    });
  }).filter(Boolean);
  var nonGroupByColumns = columns.filter(function (col) {
    return !groupBy.includes(col.id);
  });
  columns = [].concat(_toConsumableArray(groupByColumns), _toConsumableArray(nonGroupByColumns));
  columns.forEach(function (column) {
    column.isGrouped = groupBy.includes(column.id);
    column.groupedIndex = groupBy.indexOf(column.id);
  });
  return columns;
}

var defaultUserAggregations = {};

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      flatRows = instance.flatRows,
      rowsById = instance.rowsById,
      allColumns = instance.allColumns,
      flatHeaders = instance.flatHeaders,
      _instance$groupByFn = instance.groupByFn,
      groupByFn = _instance$groupByFn === void 0 ? defaultGroupByFn : _instance$groupByFn,
      manualGroupBy = instance.manualGroupBy,
      _instance$aggregation = instance.aggregations,
      userAggregations = _instance$aggregation === void 0 ? defaultUserAggregations : _instance$aggregation,
      plugins = instance.plugins,
      groupBy = instance.state.groupBy,
      dispatch = instance.dispatch,
      _instance$autoResetGr = instance.autoResetGroupBy,
      autoResetGroupBy = _instance$autoResetGr === void 0 ? true : _instance$autoResetGr,
      disableGroupBy = instance.disableGroupBy,
      defaultCanGroupBy = instance.defaultCanGroupBy,
      getHooks = instance.getHooks;
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useColumnOrder', 'useFilters'], 'useGroupBy');
  var getInstance = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  allColumns.forEach(function (column) {
    var accessor = column.accessor,
        defaultColumnGroupBy = column.defaultGroupBy,
        columnDisableGroupBy = column.disableGroupBy;
    column.canGroupBy = accessor ? (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(column.canGroupBy, columnDisableGroupBy === true ? false : undefined, disableGroupBy === true ? false : undefined, true) : (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(column.canGroupBy, defaultColumnGroupBy, defaultCanGroupBy, false);

    if (column.canGroupBy) {
      column.toggleGroupBy = function () {
        return instance.toggleGroupBy(column.id);
      };
    }

    column.Aggregated = column.Aggregated || column.Cell;
  });
  var toggleGroupBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (columnId, value) {
    dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleGroupBy,
      columnId: columnId,
      value: value
    });
  }, [dispatch]);
  var setGroupBy = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setGroupBy,
      value: value
    });
  }, [dispatch]);
  flatHeaders.forEach(function (header) {
    header.getGroupByToggleProps = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getGroupByToggleProps, {
      instance: getInstance(),
      header: header
    });
  });

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    if (manualGroupBy || !groupBy.length) {
      return [rows, flatRows, rowsById, emptyArray, emptyObject, flatRows, rowsById];
    } // Ensure that the list of filtered columns exist


    var existingGroupBy = groupBy.filter(function (g) {
      return allColumns.find(function (col) {
        return col.id === g;
      });
    }); // Find the columns that can or are aggregating
    // Uses each column to aggregate rows into a single value

    var aggregateRowsToValues = function aggregateRowsToValues(leafRows, groupedRows, depth, aggregatedColumns) {
      var values = {};
      allColumns.forEach(function (column) {
        // Only aggregate columns that aren't being grouped. Originally, all groupBy
        // columns were excluded, but now, groupBy columns not in the row's group
        // may be aggregated.
        if (!aggregatedColumns.includes(column.id)) {
          // Set placeholder values
          values[column.id] = groupedRows[0] ? groupedRows[0].values[column.id] : null;
          return;
        } // Get the columnValues to aggregate (no longer used)
        // const groupedValues = groupedRows.map(row => row.values[column.id])
        // Aggregate the values


        var aggregateFn = typeof column.aggregate === 'function' ? column.aggregate : userAggregations[column.aggregate] || aggregations[column.aggregate];

        if (aggregateFn) {
          // Get the columnValues to aggregate
          var leafValues = leafRows.map(function (row) {
            var columnValue = row.values[column.id];

            if (!depth && column.aggregateValue) {
              var aggregateValueFn = typeof column.aggregateValue === 'function' ? column.aggregateValue : userAggregations[column.aggregateValue] || aggregations[column.aggregateValue];

              if (!aggregateValueFn) {
                console.info({
                  column: column
                });
                throw new Error("React Table: Invalid column.aggregateValue option for column listed above");
              }

              columnValue = aggregateValueFn(columnValue, row, column);
            }

            return columnValue;
          }); // Originally, the leafValues and groupedValues were passed to the aggregate function.
          // Now, the aggregate function takes:
          // - leafValues: flattened array of values in the column
          // - leafRows: flattened array of rows in the column (for v6 compatibility)
          // - groupedRows: array of aggregated rows in the column

          values[column.id] = aggregateFn(leafValues, leafRows.map(function (row) {
            return row.values;
          }), groupedRows.map(function (row) {
            return row.values;
          }));
        } else if (column.aggregate) {
          console.info({
            column: column
          });
          throw new Error("React Table: Invalid column.aggregate option for column listed above");
        } else {
          values[column.id] = null;
        }
      });
      return values;
    };

    var groupedFlatRows = [];
    var groupedRowsById = {};
    var onlyGroupedFlatRows = [];
    var onlyGroupedRowsById = {};
    var nonGroupedFlatRows = [];
    var nonGroupedRowsById = {}; // Recursively group the data

    var groupUpRecursively = function groupUpRecursively(rows) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var parentId = arguments.length > 2 ? arguments[2] : undefined;

      // This is the last level, just return the rows
      if (depth === existingGroupBy.length) {
        // Set nesting depth for leaf rows
        rows.forEach(function (row) {
          row.depth = depth;
        });
        return rows;
      }

      var columnId = existingGroupBy[depth]; // Group the rows together for this level

      var rowGroupsMap = groupByFn(rows, columnId); // Peform aggregations for each group

      var aggregatedGroupedRows = Object.entries(rowGroupsMap).map(function (_ref4, index) {
        var _ref5 = _slicedToArray(_ref4, 2),
            groupByVal = _ref5[0],
            groupedRows = _ref5[1];

        var id = "".concat(columnId, ":").concat(groupByVal);
        id = parentId ? "".concat(parentId, ">").concat(id) : id; // First, Recurse to group sub rows before aggregation

        var subRows = groupUpRecursively(groupedRows, depth + 1, id); // Flatten the leaf rows of the rows in this group

        var leafRows = depth ? flattenBy(groupedRows, 'leafRows') : groupedRows; // Find the columns that can be aggregated, including any columns in
        // groupBy. Originally, no groupBy columns were aggregated. Now we
        // aggregate groupBy columns that aren't in the row's group.

        var groupedColumns = existingGroupBy.slice(0, depth + 1);
        var aggregatedColumns = allColumns.filter(function (col) {
          return !groupedColumns.includes(col.id);
        }).map(function (col) {
          return col.id;
        }); // Originally, groupedRows were passed here, which were the same as
        // the leafRows. Now, the subRows are passed, which contain the aggregated
        // values of the immediate child rows.

        var values = aggregateRowsToValues(leafRows, subRows, depth, aggregatedColumns);
        var row = {
          id: id,
          isGrouped: true,
          groupByID: columnId,
          groupByVal: groupByVal,
          values: values,
          subRows: subRows,
          leafRows: leafRows,
          depth: depth,
          // Originally, aggregated rows had a row index corresponding to the index within
          // rowGroupsMap. This row index doesn't map to a valid data row and overlaps
          // with the leaf rows, so explicitly omit it.
          // index: undefined,
          index: undefined,
          groupIndex: index,
          // All columns that can be aggregated (including groupBy columns)
          aggregatedColumns: aggregatedColumns
        };
        subRows.forEach(function (subRow) {
          groupedFlatRows.push(subRow);
          groupedRowsById[subRow.id] = subRow;

          if (subRow.isGrouped) {
            onlyGroupedFlatRows.push(subRow);
            onlyGroupedRowsById[subRow.id] = subRow;
          } else {
            nonGroupedFlatRows.push(subRow);
            nonGroupedRowsById[subRow.id] = subRow;
          }
        });
        return row;
      });
      return aggregatedGroupedRows;
    };

    var groupedRows = groupUpRecursively(rows);
    groupedRows.forEach(function (subRow) {
      groupedFlatRows.push(subRow);
      groupedRowsById[subRow.id] = subRow;

      if (subRow.isGrouped) {
        onlyGroupedFlatRows.push(subRow);
        onlyGroupedRowsById[subRow.id] = subRow;
      } else {
        nonGroupedFlatRows.push(subRow);
        nonGroupedRowsById[subRow.id] = subRow;
      }
    }); // Assign the new data

    return [groupedRows, groupedFlatRows, groupedRowsById, onlyGroupedFlatRows, onlyGroupedRowsById, nonGroupedFlatRows, nonGroupedRowsById];
  }, [manualGroupBy, groupBy, rows, flatRows, rowsById, allColumns, userAggregations, groupByFn]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 7),
      groupedRows = _React$useMemo2[0],
      groupedFlatRows = _React$useMemo2[1],
      groupedRowsById = _React$useMemo2[2],
      onlyGroupedFlatRows = _React$useMemo2[3],
      onlyGroupedRowsById = _React$useMemo2[4],
      nonGroupedFlatRows = _React$useMemo2[5],
      nonGroupedRowsById = _React$useMemo2[6];

  var getAutoResetGroupBy = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetGroupBy);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetGroupBy()) {
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetGroupBy
      });
    }
  }, [dispatch, manualGroupBy ? null : data]);
  Object.assign(instance, {
    preGroupedRows: rows,
    preGroupedFlatRow: flatRows,
    preGroupedRowsById: rowsById,
    groupedRows: groupedRows,
    groupedFlatRows: groupedFlatRows,
    groupedRowsById: groupedRowsById,
    onlyGroupedFlatRows: onlyGroupedFlatRows,
    onlyGroupedRowsById: onlyGroupedRowsById,
    nonGroupedFlatRows: nonGroupedFlatRows,
    nonGroupedRowsById: nonGroupedRowsById,
    rows: groupedRows,
    flatRows: groupedFlatRows,
    rowsById: groupedRowsById,
    toggleGroupBy: toggleGroupBy,
    setGroupBy: setGroupBy
  });
}

function prepareRow(row) {
  row.allCells.forEach(function (cell) {
    var _row$aggregatedColumn, _row$subRows;

    // Grouped cells are in the groupBy and the pivot cell for the row
    cell.isGrouped = cell.column.isGrouped && cell.column.id === row.groupByID; // Aggregated cells are not grouped, not repeated, but still have subRows

    cell.isAggregated = !cell.isGrouped && ((_row$aggregatedColumn = row.aggregatedColumns) === null || _row$aggregatedColumn === void 0 ? void 0 : _row$aggregatedColumn.includes(cell.column.id)) && ((_row$subRows = row.subRows) === null || _row$subRows === void 0 ? void 0 : _row$subRows.length); // Placeholder cells are any columns in the groupBy that are not grouped or aggregated

    cell.isPlaceholder = !cell.isGrouped && cell.column.isGrouped && !cell.isAggregated;
  });
}

function defaultGroupByFn(rows, columnId) {
  return rows.reduce(function (prev, row) {
    // TODO: Might want to implement a key serializer here so
    // irregular column values can still be grouped if needed?
    var resKey = "".concat(row.values[columnId]);
    prev[resKey] = Array.isArray(prev[resKey]) ? prev[resKey] : [];
    prev[resKey].push(row);
    return prev;
  }, {});
}

function flattenBy(arr, key) {
  var flat = [];

  var recurse = function recurse(arr) {
    arr.forEach(function (d) {
      if (!d[key]) {
        flat.push(d);
      } else {
        recurse(d[key]);
      }
    });
  };

  recurse(arr);
  return flat;
}

/***/ }),

/***/ "./srcjs/useMeta.js":
/*!**************************!*\
  !*** ./srcjs/useMeta.js ***!
  \**************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useMeta; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }


function useMeta() {
  var initialMeta = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _React$useState = react__WEBPACK_IMPORTED_MODULE_0___default().useState(initialMeta),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      meta = _React$useState2[0],
      setRawMeta = _React$useState2[1];

  var setMeta = function setMeta(meta) {
    if (meta == null) {
      setRawMeta({});
      return;
    }

    if (_typeof(meta) !== 'object' && typeof meta !== 'function') {
      throw new Error('meta must be an object or function');
    }

    setRawMeta(function (prevMeta) {
      if (typeof meta === 'function') {
        meta = meta(prevMeta);
      }

      var newMeta = _objectSpread(_objectSpread({}, prevMeta), meta);

      for (var _i2 = 0, _Object$entries = Object.entries(newMeta); _i2 < _Object$entries.length; _i2++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2),
            key = _Object$entries$_i[0],
            value = _Object$entries$_i[1];

        if (value === undefined) {
          delete meta[key];
        }
      }

      return newMeta;
    });
  };

  return [meta, setMeta];
}

/***/ }),

/***/ "./srcjs/usePagination.js":
/*!********************************!*\
  !*** ./srcjs/usePagination.js ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ usePagination; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// usePagination modified to:
// - Allow pagination to be disabled. This makes it easier to use the hook
//   conditionally while keeping pagination functionality intact (e.g., the
//   pagination bar and API can still be used when pagination is disabled).
// - Provide instance.pageRowCount for the number of paginated rows on the
//   page, excluding expanded rows when paginateExpandedRows = false.


var pluginName = 'usePagination'; // Actions

react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage = 'resetPage';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage = 'gotoPage';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize = 'setPageSize';
function usePagination(hooks) {
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
}
usePagination.pluginName = pluginName;

function reducer(state, action, previousState, instance) {
  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      pageSize: 10,
      pageIndex: 0
    }, state);
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage) {
    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: instance.initialState.pageIndex || 0
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage) {
    var pageCount = instance.pageCount,
        page = instance.page;
    var newPageIndex = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.functionalUpdate)(action.pageIndex, state.pageIndex);
    var canNavigate = false;

    if (newPageIndex > state.pageIndex) {
      // next page
      canNavigate = pageCount === -1 ? page.length >= state.pageSize : newPageIndex < pageCount;
    } else if (newPageIndex < state.pageIndex) {
      // prev page
      canNavigate = newPageIndex > -1;
    }

    if (!canNavigate) {
      return state;
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: newPageIndex
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize) {
    var pageSize = action.pageSize;
    var topRowIndex = state.pageSize * state.pageIndex;
    var pageIndex = Math.floor(topRowIndex / pageSize);
    return _objectSpread(_objectSpread({}, state), {}, {
      pageIndex: pageIndex,
      pageSize: pageSize
    });
  }
}

function useInstance(instance) {
  var rows = instance.rows,
      _instance$autoResetPa = instance.autoResetPage,
      autoResetPage = _instance$autoResetPa === void 0 ? true : _instance$autoResetPa,
      _instance$manualExpan = instance.manualExpandedKey,
      manualExpandedKey = _instance$manualExpan === void 0 ? 'expanded' : _instance$manualExpan,
      plugins = instance.plugins,
      userPageCount = instance.pageCount,
      _instance$paginateExp = instance.paginateExpandedRows,
      paginateExpandedRows = _instance$paginateExp === void 0 ? true : _instance$paginateExp,
      _instance$expandSubRo = instance.expandSubRows,
      expandSubRows = _instance$expandSubRo === void 0 ? true : _instance$expandSubRo,
      disablePagination = instance.disablePagination,
      _instance$state = instance.state,
      pageIndex = _instance$state.pageIndex,
      expanded = _instance$state.expanded,
      globalFilter = _instance$state.globalFilter,
      filters = _instance$state.filters,
      groupBy = _instance$state.groupBy,
      sortBy = _instance$state.sortBy,
      dispatch = instance.dispatch,
      data = instance.data,
      manualPagination = instance.manualPagination;
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useGlobalFilter', 'useFilters', 'useGroupBy', 'useSortBy', 'useExpanded'], 'usePagination');
  var getAutoResetPage = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetPage);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetPage()) {
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetPage
      });
    }
  }, [dispatch, manualPagination ? null : data, globalFilter, filters, groupBy, sortBy]); // Disabling pagination effectively means setting the page size to the table size.
  // This is best done by the hook, rather than the user, because the row count
  // isn't known until other row-manipulating hooks have run (e.g., useGroupBy).

  var pageSize = disablePagination ? rows.length : instance.state.pageSize;
  var pageCount = manualPagination ? userPageCount : Math.ceil(rows.length / pageSize);
  var pageOptions = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    return pageCount > 0 ? _toConsumableArray(new Array(pageCount)).fill(null).map(function (d, i) {
      return i;
    }) : [];
  }, [pageCount]);

  var _React$useMemo = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var page;

    if (manualPagination) {
      page = rows;
    } else {
      var pageStart = pageSize * pageIndex;
      var pageEnd = pageStart + pageSize;
      page = rows.slice(pageStart, pageEnd);
    }

    var pageRowCount = page.length;

    if (paginateExpandedRows) {
      return [page, pageRowCount];
    }

    return [expandRows(page, {
      manualExpandedKey: manualExpandedKey,
      expanded: expanded,
      expandSubRows: expandSubRows
    }), pageRowCount];
  }, [expandSubRows, expanded, manualExpandedKey, manualPagination, pageIndex, pageSize, paginateExpandedRows, rows]),
      _React$useMemo2 = _slicedToArray(_React$useMemo, 2),
      page = _React$useMemo2[0],
      pageRowCount = _React$useMemo2[1];

  var canPreviousPage = pageIndex > 0;
  var canNextPage = pageCount === -1 ? page.length >= pageSize : pageIndex < pageCount - 1;
  var gotoPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (pageIndex) {
    dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.gotoPage,
      pageIndex: pageIndex
    });
  }, [dispatch]);
  var previousPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return gotoPage(function (old) {
      return old - 1;
    });
  }, [gotoPage]);
  var nextPage = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return gotoPage(function (old) {
      return old + 1;
    });
  }, [gotoPage]);
  var setPageSize = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (pageSize) {
    dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setPageSize,
      pageSize: pageSize
    });
  }, [dispatch]);
  Object.assign(instance, {
    pageOptions: pageOptions,
    pageCount: pageCount,
    page: page,
    pageRowCount: pageRowCount,
    canPreviousPage: canPreviousPage,
    canNextPage: canNextPage,
    gotoPage: gotoPage,
    previousPage: previousPage,
    nextPage: nextPage,
    setPageSize: setPageSize
  });
}

function expandRows(rows, _ref) {
  var manualExpandedKey = _ref.manualExpandedKey,
      expanded = _ref.expanded,
      _ref$expandSubRows = _ref.expandSubRows,
      expandSubRows = _ref$expandSubRows === void 0 ? true : _ref$expandSubRows;
  var expandedRows = [];

  var handleRow = function handleRow(row) {
    var addToExpandedRows = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    row.isExpanded = row.original && row.original[manualExpandedKey] || expanded[row.id];
    row.canExpand = row.subRows && !!row.subRows.length;

    if (addToExpandedRows) {
      expandedRows.push(row);
    }

    if (row.subRows && row.subRows.length && row.isExpanded) {
      row.subRows.forEach(function (row) {
        return handleRow(row, expandSubRows);
      });
    }
  };

  rows.forEach(function (row) {
    return handleRow(row);
  });
  return expandedRows;
}

/***/ }),

/***/ "./srcjs/useResizeColumns.js":
/*!***********************************!*\
  !*** ./srcjs/useResizeColumns.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useResizeColumns; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// useResizeColumns modified to:
// - Resize based on actual DOM width of column, like in v6. Requires a
//   getDOMWidth() method to be defined on each column header and header group.
// - Clean up touchend listeners properly (https://github.com/tannerlinsley/react-table/issues/2622)
// - Optimize number of calls to dispatch (https://github.com/tannerlinsley/react-table/pull/3231)



var passiveSupported = null;

function passiveEventSupported() {
  // memoize support to avoid adding multiple test events
  if (typeof passiveSupported === 'boolean') return passiveSupported;
  var supported = false;

  try {
    var options = {
      get passive() {
        supported = true;
        return false;
      }

    };
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    supported = false;
  }

  passiveSupported = supported;
  return passiveSupported;
} // Default Column


react_table__WEBPACK_IMPORTED_MODULE_1__.defaultColumn.canResize = true; // Actions

react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing = 'columnStartResizing';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing = 'columnResizing';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing = 'columnDoneResizing';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize = 'resetResize';
function useResizeColumns(hooks) {
  hooks.getResizerProps = [defaultGetResizerProps];
  hooks.getHeaderProps.push({
    style: {
      position: 'relative'
    }
  });
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.useInstanceBeforeDimensions.push(useInstanceBeforeDimensions);
}

var defaultGetResizerProps = function defaultGetResizerProps(props, _ref) {
  var instance = _ref.instance,
      header = _ref.header;
  var dispatch = instance.dispatch;

  var onResizeStart = function onResizeStart(e, header) {
    var isTouchEvent = false;

    if (e.type === 'touchstart') {
      // lets not respond to multiple touches (e.g. 2 or 3 fingers)
      if (e.touches && e.touches.length > 1) {
        return;
      }

      isTouchEvent = true;
    }

    var headersToResize = getAllColumns(header);
    var headerIdWidths = headersToResize.map(function (d) {
      return [d.id, d.getDOMWidth()];
    });
    var columnWidth = headerIdWidths.find(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 1),
          id = _ref3[0];

      return id === header.id;
    })[1];
    var clientX = isTouchEvent ? Math.round(e.touches[0].clientX) : e.clientX;
    var raf;
    var mostRecentClientX;

    var dispatchMove = function dispatchMove() {
      window.cancelAnimationFrame(raf);
      raf = null;
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing,
        clientX: mostRecentClientX
      });
    };

    var dispatchEnd = function dispatchEnd() {
      window.cancelAnimationFrame(raf);
      raf = null;
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing
      });
    };

    var scheduleDispatchMoveOnNextAnimationFrame = function scheduleDispatchMoveOnNextAnimationFrame(clientXPos) {
      mostRecentClientX = clientXPos;

      if (!raf) {
        raf = window.requestAnimationFrame(dispatchMove);
      }
    };

    var handlersAndEvents = {
      mouse: {
        moveEvent: 'mousemove',
        moveHandler: function moveHandler(e) {
          return scheduleDispatchMoveOnNextAnimationFrame(e.clientX);
        },
        upEvent: 'mouseup',
        upHandler: function upHandler() {
          document.removeEventListener('mousemove', handlersAndEvents.mouse.moveHandler);
          document.removeEventListener('mouseup', handlersAndEvents.mouse.upHandler);
          dispatchEnd();
        }
      },
      touch: {
        moveEvent: 'touchmove',
        moveHandler: function moveHandler(e) {
          if (e.cancelable) {
            e.preventDefault();
            e.stopPropagation();
          }

          scheduleDispatchMoveOnNextAnimationFrame(e.touches[0].clientX);
          return false;
        },
        upEvent: 'touchend',
        upHandler: function upHandler() {
          document.removeEventListener(handlersAndEvents.touch.moveEvent, handlersAndEvents.touch.moveHandler);
          document.removeEventListener(handlersAndEvents.touch.upEvent, handlersAndEvents.touch.upHandler);
          dispatchEnd();
        }
      }
    };
    var events = isTouchEvent ? handlersAndEvents.touch : handlersAndEvents.mouse;
    var passiveIfSupported = passiveEventSupported() ? {
      passive: false
    } : false;
    document.addEventListener(events.moveEvent, events.moveHandler, passiveIfSupported);
    document.addEventListener(events.upEvent, events.upHandler, passiveIfSupported);
    dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing,
      columnId: header.id,
      columnWidth: columnWidth,
      headerIdWidths: headerIdWidths,
      clientX: clientX
    });
  };

  return [props, {
    onMouseDown: function onMouseDown(e) {
      return e.persist() || onResizeStart(e, header);
    },
    onTouchStart: function onTouchStart(e) {
      return e.persist() || onResizeStart(e, header);
    },
    style: {
      cursor: 'col-resize'
    },
    draggable: false,
    role: 'separator'
  }];
};

useResizeColumns.pluginName = 'useResizeColumns';

function reducer(state, action) {
  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      columnResizing: {
        columnWidths: {}
      }
    }, state);
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: {
        columnWidths: {}
      }
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnStartResizing) {
    var clientX = action.clientX,
        columnId = action.columnId,
        columnWidth = action.columnWidth,
        headerIdWidths = action.headerIdWidths;
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        startX: clientX,
        headerIdWidths: headerIdWidths,
        columnWidth: columnWidth,
        isResizingColumn: columnId
      })
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnResizing) {
    var _clientX = action.clientX;

    var _state$columnResizing = state.columnResizing,
        startX = _state$columnResizing.startX,
        _columnWidth = _state$columnResizing.columnWidth,
        _state$columnResizing2 = _state$columnResizing.headerIdWidths,
        _headerIdWidths = _state$columnResizing2 === void 0 ? [] : _state$columnResizing2;

    var deltaX = _clientX - startX;
    var percentageDeltaX = deltaX / _columnWidth;
    var newColumnWidths = {};

    _headerIdWidths.forEach(function (_ref4) {
      var _ref5 = _slicedToArray(_ref4, 2),
          headerId = _ref5[0],
          headerWidth = _ref5[1];

      newColumnWidths[headerId] = Math.max(headerWidth + headerWidth * percentageDeltaX, 0);
    });

    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        columnWidths: _objectSpread(_objectSpread({}, state.columnResizing.columnWidths), newColumnWidths)
      })
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.columnDoneResizing) {
    return _objectSpread(_objectSpread({}, state), {}, {
      columnResizing: _objectSpread(_objectSpread({}, state.columnResizing), {}, {
        startX: null,
        isResizingColumn: null
      })
    });
  }
}

var useInstanceBeforeDimensions = function useInstanceBeforeDimensions(instance) {
  var flatHeaders = instance.flatHeaders,
      disableResizing = instance.disableResizing,
      getHooks = instance.getHooks,
      columnResizing = instance.state.columnResizing;
  var getInstance = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  flatHeaders.forEach(function (header) {
    var canResize = (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(header.disableResizing === true ? false : undefined, disableResizing === true ? false : undefined, true);
    header.canResize = canResize;
    header.width = (0,_utils__WEBPACK_IMPORTED_MODULE_2__.getFirstDefined)(columnResizing.columnWidths[header.id], header.originalWidth, header.width);
    header.isResizing = columnResizing.isResizingColumn === header.id;

    if (canResize) {
      header.getResizerProps = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getResizerProps, {
        instance: getInstance(),
        header: header
      });
    }
  });
};

function useInstance(instance) {
  var plugins = instance.plugins,
      dispatch = instance.dispatch,
      _instance$autoResetRe = instance.autoResetResize,
      autoResetResize = _instance$autoResetRe === void 0 ? true : _instance$autoResetRe,
      columns = instance.columns;
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useAbsoluteLayout'], 'useResizeColumns');
  var getAutoResetResize = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetResize);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetResize()) {
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize
      });
    }
  }, [columns]);
  var resetResizing = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    return dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetResize
    });
  }, [dispatch]);
  Object.assign(instance, {
    resetResizing: resetResizing
  });
}

function getAllColumns(column) {
  var allColumns = [];

  var recurseColumn = function recurseColumn(column) {
    if (column.columns && column.columns.length) {
      column.columns.forEach(recurseColumn);
    }

    allColumns.push(column);
  };

  recurseColumn(column);
  return allColumns;
}

/***/ }),

/***/ "./srcjs/useRowSelect.js":
/*!*******************************!*\
  !*** ./srcjs/useRowSelect.js ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useRowSelect; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// useRowSelect hook modified to:
// - Set row.isSelected for sub rows when paginateExpandedRows = false
//   (https://github.com/TanStack/react-table/issues/2908)
// - Include an instance.setRowsSelected() function to set selected rows.
//   This is also useful to clear all selection, since toggleAllRowsSelected()
//   only affects visible rows, excluding any selected rows that may be filtered out.
// - Handle sub rows correctly when custom getSubRows is used
//  (https://github.com/TanStack/react-table/pull/2886)


var pluginName = 'useRowSelect'; // Actions

react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows = 'resetSelectedRows';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected = 'toggleAllRowsSelected';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected = 'toggleRowSelected';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected = 'toggleAllPageRowsSelected';
react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setRowsSelected = 'setRowsSelected';
function useRowSelect(hooks) {
  hooks.getToggleRowSelectedProps = [defaultGetToggleRowSelectedProps];
  hooks.getToggleAllRowsSelectedProps = [defaultGetToggleAllRowsSelectedProps];
  hooks.getToggleAllPageRowsSelectedProps = [defaultGetToggleAllPageRowsSelectedProps];
  hooks.stateReducers.push(reducer);
  hooks.useInstance.push(useInstance);
  hooks.prepareRow.push(prepareRow);
}
useRowSelect.pluginName = pluginName;

var defaultGetToggleRowSelectedProps = function defaultGetToggleRowSelectedProps(props, _ref) {
  var instance = _ref.instance,
      row = _ref.row;
  var _instance$manualRowSe = instance.manualRowSelectedKey,
      manualRowSelectedKey = _instance$manualRowSe === void 0 ? 'isSelected' : _instance$manualRowSe;
  var checked = false;

  if (row.original && row.original[manualRowSelectedKey]) {
    checked = true;
  } else {
    checked = row.isSelected;
  }

  return [props, {
    onChange: function onChange(e) {
      row.toggleRowSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: checked,
    title: 'Toggle Row Selected',
    indeterminate: row.isSomeSelected
  }];
};

var defaultGetToggleAllRowsSelectedProps = function defaultGetToggleAllRowsSelectedProps(props, _ref2) {
  var instance = _ref2.instance;
  return [props, {
    onChange: function onChange(e) {
      instance.toggleAllRowsSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllRowsSelected,
    title: 'Toggle All Rows Selected',
    indeterminate: Boolean(!instance.isAllRowsSelected && Object.keys(instance.state.selectedRowIds).length)
  }];
};

var defaultGetToggleAllPageRowsSelectedProps = function defaultGetToggleAllPageRowsSelectedProps(props, _ref3) {
  var instance = _ref3.instance;
  return [props, {
    onChange: function onChange(e) {
      instance.toggleAllPageRowsSelected(e.target.checked);
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllPageRowsSelected,
    title: 'Toggle All Current Page Rows Selected',
    indeterminate: Boolean(!instance.isAllPageRowsSelected && instance.page.some(function (_ref4) {
      var id = _ref4.id;
      return instance.state.selectedRowIds[id];
    }))
  }];
}; // eslint-disable-next-line max-params


function reducer(state, action, previousState, instance) {
  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.init) {
    return _objectSpread({
      selectedRowIds: {}
    }, state);
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows) {
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: instance.initialState.selectedRowIds || {}
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected) {
    var setSelected = action.value;
    var isAllRowsSelected = instance.isAllRowsSelected,
        rowsById = instance.rowsById,
        _instance$nonGroupedR = instance.nonGroupedRowsById,
        nonGroupedRowsById = _instance$nonGroupedR === void 0 ? rowsById : _instance$nonGroupedR;
    var selectAll = typeof setSelected !== 'undefined' ? setSelected : !isAllRowsSelected; // Only remove/add the rows that are visible on the screen
    //  Leave all the other rows that are selected alone.

    var selectedRowIds = Object.assign({}, state.selectedRowIds);

    if (selectAll) {
      Object.keys(nonGroupedRowsById).forEach(function (rowId) {
        selectedRowIds[rowId] = true;
      });
    } else {
      Object.keys(nonGroupedRowsById).forEach(function (rowId) {
        delete selectedRowIds[rowId];
      });
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: selectedRowIds
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected) {
    var id = action.id,
        _setSelected = action.value;
    var _rowsById = instance.rowsById,
        _instance$selectSubRo = instance.selectSubRows,
        selectSubRows = _instance$selectSubRo === void 0 ? true : _instance$selectSubRo;
    var isSelected = state.selectedRowIds[id];
    var shouldExist = typeof _setSelected !== 'undefined' ? _setSelected : !isSelected;

    if (isSelected === shouldExist) {
      return state;
    }

    var newSelectedRowIds = _objectSpread({}, state.selectedRowIds);

    var handleRowById = function handleRowById(id) {
      var row = _rowsById[id];

      if (!row.isGrouped) {
        if (shouldExist) {
          newSelectedRowIds[id] = true;
        } else {
          delete newSelectedRowIds[id];
        }
      }

      if (selectSubRows && row.subRows) {
        return row.subRows.forEach(function (row) {
          return handleRowById(row.id);
        });
      }
    };

    handleRowById(id);
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: newSelectedRowIds
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected) {
    var _setSelected2 = action.value;

    var page = instance.page,
        _rowsById2 = instance.rowsById,
        _instance$selectSubRo2 = instance.selectSubRows,
        _selectSubRows = _instance$selectSubRo2 === void 0 ? true : _instance$selectSubRo2,
        isAllPageRowsSelected = instance.isAllPageRowsSelected;

    var _selectAll = typeof _setSelected2 !== 'undefined' ? _setSelected2 : !isAllPageRowsSelected;

    var _newSelectedRowIds = _objectSpread({}, state.selectedRowIds);

    var _handleRowById = function _handleRowById(id) {
      var row = _rowsById2[id];

      if (!row.isGrouped) {
        if (_selectAll) {
          _newSelectedRowIds[id] = true;
        } else {
          delete _newSelectedRowIds[id];
        }
      }

      if (_selectSubRows && row.subRows) {
        return row.subRows.forEach(function (row) {
          return _handleRowById(row.id);
        });
      }
    };

    page.forEach(function (row) {
      return _handleRowById(row.id);
    });
    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: _newSelectedRowIds
    });
  }

  if (action.type === react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setRowsSelected) {
    var _setSelected3 = action.ids;

    var _rowsById3 = instance.rowsById,
        _instance$selectSubRo3 = instance.selectSubRows,
        _selectSubRows2 = _instance$selectSubRo3 === void 0 ? true : _instance$selectSubRo3;

    var _newSelectedRowIds2 = {};

    var _handleRowById2 = function _handleRowById2(id) {
      var row = _rowsById3[id]; // Select a filtered or (less likely) invalid row (rowsById only contains visible rows).

      if (!row) {
        _newSelectedRowIds2[id] = true;
        return;
      }

      if (!row.isGrouped) {
        _newSelectedRowIds2[id] = true;
      }

      if (_selectSubRows2 && row.subRows) {
        return row.subRows.forEach(function (row) {
          return _handleRowById2(row.id);
        });
      }
    };

    _setSelected3.forEach(function (rowId) {
      return _handleRowById2(rowId);
    });

    return _objectSpread(_objectSpread({}, state), {}, {
      selectedRowIds: _newSelectedRowIds2
    });
  }

  return state;
}

function useInstance(instance) {
  var data = instance.data,
      rows = instance.rows,
      getHooks = instance.getHooks,
      plugins = instance.plugins,
      rowsById = instance.rowsById,
      _instance$nonGroupedR2 = instance.nonGroupedRowsById,
      nonGroupedRowsById = _instance$nonGroupedR2 === void 0 ? rowsById : _instance$nonGroupedR2,
      _instance$autoResetSe = instance.autoResetSelectedRows,
      autoResetSelectedRows = _instance$autoResetSe === void 0 ? true : _instance$autoResetSe,
      selectedRowIds = instance.state.selectedRowIds,
      _instance$selectSubRo4 = instance.selectSubRows,
      selectSubRows = _instance$selectSubRo4 === void 0 ? true : _instance$selectSubRo4,
      dispatch = instance.dispatch,
      page = instance.page;
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.ensurePluginOrder)(plugins, ['useFilters', 'useGroupBy', 'useSortBy', 'useExpanded', 'usePagination'], 'useRowSelect');
  var selectedFlatRows = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(function () {
    var selectedFlatRows = []; // Ensure row.isSelected is set for sub rows when paginateExpandedRows = false
    // https://github.com/TanStack/react-table/issues/2908

    var handleRow = function handleRow(row) {
      var isSelected = selectSubRows ? getRowIsSelected(row, selectedRowIds) : !!selectedRowIds[row.id];
      row.isSelected = !!isSelected;
      row.isSomeSelected = isSelected === null;

      if (isSelected) {
        selectedFlatRows.push(row);
      }

      if (row.subRows && row.subRows.length) {
        row.subRows.forEach(function (row) {
          return handleRow(row);
        });
      }
    };

    rows.forEach(function (row) {
      return handleRow(row);
    });
    return selectedFlatRows;
  }, [rows, selectSubRows, selectedRowIds]);
  var isAllRowsSelected = Boolean(Object.keys(nonGroupedRowsById).length && Object.keys(selectedRowIds).length);
  var isAllPageRowsSelected = isAllRowsSelected;

  if (isAllRowsSelected) {
    if (Object.keys(nonGroupedRowsById).some(function (id) {
      return !selectedRowIds[id];
    })) {
      isAllRowsSelected = false;
    }
  }

  if (!isAllRowsSelected) {
    if (page && page.length && page.some(function (_ref5) {
      var id = _ref5.id;
      return !selectedRowIds[id];
    })) {
      isAllPageRowsSelected = false;
    }
  }

  var getAutoResetSelectedRows = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(autoResetSelectedRows);
  (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useMountedLayoutEffect)(function () {
    if (getAutoResetSelectedRows()) {
      dispatch({
        type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.resetSelectedRows
      });
    }
  }, [dispatch, data]);
  var toggleAllRowsSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllRowsSelected,
      value: value
    });
  }, [dispatch]);
  var toggleAllPageRowsSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (value) {
    return dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleAllPageRowsSelected,
      value: value
    });
  }, [dispatch]);
  var toggleRowSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (id, value) {
    return dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.toggleRowSelected,
      id: id,
      value: value
    });
  }, [dispatch]);
  var setRowsSelected = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function (ids) {
    return dispatch({
      type: react_table__WEBPACK_IMPORTED_MODULE_1__.actions.setRowsSelected,
      ids: ids
    });
  }, [dispatch]);
  var getInstance = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(instance);
  var getToggleAllRowsSelectedProps = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleAllRowsSelectedProps, {
    instance: getInstance()
  });
  var getToggleAllPageRowsSelectedProps = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(getHooks().getToggleAllPageRowsSelectedProps, {
    instance: getInstance()
  });
  Object.assign(instance, {
    selectedFlatRows: selectedFlatRows,
    isAllRowsSelected: isAllRowsSelected,
    isAllPageRowsSelected: isAllPageRowsSelected,
    toggleRowSelected: toggleRowSelected,
    toggleAllRowsSelected: toggleAllRowsSelected,
    setRowsSelected: setRowsSelected,
    getToggleAllRowsSelectedProps: getToggleAllRowsSelectedProps,
    getToggleAllPageRowsSelectedProps: getToggleAllPageRowsSelectedProps,
    toggleAllPageRowsSelected: toggleAllPageRowsSelected
  });
}

function prepareRow(row, _ref6) {
  var instance = _ref6.instance;

  row.toggleRowSelected = function (set) {
    return instance.toggleRowSelected(row.id, set);
  };

  row.getToggleRowSelectedProps = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.makePropGetter)(instance.getHooks().getToggleRowSelectedProps, {
    instance: instance,
    row: row
  });
}

function getRowIsSelected(row, selectedRowIds) {
  if (selectedRowIds[row.id]) {
    return true;
  }

  var subRows = row.subRows;

  if (subRows && subRows.length) {
    var allChildrenSelected = true;
    var someSelected = false;
    subRows.forEach(function (subRow) {
      // Bail out early if we know both of these
      if (someSelected && !allChildrenSelected) {
        return;
      }

      if (getRowIsSelected(subRow, selectedRowIds)) {
        someSelected = true;
      } else {
        allChildrenSelected = false;
      }
    });
    return allChildrenSelected ? true : someSelected ? null : false;
  }

  return false;
}

/***/ }),

/***/ "./srcjs/useStickyColumns.js":
/*!***********************************!*\
  !*** ./srcjs/useStickyColumns.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ useStickyColumns; }
/* harmony export */ });
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./srcjs/utils.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }



function useStickyColumns(hooks) {
  hooks.getHeaderProps.push(getHeaderProps);
  hooks.getCellProps.push(getCellProps);
  hooks.getFooterProps.push(getFooterProps);
  hooks.useInstance.push(useInstance);
}
useStickyColumns.pluginName = 'useStickyColumns';

var getHeaderProps = function getHeaderProps(props, _ref) {
  var column = _ref.column;

  if (!column.stickyProps) {
    return props;
  }

  return [props, column.stickyProps];
};

var getCellProps = function getCellProps(props, _ref2) {
  var cell = _ref2.cell;

  if (!cell.column.stickyProps) {
    return props;
  }

  return [props, cell.column.stickyProps];
};

var getFooterProps = function getFooterProps(props, _ref3) {
  var column = _ref3.column;

  if (!column.stickyProps) {
    return props;
  }

  return [props, column.stickyProps];
};

var getStickyProps = function getStickyProps(column, columns) {
  var props = {
    className: 'rt-sticky',
    style: {
      position: 'sticky'
    }
  };

  if (column.sticky === 'left') {
    var stickyCols = columns.filter(function (col) {
      return col.sticky === 'left';
    });
    props.style.left = 0;

    var _iterator = _createForOfIteratorHelper(stickyCols),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var col = _step.value;
        if (col.id === column.id) break;
        props.style.left += col.totalWidth;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else if (column.sticky === 'right') {
    var _stickyCols = columns.filter(function (col) {
      return col.sticky === 'right';
    });

    props.style.right = 0;

    var _iterator2 = _createForOfIteratorHelper(_stickyCols.reverse()),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _col = _step2.value;
        if (_col.id === column.id) break;
        props.style.right += _col.totalWidth;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }

  return props;
};

function useInstance(instance) {
  var plugins = instance.plugins,
      headerGroups = instance.headerGroups;
  (0,react_table__WEBPACK_IMPORTED_MODULE_0__.ensurePluginOrder)(plugins, ['useResizeColumns'], 'useStickyColumns');
  headerGroups.forEach(function (headerGroup) {
    var columns = headerGroup.headers; // Ensure all columns in the group have the same sticky property.
    // If any sticky properties in the group differ, the first sticky column's
    // property is used for the whole group.

    columns.forEach(function (column) {
      var groupColumns = [column];

      if (column.columns) {
        groupColumns.push.apply(groupColumns, _toConsumableArray((0,_utils__WEBPACK_IMPORTED_MODULE_1__.getLeafColumns)(column)));
      }

      var firstStickyCol = groupColumns.find(function (col) {
        return col.sticky;
      });

      if (firstStickyCol) {
        groupColumns.forEach(function (col) {
          col.sticky = firstStickyCol.sticky;
        });
      }
    });
    columns.forEach(function (column) {
      if (column.sticky) {
        column.stickyProps = getStickyProps(column, columns);
      }
    });
  });
}

/***/ }),

/***/ "./srcjs/utils.js":
/*!************************!*\
  !*** ./srcjs/utils.js ***!
  \************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "classNames": function() { return /* binding */ classNames; },
/* harmony export */   "convertRowsToV6": function() { return /* binding */ convertRowsToV6; },
/* harmony export */   "downloadCSV": function() { return /* binding */ downloadCSV; },
/* harmony export */   "escapeRegExp": function() { return /* binding */ escapeRegExp; },
/* harmony export */   "getFirstDefined": function() { return /* binding */ getFirstDefined; },
/* harmony export */   "getLeafColumns": function() { return /* binding */ getLeafColumns; },
/* harmony export */   "isBrowser": function() { return /* binding */ isBrowser; },
/* harmony export */   "rowsToCSV": function() { return /* binding */ rowsToCSV; },
/* harmony export */   "useAsyncDebounce": function() { return /* binding */ useAsyncDebounce; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-table */ "./node_modules/react-table/src/index.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



function classNames() {
  for (var _len = arguments.length, classes = new Array(_len), _key = 0; _key < _len; _key++) {
    classes[_key] = arguments[_key];
  }

  return classes.filter(function (cls) {
    return cls;
  }).join(' ');
}
function getFirstDefined() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return args.find(function (x) {
    return x != null;
  });
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} // Get leaf columns as an array

function getLeafColumns(column) {
  var leafColumns = [];

  var recurseColumn = function recurseColumn(column) {
    if (column.columns) {
      column.columns.forEach(recurseColumn);
    } else {
      leafColumns.push(column);
    }
  };

  recurseColumn(column);
  return leafColumns;
} // Convert row data for react-table v6 compatibility

function convertRowsToV6(rows) {
  return rows.map(function (row) {
    if (row.subRows && row.subRows.length > 0) {
      return _objectSpread({
        _subRows: convertRowsToV6(row.subRows)
      }, row.values);
    } else {
      return row.values;
    }
  });
}
function rowsToCSV(rows) {
  if (rows.length === 0) {
    return '';
  }

  var rowToCSV = function rowToCSV(row) {
    return row.map(function (value) {
      if (value == null) {
        value = '';
      } // Serialize dates as ISO strings, all other non-string and non-numeric values as JSON


      if (value instanceof Date) {
        value = value.toISOString();
      } else if (typeof value !== 'string' && typeof value !== 'number') {
        value = JSON.stringify(value);
      } // Escape CSV-unsafe characters


      if (typeof value === 'string' && value.match(/[",]/)) {
        value = "\"".concat(value.replace(/"/g, '""'), "\"");
      }

      return value;
    }).join(',');
  };

  var csv = [];
  var headers = Object.keys(rows[0]);
  csv.push(rowToCSV(headers));

  var _iterator = _createForOfIteratorHelper(rows),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var row = _step.value;
      csv.push(rowToCSV(Object.values(row)));
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return csv.join('\n') + '\n';
}
function downloadCSV(content, filename) {
  var blob = new Blob([content], {
    type: 'text/csv;charset=utf-8'
  });

  if (window.navigator.msSaveBlob) {
    // For IE11
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement('a');
    var url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
function isBrowser() {
  return typeof document !== 'undefined';
} // useAsyncDebounce from react-table without async/await (which seems to be unnecessary anyway)
// to avoid adding regenerator-runtime to bundle.

function useAsyncDebounce(defaultFn) {
  var defaultWait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var debounceRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef({});
  var getDefaultFn = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(defaultFn);
  var getDefaultWait = (0,react_table__WEBPACK_IMPORTED_MODULE_1__.useGetLatest)(defaultWait);
  return react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    if (!debounceRef.current.promise) {
      debounceRef.current.promise = new Promise(function (resolve, reject) {
        debounceRef.current.resolve = resolve;
        debounceRef.current.reject = reject;
      });
    }

    if (debounceRef.current.timeout) {
      clearTimeout(debounceRef.current.timeout);
    }

    debounceRef.current.timeout = setTimeout(function () {
      delete debounceRef.current.timeout;

      try {
        debounceRef.current.resolve(getDefaultFn().apply(void 0, args));
      } catch (err) {
        debounceRef.current.reject(err);
      } finally {
        delete debounceRef.current.promise;
      }
    }, getDefaultWait());
    return debounceRef.current.promise;
  }, [getDefaultFn, getDefaultWait]);
}

/***/ }),

/***/ "./srcjs/react-table.css":
/*!*******************************!*\
  !*** ./srcjs/react-table.css ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./srcjs/reactable.css":
/*!*****************************!*\
  !*** ./srcjs/reactable.css ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./node_modules/object-assign/index.js":
/*!*********************************************!*\
  !*** ./node_modules/object-assign/index.js ***!
  \*********************************************/
/***/ (function(module) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),

/***/ "./node_modules/prop-types/checkPropTypes.js":
/*!***************************************************!*\
  !*** ./node_modules/prop-types/checkPropTypes.js ***!
  \***************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var printWarning = function() {};

if (true) {
  var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "./node_modules/prop-types/lib/ReactPropTypesSecret.js");
  var loggedTypeFailures = {};
  var has = __webpack_require__(/*! ./lib/has */ "./node_modules/prop-types/lib/has.js");

  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) { /**/ }
  };
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (true) {
    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            var err = Error(
              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' +
              'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          printWarning(
            (componentName || 'React class') + ': type specification of ' +
            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
            'You may have forgotten to pass an argument to the type checker ' +
            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
            'shape all require an argument).'
          );
        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          printWarning(
            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
          );
        }
      }
    }
  }
}

/**
 * Resets warning cache when testing.
 *
 * @private
 */
checkPropTypes.resetWarningCache = function() {
  if (true) {
    loggedTypeFailures = {};
  }
}

module.exports = checkPropTypes;


/***/ }),

/***/ "./node_modules/prop-types/factoryWithTypeCheckers.js":
/*!************************************************************!*\
  !*** ./node_modules/prop-types/factoryWithTypeCheckers.js ***!
  \************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactIs = __webpack_require__(/*! react-is */ "./node_modules/prop-types/node_modules/react-is/index.js");
var assign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "./node_modules/prop-types/lib/ReactPropTypesSecret.js");
var has = __webpack_require__(/*! ./lib/has */ "./node_modules/prop-types/lib/has.js");
var checkPropTypes = __webpack_require__(/*! ./checkPropTypes */ "./node_modules/prop-types/checkPropTypes.js");

var printWarning = function() {};

if (true) {
  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

function emptyFunctionThatReturnsNull() {
  return null;
}

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bigint: createPrimitiveTypeChecker('bigint'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    elementType: createElementTypeTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message, data) {
    this.message = message;
    this.data = data && typeof data === 'object' ? data: {};
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (true) {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
          err.name = 'Invariant Violation';
          throw err;
        } else if ( true && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            printWarning(
              'You are manually calling a React.PropTypes validation ' +
              'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError(
          'Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'),
          {expectedType: expectedType}
        );
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!ReactIs.isValidElementType(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      if (true) {
        if (arguments.length > 1) {
          printWarning(
            'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
            'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
          );
        } else {
          printWarning('Invalid argument supplied to oneOf, expected an array.');
        }
      }
      return emptyFunctionThatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
        var type = getPreciseType(value);
        if (type === 'symbol') {
          return String(value);
        }
        return value;
      });
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (has(propValue, key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
       true ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : 0;
      return emptyFunctionThatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        printWarning(
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
        );
        return emptyFunctionThatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      var expectedTypes = [];
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
        if (checkerResult == null) {
          return null;
        }
        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
          expectedTypes.push(checkerResult.data.expectedType);
        }
      }
      var expectedTypesMessage = (expectedTypes.length > 0) ? ', expected one of type [' + expectedTypes.join(', ') + ']': '';
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function invalidValidatorError(componentName, location, propFullName, key, type) {
    return new PropTypeError(
      (componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' +
      'it must be a function, usually from the `prop-types` package, but received `' + type + '`.'
    );
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (has(shapeTypes, key) && typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // falsy value can't be a Symbol
    if (!propValue) {
      return false;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),

/***/ "./node_modules/prop-types/index.js":
/*!******************************************!*\
  !*** ./node_modules/prop-types/index.js ***!
  \******************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (true) {
  var ReactIs = __webpack_require__(/*! react-is */ "./node_modules/prop-types/node_modules/react-is/index.js");

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = __webpack_require__(/*! ./factoryWithTypeCheckers */ "./node_modules/prop-types/factoryWithTypeCheckers.js")(ReactIs.isElement, throwOnDirectAccess);
} else {}


/***/ }),

/***/ "./node_modules/prop-types/lib/ReactPropTypesSecret.js":
/*!*************************************************************!*\
  !*** ./node_modules/prop-types/lib/ReactPropTypesSecret.js ***!
  \*************************************************************/
/***/ (function(module) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ }),

/***/ "./node_modules/prop-types/lib/has.js":
/*!********************************************!*\
  !*** ./node_modules/prop-types/lib/has.js ***!
  \********************************************/
/***/ (function(module) {

module.exports = Function.call.bind(Object.prototype.hasOwnProperty);


/***/ }),

/***/ "./node_modules/prop-types/node_modules/react-is/cjs/react-is.development.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/prop-types/node_modules/react-is/cjs/react-is.development.js ***!
  \***********************************************************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */





if (true) {
  (function() {
'use strict';

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

function isValidElementType(type) {
  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
}

function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    var $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = object.type;

        switch (type) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return type;

          default:
            var $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;

              default:
                return $$typeof;
            }

        }

      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
} // AsyncMode is deprecated along with isAsyncMode

var AsyncMode = REACT_ASYNC_MODE_TYPE;
var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
var ContextConsumer = REACT_CONTEXT_TYPE;
var ContextProvider = REACT_PROVIDER_TYPE;
var Element = REACT_ELEMENT_TYPE;
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Fragment = REACT_FRAGMENT_TYPE;
var Lazy = REACT_LAZY_TYPE;
var Memo = REACT_MEMO_TYPE;
var Portal = REACT_PORTAL_TYPE;
var Profiler = REACT_PROFILER_TYPE;
var StrictMode = REACT_STRICT_MODE_TYPE;
var Suspense = REACT_SUSPENSE_TYPE;
var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

function isAsyncMode(object) {
  {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
    }
  }

  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}
function isPortal(object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
function isProfiler(object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
function isStrictMode(object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
function isSuspense(object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}

exports.AsyncMode = AsyncMode;
exports.ConcurrentMode = ConcurrentMode;
exports.ContextConsumer = ContextConsumer;
exports.ContextProvider = ContextProvider;
exports.Element = Element;
exports.ForwardRef = ForwardRef;
exports.Fragment = Fragment;
exports.Lazy = Lazy;
exports.Memo = Memo;
exports.Portal = Portal;
exports.Profiler = Profiler;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.isAsyncMode = isAsyncMode;
exports.isConcurrentMode = isConcurrentMode;
exports.isContextConsumer = isContextConsumer;
exports.isContextProvider = isContextProvider;
exports.isElement = isElement;
exports.isForwardRef = isForwardRef;
exports.isFragment = isFragment;
exports.isLazy = isLazy;
exports.isMemo = isMemo;
exports.isPortal = isPortal;
exports.isProfiler = isProfiler;
exports.isStrictMode = isStrictMode;
exports.isSuspense = isSuspense;
exports.isValidElementType = isValidElementType;
exports.typeOf = typeOf;
  })();
}


/***/ }),

/***/ "./node_modules/prop-types/node_modules/react-is/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/prop-types/node_modules/react-is/index.js ***!
  \****************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";


if (false) {} else {
  module.exports = __webpack_require__(/*! ./cjs/react-is.development.js */ "./node_modules/prop-types/node_modules/react-is/cjs/react-is.development.js");
}


/***/ }),

/***/ "react":
/*!*******************************!*\
  !*** external "window.React" ***!
  \*******************************/
/***/ (function(module) {

"use strict";
module.exports = window.React;

/***/ }),

/***/ "react-dom":
/*!**********************************!*\
  !*** external "window.ReactDOM" ***!
  \**********************************/
/***/ (function(module) {

"use strict";
module.exports = window.ReactDOM;

/***/ }),

/***/ "reactR":
/*!********************************!*\
  !*** external "window.reactR" ***!
  \********************************/
/***/ (function(module) {

"use strict";
module.exports = window.reactR;

/***/ }),

/***/ "./node_modules/stylis/src/Enum.js":
/*!*****************************************!*\
  !*** ./node_modules/stylis/src/Enum.js ***!
  \*****************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CHARSET": function() { return /* binding */ CHARSET; },
/* harmony export */   "COMMENT": function() { return /* binding */ COMMENT; },
/* harmony export */   "COUNTER_STYLE": function() { return /* binding */ COUNTER_STYLE; },
/* harmony export */   "DECLARATION": function() { return /* binding */ DECLARATION; },
/* harmony export */   "DOCUMENT": function() { return /* binding */ DOCUMENT; },
/* harmony export */   "FONT_FACE": function() { return /* binding */ FONT_FACE; },
/* harmony export */   "FONT_FEATURE_VALUES": function() { return /* binding */ FONT_FEATURE_VALUES; },
/* harmony export */   "IMPORT": function() { return /* binding */ IMPORT; },
/* harmony export */   "KEYFRAMES": function() { return /* binding */ KEYFRAMES; },
/* harmony export */   "MEDIA": function() { return /* binding */ MEDIA; },
/* harmony export */   "MOZ": function() { return /* binding */ MOZ; },
/* harmony export */   "MS": function() { return /* binding */ MS; },
/* harmony export */   "NAMESPACE": function() { return /* binding */ NAMESPACE; },
/* harmony export */   "PAGE": function() { return /* binding */ PAGE; },
/* harmony export */   "RULESET": function() { return /* binding */ RULESET; },
/* harmony export */   "SUPPORTS": function() { return /* binding */ SUPPORTS; },
/* harmony export */   "VIEWPORT": function() { return /* binding */ VIEWPORT; },
/* harmony export */   "WEBKIT": function() { return /* binding */ WEBKIT; }
/* harmony export */ });
var MS = '-ms-'
var MOZ = '-moz-'
var WEBKIT = '-webkit-'

var COMMENT = 'comm'
var RULESET = 'rule'
var DECLARATION = 'decl'

var PAGE = '@page'
var MEDIA = '@media'
var IMPORT = '@import'
var CHARSET = '@charset'
var VIEWPORT = '@viewport'
var SUPPORTS = '@supports'
var DOCUMENT = '@document'
var NAMESPACE = '@namespace'
var KEYFRAMES = '@keyframes'
var FONT_FACE = '@font-face'
var COUNTER_STYLE = '@counter-style'
var FONT_FEATURE_VALUES = '@font-feature-values'


/***/ }),

/***/ "./node_modules/stylis/src/Middleware.js":
/*!***********************************************!*\
  !*** ./node_modules/stylis/src/Middleware.js ***!
  \***********************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "middleware": function() { return /* binding */ middleware; },
/* harmony export */   "namespace": function() { return /* binding */ namespace; },
/* harmony export */   "prefixer": function() { return /* binding */ prefixer; },
/* harmony export */   "rulesheet": function() { return /* binding */ rulesheet; }
/* harmony export */ });
/* harmony import */ var _Enum_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Enum.js */ "./node_modules/stylis/src/Enum.js");
/* harmony import */ var _Utility_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utility.js */ "./node_modules/stylis/src/Utility.js");
/* harmony import */ var _Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Tokenizer.js */ "./node_modules/stylis/src/Tokenizer.js");
/* harmony import */ var _Serializer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Serializer.js */ "./node_modules/stylis/src/Serializer.js");
/* harmony import */ var _Prefixer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Prefixer.js */ "./node_modules/stylis/src/Prefixer.js");






/**
 * @param {function[]} collection
 * @return {function}
 */
function middleware (collection) {
	var length = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.sizeof)(collection)

	return function (element, index, children, callback) {
		var output = ''

		for (var i = 0; i < length; i++)
			output += collection[i](element, index, children, callback) || ''

		return output
	}
}

/**
 * @param {function} callback
 * @return {function}
 */
function rulesheet (callback) {
	return function (element) {
		if (!element.root)
			if (element = element.return)
				callback(element)
	}
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 */
function prefixer (element, index, children, callback) {
	if (element.length > -1)
		if (!element.return)
			switch (element.type) {
				case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.DECLARATION: element.return = (0,_Prefixer_js__WEBPACK_IMPORTED_MODULE_2__.prefix)(element.value, element.length)
					break
				case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.KEYFRAMES:
					return (0,_Serializer_js__WEBPACK_IMPORTED_MODULE_3__.serialize)([(0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.copy)(element, {value: (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(element.value, '@', '@' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT)})], callback)
				case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.RULESET:
					if (element.length)
						return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.combine)(element.props, function (value) {
							switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.match)(value, /(::plac\w+|:read-\w+)/)) {
								// :read-(only|write)
								case ':read-only': case ':read-write':
									return (0,_Serializer_js__WEBPACK_IMPORTED_MODULE_3__.serialize)([(0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.copy)(element, {props: [(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /:(read-\w+)/, ':' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MOZ + '$1')]})], callback)
								// :placeholder
								case '::placeholder':
									return (0,_Serializer_js__WEBPACK_IMPORTED_MODULE_3__.serialize)([
										(0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.copy)(element, {props: [(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /:(plac\w+)/, ':' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + 'input-$1')]}),
										(0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.copy)(element, {props: [(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /:(plac\w+)/, ':' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MOZ + '$1')]}),
										(0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.copy)(element, {props: [(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /:(plac\w+)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'input-$1')]})
									], callback)
							}

							return ''
						})
			}
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 */
function namespace (element) {
	switch (element.type) {
		case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.RULESET:
			element.props = element.props.map(function (value) {
				return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.combine)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_4__.tokenize)(value), function (value, index, children) {
					switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, 0)) {
						// \f
						case 12:
							return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.substr)(value, 1, (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.strlen)(value))
						// \0 ( + > ~
						case 0: case 40: case 43: case 62: case 126:
							return value
						// :
						case 58:
							if (children[++index] === 'global')
								children[index] = '', children[++index] = '\f' + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.substr)(children[index], index = 1, -1)
						// \s
						case 32:
							return index === 1 ? '' : value
						default:
							switch (index) {
								case 0: element = value
									return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.sizeof)(children) > 1 ? '' : value
								case index = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.sizeof)(children) - 1: case 2:
									return index === 2 ? value + element + element : value + element
								default:
									return value
							}
					}
				})
			})
	}
}


/***/ }),

/***/ "./node_modules/stylis/src/Parser.js":
/*!*******************************************!*\
  !*** ./node_modules/stylis/src/Parser.js ***!
  \*******************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "comment": function() { return /* binding */ comment; },
/* harmony export */   "compile": function() { return /* binding */ compile; },
/* harmony export */   "declaration": function() { return /* binding */ declaration; },
/* harmony export */   "parse": function() { return /* binding */ parse; },
/* harmony export */   "ruleset": function() { return /* binding */ ruleset; }
/* harmony export */ });
/* harmony import */ var _Enum_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Enum.js */ "./node_modules/stylis/src/Enum.js");
/* harmony import */ var _Utility_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Utility.js */ "./node_modules/stylis/src/Utility.js");
/* harmony import */ var _Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Tokenizer.js */ "./node_modules/stylis/src/Tokenizer.js");




/**
 * @param {string} value
 * @return {object[]}
 */
function compile (value) {
	return (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.dealloc)(parse('', null, null, null, [''], value = (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.alloc)(value), 0, [0], value))
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {string[]} rule
 * @param {string[]} rules
 * @param {string[]} rulesets
 * @param {number[]} pseudo
 * @param {number[]} points
 * @param {string[]} declarations
 * @return {object}
 */
function parse (value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
	var index = 0
	var offset = 0
	var length = pseudo
	var atrule = 0
	var property = 0
	var previous = 0
	var variable = 1
	var scanning = 1
	var ampersand = 1
	var character = 0
	var type = ''
	var props = rules
	var children = rulesets
	var reference = rule
	var characters = type

	while (scanning)
		switch (previous = character, character = (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.next)()) {
			// (
			case 40:
				if (previous != 108 && characters.charCodeAt(length - 1) == 58) {
					if ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.indexof)(characters += (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.replace)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.delimit)(character), '&', '&\f'), '&\f') != -1)
						ampersand = -1
					break
				}
			// " ' [
			case 34: case 39: case 91:
				characters += (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.delimit)(character)
				break
			// \t \n \r \s
			case 9: case 10: case 13: case 32:
				characters += (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.whitespace)(previous)
				break
			// \
			case 92:
				characters += (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.escaping)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.caret)() - 1, 7)
				continue
			// /
			case 47:
				switch ((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.peek)()) {
					case 42: case 47:
						;(0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.append)(comment((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.commenter)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.next)(), (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.caret)()), root, parent), declarations)
						break
					default:
						characters += '/'
				}
				break
			// {
			case 123 * variable:
				points[index++] = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(characters) * ampersand
			// } ; \0
			case 125 * variable: case 59: case 0:
				switch (character) {
					// \0 }
					case 0: case 125: scanning = 0
					// ;
					case 59 + offset:
						if (property > 0 && ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(characters) - length))
							(0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.append)(property > 32 ? declaration(characters + ';', rule, parent, length - 1) : declaration((0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.replace)(characters, ' ', '') + ';', rule, parent, length - 2), declarations)
						break
					// @ ;
					case 59: characters += ';'
					// { rule/at-rule
					default:
						;(0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.append)(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length), rulesets)

						if (character === 123)
							if (offset === 0)
								parse(characters, root, reference, reference, props, rulesets, length, points, children)
							else
								switch (atrule) {
									// d m s
									case 100: case 109: case 115:
										parse(value, reference, reference, rule && (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.append)(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length), children), rules, children, length, points, rule ? props : children)
										break
									default:
										parse(characters, reference, reference, reference, [''], children, 0, points, children)
								}
				}

				index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo
				break
			// :
			case 58:
				length = 1 + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(characters), property = previous
			default:
				if (variable < 1)
					if (character == 123)
						--variable
					else if (character == 125 && variable++ == 0 && (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.prev)() == 125)
						continue

				switch (characters += (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.from)(character), character * variable) {
					// &
					case 38:
						ampersand = offset > 0 ? 1 : (characters += '\f', -1)
						break
					// ,
					case 44:
						points[index++] = ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(characters) - 1) * ampersand, ampersand = 1
						break
					// @
					case 64:
						// -
						if ((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.peek)() === 45)
							characters += (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.delimit)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.next)())

						atrule = (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.peek)(), offset = length = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(type = characters += (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.identifier)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.caret)())), character++
						break
					// -
					case 45:
						if (previous === 45 && (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.strlen)(characters) == 2)
							variable = 0
				}
		}

	return rulesets
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} index
 * @param {number} offset
 * @param {string[]} rules
 * @param {number[]} points
 * @param {string} type
 * @param {string[]} props
 * @param {string[]} children
 * @param {number} length
 * @return {object}
 */
function ruleset (value, root, parent, index, offset, rules, points, type, props, children, length) {
	var post = offset - 1
	var rule = offset === 0 ? rules : ['']
	var size = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.sizeof)(rule)

	for (var i = 0, j = 0, k = 0; i < index; ++i)
		for (var x = 0, y = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.substr)(value, post + 1, post = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.abs)(j = points[i])), z = value; x < size; ++x)
			if (z = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.trim)(j > 0 ? rule[x] + ' ' + y : (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.replace)(y, /&\f/g, rule[x])))
				props[k++] = z

	return (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.node)(value, root, parent, offset === 0 ? _Enum_js__WEBPACK_IMPORTED_MODULE_2__.RULESET : type, props, children, length)
}

/**
 * @param {number} value
 * @param {object} root
 * @param {object?} parent
 * @return {object}
 */
function comment (value, root, parent) {
	return (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.node)(value, root, parent, _Enum_js__WEBPACK_IMPORTED_MODULE_2__.COMMENT, (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.from)((0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.char)()), (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.substr)(value, 2, -2), 0)
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} length
 * @return {object}
 */
function declaration (value, root, parent, length) {
	return (0,_Tokenizer_js__WEBPACK_IMPORTED_MODULE_0__.node)(value, root, parent, _Enum_js__WEBPACK_IMPORTED_MODULE_2__.DECLARATION, (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.substr)(value, 0, length), (0,_Utility_js__WEBPACK_IMPORTED_MODULE_1__.substr)(value, length + 1, -1), length)
}


/***/ }),

/***/ "./node_modules/stylis/src/Prefixer.js":
/*!*********************************************!*\
  !*** ./node_modules/stylis/src/Prefixer.js ***!
  \*********************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "prefix": function() { return /* binding */ prefix; }
/* harmony export */ });
/* harmony import */ var _Enum_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Enum.js */ "./node_modules/stylis/src/Enum.js");
/* harmony import */ var _Utility_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utility.js */ "./node_modules/stylis/src/Utility.js");



/**
 * @param {string} value
 * @param {number} length
 * @return {string}
 */
function prefix (value, length) {
	switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.hash)(value, length)) {
		// color-adjust
		case 5103:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + 'print-' + value + value
		// animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
		case 5737: case 4201: case 3177: case 3433: case 1641: case 4457: case 2921:
		// text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
		case 5572: case 6356: case 5844: case 3191: case 6645: case 3005:
		// mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
		case 6391: case 5879: case 5623: case 6135: case 4599: case 4855:
		// background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
		case 4215: case 6389: case 5109: case 5365: case 5621: case 3829:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + value
		// appearance, user-select, transform, hyphens, text-size-adjust
		case 5349: case 4246: case 4810: case 6968: case 2756:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MOZ + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + value + value
		// flex, flex-direction
		case 6828: case 4268:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + value + value
		// order
		case 6165:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'flex-' + value + value
		// align-items
		case 5187:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(\w+).+(:[^]+)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + 'box-$1$2' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'flex-$1$2') + value
		// align-self
		case 5443:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'flex-item-' + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /flex-|-self/, '') + value
		// align-content
		case 4675:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'flex-line-pack' + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /align-content|flex-|-self/, '') + value
		// flex-shrink
		case 5548:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, 'shrink', 'negative') + value
		// flex-basis
		case 5292:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, 'basis', 'preferred-size') + value
		// flex-grow
		case 6060:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + 'box-' + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, '-grow', '') + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, 'grow', 'positive') + value
		// transition
		case 4554:
			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /([^-])(transform)/g, '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$2') + value
		// cursor
		case 6187:
			return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(zoom-|grab)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$1'), /(image-set)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$1'), value, '') + value
		// background, background-image
		case 5495: case 3959:
			return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(image-set\([^]*)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$1' + '$`$1')
		// justify-content
		case 4968:
			return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(.+:)(flex-)?(.*)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + 'box-pack:$3' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + value
		// (margin|padding)-inline-(start|end)
		case 4095: case 3583: case 4068: case 2532:
			return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(.+)-inline(.+)/, _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$1$2') + value
		// (min|max)?(width|height|inline-size|block-size)
		case 8116: case 7059: case 5753: case 5535:
		case 5445: case 5701: case 4933: case 4677:
		case 5533: case 5789: case 5021: case 4765:
			// stretch, max-content, min-content, fill-available
			if ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.strlen)(value) - 1 - length > 6)
				switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, length + 1)) {
					// (m)ax-content, (m)in-content
					case 109:
						// -
						if ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, length + 4) !== 45)
							break
					// (f)ill-available, (f)it-content
					case 102:
						return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(.+:)(.+)-([^]+)/, '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$2-$3' + '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MOZ + ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, length + 3) == 108 ? '$3' : '$2-$3')) + value
					// (s)tretch
					case 115:
						return ~(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.indexof)(value, 'stretch') ? prefix((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, 'stretch', 'fill-available'), length) + value : value
				}
			break
		// position: sticky
		case 4949:
			// (s)ticky?
			if ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, length + 1) !== 115)
				break
		// display: (flex|inline-flex)
		case 6444:
			switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.strlen)(value) - 3 - (~(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.indexof)(value, '!important') && 10))) {
				// stic(k)y
				case 107:
					return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, ':', ':' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT) + value
				// (inline-)?fl(e)x
				case 101:
					return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /(.+:)([^;!]+)(;|!.+)?/, '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + '$2$3' + '$1' + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + '$2box$3') + value
			}
			break
		// writing-mode
		case 5936:
			switch ((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(value, length + 11)) {
				// vertical-l(r)
				case 114:
					return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /[svh]\w+-[tblr]{2}/, 'tb') + value
				// vertical-r(l)
				case 108:
					return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value
				// horizontal(-)tb
				case 45:
					return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.replace)(value, /[svh]\w+-[tblr]{2}/, 'lr') + value
			}

			return _Enum_js__WEBPACK_IMPORTED_MODULE_1__.WEBKIT + value + _Enum_js__WEBPACK_IMPORTED_MODULE_1__.MS + value + value
	}

	return value
}


/***/ }),

/***/ "./node_modules/stylis/src/Serializer.js":
/*!***********************************************!*\
  !*** ./node_modules/stylis/src/Serializer.js ***!
  \***********************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serialize": function() { return /* binding */ serialize; },
/* harmony export */   "stringify": function() { return /* binding */ stringify; }
/* harmony export */ });
/* harmony import */ var _Enum_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Enum.js */ "./node_modules/stylis/src/Enum.js");
/* harmony import */ var _Utility_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utility.js */ "./node_modules/stylis/src/Utility.js");



/**
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function serialize (children, callback) {
	var output = ''
	var length = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.sizeof)(children)

	for (var i = 0; i < length; i++)
		output += callback(children[i], i, children, callback) || ''

	return output
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function stringify (element, index, children, callback) {
	switch (element.type) {
		case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.IMPORT: case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.DECLARATION: return element.return = element.return || element.value
		case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.COMMENT: return ''
		case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.KEYFRAMES: return element.return = element.value + '{' + serialize(element.children, callback) + '}'
		case _Enum_js__WEBPACK_IMPORTED_MODULE_1__.RULESET: element.value = element.props.join(',')
	}

	return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.strlen)(children = serialize(element.children, callback)) ? element.return = element.value + '{' + children + '}' : ''
}


/***/ }),

/***/ "./node_modules/stylis/src/Tokenizer.js":
/*!**********************************************!*\
  !*** ./node_modules/stylis/src/Tokenizer.js ***!
  \**********************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "alloc": function() { return /* binding */ alloc; },
/* harmony export */   "caret": function() { return /* binding */ caret; },
/* harmony export */   "char": function() { return /* binding */ char; },
/* harmony export */   "character": function() { return /* binding */ character; },
/* harmony export */   "characters": function() { return /* binding */ characters; },
/* harmony export */   "column": function() { return /* binding */ column; },
/* harmony export */   "commenter": function() { return /* binding */ commenter; },
/* harmony export */   "copy": function() { return /* binding */ copy; },
/* harmony export */   "dealloc": function() { return /* binding */ dealloc; },
/* harmony export */   "delimit": function() { return /* binding */ delimit; },
/* harmony export */   "delimiter": function() { return /* binding */ delimiter; },
/* harmony export */   "escaping": function() { return /* binding */ escaping; },
/* harmony export */   "identifier": function() { return /* binding */ identifier; },
/* harmony export */   "length": function() { return /* binding */ length; },
/* harmony export */   "line": function() { return /* binding */ line; },
/* harmony export */   "next": function() { return /* binding */ next; },
/* harmony export */   "node": function() { return /* binding */ node; },
/* harmony export */   "peek": function() { return /* binding */ peek; },
/* harmony export */   "position": function() { return /* binding */ position; },
/* harmony export */   "prev": function() { return /* binding */ prev; },
/* harmony export */   "slice": function() { return /* binding */ slice; },
/* harmony export */   "token": function() { return /* binding */ token; },
/* harmony export */   "tokenize": function() { return /* binding */ tokenize; },
/* harmony export */   "tokenizer": function() { return /* binding */ tokenizer; },
/* harmony export */   "whitespace": function() { return /* binding */ whitespace; }
/* harmony export */ });
/* harmony import */ var _Utility_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utility.js */ "./node_modules/stylis/src/Utility.js");


var line = 1
var column = 1
var length = 0
var position = 0
var character = 0
var characters = ''

/**
 * @param {string} value
 * @param {object | null} root
 * @param {object | null} parent
 * @param {string} type
 * @param {string[] | string} props
 * @param {object[] | string} children
 * @param {number} length
 */
function node (value, root, parent, type, props, children, length) {
	return {value: value, root: root, parent: parent, type: type, props: props, children: children, line: line, column: column, length: length, return: ''}
}

/**
 * @param {object} root
 * @param {object} props
 * @return {object}
 */
function copy (root, props) {
	return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.assign)(node('', null, null, '', null, null, 0), root, {length: -root.length}, props)
}

/**
 * @return {number}
 */
function char () {
	return character
}

/**
 * @return {number}
 */
function prev () {
	character = position > 0 ? (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(characters, --position) : 0

	if (column--, character === 10)
		column = 1, line--

	return character
}

/**
 * @return {number}
 */
function next () {
	character = position < length ? (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(characters, position++) : 0

	if (column++, character === 10)
		column = 1, line++

	return character
}

/**
 * @return {number}
 */
function peek () {
	return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.charat)(characters, position)
}

/**
 * @return {number}
 */
function caret () {
	return position
}

/**
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function slice (begin, end) {
	return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.substr)(characters, begin, end)
}

/**
 * @param {number} type
 * @return {number}
 */
function token (type) {
	switch (type) {
		// \0 \t \n \r \s whitespace token
		case 0: case 9: case 10: case 13: case 32:
			return 5
		// ! + , / > @ ~ isolate token
		case 33: case 43: case 44: case 47: case 62: case 64: case 126:
		// ; { } breakpoint token
		case 59: case 123: case 125:
			return 4
		// : accompanied token
		case 58:
			return 3
		// " ' ( [ opening delimit token
		case 34: case 39: case 40: case 91:
			return 2
		// ) ] closing delimit token
		case 41: case 93:
			return 1
	}

	return 0
}

/**
 * @param {string} value
 * @return {any[]}
 */
function alloc (value) {
	return line = column = 1, length = (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.strlen)(characters = value), position = 0, []
}

/**
 * @param {any} value
 * @return {any}
 */
function dealloc (value) {
	return characters = '', value
}

/**
 * @param {number} type
 * @return {string}
 */
function delimit (type) {
	return (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.trim)(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)))
}

/**
 * @param {string} value
 * @return {string[]}
 */
function tokenize (value) {
	return dealloc(tokenizer(alloc(value)))
}

/**
 * @param {number} type
 * @return {string}
 */
function whitespace (type) {
	while (character = peek())
		if (character < 33)
			next()
		else
			break

	return token(type) > 2 || token(character) > 3 ? '' : ' '
}

/**
 * @param {string[]} children
 * @return {string[]}
 */
function tokenizer (children) {
	while (next())
		switch (token(character)) {
			case 0: (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.append)(identifier(position - 1), children)
				break
			case 2: ;(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.append)(delimit(character), children)
				break
			default: ;(0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.append)((0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.from)(character), children)
		}

	return children
}

/**
 * @param {number} index
 * @param {number} count
 * @return {string}
 */
function escaping (index, count) {
	while (--count && next())
		// not 0-9 A-F a-f
		if (character < 48 || character > 102 || (character > 57 && character < 65) || (character > 70 && character < 97))
			break

	return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32))
}

/**
 * @param {number} type
 * @return {number}
 */
function delimiter (type) {
	while (next())
		switch (character) {
			// ] ) " '
			case type:
				return position
			// " '
			case 34: case 39:
				if (type !== 34 && type !== 39)
					delimiter(character)
				break
			// (
			case 40:
				if (type === 41)
					delimiter(type)
				break
			// \
			case 92:
				next()
				break
		}

	return position
}

/**
 * @param {number} type
 * @param {number} index
 * @return {number}
 */
function commenter (type, index) {
	while (next())
		// //
		if (type + character === 47 + 10)
			break
		// /*
		else if (type + character === 42 + 42 && peek() === 47)
			break

	return '/*' + slice(index, position - 1) + '*' + (0,_Utility_js__WEBPACK_IMPORTED_MODULE_0__.from)(type === 47 ? type : next())
}

/**
 * @param {number} index
 * @return {string}
 */
function identifier (index) {
	while (!token(peek()))
		next()

	return slice(index, position)
}


/***/ }),

/***/ "./node_modules/stylis/src/Utility.js":
/*!********************************************!*\
  !*** ./node_modules/stylis/src/Utility.js ***!
  \********************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "abs": function() { return /* binding */ abs; },
/* harmony export */   "append": function() { return /* binding */ append; },
/* harmony export */   "assign": function() { return /* binding */ assign; },
/* harmony export */   "charat": function() { return /* binding */ charat; },
/* harmony export */   "combine": function() { return /* binding */ combine; },
/* harmony export */   "from": function() { return /* binding */ from; },
/* harmony export */   "hash": function() { return /* binding */ hash; },
/* harmony export */   "indexof": function() { return /* binding */ indexof; },
/* harmony export */   "match": function() { return /* binding */ match; },
/* harmony export */   "replace": function() { return /* binding */ replace; },
/* harmony export */   "sizeof": function() { return /* binding */ sizeof; },
/* harmony export */   "strlen": function() { return /* binding */ strlen; },
/* harmony export */   "substr": function() { return /* binding */ substr; },
/* harmony export */   "trim": function() { return /* binding */ trim; }
/* harmony export */ });
/**
 * @param {number}
 * @return {number}
 */
var abs = Math.abs

/**
 * @param {number}
 * @return {string}
 */
var from = String.fromCharCode

/**
 * @param {object}
 * @return {object}
 */
var assign = Object.assign

/**
 * @param {string} value
 * @param {number} length
 * @return {number}
 */
function hash (value, length) {
	return (((((((length << 2) ^ charat(value, 0)) << 2) ^ charat(value, 1)) << 2) ^ charat(value, 2)) << 2) ^ charat(value, 3)
}

/**
 * @param {string} value
 * @return {string}
 */
function trim (value) {
	return value.trim()
}

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @return {string?}
 */
function match (value, pattern) {
	return (value = pattern.exec(value)) ? value[0] : value
}

/**
 * @param {string} value
 * @param {(string|RegExp)} pattern
 * @param {string} replacement
 * @return {string}
 */
function replace (value, pattern, replacement) {
	return value.replace(pattern, replacement)
}

/**
 * @param {string} value
 * @param {string} search
 * @return {number}
 */
function indexof (value, search) {
	return value.indexOf(search)
}

/**
 * @param {string} value
 * @param {number} index
 * @return {number}
 */
function charat (value, index) {
	return value.charCodeAt(index) | 0
}

/**
 * @param {string} value
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function substr (value, begin, end) {
	return value.slice(begin, end)
}

/**
 * @param {string} value
 * @return {number}
 */
function strlen (value) {
	return value.length
}

/**
 * @param {any[]} value
 * @return {number}
 */
function sizeof (value) {
	return value.length
}

/**
 * @param {any} value
 * @param {any[]} array
 * @return {any}
 */
function append (value, array) {
	return array.push(value), value
}

/**
 * @param {string[]} array
 * @param {function} callback
 * @return {string}
 */
function combine (array, callback) {
	return array.map(callback).join('')
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";
/*!************************!*\
  !*** ./srcjs/index.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "downloadDataCSV": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.downloadDataCSV; },
/* harmony export */   "getInstance": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.getInstance; },
/* harmony export */   "getState": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.getState; },
/* harmony export */   "onStateChange": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.onStateChange; },
/* harmony export */   "setAllFilters": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setAllFilters; },
/* harmony export */   "setData": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setData; },
/* harmony export */   "setFilter": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setFilter; },
/* harmony export */   "setGroupBy": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setGroupBy; },
/* harmony export */   "setMeta": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setMeta; },
/* harmony export */   "setSearch": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.setSearch; },
/* harmony export */   "toggleAllRowsExpanded": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.toggleAllRowsExpanded; },
/* harmony export */   "toggleGroupBy": function() { return /* reexport safe */ _Reactable__WEBPACK_IMPORTED_MODULE_1__.toggleGroupBy; }
/* harmony export */ });
/* harmony import */ var _reactR__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactR */ "./srcjs/reactR.js");
/* harmony import */ var _Reactable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Reactable */ "./srcjs/Reactable.js");


(0,_reactR__WEBPACK_IMPORTED_MODULE_0__.reactWidget)('reactable', 'output', {
  Reactable: _Reactable__WEBPACK_IMPORTED_MODULE_1__["default"]
});

}();
var __webpack_export_target__ = (Reactable = typeof Reactable === "undefined" ? {} : Reactable);
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=reactable.js.map