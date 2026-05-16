import type { MouseEvent, ReactNode } from 'react';
import type { DropdownItem } from '../dropdown.types';


interface OptionProps<T extends DropdownItem> {
	id: string;
	listboxId: string;
	option: T;
	isHighlighted: boolean;
	render?: ( ( option: T ) => ReactNode ) | undefined;
	onSelect: ( ( option: T ) => void ) | undefined;
	onHighlight?: ( ( option: T ) => void ) | undefined;
}

function Option<T extends DropdownItem>( props: OptionProps<T> ) {
	const {
		listboxId,
		option,
		isHighlighted,
		render,
		onSelect,
		onHighlight
	} = props;

	const selectHandler = ( event: MouseEvent<HTMLLIElement> ) => {
		event.preventDefault();
		onSelect?.( option );
	};
	const highlightHandler = () => {
		onHighlight?.( option );
	};

	const stateClass = isHighlighted ? 'bg-accent-soft text-accent' : 'text-ink-strong';
	const className = `px-4 py-2 cursor-pointer ${stateClass}`;

	return (
		<li
			id={`${listboxId}-option-${option.id}`}
			role="option"
			aria-selected={isHighlighted}
			onMouseDown={selectHandler}
			onMouseEnter={highlightHandler}
			className={className}
		>
			{render?.( option )}
		</li>
	);
}

export default Option;