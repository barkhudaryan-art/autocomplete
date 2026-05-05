module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Disallow blank lines immediately after an opening brace/bracket or immediately before a closing brace/bracket.'
		},
		fixable: 'whitespace',
		schema: []
	},

	create( context ) {
		const sourceCode = context.sourceCode || context.getSourceCode();

		// Strip blank lines from a whitespace-only gap string.
		// Works with both \n and \r\n line endings.
		function removeBlankLines( text ) {
			return text.replace( /(\r?\n)[ \t]*(?=\r?\n)/g, '' );
		}

		function isInsideJSX( node ) {
			let current = node.parent;

			while ( current ) {
				if ( current.type === 'JSXExpressionContainer' || current.type === 'JSXElement' ) {
					return true;
				}
				current = current.parent;
			}
			return false;
		}

		function checkNode( node ) {
			// Handled by jsx-formatting
			if ( isInsideJSX( node ) ) {
				return;
			}
			const open = sourceCode.getFirstToken( node );
			const close = sourceCode.getLastToken( node );

			const openLine = open.loc.end.line; // line containing {/[
			const closeLine = close.loc.start.line; // line containing }/]

			if ( openLine === closeLine ) {
				return; // single-line — nothing to do
			}

			const src = sourceCode.getText();

			// ── blank lines immediately after the opener ──────────────────────
			const firstInner = sourceCode.getTokenAfter( open, { includeComments: true } );

			if ( firstInner ) {
				const gapStart = open.range[1];
				const gapEnd = firstInner.range[0];
				const gapText = src.slice( gapStart, gapEnd );
				const fixed = removeBlankLines( gapText );

				if ( fixed !== gapText ) {
					const firstBlankLine = openLine + 1;
					context.report( {
						node,
						loc: {
							start: { line: firstBlankLine, column: 0 },
							end: { line: firstInner.loc.start.line, column: 0 }
						},
						message: 'No blank lines allowed after opening brace/bracket.',
						fix( fixer ) {
							return fixer.replaceTextRange( [gapStart, gapEnd], fixed );
						}
					} );
				}
			}

			// ── blank lines immediately before the closer ─────────────────────
			const lastInner = sourceCode.getTokenBefore( close, { includeComments: true } );

			if ( lastInner ) {
				const gapStart = lastInner.range[1];
				const gapEnd = close.range[0];
				const gapText = src.slice( gapStart, gapEnd );
				const fixed = removeBlankLines( gapText );

				if ( fixed !== gapText ) {
					const firstBlankLine = lastInner.loc.end.line + 1;
					context.report( {
						node,
						loc: {
							start: { line: firstBlankLine, column: 0 },
							end: { line: closeLine, column: 0 }
						},
						message: 'No blank lines allowed before closing brace/bracket.',
						fix( fixer ) {
							return fixer.replaceTextRange( [gapStart, gapEnd], fixed );
						}
					} );
				}
			}
		}

		return {
			ObjectExpression( node ) {
				checkNode( node );
			},
			ObjectPattern( node ) {
				checkNode( node );
			},
			ArrayExpression( node ) {
				checkNode( node );
			},
			ArrayPattern( node ) {
				checkNode( node );
			},
			BlockStatement( node ) {
				checkNode( node );
			}
		};
	}
};