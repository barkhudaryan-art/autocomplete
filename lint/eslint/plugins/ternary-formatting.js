module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce consistent ternary expression formatting: single-line when it fits, structured multi-line otherwise.'
		},
		fixable: 'whitespace',
		schema: [
			{
				type: 'object',
				properties: {
					maxLength: { type: 'number' }
				},
				additionalProperties: false
			}
		]
	},

	create( context ) {
		const maxLength = ( context.options[0] && context.options[0].maxLength ) || 150;
		const sourceCode = context.sourceCode || context.getSourceCode();
		const lines = sourceCode.lines;

		function getLineIndent( lineNum ) {
			const line = lines[lineNum - 1] || '';
			const match = line.match( /^(\t*)/ );
			return match ? match[1] : '';
		}

		// Walk up ancestors to detect if this node lives inside a JSX.
		// Those ternaries are already handled by jsx-formatting.
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

		// True when either branch contains a nested ternary.
		function isNestedTernary( node ) {
			return node.consequent.type === 'ConditionalExpression' || node.alternate.type === 'ConditionalExpression';
		}

		// Collapse a ternary (and any chained alternates) to a single line.
		// Internal whitespace is normalized to single spaces.
		function toSingleLine( node ) {
			const test = sourceCode.getText( node.test ).replace( /\s+/g, ' ' ).trim();
			const cons = sourceCode.getText( node.consequent ).replace( /\s+/g, ' ' ).trim();
			const alt = sourceCode.getText( node.alternate ).replace( /\s+/g, ' ' ).trim();
			return `${test} ? ${cons} : ${alt}`;
		}

		// Recursively format a ternary across multiple lines.
		// Nested ternaries in BOTH branches are expanded with one extra indent level.
		function formatTernary( node, baseIndent ) {
			const conditionIndent = baseIndent + '\t';
			const branchIndent = baseIndent + '\t\t';
			const formattedLines = [];

			function appendBranch( expression, prefix, childIndent ) {
				if ( expression.type === 'ConditionalExpression' ) {
					formattedLines.push( `${prefix}${sourceCode.getText( expression.test ).replace( /\s+/g, ' ' ).trim()}` );
					appendBranch( expression.consequent, `${childIndent}? `, `${childIndent}\t` );
					appendBranch( expression.alternate, `${childIndent}: `, `${childIndent}\t` );
					return;
				}

				formattedLines.push( `${prefix}${sourceCode.getText( expression ).replace( /\s+/g, ' ' ).trim()}` );
			}

			formattedLines.push( `${conditionIndent}${sourceCode.getText( node.test ).replace( /\s+/g, ' ' ).trim()}` );
			appendBranch( node.consequent, `${branchIndent}? `, `${branchIndent}\t` );
			appendBranch( node.alternate, `${branchIndent}: `, `${branchIndent}\t` );

			return formattedLines.join( '\n' );
		}

		// Check that a multi-line ternary already follows the correct format.
		// Returns true when no fix is needed.
		function isCorrectFormat( node, baseIndent ) {
			const opIndent = baseIndent + '\t';
			const expectedCols = opIndent.length; // tab chars = column index (1 tab = column 1)

			const questionToken = sourceCode.getTokenAfter( node.test, { filter: ( t ) => t.value === '?' } );
			const colonToken = sourceCode.getTokenAfter( node.consequent, { filter: ( t ) => t.value === ':' } );

			if ( !questionToken || !colonToken ) {
				return true; // can't determine — leave alone
			}

			const questionLine = questionToken.loc.start.line;
			const colonLine = colonToken.loc.start.line;

			// ? must be on a different line from the end of the condition
			if ( questionLine === node.test.loc.end.line ) {
				return false;
			}
			// : must be on a different line from the end of the consequent
			if ( colonLine === node.consequent.loc.end.line ) {
				return false;
			}
			// ? must be at the correct indent column
			if ( questionToken.loc.start.column !== expectedCols ) {
				return false;
			}
			// : must be at the correct indent column
			if ( colonToken.loc.start.column !== expectedCols ) {
				return false;
			}
			// The ? line must start with exactly opIndent + '?'
			if ( !lines[questionLine - 1].startsWith( opIndent + '?' ) ) {
				return false;
			}
			// The : line must start with exactly opIndent + ':'
			if ( !lines[colonLine - 1].startsWith( opIndent + ':' ) ) {
				return false;
			}

			// Recurse into nested branches.
			if ( node.consequent.type === 'ConditionalExpression' && !isCorrectFormat( node.consequent, opIndent ) ) {
				return false;
			}

			return !( node.alternate.type === 'ConditionalExpression' && !isCorrectFormat( node.alternate, opIndent ) );
		}

		return {
			ConditionalExpression( node ) {
				// Handled by jsx-formatting
				if ( isInsideJSX( node ) ) {
					return;
				}

				// Only process the root of a ternary chain — skip nested alternates.
				// They are reformatted as part of the root node's fix.
				if ( node.parent.type === 'ConditionalExpression' ) {
					return;
				}

				const onOneLine = node.loc.start.line === node.loc.end.line;
				const chained = isNestedTernary( node );

				// Single ternary already on one line → valid
				if ( onOneLine && !chained ) {
					return;
				}

				const baseIndent = getLineIndent( node.test.loc.start.line );

				// Chained ternary on one line → must always expand
				if ( onOneLine && chained ) {
					const formatted = formatTernary( node, baseIndent );

					context.report( {
						node,
						loc: node.loc,
						message: 'Chained ternary expressions must be formatted across multiple lines.',
						fix( fixer ) {
							return fixer.replaceTextRange( node.range, formatted );
						}
					} );
					return;
				}

				// Multi-line ternary — first check if it's already correctly formatted
				if ( isCorrectFormat( node, baseIndent ) ) {
					return;
				}

				// Not correct — try collapsing to one line if single (not chained)
				if ( !chained ) {
					const singleLine = toSingleLine( node );
					const linePrefix = lines[node.loc.start.line - 1].substring( 0, node.loc.start.column );
					const lastLine = lines[node.loc.end.line - 1];
					const lineSuffix = lastLine.substring( node.loc.end.column );
					const fullLine = linePrefix + singleLine + lineSuffix;

					if ( fullLine.length <= maxLength ) {
						context.report( {
							node,
							loc: node.loc,
							message: 'Single ternary that fits within the line length limit should be on one line.',
							fix( fixer ) {
								return fixer.replaceTextRange( node.range, singleLine );
							}
						} );
						return;
					}
				}

				// Can't collapse — reformat to correct multi-line structure
				const formatted = formatTernary( node, baseIndent );

				context.report( {
					node,
					loc: node.loc,
					message: 'Ternary expression is not correctly formatted.',
					fix( fixer ) {
						return fixer.replaceTextRange( node.range, formatted );
					}
				} );
			}
		};
	}
};