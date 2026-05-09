import { useState } from 'react';

import Input from 'components/input';


function generateUsers( count = 10 ) {
	const names = [
		'John',
		'Anna',
		'Mike',
		'Sarah',
		'David',
		'Emma',
		'Chris',
		'Lisa',
		'Alexander',
		'Sophie',
		'Daniel',
		'Olivia',
		'Matthew',
		'Isabella',
		'Nathan',
		'Charlotte',
		'Ethan',
		'Mia',
		'Lucas',
		'Amelia',
		'Noah',
		'Ava',
		'Benjamin',
		'Harper',
		'Elijah',
		'Evelyn',
		'James',
		'Abigail',
		'William',
		'Emily',
		'Michael',
		'Ella',
		'Sebastian',
		'Scarlett',
		'Jack',
		'Grace',
		'Leo',
		'Chloe',
		'Henry',
		'Victoria'
	];

	return Array.from( { length: count }, ( _, index ) => ( {
		id: index + 1,
		name: names[Math.floor( Math.random() * names.length )],
		age: Math.floor( Math.random() * 50 ) + 18
	} ) );
}

const MOCK_ARRAY = generateUsers( 50 );

function App() {
	const [searchValue, setSearchValue] = useState( '' );

	const searchChangeHandler = ( value: string ) => {
		setSearchValue( value );
	};
	const filteredArray = MOCK_ARRAY.filter( user => {
		const foundName = user.name?.toLowerCase().includes( searchValue.toLowerCase() );
		const foundAge = Number.isFinite( +searchValue ) ? user.age === +searchValue : false;
		return !!foundName || foundAge;
	} );

	return <div className='pt-15 px-5 h-full'>
		<Input
			id={'autocomplete'}
			placeholder={'Search...'}
			value={searchValue}
			onChange={searchChangeHandler}
		/>
		<div
			className='flex flex-col items-center justify-center'
		>
			{
				filteredArray.length > 0
					? filteredArray.map( user => {
						return (
							<div
								key={user.id}
								className={'py-1 w-full flex items-center justify-center border-border border-b'}
							>
								{user.name} - {user.age}
							</div>
						);
					} )
					: <div>No data</div>
			}
		</div>
	</div>;
}

export default App;
