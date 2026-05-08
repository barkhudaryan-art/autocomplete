import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import tseslint from 'typescript-eslint';

import ignores from './ignores.mjs';
import noInlineTabsRule from './plugins/no-inline-tabs.js';
import chopOverlongLinesRule from './plugins/chop-overlong-lines.js';
import noBoundaryBlankLinesRule from './plugins/no-blank-lines-at-boundaries.js';
import closingBracketAlignmentRule from './plugins/closing-bracket-alignment.js';
import ternaryFormattingRule from './plugins/ternary-formatting.js';
import jsxFormattingRule from './plugins/jsx-formatting.js';


const sharedPlugins = {
	'react-hooks': reactHooksPlugin,
	'import': importPlugin,
	'custom': {
		rules: {
			'no-inline-tabs': noInlineTabsRule,
			'chop-overlong-lines': chopOverlongLinesRule,
			'no-blank-lines-at-boundaries': noBoundaryBlankLinesRule,
			'closing-bracket-alignment': closingBracketAlignmentRule,
			'ternary-formatting': ternaryFormattingRule,
			'jsx-formatting': jsxFormattingRule
		}
	}
}
const sharedGlobals = {
	...globals.browser,
	...globals.node,
	...globals.jest,
	...globals.es2021
}
const sharedRules = {
	'custom/no-inline-tabs': 'error',
	'custom/chop-overlong-lines': ['error', { maxLength: 150 }],
	'custom/no-blank-lines-at-boundaries': 'error',
	'custom/closing-bracket-alignment': 'error',
	'custom/ternary-formatting': ['error', { maxLength: 150 }],
	'custom/jsx-formatting': ['error', { maxLength: 150 }],

	'indent': ['error', 'tab', {
		SwitchCase: 1,
		VariableDeclarator: 1,
		outerIIFEBody: 1,
		MemberExpression: 1,
		FunctionDeclaration: { parameters: 1, body: 1 },
		FunctionExpression: { parameters: 1, body: 1 },
		CallExpression: { arguments: 1 },
		ArrayExpression: 1,
		ObjectExpression: 1,
		ImportDeclaration: 1,
		flatTernaryExpressions: false
	}],
	'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: true }],
	'newline-per-chained-call': 'off',

	'space-before-function-paren': ['error', {
		anonymous: 'never',
		named: 'never',
		asyncArrow: 'always'
	}],
	'func-call-spacing': ['error', 'never'],
	'keyword-spacing': ['error', {
		before: true,
		after: true,
		overrides: {
			else: { before: true, after: true },
			while: { before: true, after: true },
			catch: { before: true, after: true },
			finally: { before: true, after: true }
		}
	}],
	'space-infix-ops': 'error',
	'space-unary-ops': ['error', { words: true, nonwords: false }],
	'space-before-blocks': ['error', 'always'],
	'space-in-parens': ['error', 'always'],
	'array-bracket-spacing': ['error', 'never'],
	'object-curly-spacing': ['error', 'always'],
	'template-curly-spacing': ['error', 'never'],
	'comma-spacing': ['error', { before: false, after: true }],
	'key-spacing': ['error', { beforeColon: false, afterColon: true }],

	'brace-style': ['error', '1tbs', { allowSingleLine: false }],
	'curly': ['error', 'all'],
	'operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
	'array-bracket-newline': 'off',
	'array-element-newline': ['error', 'consistent'],
	'object-curly-newline': ['error', {
		ObjectExpression: { multiline: true, consistent: true },
		ObjectPattern: { multiline: true, consistent: true },
		ImportDeclaration: { multiline: true, consistent: true },
		ExportDeclaration: { multiline: true, consistent: true }
	}],
	'one-var': ['error', 'never'],
	'semi': ['error', 'always'],
	'semi-spacing': ['error', { before: false, after: true }],
	'comma-dangle': ['error', 'never'],
	'quotes': ['error', 'single', { avoidEscape: true }],
	'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0, maxBOF: 0 }],
	'no-multi-spaces': 'error',

	'import/newline-after-import': ['error', { count: 2 }],
	'padding-line-between-statements': [
		'error',
		{ blankLine: 'always', prev: '*', next: 'function' },
		{ blankLine: 'always', prev: 'function', next: '*' },
		{ blankLine: 'always', prev: '*', next: 'class' },
		{ blankLine: 'always', prev: 'class', next: '*' },
		{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }
	],

	'react/prop-types': 'off',
	'react/react-in-jsx-scope': 'off',
	'react/display-name': 'off',
	'react/jsx-curly-spacing': ['error', { when: 'never' }],
	'react-hooks/exhaustive-deps': 'warn'
}

export default tseslint.config(
	{ignores},
	js.configs.recommended,
	{
		files: ['**/*.js', '**/*.jsx'],
		plugins: {
			react: reactPlugin,
			...sharedPlugins
		},
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: { presets: ['@babel/preset-react'] },
				ecmaFeatures: { jsx: true }
			},
			globals: sharedGlobals
		},
		settings: { react: { version: '18.2' } },
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			...sharedRules
		}
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		extends: [
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked
		],
		plugins: {
			react: reactPlugin,
			...sharedPlugins
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: { jsx: true },
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			},
			globals: sharedGlobals
		},
		settings: { react: { version: '18.2' } },
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			...sharedRules,

			// base rules with TS-aware replacements — turn the base off
			'no-unused-vars': 'off',
			'no-shadow': 'off',
			'no-redeclare': 'off',

			// soften — !root in main.tsx is fine; flag, don't block
			'@typescript-eslint/no-non-null-assertion': 'off',

			// unused vars — allow `_`-prefixed for intentional skip
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_'
			}],

			// matches verbatimModuleSyntax — enforce type-only imports inline
			'@typescript-eslint/consistent-type-imports': ['error', {
				prefer: 'type-imports',
				fixStyle: 'inline-type-imports'
			}]
		}
	}
)

