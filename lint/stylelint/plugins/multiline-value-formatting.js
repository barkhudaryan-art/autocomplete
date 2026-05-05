'use strict';

const stylelint = require( 'stylelint' );


const ruleName = 'custom/multiline-value-formatting';

const messages = stylelint.utils.ruleMessages( ruleName, {
	inconsistentIndentation: 'Multiline declaration values must be indented consistently'
} );

const meta = { fixable: true };

function rule( primaryOption, secondaryOptions, context ) {
	return ( root, result ) => {
		const maxLength = ( secondaryOptions && secondaryOptions.maxLength ) || 150;
		const tabWidth = ( secondaryOptions && secondaryOptions.tabWidth ) || 4;

		function expandTabs( text ) {
			return text.replace( /\t/g, ' '.repeat( tabWidth ) );
		}

		function getLineLength( text ) {
			return expandTabs( text ).length;
		}

		function hasOverlongLine( text ) {
			return text.split( '\n' ).some( ( line ) => getLineLength( line ) > maxLength );
		}

		function getDeclarationIndent( declaration ) {
			let depth = 0;
			let current = declaration.parent;

			while ( current && current.type !== 'root' ) {
				depth++;
				current = current.parent;
			}

			return '\t'.repeat( depth );
		}

		function getValueIndent( declaration ) {
			return `${getDeclarationIndent( declaration )}\t`;
		}

		function getRawValue( declaration ) {
			return declaration.raws.value && typeof declaration.raws.value.raw === 'string'
				? declaration.raws.value.raw
				: declaration.value;
		}

		function normalizeInlineText( text ) {
			return text
				.split( '\n' )
				.map( ( line ) => line.trim() )
				.filter( Boolean )
				.join( ' ' );
		}

		function stripTrailingImportant( text ) {
			const match = text.match( /\s*!important\s*$/ );

			if ( !match ) {
				return {
					text,
					suffix: ''
				};
			}

			return {
				text: text.slice( 0, match.index ).trimEnd(),
				suffix: ' !important'
			};
		}

		function getLeadingClosersCount( text ) {
			let count = 0;

			while ( count < text.length && [')', ']', '}'].includes( text[count] ) ) {
				count++;
			}

			return count;
		}

		function createScannerState() {
			return {
				inComment: false,
				quote: null,
				escaped: false
			};
		}

		function consumeScannerChar( char, nextChar, state ) {
			if ( state.inComment ) {
				if ( char === '*' && nextChar === '/' ) {
					state.inComment = false;
					return 1;
				}
				return 0;
			}

			if ( state.quote ) {
				if ( state.escaped ) {
					state.escaped = false;
					return 0;
				}

				if ( char === '\\' ) {
					state.escaped = true;
					return 0;
				}

				if ( char === state.quote ) {
					state.quote = null;
				}
				return 0;
			}

			if ( char === '/' && nextChar === '*' ) {
				state.inComment = true;
				return 1;
			}

			if ( char === '\'' || char === '"' ) {
				state.quote = char;
			}

			return 0;
		}

		function getDepthDelta( text, state ) {
			let delta = 0;

			for ( let i = 0; i < text.length; i++ ) {
				const char = text[i];
				const nextChar = text[i + 1];
				const skip = consumeScannerChar( char, nextChar, state );

				if ( skip > 0 ) {
					i += skip;
					continue;
				}

				if ( state.inComment || state.quote ) {
					continue;
				}

				if ( ['(', '[', '{'].includes( char ) ) {
					delta++;
					continue;
				}

				if ( [')', ']', '}'].includes( char ) ) {
					delta--;
				}
			}

			return delta;
		}

		function splitTopLevelByComma( text ) {
			const segments = [];
			const state = createScannerState();
			let depth = 0;
			let segmentStart = 0;

			for ( let i = 0; i < text.length; i++ ) {
				const char = text[i];
				const nextChar = text[i + 1];
				const skip = consumeScannerChar( char, nextChar, state );

				if ( skip > 0 ) {
					i += skip;
					continue;
				}

				if ( state.inComment || state.quote ) {
					continue;
				}

				if ( ['(', '[', '{'].includes( char ) ) {
					depth++;
					continue;
				}

				if ( [')', ']', '}'].includes( char ) ) {
					depth--;
					continue;
				}

				if ( char === ',' && depth === 0 ) {
					segments.push( text.slice( segmentStart, i ).trim() );
					segmentStart = i + 1;
				}
			}

			segments.push( text.slice( segmentStart ).trim() );
			return segments.filter( Boolean );
		}

		function findOuterFunctionCall( text ) {
			const state = createScannerState();
			let depth = 0;
			let openParenIndex = -1;
			let closeParenIndex = -1;

			for ( let i = 0; i < text.length; i++ ) {
				const char = text[i];
				const nextChar = text[i + 1];
				const skip = consumeScannerChar( char, nextChar, state );

				if ( skip > 0 ) {
					i += skip;
					continue;
				}

				if ( state.inComment || state.quote ) {
					continue;
				}

				if ( char === '(' ) {
					if ( depth === 0 ) {
						openParenIndex = i;
					}
					depth++;
					continue;
				}

				if ( char === ')' ) {
					depth--;
					if ( depth === 0 && openParenIndex !== -1 ) {
						closeParenIndex = i;
						break;
					}
				}
			}

			if ( openParenIndex === -1 || closeParenIndex === -1 ) {
				return null;
			}

			const name = text.slice( 0, openParenIndex ).trimEnd();

			if ( !/[a-zA-Z_-][a-zA-Z0-9_-]*$/.test( name ) ) {
				return null;
			}

			return {
				name,
				inner: text.slice( openParenIndex + 1, closeParenIndex ),
				suffix: text.slice( closeParenIndex + 1 ).trim()
			};
		}

		function packCommaSeparatedItems( items, indent, maxLineLength = maxLength ) {
			const lines = [];
			let currentLine = '';

			for ( let i = 0; i < items.length; i++ ) {
				const item = items[i];
				const isLast = i === items.length - 1;
				const candidate = currentLine ? `${currentLine}, ${item}` : item;
				const candidateWithTail = `${indent}${candidate}${isLast ? '' : ','}`;

				if ( currentLine && getLineLength( candidateWithTail ) > maxLineLength ) {
					lines.push( `${indent}${currentLine},` );
					currentLine = item;
				} else {
					currentLine = candidate;
				}
			}

			if ( currentLine ) {
				lines.push( `${indent}${currentLine}` );
			}

			return lines.join( '\n' );
		}

		function formatFunctionSegment( segmentText, indent ) {
			const normalizedText = normalizeInlineText( segmentText );

			if ( getLineLength( `${indent}${normalizedText}` ) <= maxLength ) {
				return normalizedText;
			}

			const outerFunction = findOuterFunctionCall( normalizedText );

			if ( !outerFunction ) {
				return normalizedText;
			}

			const items = splitTopLevelByComma( outerFunction.inner ).map( normalizeInlineText );
			const innerIndent = `${indent}\t`;
			const packedItems = packCommaSeparatedItems( items, innerIndent, maxLength - ( tabWidth * 2 ) );
			const suffix = outerFunction.suffix ? ` ${outerFunction.suffix}` : '';

			return `${outerFunction.name}(\n${packedItems}\n${indent})${suffix}`;
		}

		function formatOverlongFunctionValue( declaration ) {
			const valueIndent = getValueIndent( declaration );
			const normalizedValue = normalizeInlineText( getRawValue( declaration ) );
			const importantParts = stripTrailingImportant( normalizedValue );
			const topLevelSegments = splitTopLevelByComma( importantParts.text );
			const formattedSegments = topLevelSegments.map( ( segment ) => formatFunctionSegment( segment, valueIndent ) );

			if ( importantParts.suffix && formattedSegments.length > 0 ) {
				formattedSegments[formattedSegments.length - 1] += importantParts.suffix;
			}

			return {
				between: `:\n${valueIndent}`,
				raw: formattedSegments.join( `,\n${valueIndent}` )
			};
		}

		function formatMultilineValue( declaration ) {
			const rawValue = getRawValue( declaration );
			const declarationIndent = getDeclarationIndent( declaration );
			const startsOnNewLine = declaration.raws.between.includes( '\n' );

			if ( !rawValue.includes( '\n' ) ) {
				return rawValue;
			}

			const rawLines = rawValue.split( '\n' );
			const formattedLines = [rawLines[0]];
			const state = createScannerState();
			let depth = getDepthDelta( rawLines[0], state );

			for ( let i = 1; i < rawLines.length; i++ ) {
				const rawLine = rawLines[i];
				const trimmedLine = rawLine.trimStart();

				if ( trimmedLine === '' ) {
					formattedLines.push( '' );
					continue;
				}

				const leadingClosersCount = getLeadingClosersCount( trimmedLine );
				const effectiveDepth = Math.max( depth - leadingClosersCount, 0 );
				const extraIndentLevel = leadingClosersCount > 0
					? effectiveDepth + ( startsOnNewLine ? 1 : 0 )
					: 1 + Math.max( effectiveDepth - 1, 0 ) + ( startsOnNewLine && effectiveDepth > 0 ? 1 : 0 );
				const expectedIndent = declarationIndent + '\t'.repeat( extraIndentLevel );

				formattedLines.push( `${expectedIndent}${trimmedLine}` );
				depth = Math.max( depth + getDepthDelta( trimmedLine, state ), 0 );
			}

			return formattedLines.join( '\n' );
		}

		function shouldReflowOverlongFunctionValue( declaration ) {
			const rawValue = getRawValue( declaration );

			if ( !findOuterFunctionCall( normalizeInlineText( rawValue ) ) ) {
				return false;
			}

			return hasOverlongLine( declaration.toString() );
		}

		root.walkDecls( ( declaration ) => {
			const rawValue = getRawValue( declaration );

			if ( !rawValue ) {
				return;
			}

			let formattedBetween = declaration.raws.between;
			let formattedValue = rawValue;

			if ( shouldReflowOverlongFunctionValue( declaration ) ) {
				const formattedDeclarationValue = formatOverlongFunctionValue( declaration );
				formattedBetween = formattedDeclarationValue.between;
				formattedValue = formattedDeclarationValue.raw;
			} else if ( rawValue.includes( '\n' ) ) {
				formattedValue = formatMultilineValue( declaration );
			}

			if ( formattedBetween === declaration.raws.between && formattedValue === rawValue ) {
				return;
			}

			if ( context && context.fix ) {
				declaration.raws.between = formattedBetween;
				declaration.raws.value = {
					raw: formattedValue,
					value: declaration.value
				};
				return;
			}

			stylelint.utils.report( {
				message: messages.inconsistentIndentation,
				node: declaration,
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
