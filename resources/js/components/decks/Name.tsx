import { NotebookPen, Pencil } from 'lucide-solid';
import { Accessor, Component, createSignal, Setter, Show } from 'solid-js';
import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import ApiResponse from '../../interfaces/api/ApiResponse';
import { default as Deck, default as DeckType } from '../../interfaces/Deck';
import request from '../../util/Requests';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Label from '../ui/Label';
import Modal from '../ui/Modal';
import ValidationErrors from '../ui/ValidationErrors';
import Editing from './Editing';

interface DeckProps {
	id: number;
	name: string;
	notes?: string | null;
	class?: string;
	setErrors: (errors: string[]) => void;
	working: Accessor<boolean>;
	setWorking: Setter<boolean>;
	setDecks: SetStoreFunction<ApiResponse<DeckType[]>>;
}

const Name: Component<DeckProps> = (props) => {
	const defaultNotesForm: () => {
		id: number | null;
		value: string;
		editingNotes: boolean;
		errors: Record<string, string[]> | string[];
	} = () => ({ id: null, value: props.notes ?? '', editingNotes: false, errors: {} });

	const [editing, setEditing] = createSignal(false);
	const [notes, setNotes] = createStore(defaultNotesForm());

	const closeEditNotes = () => {
		setNotes('editingNotes', false);
		setNotes('value', props.notes ?? '');
	};

	const submitEditNotes = async () => {
		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const notesVal = notes.value.trim();
			const body = notesVal === '' ? { delete_notes: true } : { notes: notesVal };
			const res = await request(`/decks/${props.id}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			});

			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors);
				return;
			}

			closeEditNotes();
			props.setDecks(produce((decks) => {
				const index = (decks.data ?? []).findIndex((deck: Deck) => deck.id === props.id);
				if (index !== -1) {
					decks.data![index] = { ...decks.data![index], notes: notesVal };
				}
			}));
		} catch (error) {
			console.error(error);
		} finally {
			props.setWorking(false);
		}
	};

	return (
		<Show when={!editing()} fallback={<Editing setEditing={setEditing} {...props} />}>
			<h5 class="title-font flex flex-row justify-center mb-2 text-2xl font-bold tracking-tight">
				<div>{props.name}</div>
				<button type="button" class="cursor-pointer text-gray-300 hover:text-white ml-2" onClick={() => setEditing(true)}>
					<Pencil />
				</button>
				<button type="button" class="cursor-pointer text-gray-300 hover:text-white ml-2" onClick={() => setNotes('editingNotes', true)}>
					<NotebookPen />
				</button>
			</h5>
			<Modal open={notes.editingNotes} onOpenChange={val => val ? setNotes('editingNotes', true) : closeEditNotes()} size="lg" static>
				<Modal.Header>
					Editing Notes -
					{' '}
					{props.name}
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(notes.errors)}>
							<ValidationErrors errors={() => notes.errors as unknown as string[]} />
						</Show>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="notes" class="leading-7 text-sm text-gray-100" value="Deck Notes" />
								<Input
									type="textarea"
									name="notes"
									class="mt-1 block w-full"
									value={notes.value}
									handleChange={e => setNotes('value', e.target.value)}
									errors={() => !Array.isArray(notes.errors) ? notes.errors?.notes : []}
									required
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={submitEditNotes} processing={() => props.working()}>Submit</Button>
					<Button type="button" onClick={closeEditNotes} theme="secondary" class="ml-2" processing={() => props.working()} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</Show>
	);
};

export default Name;
