import { Save } from 'lucide-solid';
import { Accessor, Component, createSignal, Setter } from 'solid-js';
import { produce, SetStoreFunction } from 'solid-js/store';
import ApiResponse from '../../interfaces/api/ApiResponse';
import Deck from '../../interfaces/Deck';
import request from '../../util/Requests';
import { Input } from '../ui/Input';

interface DeckProps {
	id: number;
	name: string;
	class?: string;
	setEditing: Setter<boolean>;
	setErrors: (errors: string[]) => void;
	working: Accessor<boolean>;
	setWorking: Setter<boolean>;
	setDecks: SetStoreFunction<ApiResponse<Deck[]>>;
}

const Editing: Component<DeckProps> = (props) => {
	const [newDeckName, setNewDeckName] = createSignal(props.name);
	const editName = async (e: Event) => {
		e.preventDefault();

		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const res = await request(`/decks/${props.id}`, {
				method: 'PUT',
				body: JSON.stringify({ name: newDeckName() }),
			});

			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors as string[]);
				return;
			}

			props.setEditing(false);
			props.setDecks(produce((decks) => {
				const index = (decks.data ?? []).findIndex((deck: Deck) => deck.id === props.id);
				if (index !== -1) {
					decks.data![index] = { ...decks.data![index], name: newDeckName() };
				}
			}));
		} catch (error) {
			console.error(error);
		} finally {
			props.setWorking(false);
		}
	};

	return (
		<h2 class="title-font sm:text-2xl text-xl font-medium text-white mb-3">
			<form onSubmit={editName} class="flex flex-row justify-center">
				<Input
					type="text"
					name="name"
					value={newDeckName()}
					handleChange={e => setNewDeckName(e.currentTarget.value)}
					class="w-full"
					placeholder="Deck Name"
					darkBg
				/>
				<button type="submit" class="cursor-pointer text-gray-200 hover:text-white ml-2">
					<Save />
				</button>
			</form>
		</h2>
	);
};

export default Editing;
