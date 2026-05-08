export default {
	meta: {
		type: 'layout',
		docs: {
			description: 'Disallow tab characters used for alignment (non-indentation tabs) and auto-fix them to a single space.'
		},
		fixable: 'whitespace',
		schema: []
	},

	create( context ) {
		const sourceCode = context.sourceCode || context.getSourceCode();

		return {
			Program() {
				const lines = sourceCode.lines;

				// Build a set of character ranges that are inside comments so we
				// can skip tabs that appear there.
				const commentRanges = sourceCode.getAllComments().map( ( c ) => c.range );

				function isInComment( charIndex ) {
					return commentRanges.some( ( [start, end] ) => charIndex >= start && charIndex < end );
				}

				lines.forEach( ( line, index ) => {
					const lineNumber = index + 1;

					// Find where indentation ends (first non-tab character)
					const indentMatch = line.match( /^(\t*)/ );
					const indentEnd = indentMatch ? indentMatch[1].length : 0;

					// Look for tabs after indentation
					const rest = line.slice( indentEnd );
					for ( let i = 0; i < rest.length; i++ ) {
						if ( rest[i] === '\t' ) {
							const col = indentEnd + i;
							const startIndex = sourceCode.getIndexFromLoc( { line: lineNumber, column: col } );

							if ( isInComment( startIndex ) ) {
								continue;
							}

							context.report( {
								loc: {
									start: { line: lineNumber, column: col },
									end: { line: lineNumber, column: col + 1 }
								},
								message: 'Unexpected tab character used for alignment. Use a single space instead.',
								fix( fixer ) {
									return fixer.replaceTextRange( [startIndex, startIndex + 1], ' ' );
								}
							} );
						}
					}
				} );
			}
		};
	}
};