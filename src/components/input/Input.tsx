import React from 'react';


function Input( props: { id: any, placeholder: any; value: any; onChange: any; } ) {
	const {
        id = crypto.randomUUID(),
        propKey,
		placeholder,
		value,
		onChange
	} = props;

	const changeHandler = ( e: React.ChangeEventHandler ) => {
		onChange?.( e.target.value, propKey );
	};

	return (
		<label
			htmlFor={id}
			className={'border border-border rounded-4xl mx-auto h-10 w-1/2 flex justify-center items-center pl-4'}
		>
			<input
				id={id}
				type="text"
                placeholder={placeholder || ''}
				value={value}
				className={'w-full outline-none '}
				onChange={changeHandler}
			/>
		</label>
	);
}

export default Input;