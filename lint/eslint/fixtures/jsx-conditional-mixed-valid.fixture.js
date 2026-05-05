import React from 'react';


const styles = {
	no_data_found: '',
	center_element: '',
	icon: ''
};
const options = [];


function PortalContainer() {
	return null;
}


function ConditionalMixedValidFixture() {
	let Condition1 = 1;
	let Condition2 = 2;
	let popupRef = null;

	return (
		<div>
			{
				Condition1
					? <PortalContainer containerRef={popupRef} height={32}/>
					: Condition2
						? options.map( season => {
							return <PortalContainer
								item={season}
								key={season.id}
								onClick={'onClick'}
								isSelected={'selectedSeason?.id === season.id'}
								selectedSeason={'selectedSeason'}
							/>;
						} )
						: <div className={`asfsaf ${styles.no_data_found} ${styles.center_element}`}>
							<i className={`icon-image_border ${styles.icon}`}/>
							No seasons found.
						</div>
			}
		</div>
	);
}


ConditionalMixedValidFixture();
