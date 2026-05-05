import React, { Fragment, useCallback, useRef, useState } from 'react';
import styles from './coreRowActionStyles.module.scss';

import PortalContainer from '@softconstruct/stats-core_portal-container';

import CONSTANTS from '../../../constants';
import { elementHelper } from '../../../helpers';
import { useDynamicConfigsContext, useStableConfigsContext } from '../../../context';


const { DATA_TITLE } = CONSTANTS;

const stopPropagation = e => e.stopPropagation();

function RowAction( props ) {
	const {
		enabled,
		row
	} = props;
	const { rowRenderOptions } = useDynamicConfigsContext();
	const {
		rowActionsClassName,
		rowActionsPopupClassName,
		rowActionsWidth,
		rowActionsIsGrouped,
		rowActionsAlwaysVisible,
		rowActions,
		providedRowActionsGroupBtn
	} = useStableConfigsContext();

	const [actionsVisible, setActionsVisible] = useState( false );

	const buttonRef = useRef( null );
	const portalRef = useRef( null );

	const alwaysVisible = !!rowActionsAlwaysVisible && enabled;

	const closeMenu = useCallback( () => {
		portalRef.current?.closeHandler( () => setActionsVisible( false ) );
	}, [] );

	if ( rowActionsIsGrouped ) {
		const toggleMenu = ( e ) => {
			e.stopPropagation();
			if ( actionsVisible ) {
				portalRef.current?.closeHandler( () => setActionsVisible( false ) );
			} else {
				setActionsVisible( true );
			}
		};

		return <div
			data-title={DATA_TITLE.ROW_ACTION}
			className={`${rowActionsClassName} ${styles.group} ${alwaysVisible ? '' : styles.visible_by_hover}`}
			onClick={toggleMenu}
			onDoubleClick={stopPropagation}
			style={{ flex: `0 0 ${rowActionsWidth}px` }}
			ref={buttonRef}
		>
			{providedRowActionsGroupBtn}
			{
				actionsVisible && Array.isArray( rowActions ) &&
				<PortalContainer
					ref={portalRef}
					className={rowActionsPopupClassName}
					position={'bottomRight'}
					targetRef={buttonRef}
					onClose={closeMenu}
				>
					{
						rowActions?.map( ( action, i ) => {
							return <Fragment key={i}>
								{elementHelper.renderValueHandler( action?.( row, rowRenderOptions ) )}
							</Fragment>;
						} )
					}
				</PortalContainer>
			}
		</div>;
	}

	return <span
		data-title={DATA_TITLE.ROW_ACTION}
		onClick={stopPropagation}
		onDoubleClick={stopPropagation}
		className={`${rowActionsClassName} ${styles.inline_wrapper} ${alwaysVisible ? '' : styles.visible_by_hover}`}
		style={{ flex: `0 0 ${rowActionsWidth}px` }}
	>
		{
			Array.isArray( rowActions ) &&
			rowActions.map( ( action, j ) =>
				<Fragment key={j}>
					{elementHelper.renderValueHandler( action?.( row, rowRenderOptions ) )}
				</Fragment>
			)
		}
	</span>;
}

export default RowAction;