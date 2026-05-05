module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Auto-chop arrays, objects, function arguments/params, and imports to multiple lines when a line exceeds max length.'
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

		// Track lines already claimed by an outer node so inner nodes don't
		// produce a conflicting fix on the same pass. Because ESLint traverses
		// the AST parent-first, the outermost node on a line always registers
		// here before any of its children are visited.
		const reportedLines = new Set();

		function getLineIndent( lineNumber ) {
			const line = sourceCode.lines[lineNumber - 1];
			const match = line.match( /^(\t*)/ );
			return match ? match[1] : '';
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

		// separator: ',' for lists, or a logical operator like '||' / '&&'
		function chopItems( node, items, openToken, closeToken, separator = ',' ) {
			if ( !items || items.length < 2 ) {
				return;
			}

			// Only act on single-line expressions
			if ( openToken.loc.start.line !== closeToken.loc.end.line ) {
				return;
			}

			// Only act when line exceeds max length
			const lineNum = openToken.loc.start.line;
			if ( sourceCode.lines[lineNum - 1].length <= maxLength ) {
				return;
			}

			// Skip if an outer node on this line was already reported.
			// This ensures we always chop the outermost structure first;
			// inner nodes are left for subsequent lint passes.
			if ( reportedLines.has( lineNum ) ) {
				return;
			}
			reportedLines.add( lineNum );

			const baseIndent = getLineIndent( lineNum );
			const itemIndent = baseIndent + '\t';

			const itemTexts = items.map( ( item ) => {
				if ( item === null ) {
					return '';
				}
				return sourceCode.getText( item ).trim();
			} );

			context.report( {
				node,
				message: 'Line exceeds maximum length. Chop down to multiple lines.',
				fix( fixer ) {
					const isComma = separator === ',';
					const itemLines = itemTexts.map( ( t, i ) => {
						const isLast = i === itemTexts.length - 1;
						if ( isComma ) {
							// comma goes at the end of every line except the last
							return itemIndent + t + ( isLast ? '' : separator );
						}
						// logical operator goes at the end of every line except the last,
						// with a space before it so it reads naturally: `expr ||`
						return itemIndent + t + ( isLast ? '' : ' ' + separator );
					} );

					const newText = openToken.value + '\n' +
						itemLines.join( '\n' ) + '\n' +
						baseIndent + closeToken.value;

					return fixer.replaceTextRange(
						[openToken.range[0], closeToken.range[1]],
						newText
					);
				}
			} );
		}

		function handleBracketedNode( node, items ) {
			// Handled by jsx-formatting
			if ( isInsideJSX( node ) ) {
				return;
			}
			const open = sourceCode.getFirstToken( node );
			const close = sourceCode.getLastToken( node );
			chopItems( node, items, open, close );
		}

		function handleParenthesizedItems( node, items ) {
			// Handled by jsx-formatting
			if ( isInsideJSX( node ) ) {
				return;
			}
			if ( !items || items.length < 2 ) {
				return;
			}

			const openParen = sourceCode.getTokenBefore( items[0], { filter: ( t ) => t.value === '(' } );
			const closeParen = sourceCode.getTokenAfter( items[items.length - 1], { filter: ( t ) => t.value === ')' } );

			if ( openParen && closeParen ) {
				chopItems( node, items, openParen, closeParen );
			}
		}

		function handleBracedItems( node, items ) {
			// Handled by jsx-formatting
			if ( isInsideJSX( node ) ) {
				return;
			}
			if ( !items || items.length < 2 ) {
				return;
			}

			const openBrace = sourceCode.getTokenBefore( items[0], { filter: ( t ) => t.value === '{' } );
			const closeBrace = sourceCode.getTokenAfter( items[items.length - 1], { filter: ( t ) => t.value === '}' } );

			if ( openBrace && closeBrace ) {
				chopItems( node, items, openBrace, closeBrace );
			}
		}

		// Flatten a LogicalExpression tree into its leaf operands, but only
		// for the *top-level* operator.  e.g. `A || B || C` → [A, B, C],
		// while `A || (B && C)` → [A, (B && C)] (stops at the &&).
		function getLogicalOperands( node ) {
			const topOperator = node.operator;
			const operands = [];

			function collect( n ) {
				if ( n.type === 'LogicalExpression' && n.operator === topOperator ) {
					collect( n.left );
					collect( n.right );
				} else {
					operands.push( n );
				}
			}

			collect( node );
			return { operands, operator: topOperator };
		}

		return {
			// IfStatement is visited *before* any CallExpression nodes it contains,
			// so it will claim the line in reportedLines first, preventing inner
			// call-argument lists from being chopped in the same pass.
			IfStatement( node ) {
				const lineNum = node.loc.start.line;
				if ( sourceCode.lines[lineNum - 1].length <= maxLength ) {
					return;
				}
				if ( reportedLines.has( lineNum ) ) {
					return;
				}

				const openParen = sourceCode.getTokenBefore( node.test, { filter: ( t ) => t.value === '(' } );
				const closeParen = sourceCode.getTokenAfter( node.test, { filter: ( t ) => t.value === ')' } );

				if ( !openParen || !closeParen ) {
					return;
				}
				// Already multi-line — nothing to do
				if ( openParen.loc.start.line !== closeParen.loc.end.line ) {
					return;
				}

				if ( node.test.type === 'LogicalExpression' ) {
					const { operands, operator } = getLogicalOperands( node.test );
					if ( operands.length >= 2 ) {
						chopItems( node, operands, openParen, closeParen, operator );
					}
				}
				// Non-logical single expressions can't be split here; leave them
				// for other rules or manual formatting.
			},

			ArrayExpression( node ) {
				handleBracketedNode( node, node.elements );
			},

			ObjectExpression( node ) {
				handleBracketedNode( node, node.properties );
			},

			ArrayPattern( node ) {
				handleBracketedNode( node, node.elements );
			},

			ObjectPattern( node ) {
				handleBracketedNode( node, node.properties );
			},

			CallExpression( node ) {
				handleParenthesizedItems( node, node.arguments );
			},

			NewExpression( node ) {
				handleParenthesizedItems( node, node.arguments );
			},

			FunctionDeclaration( node ) {
				handleParenthesizedItems( node, node.params );
			},

			FunctionExpression( node ) {
				handleParenthesizedItems( node, node.params );
			},

			ArrowFunctionExpression( node ) {
				handleParenthesizedItems( node, node.params );
			},

			ImportDeclaration( node ) {
				const namedSpecifiers = node.specifiers.filter( ( s ) => s.type === 'ImportSpecifier' );
				handleBracedItems( node, namedSpecifiers );
			},

			ExportNamedDeclaration( node ) {
				handleBracedItems( node, node.specifiers );
			}
		};
	}
};