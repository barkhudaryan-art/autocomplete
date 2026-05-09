import type { ChangeEvent } from 'react';


interface InputProps {
	id?: string,
	placeholder?: string,
	value?: string | number,
	onChange?: ( value: string ) => void,
}

function Input( props: InputProps ) {
	const {
		id = crypto.randomUUID(),
		placeholder,
		value,
		onChange
	} = props;

	const changeHandler = ( e: ChangeEvent<HTMLInputElement> ) => {
		onChange?.( e.target.value );
	};

	return (
		<label
			htmlFor={id}
			className={'border border-border rounded-4xl mx-auto h-10 w-full flex justify-center items-center pl-4'}
		>
			<input
				id={id}
				type={'text'}
				role={'combobox'}
				placeholder={placeholder ?? ''}
				value={value}
				className={'w-full outline-none'}
				onChange={changeHandler}
			/>
		</label>
	);
}

export default Input;