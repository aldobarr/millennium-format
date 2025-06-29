import { Component } from 'solid-js';
import DeckBuilderComponent from '../components/DeckBuilder';
import { useParams } from '@solidjs/router';

const DeckBuilder: Component = () => {
	const params = useParams();
	const deckId = params.id ? Number(params.id) : undefined;

	return (
		<section class="text-gray-400 body-font text-center">
			<DeckBuilderComponent deckId={deckId} />
		</section>
	);
};

export default DeckBuilder;
