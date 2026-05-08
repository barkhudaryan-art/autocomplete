module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce closing brackets/braces/parens to be indented at the same level as the line containing their opener.'
		},
		fixable: 'whitespace',
		schema: []
	},

	create( context ) {
		const sourceCode = context.sourceCode || context.getSourceCode();
		const lines = sourceCode.lines;

		const OPENING = new Set( ['(', '{', '['] );
		const CLOSING = new Set( [')', '}', ']'] );

		function getLineIndent( lineNum ) {
			const line = lines[lineNum - 1] || '';
			const match = line.match( /^(\t*)/ );
			return match ? match[1] : '';
		}

		function isAloneOnLine( token ) {
			const before = lines[token.loc.start.line - 1].substring( 0, token.loc.start.column );
			return before.trim() === '';
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

		function getArrayBracketTokens( node ) {
			const openBracket = sourceCode.getFirstToken( node, { filter: token => token.value === '[' } );
			const closeBracket = sourceCode.getLastToken( node, { filter: token => token.value === ']' } );

			if ( !openBracket || !closeBracket ) {
				return null;
			}

			return {
				openBracket,
				closeBracket
			};
		}

		function getCallParenTokens( node ) {
			const openParen = sourceCode.getTokenAfter( node.callee, { filter: token => token.value === '(' } );
			const closeParen = sourceCode.getLastToken( node, { filter: token => token.value === ')' } );

			if ( !openParen || !closeParen ) {
				return null;
			}

			return {
				openParen,
				closeParen
			};
		}

		function getFunctionParenTokens( node ) {
			if ( !node.body ) {
				return null;
			}

			const bodyStart = sourceCode.getFirstToken( node.body );
			const closeParen = bodyStart
				? sourceCode.getTokenBefore( bodyStart, { filter: token => token.value === ')' } )
				: null;
			const openParen = closeParen
				? sourceCode.getTokenBefore( closeParen, { filter: token => token.value === '(' } )
				: null;

			if ( !openParen || !closeParen ) {
				return null;
			}

			return {
				openParen,
				closeParen
			};
		}

		function checkEmptyFunctionParens( node ) {
			if ( isInsideJSX( node ) || node.params.length !== 0 ) {
				return;
			}

			const parenTokens = getFunctionParenTokens( node );
			if ( !parenTokens ) {
				return;
			}

			const { openParen, closeParen } = parenTokens;
			const between = sourceCode.text.slice( openParen.range[1], closeParen.range[0] );

			if ( between === ' ' ) {
				context.report( {
					node,
					loc: {
						start: openParen.loc.start,
						end: closeParen.loc.end
					},
					message: "Empty function parameter lists must not contain spaces between '(' and ')'.",
					fix( fixer ) {
						return fixer.replaceTextRange( [openParen.range[1], closeParen.range[0]], '' );
					}
				} );
			}
		}

		function checkEmptyFunctionBodySpacing( node ) {
			if ( isInsideJSX( node ) || !node.body || node.body.type !== 'BlockStatement' || node.body.body.length > 0 ) {
				return;
			}

			const bodyText = sourceCode.getText( node.body );
			if ( bodyText !== '{ }' ) {
				return;
			}

			const openBrace = sourceCode.getFirstToken( node.body, { filter: token => token.value === '{' } );
			const closeBrace = sourceCode.getLastToken( node.body, { filter: token => token.value === '}' } );

			if ( !openBrace || !closeBrace ) {
				return;
			}

			context.report( {
				node: node.body,
				loc: node.body.loc,
				message: "Empty function bodies must not contain spaces between '{' and '}'.",
				fix( fixer ) {
					return fixer.replaceTextRange( [openBrace.range[1], closeBrace.range[0]], '' );
				}
			} );
		}

		return {
			'Program:exit'( node ) {
				// Handled by jsx-formatting
				if ( isInsideJSX( node ) ) {
					return;
				}
				// ── Step 1: build opener→closer map via bracket-matching stack ────────
				// sourceCode.getTokens() returns only real tokens so brackets inside
				// strings/template literals are excluded automatically.
				const allTokens = sourceCode.getTokens( node, { includeComments: false } );

				const stack = [];
				const openerOf = new Map(); // closeToken.range[0] → openToken
				const closeTokenOfOpen = new Map(); // openToken.range[0] → closeToken

				for ( const token of allTokens ) {
					if ( OPENING.has( token.value ) ) {
						stack.push( token );
					} else if ( CLOSING.has( token.value ) ) {
						if ( stack.length > 0 ) {
							const opener = stack.pop();
							openerOf.set( token.range[0], opener );
							closeTokenOfOpen.set( opener.range[0], token );
						}
					}
				}

				// Build a reverse lookup: openerToken.range[0] → closeToken.
				// Used in the sibling-argument guard in step 3.
				const closerOf = new Map();

				for ( const [closeStart, opener] of openerOf ) {
					closerOf.set( opener.range[0], closeStart );
				}

				// Build a line→tokens index for efficient per-line lookups in step 3.
				const tokensByLine = new Map();

				for ( const token of allTokens ) {
					const ln = token.loc.start.line;
					if ( !tokensByLine.has( ln ) ) {
						tokensByLine.set( ln, [] );
					}
					tokensByLine.get( ln ).push( token );
				}

				const handledAsChain = new Set();

				// Collect opening-brace positions that belong to JSXExpressionContainers.
				// These braces are managed by jsx-formatting and must not be moved by this plugin.
				const jsxExprRanges = [];
				sourceCode.ast.body.forEach( function collectJSXExpr( node ) {
					if ( !node || typeof node !== 'object' ) {
						return;
					}
					if ( node.type === 'JSXExpressionContainer' ) {
						jsxExprRanges.push( node.range );
					}
					for ( const key of Object.keys( node ) ) {
						if ( key === 'parent' ) {
							continue;
						}
						const child = node[key];
						if ( Array.isArray( child ) ) {
							child.forEach( collectJSXExpr );
						} else if ( child && typeof child === 'object' && child.type ) {
							collectJSXExpr( child );
						}
					}
				} );

				function isInsideJSXExprContainer( token ) {
					return jsxExprRanges.some( ( r ) => token.range[0] >= r[0] && token.range[1] <= r[1] );
				}

				// ── Step 1b: comma must follow closing bracket on the same line ──────
				//    If a comma sits alone on a line and the previous real token is a
				//    closing bracket/brace/paren, pull the comma up to that line.
				//    Exception: skip when the resulting line would exceed 150 chars.
				for ( const token of allTokens ) {
					if ( token.type !== 'Punctuator' || token.value !== ',' ) {
						continue;
					}

					const lineText = lines[token.loc.start.line - 1];
					const beforeComma = lineText.substring( 0, token.loc.start.column );

					if ( beforeComma.trim() !== '' ) {
						continue;
					}

					const prev = sourceCode.getTokenBefore( token, { includeComments: false } );

					if ( !prev || !CLOSING.has( prev.value ) ) {
						continue;
					}

					// Check if joining would exceed max length.
					const prevLine = lines[prev.loc.end.line - 1];
					const joinedLength = prevLine.trimEnd().length + 1; // +1 for the comma
					const next = sourceCode.getTokenAfter( token, { includeComments: false } );
					let canInlineNextSingleLineBracketArg = false;
					let nextArgEnd = null;

					if ( next && next.loc.start.line > token.loc.start.line && OPENING.has( next.value ) ) {
						const nextClose = closeTokenOfOpen.get( next.range[0] );

						if ( nextClose && nextClose.loc.start.line === next.loc.start.line ) {
							canInlineNextSingleLineBracketArg = true;
							nextArgEnd = nextClose.range[1];
						}
					}

					if ( canInlineNextSingleLineBracketArg ) {
						const nextArgText = sourceCode.text.slice( next.range[0], nextArgEnd );
						const joinedWithArgLength = prevLine.trimEnd().length + 2 + nextArgText.length;

						if ( joinedWithArgLength <= 150 ) {
							context.report( {
								node: token,
								loc: token.loc,
								message: `Comma should follow the closing '${prev.value}' on the same line, not on a new line.`,
								fix( fixer ) {
									return fixer.replaceTextRange( [prev.range[1], next.range[0]], ', ' );
								}
							} );
							continue;
						}
					}

					if ( joinedLength > 150 ) {
						continue;
					}

					context.report( {
						node: token,
						loc: token.loc,
						message: `Comma should follow the closing '${prev.value}' on the same line, not on a new line.`,
						fix( fixer ) {
							return fixer.replaceTextRange( [prev.range[1], token.range[0]], '' );
						}
					} );
				}

				// ── Step 1c: pull up a lone `)` after an inline closing `]` ───────────
				//    Pattern:  `]` ends a line (closing an inline `[...]`) and `)` is
				//    alone on the next line. The `)` should be appended to that `]` line.
				//    This intentionally does NOT apply to `}` after an inline `)` inside
				//    an object value, which is a valid aligned multiline object literal.
				//    Exception: skip when the resulting line would exceed 150 chars.
				for ( const token of allTokens ) {
					if ( token.value !== ')' ) {
						continue;
					}
					if ( !isAloneOnLine( token ) ) {
						continue;
					}

					const prev = sourceCode.getTokenBefore( token, { includeComments: false } );

					if ( !prev || prev.value !== ']' ) {
						continue;
					}

					// The previous closer must end on a different (earlier) line.
					if ( prev.loc.end.line === token.loc.start.line ) {
						continue;
					}

					// The previous closer must be an inline closer — its opener is on the
					// same line as itself.
					const prevOpener = openerOf.get( prev.range[0] );

					if ( !prevOpener || prevOpener.loc.start.line !== prev.loc.start.line ) {
						continue;
					}

					// The current closer must span multiple lines (opener on different line).
					const curOpener = openerOf.get( token.range[0] );

					if ( !curOpener || curOpener.loc.start.line === token.loc.start.line ) {
						continue;
					}

					// Only pull `)` up for calls that started inline on the opener line.
					// If the opener line ends right after `(`, the call is already in a
					// fully multiline layout and keeping `)` on its own line is valid.
					const openerLineText = lines[curOpener.loc.start.line - 1] || '';
					const openerLineAfterToken = openerLineText.substring( curOpener.loc.end.column );

					if ( openerLineAfterToken.trim() === '' ) {
						continue;
					}

					// Skip if the current token is inside a JSX expression container
					// (e.g., closing paren of a .map() call inside JSX is handled by jsx-formatting).
					if ( isInsideJSXExprContainer( token ) ) {
						continue;
					}

					// Check resulting line length.
					const prevLineText = lines[prev.loc.end.line - 1].trimEnd();
					const joined = prevLineText + token.value;

					if ( joined.length > 150 ) {
						continue;
					}

					context.report( {
						node: token,
						loc: token.loc,
						message: `Closing '${token.value}' should follow '${prev.value}' on the same line, not on a new line.`,
						fix( fixer ) {
							// Remove the whitespace/newline between prev closer and this token.
							return fixer.replaceTextRange( [prev.range[1], token.range[0]], '' );
						}
					} );
				}

				// ── Step 2: for each closer alone on its line ─────────────────────────
				//   a) Merge: walk backward collecting closers on consecutive lines above
				//      that share the same opener line → collapse all gaps in one fix.
				//   b) Indent: if no merge, fix indentation to match opener's line.
				for ( const token of allTokens ) {
					if ( !CLOSING.has( token.value ) ) {
						continue;
					}
					if ( !isAloneOnLine( token ) ) {
						continue;
					}
					if ( handledAsChain.has( token.range[0] ) ) {
						continue;
					}

					const opener = openerOf.get( token.range[0] );
					if ( !opener ) {
						continue;
					}

					const openLine = opener.loc.start.line;
					const closeLine = token.loc.start.line;

					if ( openLine === closeLine ) {
						continue;
					}

					const expectedIndent = getLineIndent( openLine );
					const textBeforeClose = lines[closeLine - 1].substring( 0, token.loc.start.column );

					// Walk backward collecting the full chain of closers to merge.
					const gaps = [];
					let current = token;

					while ( true ) {
						const prev = sourceCode.getTokenBefore( current, { includeComments: false } );

						if ( !prev || !CLOSING.has( prev.value ) ) {
							break;
						}
						if ( prev.loc.end.line !== current.loc.start.line - 1 ) {
							break;
						}

						const prevOpener = openerOf.get( prev.range[0] );

						if ( !prevOpener || prevOpener.loc.start.line !== openLine ) {
							break;
						}

						gaps.unshift( { start: prev.range[1], end: current.range[0] } );
						handledAsChain.add( prev.range[0] );
						current = prev;
					}

					if ( gaps.length > 0 ) {
						handledAsChain.add( token.range[0] );

						context.report( {
							node: token,
							loc: token.loc,
							message: `Closing '${token.value}' should be on the same line as the previous closing bracket.`,
							fix( fixer ) {
								return gaps.map( ( gap ) =>
									fixer.replaceTextRange( [gap.start, gap.end], ' ' ) );
							}
						} );
						continue;
					}

					// Plain indent check.
					if ( textBeforeClose === expectedIndent ) {
						continue;
					}

					context.report( {
						node: token,
						loc: token.loc,
						message: `Closing '${token.value}' should be indented to match its opening line.`,
						fix( fixer ) {
							const lineStartOffset = token.range[0] - token.loc.start.column;
							return fixer.replaceTextRange(
								[lineStartOffset, token.range[0]],
								expectedIndent
							);
						}
					} );
				}

				// ── Step 3: split closers on the same line whose openers are on
				//    DIFFERENT lines.
				//
				//    We scan runs of consecutive closers on the same line, find every
				//    boundary where the opener line changes, and emit ONE report per run
				//    so a single WebStorm hotkey press resolves the whole line.
				//
				//    Guard A — inline construct: if the left closer's opener is on the
				//    same line as the closer itself (e.g. `[a, b]`), never split.
				//
				//    Guard B — sibling argument: if left's opener was placed on a line
				//    that already contains a closer whose opener line equals right's
				//    opener line, then left's opener was opened as a sibling argument
				//    in the same call that right closes. The two closers therefore
				//    belong together and must not be split.
				//
				//    Example of guard B:
				//      line 1:  useMemo( () => ( {   ← opens (, (, {
				//      line N:  } ), [               ← closes }, ), opens [
				//      line M:  ] );                 ← closes ], )
				//    On line N, `)` is a closer whose opener is on line 1 (= right's
				//    opener line). So `[` on that line is a sibling argument → `]` and
				//    `);` belong together → no split.
				let i = 0;

				while ( i < allTokens.length ) {
					const token = allTokens[i];

					if ( !CLOSING.has( token.value ) ) {
						i++;
						continue;
					}

					// Collect a run of consecutive closers on the same line.
					const run = [token];
					let j = i + 1;

					while ( j < allTokens.length ) {
						const next = allTokens[j];

						if ( !CLOSING.has( next.value ) ) {
							break;
						}
						if ( next.loc.start.line !== token.loc.start.line ) {
							break;
						}
						run.push( next );
						j++;
					}

					i = j;

					if ( run.length < 2 ) {
						continue;
					}

					// Find every split point within the run.
					const splits = [];

					for ( let k = 0; k < run.length - 1; k++ ) {
						const left = run[k];
						const right = run[k + 1];

						const leftOpener = openerOf.get( left.range[0] );
						const rightOpener = openerOf.get( right.range[0] );

						if ( !leftOpener || !rightOpener ) {
							continue;
						}

						const leftOpenerLine = leftOpener.loc.start.line;
						const rightOpenerLine = rightOpener.loc.start.line;

						// Same opener line → belong together, no split needed.
						if ( leftOpenerLine === rightOpenerLine ) {
							continue;
						}

						// Guard A: left closer is an inline construct (opener on same
						// line as the closer itself) — never split here.
						if ( leftOpenerLine === left.loc.start.line ) {
							continue;
						}

						// Guard B: check whether left's opener line contains any closer
						// whose opener line equals rightOpenerLine. If so, left's opener
						// was placed there as a sibling argument in the same call that
						// right closes — they belong together, no split.
						const tokensOnLeftOpenerLine = tokensByLine.get( leftOpenerLine ) || [];
						const isSiblingArgument = tokensOnLeftOpenerLine.some( ( t ) => {
							if ( !CLOSING.has( t.value ) ) {
								return false;
							}
							const tOpener = openerOf.get( t.range[0] );
							return tOpener && tOpener.loc.start.line === rightOpenerLine;
						} );

						if ( isSiblingArgument ) {
							continue;
						}

						splits.push( {
							gapStart: left.range[1],
							gapEnd: right.range[0],
							newIndent: getLineIndent( rightOpenerLine )
						} );
					}

					if ( splits.length === 0 ) {
						continue;
					}

					// Report once for the whole run so WebStorm applies all splits
					// in a single hotkey press.
					context.report( {
						node: run[run.length - 1],
						loc: {
							start: run[0].loc.start,
							end: run[run.length - 1].loc.end
						},
						message: 'Closing brackets on this line need to be split across lines to match their opener indentation.',
						fix( fixer ) {
							return splits.map( ( s ) =>
								fixer.replaceTextRange( [s.gapStart, s.gapEnd], '\n' + s.newIndent ) );
						}
					} );
				}
			},

			ArrayExpression( node ) {
				if ( isInsideJSX( node ) || node.loc.start.line === node.loc.end.line || node.elements.length <= 1 ) {
					return;
				}

				const bracketTokens = getArrayBracketTokens( node );

				if ( !bracketTokens ) {
					return;
				}

				const { openBracket, closeBracket } = bracketTokens;
				const firstElement = node.elements[0];
				const lastElement = node.elements[node.elements.length - 1];

				if ( firstElement && firstElement.loc.start.line === openBracket.loc.start.line ) {
					context.report( {
						node,
						loc: openBracket.loc,
						message: "Multiline arrays with more than one element must start elements on the line after '['.",
						fix( fixer ) {
							return fixer.replaceTextRange( [openBracket.range[1], firstElement.range[0]], '\n' + getLineIndent( firstElement.loc.start.line ) );
						}
					} );
				}

				if ( lastElement && lastElement.loc.end.line === closeBracket.loc.start.line ) {
					context.report( {
						node,
						loc: closeBracket.loc,
						message: "Multiline arrays with more than one element must place ']' on its own line.",
						fix( fixer ) {
							return fixer.replaceTextRange( [lastElement.range[1], closeBracket.range[0]], '\n' + getLineIndent( openBracket.loc.start.line ) );
						}
					} );
				}

				for ( let i = 0; i < node.elements.length - 1; i++ ) {
					const left = node.elements[i];
					const right = node.elements[i + 1];

					if ( !left || !right ) {
						continue;
					}

					if ( left.loc.start.line === right.loc.start.line ) {
						context.report( {
							node: right,
							loc: right.loc,
							message: 'In multiline arrays, each element must be on its own line.'
						} );
					}
				}
			},

			CallExpression( node ) {
				if ( isInsideJSX( node ) || node.arguments.length === 0 || node.loc.start.line === node.loc.end.line ) {
					return;
				}

				const parenTokens = getCallParenTokens( node );

				if ( !parenTokens ) {
					return;
				}

				const { openParen, closeParen } = parenTokens;
				const firstArg = node.arguments[0];
				const lastArg = node.arguments[node.arguments.length - 1];

				if (
					node.arguments.length === 1 &&
					firstArg &&
					firstArg.loc.start.line > openParen.loc.start.line &&
					closeParen.loc.start.line === lastArg.loc.end.line
				) {
					context.report( {
						node,
						loc: closeParen.loc,
						message: "Closing ')' should be on its own line when call arguments start on a new line.",
						fix( fixer ) {
							return fixer.replaceTextRange( [lastArg.range[1], closeParen.range[0]], '\n' + getLineIndent( openParen.loc.start.line ) );
						}
					} );
				}

				if (
					node.arguments.length === 1 &&
					firstArg &&
					firstArg.loc.start.line === openParen.loc.start.line &&
					closeParen.loc.start.line > lastArg.loc.end.line
				) {
					context.report( {
						node,
						loc: closeParen.loc,
						message: "Closing ')' should stay on the argument line when arguments start on the same line as '('.",
						fix( fixer ) {
							return fixer.replaceTextRange( [lastArg.range[1], closeParen.range[0]], ' ' );
						}
					} );
				}
			},

			ObjectExpression( node ) {
				if ( isInsideJSX( node ) || node.properties.length > 0 ) {
					return;
				}

				const text = sourceCode.getText( node );

				if ( text === '{ }' ) {
					context.report( {
						node,
						loc: node.loc,
						message: "Empty object literals must not contain spaces between '{' and '}'.",
						fix( fixer ) {
							return fixer.replaceText( node, '{}' );
						}
					} );
				}
			},

			'CallExpression[arguments.length=0]'( node ) {
				if ( isInsideJSX( node ) ) {
					return;
				}

				const parenTokens = getCallParenTokens( node );

				if ( !parenTokens ) {
					return;
				}

				const { openParen, closeParen } = parenTokens;
				const between = sourceCode.text.slice( openParen.range[1], closeParen.range[0] );

				if ( between === ' ' ) {
					context.report( {
						node,
						loc: node.loc,
						message: "Empty function calls must not contain spaces between '(' and ')'.",
						fix( fixer ) {
							return fixer.replaceTextRange( [openParen.range[1], closeParen.range[0]], '' );
						}
					} );
				}
			},

			FunctionDeclaration( node ) {
				checkEmptyFunctionParens( node );
				checkEmptyFunctionBodySpacing( node );
			},

			FunctionExpression( node ) {
				checkEmptyFunctionParens( node );
				checkEmptyFunctionBodySpacing( node );
			},

			ArrowFunctionExpression( node ) {
				checkEmptyFunctionParens( node );
				checkEmptyFunctionBodySpacing( node );
			}
		};
	}
};