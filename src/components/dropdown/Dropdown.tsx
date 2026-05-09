import type { ReactNode } from 'react';

import Option from './option';

import type { DropdownItem, DropdownStatus } from './dropdown.types.ts';


interface DropdownProps<T extends DropdownItem> {
	id: string;
	isOpen: boolean;
	status?: DropdownStatus;
	options: T[];
	highlightedId?: T['id'];
	errorMessage?: string;
	emptyMessage?: string;
	loadingMessage?: string;
	renderOption: ( option: T ) => ReactNode;
	onSelect: ( option: T ) => void;
	onHighlight?: ( ( option: T ) => void ) | undefined;
}

function Dropdown<T extends DropdownItem>( props: DropdownProps<T> ) {
	const {
		id,
		isOpen,
		status = 'success',
		options,
		highlightedId,
		errorMessage = 'Something went wrong',
		emptyMessage = 'No results',
		loadingMessage = 'Loading...',
		renderOption,
		onSelect,
		onHighlight
	} = props;

	if ( !isOpen ) {
		return null;
	}

	const showEmpty = status === 'success' && options.length === 0;
	const showOptions = status === 'success' && options.length > 0;

	return (
		<ul
			id={id}
			role="listbox"
			className="absolute left-0 right-0 z-10 mt-2 max-h-72 overflow-auto rounded-2xl border border-border bg-surface shadow-card"
		>
			{
				status === 'loading' && (
					<li role="status" aria-live="polite" className="px-4 py-2 text-ink">
						{loadingMessage}
					</li>
				)
			}
			{
				status === 'error' && (
					<li role="alert" className="px-4 py-2 text-ink">
						{errorMessage}
					</li>
				)
			}
			{
				showEmpty && (
					<li role="status" className="px-4 py-2 text-ink">
						{emptyMessage}
					</li>
				)
			}
			{
				showOptions &&
				options.map( ( option ) =>
					<Option<T>
						id={option.id}
						key={option.id}
						listboxId={id}
						option={option}
						isHighlighted={option.id === highlightedId}
						render={renderOption}
						onSelect={onSelect}
						onHighlight={onHighlight}
					/>
				)
			}
		</ul>
	);
}


export default Dropdown;
