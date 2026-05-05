import React from 'react';


const flag = true;
const nestedFlag = false;


function EslintJsxFormattingTernaryFixture() {
	return (
		<div
			data-inline-valid={flag ? 'yes' : 'no'}
			data-chopped-valid={
				flag
					? 'yes'
					: 'no'
			}
			data-simple-multiline-invalid={flag
				? 'yes'
				: 'no'}
			data-nested-inline-invalid={flag ? nestedFlag ? 'nested-yes' : 'nested-no' : 'fallback'}
			data-nested-mixed-invalid={
				flag
					? nestedFlag ? 'nested-yes' : 'nested-no'
					: 'fallback'
			}
		/>
	);
}

export default EslintJsxFormattingTernaryFixture;
