import { useState } from 'react';

import Input from './components/input/Input.tsx';


function App() {
	const [searchValue, setSearchValue] = useState( '' );

	const searchChangeHandler = ( value ) => {
		setSearchValue( value );
	};

	return <div className='pt-15 h-full'>
		<Input
			id={'autocomplete'}
			placeholder={'Search...'}
			value={searchValue}
			onChange={searchChangeHandler}
		/>
	</div>;
}

export default App;
