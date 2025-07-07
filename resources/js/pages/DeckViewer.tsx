import { useParams } from '@solidjs/router';
import { Component } from 'solid-js';
import DeckBuilderComponent from '../components/DeckBuilder';

const DeckBuilder: Component = () => {
	const params = useParams();

	return (
		<section class="text-gray-400 body-font text-center">
			<DeckBuilderComponent deckId={params.id ? Number(params.id) : undefined} readonly />
		</section>
	);
};

export default DeckBuilder;
