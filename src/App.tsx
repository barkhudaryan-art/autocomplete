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
		name: names[Math.floor( Math.random() * names.length )] ?? 'Unknown',
		age: Math.floor( Math.random() * 50 ) + 18
	} ) );
}

interface User {
	id: number;
	name: string;
	age: number;
}

const MOCK_ARRAY: User[] = generateUsers( 50 );

function filterUsers( query: string, users: User[] ): User[] {
	return users.filter( user => {
		const foundName = user.name.toLowerCase().includes( query.toLowerCase() );
		const foundAge = Number.isFinite( +query ) ? user.age === +query : false;
		return foundName || foundAge;
	} );
}

function App() {
	const [searchValue, setSearchValue] = useState( '' );

	const searchChangeHandler = ( value: string ) => {
		setSearchValue( value );
	};
	const filteredArray = filterUsers( searchValue, MOCK_ARRAY );

	return <div className='pt-15 px-5 h-full relative'>
		<Input
			id={'autocomplete'}
			placeholder={'Search...'}
			value={searchValue}
			onChange={searchChangeHandler}
		/>
		<div
			className='overflow-auto h-[calc(100%-40px)]'
		>
			{
				filteredArray.length > 0
					? filteredArray.map( user => {
						return (
							<div
								key={user.id}
								className={'py-1 w-full h-10 flex items-center border-border border-b'}
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
