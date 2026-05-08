/**
 * ESLint Rule: jsx-formatting
 * Follow the `JSX rules` in `lint/README.md`
 */

export default {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		schema: [
			{
				type: 'object',
				properties: {
					maxLength: { type: 'number' },
					maxLengthJSX: { type: 'number' },
					tabWidth: { type: 'number' }
				},
				additionalProperties: false
			}
		],
		messages: {
			openingTagCollapse: 'JSX opening tag fits on one line and should be collapsed.',
			openingTagExpand: 'JSX attributes should each be on their own line with closing bracket on its own line.',
			childLayout: 'JSX children should each start on a new line with proper indentation.',
			closingTagOwnLine: 'JSX closing tag should be on its own line at the correct indent.',
			exprBracesExpand: 'JSX expression braces should be on separate lines (content too long for one line).',
			exprBracesCollapse: 'JSX expression fits on one line and should be collapsed.',
			exprConditionalJSXMultiline: 'Ternary with JSX branches must be formatted in multiline JSX-expression layout.',
			jsxAfterLogicalOperator: 'JSX element should start on a new line after a logical operator.',
			jsxAfterLogicalAnd: 'JSX element should start on a new line after &&.',
			mapMultilineJsxAfterArrow: 'Multiline JSX returned from a callback should start on a new line after =>.',
			mapCloseParenOwnLine: 'Closing parenthesis for multiline callback JSX should be on its own line.'
		}
	},

	// Conditions
	// 1. Check if a tag is on single line and exceeds the maxLength limit
	// 1.1 Self closing element
	// 1.2 Regular element
	create( context ) {
		const options = context.options[0] || {};
		const maxLength = options.maxLength || 150;
		const tabWidth = options.tabWidth || 4;
		const source = context.sourceCode || context.getSourceCode();
		const lines = source.lines;
		const sourceCode = source.getText();
		const eol = sourceCode.includes( '\r\n' ) ? '\r\n' : '\n';
		const claimedLines = new Set();

		function normalizeEol( text ) {
			return text.replace( /\r\n/g, '\n' );
		}

		const getLineText = ( node ) => lines[node.loc.start.line - 1];
		const getSourceSlice = ( node ) => sourceCode.slice( node.range[0], node.range[1] );
		const getLineWidth = line => line.replace( /\t/g, ' '.repeat( tabWidth ) ).length;

		function getIndentByLine( lineNumber ) {
			const line = lines[lineNumber - 1] || '';
			const match = line.match( /^[\t ]*/ );
			return match ? match[0] : '';
		}

		function isWhitespaceText( node ) {
			return node.type === 'JSXText' && node.value.trim() === '';
		}

		function isCommentOnlyExpressionContainer( node ) {
			return node &&
				node.type === 'JSXExpressionContainer' &&
				node.expression &&
				node.expression.type === 'JSXEmptyExpression';
		}

		function canClaimLine( lineNumber ) {
			if ( claimedLines.has( lineNumber ) ) {
				return false;
			}

			claimedLines.add( lineNumber );
			return true;
		}

		function hasClaimedLine( lineNumber ) {
			return claimedLines.has( lineNumber );
		}

		function outdent( indent ) {
			if ( indent.endsWith( '\t' ) ) {
				return indent.slice( 0, -1 );
			}

			return indent.slice( 0, Math.max( 0, indent.length - tabWidth ) );
		}

		function reportFixOnLine( lineNumber, descriptor ) {
			if ( !canClaimLine( lineNumber ) ) {
				return;
			}

			context.report( descriptor );
		}

		function hasJSXNode( node ) {
			if ( !node || typeof node !== 'object' ) {
				return false;
			}

			if ( node.type === 'JSXElement' || node.type === 'JSXFragment' ) {
				return true;
			}

			for ( const key of Object.keys( node ) ) {
				if ( key === 'parent' ) {
					continue;
				}

				const value = node[key];
				if ( Array.isArray( value ) ) {
					for ( const item of value ) {
						if ( hasJSXNode( item ) ) {
							return true;
						}
					}
				} else if ( hasJSXNode( value ) ) {
					return true;
				}
			}

			return false;
		}

		function unwrapParenthesizedExpression( node ) {
			let current = node;

			while ( current && current.type === 'ParenthesizedExpression' ) {
				current = current.expression;
			}

			return current;
		}

		function isDirectJSXNode( node ) {
			const unwrapped = unwrapParenthesizedExpression( node );
			return !!unwrapped && ( unwrapped.type === 'JSXElement' || unwrapped.type === 'JSXFragment' );
		}

		function hasDirectJSXConditionalBranches( expression ) {
			return isDirectJSXNode( expression?.consequent ) || isDirectJSXNode( expression?.alternate );
		}

		function isLogicalJSXLayoutTarget( node ) {
			const unwrapped = unwrapParenthesizedExpression( node );

			if ( isDirectJSXNode( unwrapped ) ) {
				return true;
			}

			if ( unwrapped?.type === 'CallExpression' && getJSXCallbackFromCall( unwrapped ) ) {
				return true;
			}

			if ( unwrapped?.type === 'LogicalExpression' ) {
				return isLogicalJSXLayoutTarget( unwrapped.right );
			}

			if ( unwrapped?.type === 'ConditionalExpression' ) {
				return hasDirectJSXConditionalBranches( unwrapped );
			}

			return false;
		}

		function formatInnerBlock( rawText, indent ) {
			const normalized = normalizeEol( rawText ).trim();
			if ( !normalized ) {
				return '';
			}

			const blockLines = normalized.split( '\n' );
			const nonEmpty = blockLines.filter( line => line.trim() !== '' );
			const minIndent = nonEmpty.reduce( ( acc, line ) => {
				const current = ( line.match( /^[\t ]*/ ) || [''] )[0].length;
				return Math.min( acc, current );
			}, Number.POSITIVE_INFINITY );

			return blockLines.map( line => `${indent}${line.slice( Math.min( minIndent, line.length ) )}` ).join( eol );
		}

		function formatOpeningTagSingleLine( openingEl ) {
			const tagName = getSourceSlice( openingEl.name );
			const attrs = openingEl.attributes.map( attr => getSourceSlice( attr ).trim() ).filter( Boolean );
			const attrsText = attrs.length > 0 ? ` ${attrs.join( ' ' )}` : '';
			return openingEl.selfClosing ? `<${tagName}${attrsText}/>` : `<${tagName}${attrsText}>`;
		}

		function formatOpeningTagMultiline( openingEl ) {
			const tagName = getSourceSlice( openingEl.name );
			const baseIndent = getIndentByLine( openingEl.loc.start.line );
			const attrIndent = `${baseIndent}\t`;
			const attrs = openingEl.attributes.map( attr => `${attrIndent}${getSourceSlice( attr ).trim()}` );
			if ( attrs.length === 0 ) {
				return formatOpeningTagSingleLine( openingEl );
			}

			const closer = openingEl.selfClosing ? '/>' : '>';
			return `<${tagName}${eol}${attrs.join( eol )}${eol}${baseIndent}${closer}`;
		}

		function buildOpeningTag( openingEl, baseIndent ) {
			const tagName = getSourceSlice( openingEl.name );
			const attrs = openingEl.attributes.map( attr => getSourceSlice( attr ).trim() ).filter( Boolean );
			const attrsText = attrs.length > 0 ? ` ${attrs.join( ' ' )}` : '';
			const singleLine = openingEl.selfClosing ? `<${tagName}${attrsText}/>` : `<${tagName}${attrsText}>`;
			const shouldExpand = attrs.length > 0 && getLineWidth( `${baseIndent}${singleLine}` ) > maxLength;

			if ( !shouldExpand ) {
				return singleLine;
			}

			const attrIndent = `${baseIndent}\t`;
			const closer = openingEl.selfClosing ? '/>' : '>';
			return `<${tagName}${eol}${attrs.map( attr => `${attrIndent}${attr}` ).join( eol )}${eol}${baseIndent}${closer}`;
		}

		function formatExpressionContainerMultiline( container ) {
			const containerIndent = getIndentByLine( container.loc.start.line );
			const innerIndent = `${containerIndent}\t`;
			const inner = formatInnerBlock( getSourceSlice( container.expression ), innerIndent );
			return `{${eol}${inner}${eol}${containerIndent}}`;
		}

		function formatCallbackJsxBodyMultiline( node, arrow ) {
			const arrowIndent = getIndentByLine( arrow.loc.start.line );
			const bodyIndent = `${arrowIndent}\t`;
			const bodyText = formatInnerBlock( getSourceSlice( node ), bodyIndent );
			return `(${eol}${bodyText}${eol}${arrowIndent})`;
		}

		function formatInlineChild( child ) {
			if ( child.type === 'JSXText' ) {
				return child.value.replace( /\s+/g, ' ' );
			}

			return getSourceSlice( child ).trim();
		}

		function isSimpleInlineExpressionContainer( child ) {
			if ( child.type !== 'JSXExpressionContainer' || isCommentOnlyExpressionContainer( child ) ) {
				return false;
			}

			const expression = child.expression;

			return expression.type === 'Identifier' || expression.type === 'MemberExpression' || expression.type === 'Literal';
		}

		function getReturnedJSXFromArrow( arrow ) {
			if ( !arrow || arrow.type !== 'ArrowFunctionExpression' ) {
				return null;
			}

			if ( arrow.body.type === 'JSXElement' || arrow.body.type === 'JSXFragment' ) {
				return arrow.body;
			}

			if ( arrow.body.type === 'ParenthesizedExpression' ) {
				const expression = arrow.body.expression;
				if ( expression && ( expression.type === 'JSXElement' || expression.type === 'JSXFragment' ) ) {
					return expression;
				}
			}

			return null;
		}

		function getArrowFunctionHead( arrow ) {
			const tokens = source.getTokens( arrow );
			const arrowToken = tokens.find( token => token.value === '=>' );
			if ( !arrowToken ) {
				return sourceCode.slice( arrow.range[0], arrow.body.range[0] ).replace( /\s+$/u, '' );
			}

			return sourceCode.slice( arrow.range[0], arrowToken.range[1] ).replace( /\s+$/u, '' );
		}

		function getJSXCallbackFromCall( expression ) {
			return expression.arguments.find( argument => getReturnedJSXFromArrow( argument ) ) || null;
		}

		function formatCallExpressionWithJSXCallback( expression, baseIndent ) {
			const jsxCallback = getJSXCallbackFromCall( expression );
			if ( !jsxCallback ) {
				return null;
			}

			const returnedNode = getReturnedJSXFromArrow( jsxCallback );
			const rawCallHead = sourceCode.slice( expression.range[0], jsxCallback.range[0] ).trimEnd();
			const callHead = rawCallHead.endsWith( '(' ) ? `${rawCallHead} ` : rawCallHead;
			const callbackHead = getArrowFunctionHead( jsxCallback );
			const callIndent = `${baseIndent}\t`;
			const bodyIndent = `${callIndent}\t`;
			const callbackBody = returnedNode.loc.start.line !== returnedNode.loc.end.line
				? formatInnerBlock( getSourceSlice( returnedNode ), bodyIndent )
				: formatRenderableNode( returnedNode, bodyIndent );

			return `${callHead}${callbackHead}${eol}${bodyIndent}${callbackBody}${eol}${callIndent})`;
		}

		function formatConditionalExpressionInner( expression, baseIndent ) {
			return formatConditionalExpression( expression, baseIndent ).slice( eol.length, -baseIndent.length );
		}

		function formatLogicalExpressionInner( expression, baseIndent ) {
			const innerIndent = `${baseIndent}\t`;
			const leftText = getSourceSlice( expression.left ).trim();
			const formattedRightCall = expression.right.type === 'CallExpression'
				? formatCallExpressionWithJSXCallback( expression.right, innerIndent )
				: null;
			const rightText = formattedRightCall || formatRenderableNode( expression.right, innerIndent );
			return `${leftText} ${expression.operator}${eol}${innerIndent}${rightText}`;
		}

		function isJSXConditionalBranchFormatted( node ) {
			if ( node.type === 'ConditionalExpression' && hasDirectJSXConditionalBranches( node ) ) {
				return isConditionalExpressionWithJSXFormatted( node );
			}

			if ( node.type === 'LogicalExpression' && isLogicalJSXLayoutTarget( node.right ) ) {
				return isLogicalExpressionWithJSXFormatted( node );
			}

			return true;
		}

		function isJSXCallbackCallFormatted( expression ) {
			const jsxCallback = getJSXCallbackFromCall( expression );
			if ( !jsxCallback ) {
				return true;
			}

			const returnedNode = getReturnedJSXFromArrow( jsxCallback );
			const isReturnedMultiline = returnedNode.loc.start.line !== returnedNode.loc.end.line;
			if ( !isReturnedMultiline ) {
				return true;
			}

			const startsAfterArrowLine = returnedNode.loc.start.line > jsxCallback.loc.start.line;
			const closesBeforeCallEnd = expression.loc.end.line > returnedNode.loc.end.line;

			return startsAfterArrowLine && closesBeforeCallEnd;
		}

		function isLogicalExpressionWithJSXFormatted( expression ) {
			if ( !isLogicalJSXLayoutTarget( expression.right ) ) {
				return true;
			}

			if ( expression.right.loc.start.line <= expression.left.loc.end.line ) {
				return false;
			}

			return isJSXConditionalBranchFormatted( expression.right );
		}

		function isConditionalExpressionWithJSXFormatted( expression ) {
			const hasJSXConsequent = isDirectJSXNode( expression.consequent );
			const hasJSXAlternate = isDirectJSXNode( expression.alternate );

			if ( !( hasJSXConsequent || hasJSXAlternate ) ) {
				return true;
			}

			if ( expression.loc.start.line === expression.loc.end.line ) {
				return false;
			}

			if ( expression.consequent.loc.start.line <= expression.test.loc.end.line ) {
				return false;
			}

			if ( expression.alternate.loc.start.line <= expression.consequent.loc.end.line ) {
				return false;
			}

			return !( !isJSXConditionalBranchFormatted( expression.consequent ) || !isJSXConditionalBranchFormatted( expression.alternate ) );
		}

		function isInsideJSXExpressionContainer( node ) {
			let current = node.parent;

			while ( current ) {
				if ( current.type === 'JSXExpressionContainer' ) {
					return true;
				}

				if ( current.type === 'ReturnStatement' || current.type === 'Program' ) {
					return false;
				}

				current = current.parent;
			}

			return false;
		}

		function isTopLevelReturnedExpression( node ) {
			let current = node.parent;

			while ( current && current.type === 'ParenthesizedExpression' ) {
				current = current.parent;
			}

			return current && current.type === 'ReturnStatement';
		}

		function checkReturnedExpression( expression ) {
			if ( hasClaimedLine( expression.loc.start.line ) || isInsideJSXExpressionContainer( expression ) || !isTopLevelReturnedExpression( expression ) ) {
				return;
			}

			if ( expression.type === 'ConditionalExpression' ) {
				const hasJSXConsequent = isDirectJSXNode( expression.consequent );
				const hasJSXAlternate = isDirectJSXNode( expression.alternate );

				if ( !( hasJSXConsequent || hasJSXAlternate ) ) {
					return;
				}

				if ( isConditionalExpressionWithJSXFormatted( expression ) ) {
					return;
				}

				const baseIndent = outdent( getIndentByLine( expression.loc.start.line ) );
				const expected = formatConditionalExpressionInner( expression, baseIndent );

				reportFixOnLine( expression.loc.start.line, {
					node: expression,
					messageId: 'exprConditionalJSXMultiline',
					fix( fixer ) {
						return fixer.replaceTextRange( [expression.range[0], expression.range[1]], expected );
					}
				} );
				return;
			}

			if (
				expression.type === 'LogicalExpression' &&
				( expression.operator === '&&' || expression.operator === '||' ) &&
				isLogicalJSXLayoutTarget( expression.right ) &&
				!hasPendingNestedJSXFix( expression ) &&
				!isLogicalExpressionWithJSXFormatted( expression )
			) {
				const baseIndent = outdent( getIndentByLine( expression.loc.start.line ) );
				reportFixOnLine( expression.loc.start.line, {
					node: expression.right,
					messageId: 'jsxAfterLogicalOperator',
					fix( fixer ) {
						return fixer.replaceTextRange( [expression.range[0], expression.range[1]], formatLogicalExpressionInner( expression, baseIndent ) );
					}
				} );
			}
		}

		function hasPendingNestedJSXFix( rootExpression ) {
			let hasPending = false;

			function visit( node, isRoot = false ) {
				if ( hasPending || !node || typeof node !== 'object' ) {
					return;
				}

				if ( !isRoot ) {
					if ( node.type === 'JSXExpressionContainer' && !isCommentOnlyExpressionContainer( node ) && node.expression ) {
						const containerIndent = getIndentByLine( node.loc.start.line );
						if ( node.expression.type === 'CallExpression' ) {
							const formattedCall = formatCallExpressionWithJSXCallback( node.expression, containerIndent );
							if ( formattedCall ) {
								const expected = `{${eol}${containerIndent}\t${formattedCall}${eol}${containerIndent}}`;
								if ( normalizeEol( getSourceSlice( node ) ) !== normalizeEol( expected ) ) {
									hasPending = true;
									return;
								}
							}
						}
					}

					if (
						node.type === 'CallExpression' &&
						getReturnedJSXFromArrow( node.arguments.find( argument => getReturnedJSXFromArrow( argument ) ) ) &&
						!isJSXCallbackCallFormatted( node )
					) {
						hasPending = true;
						return;
					}

					if ( node.type === 'LogicalExpression' && isLogicalJSXLayoutTarget( node.right ) && !isLogicalExpressionWithJSXFormatted( node ) ) {
						hasPending = true;
						return;
					}

					if ( node.type === 'ConditionalExpression' && hasDirectJSXConditionalBranches( node ) && !isConditionalExpressionWithJSXFormatted( node ) ) {
						hasPending = true;
						return;
					}
				}

				for ( const key of Object.keys( node ) ) {
					if ( key === 'parent' ) {
						continue;
					}

					const value = node[key];
					if ( Array.isArray( value ) ) {
						for ( const item of value ) {
							visit( item );
						}
					} else {
						visit( value );
					}
				}
			}

			visit( rootExpression, true );
			return hasPending;
		}

		function formatExpressionContainerWithIndent( child, containerIndent ) {
			if ( isCommentOnlyExpressionContainer( child ) ) {
				return getSourceSlice( child ).trim();
			}

			const expression = child.expression;
			if ( expression.type === 'CallExpression' ) {
				const formattedCall = formatCallExpressionWithJSXCallback( expression, containerIndent );
				if ( formattedCall ) {
					return `{${eol}${containerIndent}\t${formattedCall}${eol}${containerIndent}}`;
				}
			}

			if ( expression.type === 'ConditionalExpression' ) {
				const hasJSXConsequent = isDirectJSXNode( expression.consequent );
				const hasJSXAlternate = isDirectJSXNode( expression.alternate );
				if ( hasJSXConsequent || hasJSXAlternate ) {
					return `{${formatConditionalExpression( expression, containerIndent )}}`;
				}
			}

			if (
				expression.type === 'LogicalExpression' &&
				( expression.operator === '&&' || expression.operator === '||' ) &&
				isLogicalJSXLayoutTarget( expression.right )
			) {
				return formatLogicalExpressionWithJSXForIndent( expression, containerIndent );
			}

			const raw = getSourceSlice( child ).trim();
			const isSingleLineContainer = child.loc.start.line === child.loc.end.line;
			const shouldExpand = hasJSXNode( expression ) || !isSingleLineContainer || getLineWidth( `${containerIndent}${raw}` ) > maxLength;

			if ( !shouldExpand ) {
				return raw;
			}

			const innerIndent = `${containerIndent}\t`;
			const inner = formatInnerBlock( getSourceSlice( expression ), innerIndent );
			return `{${eol}${inner}${eol}${containerIndent}}`;
		}

		function formatFragmentForIndent( node, baseIndent ) {
			const significantChildren = node.children.filter( child => !isWhitespaceText( child ) );
			if ( significantChildren.length === 0 ) {
				return '<></>';
			}

			const canInline = significantChildren.every( child => child.type !== 'JSXElement' && child.type !== 'JSXFragment' && !isCommentOnlyExpressionContainer( child ) ) &&
				getLineWidth( `${baseIndent}<>${significantChildren.map( formatInlineChild ).join( '' )}</>` ) <= maxLength;

			if ( canInline ) {
				return `<>${significantChildren.map( formatInlineChild ).join( '' )}</>`;
			}

			const childIndent = `${baseIndent}\t`;
			const children = significantChildren.map( child => {
				const rendered = formatRenderableNode( child, childIndent ) || getSourceSlice( child ).trim();
				return `${eol}${childIndent}${rendered}`;
			} ).join( '' );
			return `<>
${children}${eol}${baseIndent}</>`;
		}

		function formatElementForIndent( node, baseIndent ) {
			const openingEl = node.openingElement;
			const opening = buildOpeningTag( openingEl, baseIndent );
			if ( openingEl.selfClosing ) {
				return opening;
			}

			const tagName = getSourceSlice( openingEl.name );
			const significantChildren = node.children.filter( child => !isWhitespaceText( child ) );

			if ( significantChildren.length === 0 ) {
				if ( opening.includes( eol ) ) {
					return `${opening}${eol}${baseIndent}</${tagName}>`;
				}

				return `${opening}</${tagName}>`;
			}

			const hasJSXChild = significantChildren.some( child => child.type === 'JSXElement' || child.type === 'JSXFragment' );
			const hasComplexExpression = significantChildren.some( child =>
				child.type === 'JSXExpressionContainer' &&
				!isSimpleInlineExpressionContainer( child ) );
			const inlineText = significantChildren.map( formatInlineChild ).join( '' );

			if (
				!opening.includes( eol ) &&
				!hasJSXChild &&
				!hasComplexExpression &&
				getLineWidth( `${baseIndent}${opening}${inlineText}</${tagName}>` ) <= maxLength
			) {
				return `${opening}${inlineText}</${tagName}>`;
			}

			const childIndent = `${baseIndent}\t`;
			const children = significantChildren.map( child => {
				const rendered = formatRenderableNode( child, childIndent ) || getSourceSlice( child ).trim();
				return `${eol}${childIndent}${rendered}`;
			} ).join( '' );
			return `${opening}${children}${eol}${baseIndent}</${tagName}>`;
		}

		function formatRenderableNode( node, baseIndent ) {
			if ( node.type === 'ParenthesizedExpression' ) {
				const expression = unwrapParenthesizedExpression( node );
				if ( expression && ( expression.type === 'JSXElement' || expression.type === 'JSXFragment' ) ) {
					const innerIndent = `${baseIndent}\t`;
					return `(${eol}${innerIndent}${formatRenderableNode( expression, innerIndent )}${eol}${baseIndent})`;
				}

				return getSourceSlice( node ).trim();
			}

			if ( node.type === 'JSXElement' ) {
				return formatElementForIndent( node, baseIndent );
			}

			if ( node.type === 'JSXFragment' ) {
				return formatFragmentForIndent( node, baseIndent );
			}

			if ( node.type === 'JSXExpressionContainer' ) {
				return formatExpressionContainerWithIndent( node, baseIndent );
			}

			if ( node.type === 'JSXText' ) {
				return node.value.replace( /\s+/g, ' ' ).trim();
			}

			return getSourceSlice( node ).trim();
		}

		function getMeaningfulChildLineRange( child ) {
			if ( child.type !== 'JSXText' ) {
				return {
					start: child.loc.start.line,
					end: child.loc.end.line
				};
			}

			const text = normalizeEol( child.value );
			const textLines = text.split( '\n' );
			let firstContentIndex = -1;
			let lastContentIndex = -1;

			for ( let i = 0; i < textLines.length; i++ ) {
				if ( textLines[i].trim() !== '' ) {
					if ( firstContentIndex === -1 ) {
						firstContentIndex = i;
					}

					lastContentIndex = i;
				}
			}

			if ( firstContentIndex === -1 ) {
				return null;
			}

			return {
				start: child.loc.start.line + firstContentIndex,
				end: child.loc.start.line + lastContentIndex
			};
		}

		function checkIsNestedTernary( expression ) {
			const isConsequent = expression.consequent && expression.consequent.type === 'ConditionalExpression';
			const isAlternate = expression.alternate && expression.alternate.type === 'ConditionalExpression';
			return expression && isConsequent || isAlternate;
		}

		function formatConditionalExpression( expression, baseIndent ) {
			const conditionIndent = `${baseIndent}\t`;
			const branchIndent = `${baseIndent}\t\t`;
			const lines = [];

			function appendBranch( node, prefix, childIndent ) {
				if ( node.type === 'ConditionalExpression' ) {
					lines.push( `${prefix}${getSourceSlice( node.test )}` );
					appendBranch( node.consequent, `${childIndent}? `, `${childIndent}\t` );
					appendBranch( node.alternate, `${childIndent}: `, `${childIndent}\t` );
					return;
				}

				const branchBaseIndent = ( prefix.match( /^[\t ]*/ ) || [''] )[0];
				const rendered = formatRenderableNode( node, branchBaseIndent ) || getSourceSlice( node ).trim();
				lines.push( `${prefix}${rendered}` );
			}

			lines.push( `${conditionIndent}${getSourceSlice( expression.test )}` );
			appendBranch( expression.consequent, `${branchIndent}? `, `${branchIndent}\t` );
			appendBranch( expression.alternate, `${branchIndent}: `, `${branchIndent}\t` );
			return `${eol}${lines.join( eol )}${eol}${baseIndent}`;
		}

		function formatConditionalContainerMultiline( container, expression ) {
			const containerIndent = getIndentByLine( container.loc.start.line );
			return `{${formatConditionalExpression( expression, containerIndent )}}`;
		}

		function formatLogicalExpressionWithJSXForIndent( expression, containerIndent ) {
			const innerIndent = `${containerIndent}\t`;
			const leftText = getSourceSlice( expression.left ).trim();
			const formattedRightCall = expression.right.type === 'CallExpression'
				? formatCallExpressionWithJSXCallback( expression.right, innerIndent )
				: null;
			const rightText = formattedRightCall || formatRenderableNode( expression.right, innerIndent );
			return `{${eol}${innerIndent}${leftText} ${expression.operator}${eol}${innerIndent}${rightText}${eol}${containerIndent}}`;
		}

		function formatLogicalExpressionWithJSX( container, expression ) {
			const containerIndent = getIndentByLine( container.loc.start.line );
			return formatLogicalExpressionWithJSXForIndent( expression, containerIndent );
		}

		function checkOpeningElementLayout( node ) {
			const openingEl = node.openingElement;
			const rawOpening = getSourceSlice( openingEl );
			const hasAttrs = openingEl.attributes.length > 0;
			const isOpeningSingleLine = openingEl.loc.start.line === openingEl.loc.end.line;
			const lineNumber = openingEl.loc.start.line;
			const openingLineWidth = getLineWidth( getLineText( openingEl ) );

			if ( hasClaimedLine( lineNumber ) ) {
				return;
			}

			if ( isOpeningSingleLine && hasAttrs && openingLineWidth > maxLength ) {
				reportFixOnLine( lineNumber, {
					node: openingEl,
					messageId: 'openingTagExpand',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], formatOpeningTagMultiline( openingEl ) );
					}
				} );
				return;
			}

			if ( isOpeningSingleLine && openingEl.selfClosing && /\s\/>$/.test( rawOpening ) ) {
				reportFixOnLine( lineNumber, {
					node: openingEl,
					message: 'Self-closing tags should not contain a space before />',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], rawOpening.replace( /\s\/>$/, '/>' ) );
					}
				} );
				return;
			}

			if ( isOpeningSingleLine && !openingEl.selfClosing && /\s>$/.test( rawOpening ) ) {
				reportFixOnLine( lineNumber, {
					node: openingEl,
					message: 'Tags should not contain a space before >',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], rawOpening.replace( /\s>$/, '>' ) );
					}
				} );
				return;
			}

			if ( !hasAttrs && !isOpeningSingleLine ) {
				reportFixOnLine( lineNumber, {
					node: openingEl,
					message: 'Tags without attributes should keep opening tag in one line',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], formatOpeningTagSingleLine( openingEl ) );
					}
				} );
				return;
			}

			if ( hasAttrs && !isOpeningSingleLine ) {
				const firstAttr = openingEl.attributes[0];
				const firstAttrOnTagLine = firstAttr.loc.start.line === openingEl.loc.start.line;
				const lastAttr = openingEl.attributes[openingEl.attributes.length - 1];
				const closingOwnLine = openingEl.loc.end.line > lastAttr.loc.end.line;
				const duplicateAttrLines = new Set( openingEl.attributes.map( attr => attr.loc.start.line ) ).size !== openingEl.attributes.length;

				if ( firstAttrOnTagLine || !closingOwnLine || duplicateAttrLines ) {
					reportFixOnLine( lineNumber, {
						node: openingEl,
						messageId: 'openingTagExpand',
						fix( fixer ) {
							return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], formatOpeningTagMultiline( openingEl ) );
						}
					} );
				}
			}
		}

		function checkAttributeExpressions( openingEl ) {
			if ( hasClaimedLine( openingEl.loc.start.line ) ) {
				return;
			}

			function getAttributeName( attr ) {
				if ( attr?.name?.type === 'JSXIdentifier' ) {
					return attr.name.name;
				}

				return attr?.name ? getSourceSlice( attr.name ) : 'attribute';
			}

			function getObjectPropertyName( prop ) {
				if ( !prop ) {
					return 'property';
				}

				if ( prop.type === 'Property' ) {
					if ( prop.key?.type === 'Identifier' ) {
						return prop.key.name;
					}

					if ( prop.key ) {
						return getSourceSlice( prop.key ).trim();
					}
				}

				if ( prop.type === 'SpreadElement' && prop.argument ) {
					return `...${getSourceSlice( prop.argument ).trim()}`;
				}

				return getSourceSlice( prop ).trim();
			}

			for ( const attr of openingEl.attributes ) {
				const attrLineText = getLineText( attr );
				const attrLineWidth = getLineWidth( attrLineText );

				if ( attr.type === 'JSXSpreadAttribute' ) {
					if ( attrLineWidth > maxLength ) {
						context.report( {
							node: attr,
							message: 'Spread attribute line is too long'
						} );
					}
					continue;
				}

				const attrName = getAttributeName( attr );
				const value = attr.value;
				const expression = value && value.type === 'JSXExpressionContainer' ? value.expression : null;
				const props = expression?.properties;
				const attrIndent = attrLineText.match( /^[\t ]*/ )[0];
				const propIndent = attrIndent + '\t';
				const propLines = props?.map( prop => {
					const propRaw = getSourceSlice( prop );
					if ( propRaw.length > maxLength ) {
						context.report( {
							node: prop,
							message: `Property name in ObjectExpression too long: ${getObjectPropertyName( prop )}`
						} );
					}
					return propIndent + propRaw.trim();
				} );

				if ( !value ) {
					if ( attrLineWidth > maxLength ) {
						context.report( {
							node: attr,
							message: `Property name too long: ${attrName}`
						} );
					}
					continue;
				}

				if ( value.type !== 'JSXExpressionContainer' ) {
					continue;
				}

				switch ( expression.type ) {
					case 'Literal':
					case 'Identifier': {
						if ( attrLineWidth > maxLength ) {
							context.report( {
								node: expression,
								message: `Value of property: ${attrName} is too long`
							} );
						}
						break;
					}
					case 'ObjectExpression': {
						if ( attrLineWidth > maxLength ) {
							if ( props.length === 0 ) {
								context.report( {
									node: expression,
									message: `Property name too long: ${attrName}`
								} );
								break;
							}
							const expanded = `{{${eol}${propLines.join( `,${eol}` )}${eol}${attrIndent}}}`;
							context.report( {
								node: expression,
								message: `Object Expression ${attrName} is too long`,
								fix( fixer ) {
									return fixer.replaceTextRange( [value.range[0], value.range[1]], expanded );
								}
							} );
						}
						break;
					}
					case 'ConditionalExpression': {
						const isNestedTernary = checkIsNestedTernary( expression );
						const isTernaryOnSameLine = expression.loc.start.line === expression.loc.end.line;
						const isSimpleSingleLineTernary = isTernaryOnSameLine && !isNestedTernary;
						const shouldBeChopped = !isSimpleSingleLineTernary;
						const expressionInnerStart = value.range[0] + 1;
						const expressionInnerEnd = value.range[1] - 1;
						const formatted = formatConditionalExpression( expression, attrIndent );
						const currentExpressionText = sourceCode.slice( expressionInnerStart, expressionInnerEnd );
						const isMismatchedFormat = shouldBeChopped && normalizeEol( currentExpressionText ) !== normalizeEol( formatted );
						if ( isMismatchedFormat ) {
							context.report( {
								node: expression,
								message: `Conditional Expression in ${attrName} should use the chopped nested format`,
								fix( fixer ) {
									return fixer.replaceTextRange( [expressionInnerStart, expressionInnerEnd], formatted );
								}
							} );
						}
						break;
					}
				}
			}
		}

		function checkExpressionContainerChild( child ) {
			const expression = child.expression;
			if ( !expression || isCommentOnlyExpressionContainer( child ) || hasClaimedLine( child.loc.start.line ) ) {
				return;
			}

			if ( expression.type === 'CallExpression' ) {
				const containerIndent = getIndentByLine( child.loc.start.line );
				const jsxCallback = getJSXCallbackFromCall( expression );
				const returnedNode = jsxCallback ? getReturnedJSXFromArrow( jsxCallback ) : null;
				const formattedCall = formatCallExpressionWithJSXCallback( expression, containerIndent );
				if ( formattedCall ) {
					const expected = `{${eol}${containerIndent}\t${formattedCall}${eol}${containerIndent}}`;
					const requiresStructuredCallLayout = expression.loc.start.line !== expression.loc.end.line ||
						( returnedNode && returnedNode.loc.start.line !== returnedNode.loc.end.line );
					const expressionStartsAfterBrace = expression.loc.start.line > child.loc.start.line;
					const expressionEndsBeforeBrace = expression.loc.end.line < child.loc.end.line;

					if ( !isJSXCallbackCallFormatted( expression ) ) {
						reportFixOnLine( child.loc.start.line, {
							node: child,
							messageId: 'mapMultilineJsxAfterArrow',
							fix( fixer ) {
								return fixer.replaceTextRange( [child.range[0], child.range[1]], expected );
							}
						} );
						return;
					}

					if ( requiresStructuredCallLayout && ( !expressionStartsAfterBrace || !expressionEndsBeforeBrace ) ) {
						reportFixOnLine( child.loc.start.line, {
							node: child,
							messageId: 'exprBracesExpand',
							fix( fixer ) {
								return fixer.replaceTextRange( [child.range[0], child.range[1]], expected );
							}
						} );
						return;
					}
				}
			}

			if ( expression.type === 'ConditionalExpression' ) {
				const hasJSXConsequent = isDirectJSXNode( expression.consequent );
				const hasJSXAlternate = isDirectJSXNode( expression.alternate );
				if ( hasJSXConsequent || hasJSXAlternate ) {
					const expressionStartsAfterBrace = expression.loc.start.line > child.loc.start.line;
					const expressionEndsBeforeBrace = expression.loc.end.line < child.loc.end.line;

					if ( child.loc.start.line !== child.loc.end.line && ( !expressionStartsAfterBrace || !expressionEndsBeforeBrace ) ) {
						const expected = formatConditionalContainerMultiline( child, expression );
						reportFixOnLine( child.loc.start.line, {
							node: child,
							messageId: 'exprBracesExpand',
							fix( fixer ) {
								return fixer.replaceTextRange( [child.range[0], child.range[1]], expected );
							}
						} );
						return;
					}

					if ( !isConditionalExpressionWithJSXFormatted( expression ) ) {
						const expected = formatConditionalContainerMultiline( child, expression );
						reportFixOnLine( child.loc.start.line, {
							node: child,
							messageId: 'exprConditionalJSXMultiline',
							fix( fixer ) {
								return fixer.replaceTextRange( [child.range[0], child.range[1]], expected );
							}
						} );
					}
					return;
				}
			}

			if (
				expression.type === 'LogicalExpression' &&
				( expression.operator === '&&' || expression.operator === '||' ) &&
				isLogicalJSXLayoutTarget( expression.right )
			) {
				// Check outer brace placement first, before any inner-fix guards.
				// A multiline container whose `{` shares a line with the expression
				// content must be expanded, regardless of pending inner fixes.
				const outerExprStartsAfterBrace = expression.loc.start.line > child.loc.start.line;
				const outerExprEndsBeforeBrace = expression.loc.end.line < child.loc.end.line;

				if ( child.loc.start.line !== child.loc.end.line && ( !outerExprStartsAfterBrace || !outerExprEndsBeforeBrace ) ) {
					reportFixOnLine( child.loc.start.line, {
						node: child,
						messageId: 'exprBracesExpand',
						fix( fixer ) {
							return fixer.replaceTextRange( [child.range[0], child.range[1]], formatExpressionContainerMultiline( child ) );
						}
					} );
					return;
				}

				if ( expression.right.type === 'CallExpression' ) {
					const formattedRightCall = formatCallExpressionWithJSXCallback( expression.right, `${getIndentByLine( child.loc.start.line )}\t` );
					if ( formattedRightCall && !isJSXCallbackCallFormatted( expression.right ) ) {
						const expected = formatLogicalExpressionWithJSX( child, expression );
						reportFixOnLine( child.loc.start.line, {
							node: expression.right,
							messageId: 'mapMultilineJsxAfterArrow',
							fix( fixer ) {
								return fixer.replaceTextRange( [child.range[0], child.range[1]], expected );
							}
						} );
						return;
					}
				}

				if ( hasPendingNestedJSXFix( expression ) ) {
					return;
				}

				const betweenLeftAndRight = sourceCode.slice( expression.left.range[1], expression.right.range[0] );
				const expected = formatLogicalExpressionWithJSX( child, expression );
				const isMismatched = !isLogicalExpressionWithJSXFormatted( expression );
				const rightStartsNewLine = expression.right.loc.start.line > expression.left.loc.end.line;

				if ( isMismatched ) {
					const hasCommentBetween = betweenLeftAndRight.includes( '//' ) || betweenLeftAndRight.includes( '/*' );
					if ( hasCommentBetween && rightStartsNewLine ) {
						return;
					}
					reportFixOnLine( child.loc.start.line, {
						node: expression.right,
						messageId: 'jsxAfterLogicalOperator',
						fix: hasCommentBetween
							? null
							: fixer => fixer.replaceTextRange( [child.range[0], child.range[1]], expected )
					} );
				}
				return;
			}

			const hasJSX = hasJSXNode( expression );
			const isSingleLineContainer = child.loc.start.line === child.loc.end.line;
			const isSingleLineExpression = expression.loc.start.line === expression.loc.end.line;
			const lineWidth = getLineWidth( getLineText( child ) );

			if ( isSingleLineContainer ) {
				if ( hasJSX || lineWidth > maxLength ) {
					reportFixOnLine( child.loc.start.line, {
						node: child,
						messageId: 'exprBracesExpand',
						fix( fixer ) {
							return fixer.replaceTextRange( [child.range[0], child.range[1]], formatExpressionContainerMultiline( child ) );
						}
					} );
				}
				return;
			}

			const expressionStartsAfterBrace = expression.loc.start.line > child.loc.start.line;
			const expressionEndsBeforeBrace = expression.loc.end.line < child.loc.end.line;

			if ( !expressionStartsAfterBrace || !expressionEndsBeforeBrace ) {
				reportFixOnLine( child.loc.start.line, {
					node: child,
					messageId: 'exprBracesExpand',
					fix( fixer ) {
						return fixer.replaceTextRange( [child.range[0], child.range[1]], formatExpressionContainerMultiline( child ) );
					}
				} );
			}

			if ( expression.type === 'LogicalExpression' && expression.operator === '&&' && isLogicalJSXLayoutTarget( expression.right ) ) {
				const rightStartsNewLine = expression.right.loc.start.line > expression.left.loc.end.line;
				if ( !rightStartsNewLine ) {
					context.report( {
						node: expression.right,
						messageId: 'jsxAfterLogicalAnd'
					} );
				}
			}

			if ( expression.type === 'ConditionalExpression' && hasJSX && isSingleLineExpression ) {
				reportFixOnLine( child.loc.start.line, {
					node: expression,
					messageId: 'exprConditionalJSXMultiline',
					fix( fixer ) {
						return fixer.replaceTextRange( [child.range[0], child.range[1]], formatConditionalContainerMultiline( child, expression ) );
					}
				} );
			}
		}

		function checkCallbackJsxLayout( node ) {
			const arrow = node.parent && node.parent.type === 'ArrowFunctionExpression' ? node.parent : null;
			if ( !arrow || arrow.body !== node || hasClaimedLine( node.loc.start.line ) ) {
				return;
			}

			const callExpr = arrow.parent && arrow.parent.type === 'CallExpression' ? arrow.parent : null;
			if ( !callExpr ) {
				return;
			}

			const isMultilineNode = node.loc.start.line !== node.loc.end.line;
			if ( !isMultilineNode ) {
				return;
			}

			const expected = formatCallbackJsxBodyMultiline( node, arrow );

			if ( node.loc.start.line === arrow.loc.start.line ) {
				reportFixOnLine( node.loc.start.line, {
					node,
					messageId: 'mapMultilineJsxAfterArrow',
					fix( fixer ) {
						return fixer.replaceTextRange( [node.range[0], node.range[1]], expected );
					}
				} );
			}
		}

		function checkChildrenLayout( node, baseIndent ) {
			const nextLineIndent = `${baseIndent}\t`;
			const significantChildren = node.children.filter( child => !isWhitespaceText( child ) );
			if ( significantChildren.length === 0 ) {
				return;
			}

			for ( const child of significantChildren ) {
				if ( child.type === 'JSXExpressionContainer' && !isCommentOnlyExpressionContainer( child ) ) {
					checkExpressionContainerChild( child );
				}
			}

			const hasJSXChild = significantChildren.some( child => child.type === 'JSXElement' || child.type === 'JSXFragment' );
			const hasComplexChildExpression = significantChildren.some( child =>
				child.type === 'JSXExpressionContainer' && !isSimpleInlineExpressionContainer( child ) );
			const isNodeSingleLine = node.loc.start.line === node.loc.end.line;
			const openingEl = node.type === 'JSXElement' ? node.openingElement : null;
			const closingEl = node.type === 'JSXElement' ? node.closingElement : null;
			const hasInlinePackedChildren = !!openingEl && !!closingEl && significantChildren.some( child => {
				const childLineRange = getMeaningfulChildLineRange( child );
				if ( !childLineRange ) {
					return false;
				}

				return childLineRange.start === openingEl.loc.end.line || childLineRange.end === closingEl.loc.start.line;
			} );

			if ( node.type === 'JSXElement' && !isNodeSingleLine && ( hasJSXChild || hasComplexChildExpression ) && hasInlinePackedChildren ) {
				let newChildren = '';
				for ( const child of significantChildren ) {
					newChildren += `${eol}${nextLineIndent}${formatRenderableNode( child, nextLineIndent )}`;
				}
				newChildren += `${eol}${baseIndent}`;
				reportFixOnLine( node.loc.start.line, {
					node,
					messageId: 'childLayout',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[1], closingEl.range[0]], newChildren );
					}
				} );
				return;
			}

			if ( hasJSXChild && isNodeSingleLine && node.type === 'JSXElement' ) {
				let newChildren = '';
				for ( const child of significantChildren ) {
					newChildren += `${eol}${nextLineIndent}${formatRenderableNode( child, nextLineIndent )}`;
				}
				newChildren += `${eol}${baseIndent}`;
				reportFixOnLine( node.loc.start.line, {
					node,
					messageId: 'childLayout',
					fix( fixer ) {
						return fixer.replaceTextRange( [openingEl.range[1], closingEl.range[0]], newChildren );
					}
				} );
			}
		}

		function checkElementNode( node ) {
			if ( hasClaimedLine( node.loc.start.line ) ) {
				return;
			}

			const openingEl = node.openingElement;
			const lineText = getLineText( node );
			const baseIndent = lineText.match( /^[\t ]*/ )[0];

			checkCallbackJsxLayout( node );
			if ( hasClaimedLine( node.loc.start.line ) ) {
				return;
			}

			checkOpeningElementLayout( node );
			if ( hasClaimedLine( node.loc.start.line ) ) {
				return;
			}

			checkAttributeExpressions( openingEl );

			if ( !openingEl.selfClosing ) {
				checkChildrenLayout( node, baseIndent );
				if ( hasClaimedLine( node.loc.start.line ) ) {
					return;
				}
			}

			if ( node.loc.start.line === node.loc.end.line ) {
				const actualLineWidth = getLineWidth( lineText );
				if ( actualLineWidth > maxLength ) {
					const nextLineIndent = `${baseIndent}\t`;
					const tagName = getSourceSlice( openingEl.name );
					const attrLines = openingEl.attributes.map( attr => `${nextLineIndent}${getSourceSlice( attr ).trim()}` );
					if ( openingEl.selfClosing ) {
						const result = `<${tagName}${eol}${attrLines.join( eol )}${eol}${baseIndent}/>`;
						reportFixOnLine( node.loc.start.line, {
							node,
							message: 'Single-line self-closing JSX exceeds max length',
							fix( fixer ) {
								return fixer.replaceTextRange( [openingEl.range[0], openingEl.range[1]], result );
							}
						} );
					} else {
						const closingEl = node.closingElement;
						const significantChildren = node.children.filter( child => !isWhitespaceText( child ) );
						let newChildren = '';
						for ( const child of significantChildren ) {
							newChildren += `${eol}${nextLineIndent}${formatRenderableNode( child, nextLineIndent )}`;
						}
						newChildren += `${eol}${baseIndent}`;
						reportFixOnLine( node.loc.start.line, {
							node,
							message: `Line is longer than ${maxLength}`,
							fix( fixer ) {
								return fixer.replaceTextRange( [openingEl.range[1], closingEl.range[0]], newChildren );
							}
						} );
					}
				}
			}
		}

		function checkFragmentNode( node ) {
			if ( hasClaimedLine( node.loc.start.line ) ) {
				return;
			}

			const lineText = getLineText( node );
			const baseIndent = lineText.match( /^[\t ]*/ )[0];
			checkChildrenLayout( node, baseIndent );
		}


		return {
			ConditionalExpression( node ) {
				checkReturnedExpression( node );
			},
			LogicalExpression( node ) {
				checkReturnedExpression( node );
			},
			JSXElement( node ) {
				checkElementNode( node );
			},
			JSXFragment( node ) {
				checkFragmentNode( node );
			}
		};
	}
};