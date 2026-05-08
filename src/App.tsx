import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';


function App() {
	const [count, setCount] = useState( 0 );

	return (
		<>
			<section
				className='flex flex-col gap-6.25 place-content-center place-items-center grow max-lg:px-5 max-lg:pt-8 max-lg:pb-6 max-lg:gap-4.5'
			>
				<div className="relative">
					<img src={heroImg} className="relative mx-auto w-42.5 z-0" width="170" height="179" alt=""/>
					<img
						src={reactLogo}
						style={{
							transform: 'perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg) scale(1.4)'
						}}
						className="absolute mx-auto z-1 top-8.5 h-7"
						alt="React logo"
					/>
					<img
						src={viteLogo}
						style={{
							transform: 'perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg) scale(0.8)'
						}}
						className="absolute mx-auto z-0 top-26.75 h-6.5 w-auto"
						alt="Vite logo"
					/>
				</div>
				<div>
					<h1>Get started</h1>
					<p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
					</p>
				</div>
				<button
					type="button"
					className="cursor-pointer text-base px-2.5 py-1.25 mb-6 text-accent bg-accent-soft border-2 border-transparent rounded-[5px] transition-colors duration-300 hover:border-accent-edge focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
					onClick={() => {
						setCount( ( count ) => count + 1 );
					}}
				>
          Count is {count}
				</button>
			</section>

			<div className="ticks"></div>

			<section
				className='flex border-t border-border text-left max-lg:flex-col max-lg:text-center'
			>
				<div
					className='grow shrink basis-0 p-8 border-r border-border border-solid max-lg:px-6 max-lg:py-5 max-lg:border-b max-lg:border-r-0'
				>
					<svg className="mb-4 w-5.5 h-5.5" role="presentation" aria-hidden="true">
						<use href="/icons.svg#documentation-icon"></use>
					</svg>
					<h2>Documentation</h2>
					<p>Your questions, answered</p>
					<ul className='list-none p-0 flex gap-2 mt-8 max-lg:mt-5 flex-wrap justify-center'>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://vite.dev/"
								target="_blank"
								rel="noreferrer"
							>
								<img className="h-4.5" src={viteLogo} alt=""/>
                Explore Vite
							</a>
						</li>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://react.dev/"
								target="_blank"
								rel="noreferrer"
							>
								<img className="w-4.5 h-4.5" src={reactLogo} alt=""/>
                Learn more
							</a>
						</li>
					</ul>
				</div>
				<div id="social" className='grow shrink basis-0 p-8 max-lg:px-6 max-lg:py-5'>
					<svg className="mb-4 w-5.5 h-5.5" role="presentation" aria-hidden="true">
						<use href="/icons.svg#social-icon"></use>
					</svg>
					<h2>Connect with us</h2>
					<p>Join the Vite community</p>
					<ul className='list-none p-0 flex gap-2 mt-8 max-lg:mt-5 flex-wrap justify-center'>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://github.com/vitejs/vite"
								target="_blank"
								rel="noreferrer"
							>
								<svg
									className="w-4.5 h-4.5"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#github-icon"></use>
								</svg>
                GitHub
							</a>
						</li>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://chat.vite.dev/"
								target="_blank"
								rel="noreferrer"
							>
								<svg
									className="w-4.5 h-4.5"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#discord-icon"></use>
								</svg>
                Discord
							</a>
						</li>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://x.com/vite_js"
								target="_blank"
								rel="noreferrer"
							>
								<svg
									className="w-4.5 h-4.5"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#x-icon"></use>
								</svg>
                X.com
							</a>
						</li>
						<li className='max-lg:flex-[1_1_calc(50%-8px)]'>
							<a
								className='text-text-h bg-social-bg flex px-1.5 py-3 items-center gap-2 no-underline transition-shadow duration-300 rounded-md hover:shadow-card max-lg:w-full max-lg:justify-center'
								href="https://bsky.app/profile/vite.dev"
								target="_blank"
								rel="noreferrer"
							>
								<svg
									className="w-4.5 h-4.5"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#bluesky-icon"></use>
								</svg>
                Bluesky
							</a>
						</li>
					</ul>
				</div>
			</section>

			<div
				className="relative w-full before:content-[''] before:absolute before:top-[-4.5px] before:left-0 before:border-[5px] before:border-transparent
  before:border-l-border after:content-[''] after:absolute after:top-[-4.5px] after:right-0 after:border-[5px] after:border-transparent after:border-r-border"
			/>
			<section className='h-22 border-t border-solid border-t-border max-lg:h-12'></section>
		</>
	);
}

export default App;
