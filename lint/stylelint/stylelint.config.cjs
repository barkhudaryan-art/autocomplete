/* eslint-env node */
/* global __dirname */
const path = require( 'path' );
const ignoreFiles = require( './ignore-patterns.cjs' );

module.exports = {
	customSyntax: 'postcss-scss',
	extends: ['stylelint-config-standard-scss'],
	ignoreFiles,
	plugins: [
		require.resolve( 'stylelint-stylistic' ),
		path.join( __dirname, 'plugins/selector-list-formatting.js' ),
		path.join( __dirname, 'plugins/multiline-value-formatting.js' )
	],
	rules: {
		'custom/selector-list-formatting': [true, { maxLength: 150 }],
		'custom/multiline-value-formatting': [true, { maxLength: 150 }],
		'stylistic/indentation': ['tab', { ignore: ['value'] }],
		'stylistic/block-opening-brace-space-before': 'always',
		'stylistic/max-empty-lines': 1,
		'stylistic/no-eol-whitespace': true,
		'stylistic/selector-list-comma-newline-after': null,
		'stylistic/selector-list-comma-space-after': null,
		'stylistic/max-line-length': 150,
		'rule-empty-line-before': [
			'always-multi-line',
			{
				except: ['first-nested'],
				ignore: ['after-comment']
			}
		],
		'declaration-empty-line-before': null,
		'custom-property-empty-line-before': null,
		'comment-empty-line-before': null,
		'comment-whitespace-inside': null,
		'scss/double-slash-comment-empty-line-before': null,
		'scss/double-slash-comment-whitespace-inside': null,
		'font-family-name-quotes': null,
		'custom-property-pattern': null,
		'scss/at-import-no-partial-leading-underscore': null,
		'color-function-notation': null,
		'alpha-value-notation': null,
		'selector-pseudo-element-colon-notation': null,

		'selector-class-pattern': null,
		'selector-id-pattern': null,
		'scss/dollar-variable-pattern': null,
		'scss/at-mixin-pattern': null,
		'scss/at-function-pattern': null,
		'scss/percent-placeholder-pattern': null,
		'keyframes-name-pattern': null,

		'no-descending-specificity': null,
		'property-no-vendor-prefix': null,
		'property-no-unknown': [
			true,
			{ ignoreProperties: ['composes'] }
		],
		'font-family-no-missing-generic-family-keyword': [
			true,
			{ ignoreFontFamilies: ['Core-Icons', 'FM_Icons'] }
		]
	}
};

