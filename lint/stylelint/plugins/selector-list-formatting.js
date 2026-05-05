'use strict';

/**
 * Stylelint plugin: custom/selector-list-formatting
 *
 * Rules:
 * 1. Selector list lines must not exceed maxLength. If they do, wrap after the last
 *    selector whose comma still fits within maxLength on that line.
 * 2. A comma between selectors on the SAME line must be followed by exactly one space.
 *    A comma at the END of a line (followed by a newline) needs no space.
 * 3. Multi-line selector lists that would all fit on a single line are NOT forced
 *    to collapse — they are left as-is.
 */

const stylelint = require( 'stylelint' );


const ruleName = 'custom/selector-list-formatting';

const messages = stylelint.utils.ruleMessages( ruleName, {
	lineExceedsMaxLength: ( max ) => `Selector list line exceeds max length of ${max}`,
	missingSpaceAfterComma: 'Expected a single space after "," in selector list'
} );

const meta = { fixable: true };

function rule( primaryOption, secondaryOptions, context ) {
	return ( root, result ) => {
		const maxLength = ( secondaryOptions && secondaryOptions.maxLength ) || 150;
		const tabWidth = ( secondaryOptions && secondaryOptions.tabWidth ) || 4;

		function expandTabs( str ) {
			return str.replace( /\t/g, ' '.repeat( tabWidth ) );
		}

		function lineLen( str ) {
			return expandTabs( str ).length;
		}

		function getIndent( ruleNode ) {
			const before = ruleNode.raws.before || '';
			const idx = before.lastIndexOf( '\n' );
			return idx >= 0 ? before.slice( idx + 1 ) : '';
		}

		/**
		 * Greedily packs selectors onto lines, breaking before a selector would push
		 * the line past maxLength. Selectors already include no leading/trailing whitespace.
		 */
		function formatSelectorList( selectors, indent ) {
			const lines = [];
			let current = '';

			for ( let i = 0; i < selectors.length; i++ ) {
				const sel = selectors[i];
				const isLast = i === selectors.length - 1;
				const candidate = current ? `${current}, ${sel}` : sel;
				// The trailing comma is part of the line for all but the last selector
				const testLine = `${indent}${candidate}${isLast ? '' : ','}`;

				if ( current && lineLen( testLine ) > maxLength ) {
					// Current line is full — flush it and start a new one
					lines.push( `${current},` );
					current = sel;
				} else {
					current = candidate;
				}
			}

			if ( current ) {
				lines.push( current );
			}

			return lines.join( `\n${indent}` );
		}

		root.walkRules( ( ruleNode ) => {
			const selector = ruleNode.selector;
			if ( !selector ) {
				return;
			}

			const indent = getIndent( ruleNode );
			const selectorLines = selector.split( '\n' );

			// 1. Check for line-length violations.
			//    The first selector line sits after the rule indent; subsequent lines already
			//    carry their own leading whitespace in the selector string.
			let hasLengthViolation = false;

			for ( let i = 0; i < selectorLines.length; i++ ) {
				const rawLine = selectorLines[i];
				const fullLine = i === 0 ? indent + rawLine : rawLine;

				if ( lineLen( fullLine ) > maxLength ) {
					hasLengthViolation = true;
					break;
				}
			}

			// 2. Check for a comma immediately followed by a non-space, non-newline character.
			//    /,(?![ \n\r])/ — comma not followed by space or line-break
			const hasMissingSpace = /,(?![ \n\r])/.test( selector );

			if ( !hasLengthViolation && !hasMissingSpace ) {
				return;
			}

			// Build the reformatted selector list
			const selectors = selector.split( ',' ).map( ( s ) => s.trim() ).filter( Boolean );
			const formatted = formatSelectorList( selectors, indent );

			// If the result is already identical, nothing to do
			if ( formatted === selector ) {
				return;
			}

			const primaryMessage = hasLengthViolation
				? messages.lineExceedsMaxLength( maxLength )
				: messages.missingSpaceAfterComma;

			if ( context && context.fix ) {
				ruleNode.selector = formatted;
				return;
			}

			stylelint.utils.report( {
				message: primaryMessage,
				node: ruleNode,
				result,
				ruleName
			} );
		} );
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

module.exports = stylelint.createPlugin( ruleName, rule );
module.exports.ruleName = ruleName;
module.exports.messages = messages;
module.exports.meta = meta;
