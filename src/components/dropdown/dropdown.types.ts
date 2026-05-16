type DropdownStatus = 'idle' | 'loading' | 'success' | 'error';

interface DropdownItem {
	id: string;
	onSelect: ( id: object ) => void;
}

export type { DropdownStatus, DropdownItem };