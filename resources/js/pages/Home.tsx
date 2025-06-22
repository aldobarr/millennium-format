import { Component } from 'solid-js';
import DeckBuilder from '../components/DeckBuilder';

const Home: Component = () => {
	return (
		<section class="text-gray-400 body-font text-center">
			<DeckBuilder />
		</section>
	);
};

export default Home;
