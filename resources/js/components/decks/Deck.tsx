import { Link } from '@kobalte/core/link';
import { CopyPlus, Download, MoveRight } from 'lucide-solid';
import { Accessor, Component, Setter } from 'solid-js';
import DeckType from '../../interfaces/Deck';
import request from '../../util/Requests';

interface DeckProps {
	id: number;
	name: string;
	image: string;
	class?: string;
	setErrors: (errors: string[]) => void;
	working: Accessor<boolean>;
	setWorking: Setter<boolean>;
	setDecks: Setter<DeckType[]>;
}

const Deck: Component<DeckProps> = (props) => {
	const duplicateDeck = async () => {
		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const res = await request(`/decks/${props.id}/duplicate`, { method: 'POST' });
			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors as string[]);
				return;
			}

			props.setDecks(response.data);
		} catch (error) {
			console.error(error);
		} finally {
			props.setWorking(false);
		}
	};

	const exportDeck = async () => {
		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const res = await request(`/decks/${props.id}/download`);
			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors as string[]);
				props.setWorking(false);
				return;
			}

			const blob = new Blob([btoa(JSON.stringify(response.data))], { type: 'application/octet-stream' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.style = 'display: none';
			a.download = `${props.name.replace(/\s+/g, '_')}.deck`;
			document.body.appendChild(a);

			const handleFocus = () => {
				props.setWorking(false);
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				window.removeEventListener('focus', handleFocus);
			};

			window.addEventListener('focus', handleFocus, { once: true });
			a.click();
		} catch (error) {
			props.setWorking(false);
			console.error(error);
		}
	};

	return (
		<div class={`${props.class} max-w-sm p-4 bg-gray-900 border border-gray-800 rounded-md shadow-sm`}>
			<h5 class="mb-2 text-2xl font-bold tracking-tight">{props.name}</h5>
			<img
				src={props.image}
				alt={props.name}
				class="min-w-[300px] max-w-[300px] mx-auto"
			/>
			<div class="flex flex-col md:flex-row mt-2">
				<button
					type="button"
					disabled={props.working()}
					class="cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-700"
					onClick={duplicateDeck}
				>
					Duplicate
					<CopyPlus class="ml-2" size={16} />
				</button>
				<Link
					href={`/decks/builder/${props.id}`}
					disabled={props.working()}
					class={`
						my-1 md:my-0 md:mx-1 inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg
						${props.working() ? 'cursor-not-allowed opacity-50 hover:bg-blue-700' : 'hover:bg-blue-800'}
					`}
				>
					Edit Deck
					<MoveRight class="ml-2" size={16} />
				</Link>
				<button
					type="button"
					disabled={props.working()}
					class="cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-700"
					onClick={exportDeck}
				>
					Export Deck
					<Download class="ml-2" size={16} />
				</button>
			</div>
		</div>
	);
};

export default Deck;
