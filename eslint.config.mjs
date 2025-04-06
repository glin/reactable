import { defineConfig } from 'eslint/config'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import react from 'eslint-plugin-react'
import jsxA11Y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'
import babelParser from '@babel/eslint-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  {
    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jest/recommended',
        'plugin:jsx-a11y/recommended'
      )
    ),

    plugins: {
      react: fixupPluginRules(react),
      'jsx-a11y': fixupPluginRules(jsxA11Y)
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },

      parser: babelParser
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      // Use ignoreErr for ignored errors in catch()
      'no-unused-vars': ['error', { caughtErrors: 'all', caughtErrorsIgnorePattern: '^ignore' }],

      // no-conditional-expect is still used by a lot of tests, none within catch though
      'jest/no-conditional-expect': 'off',

      'jsx-a11y/no-onchange': 'off',

      'react/prop-types': [
        'error',
        {
          skipUndeclared: true
        }
      ]
    }
  }
])
