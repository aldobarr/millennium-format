import { DropdownMenu } from '@kobalte/core/dropdown-menu';
import { Link } from '@kobalte/core/link';
import { writeClipboard } from '@solid-primitives/clipboard';
import { CopyPlus, Download, MoveRight, SquareArrowOutUpRight } from 'lucide-solid';
import { Accessor, Component, createSignal, Setter } from 'solid-js';
import { produce, SetStoreFunction } from 'solid-js/store';
import DeckType from '../../interfaces/Deck';
import request from '../../util/Requests';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Name from './Name';

interface DeckProps {
	id: number;
	name: string;
	image: string;
	notes?: string | null;
	valid: boolean;
	class?: string;
	setErrors: (errors: string[]) => void;
	working: Accessor<boolean>;
	setWorking: Setter<boolean>;
	setSuccessMessage: (msg: string) => void;
	setDecks: SetStoreFunction<DeckType[]>;
}

const Deck: Component<DeckProps> = (props) => {
	const [confirmModal, setConfirmModal] = createSignal(false);
	const [exportDeckOpen, setExportDeckOpen] = createSignal(false);

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

	const exportDeckYP = async () => {
		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const res = await request(`/decks/${props.id}/export`);
			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors as string[]);
				props.setWorking(false);
				return;
			}

			writeClipboard(response.data);
			props.setSuccessMessage('Your deck has been exported to your clipboard.');
		} catch (error) {
			props.setWorking(false);
			console.error(error);
		}
	};

	const confirmDeleteDeck = () => {
		if (props.working()) {
			return;
		}

		setConfirmModal(true);
	};

	const deleteDeck = async () => {
		if (props.working()) {
			return;
		}

		props.setWorking(true);

		try {
			const res = await request(`/decks/${props.id}`, { method: 'DELETE' });
			const response = await res.json();
			if (!response.success) {
				props.setErrors(response.errors);
				return;
			}

			props.setDecks(produce((decks) => {
				const index = decks.findIndex((deck: DeckType) => deck.id === props.id);
				if (index !== -1) {
					decks.splice(index, 1);
				}
			}));
		} catch (error) {
			console.error(error);
		} finally {
			setConfirmModal(false);
			props.setWorking(false);
		}
	};

	return (
		<div
			class={`${props.class} max-w-sm p-4 bg-gray-900 border ${props.valid ? 'border-green-500' : 'border-red-500'} rounded-md shadow-sm relative`}
		>
			<Name
				id={props.id}
				name={props.name}
				notes={props.notes}
				setErrors={props.setErrors}
				working={props.working}
				setWorking={props.setWorking}
				setDecks={props.setDecks}
			/>
			<div class="deck-delete" onClick={confirmDeleteDeck}></div>
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
					href={`/decks/${props.id}/builder`}
					disabled={props.working()}
					class={`
						my-1 md:my-0 md:mx-1 inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg
						${props.working() ? 'cursor-not-allowed opacity-50 hover:bg-blue-700' : 'hover:bg-blue-800'}
					`}
				>
					Edit Deck
					<MoveRight class="ml-2" size={16} />
				</Link>
				<DropdownMenu open={exportDeckOpen()} onOpenChange={setExportDeckOpen}>
					<DropdownMenu.Trigger disabled={props.working()} class="dropdown-menu__trigger">
						<span>Export Deck</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content class="dropdown-menu__content">
							<DropdownMenu.Item disabled={props.working()} onClick={exportDeck} class="dropdown-menu__item">
								Deck Builder Format
								<div class="dropdown-menu__item-right-slot">
									<Download class="ml-2" size={16} />
								</div>
							</DropdownMenu.Item>
							<DropdownMenu.Item disabled={props.working()} onClick={exportDeckYP} class="dropdown-menu__item">
								YGOPro Format
								<div class="dropdown-menu__item-right-slot">
									<SquareArrowOutUpRight class="ml-2" size={16} />
								</div>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu>
			</div>
			<Modal
				open={confirmModal()}
				onOpenChange={setConfirmModal}
				size="lg"
			>
				<Modal.Header>
					<h2 class="text-2xl font-bold">
						Confirm Delete -
						{' '}
						{props.name}
					</h2>
				</Modal.Header>
				<Modal.Body>
					<div>Are you sure you want to delete this deck? This action is permanent and irreversible!</div>
					<div class="mt-2 flex justify-end">
						<Button type="button" onClick={deleteDeck} theme="danger" noSpinner>Yes</Button>
						<Button type="button" onClick={() => setConfirmModal(false)} theme="secondary" class="ml-2" noSpinner>Cancel</Button>
					</div>
				</Modal.Body>
			</Modal>
		</div>
	);
};

export default Deck;
