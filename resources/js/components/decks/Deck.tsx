import { Component } from 'solid-js';
import { MoveRight } from 'lucide-solid';
import { Link } from '@kobalte/core/link';

interface DeckType {
	id: number;
	name: string;
	image: string;
	class?: string;
}

const Deck: Component<DeckType> = (props) => {
	return (
		<div class={`${props.class} max-w-sm p-4 bg-gray-900 border border-gray-800 rounded-md shadow-sm`}>
			<h5 class="mb-2 text-2xl font-bold tracking-tight">{props.name}</h5>
			<img
				src={props.image}
				alt={props.name}
				class="min-w-[300px] max-w-[300px] mx-auto"
			/>
			<Link href={`/decks/builder/${props.id}`} class="mt-2 inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
				Edit Deck
				<MoveRight class="ml-2" size={16} />
			</Link>
		</div>
	);
};

export default Deck;
