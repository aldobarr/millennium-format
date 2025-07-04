import { Separator } from '@kobalte/core/separator';
import { Skeleton } from '@kobalte/core/skeleton';
import { Tooltip } from '@kobalte/core/tooltip';
import { FileUp } from 'lucide-solid';
import { Component, createSignal, For, onCleanup, onMount, Show, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { AppContext } from '../App';
import DeckComponent from '../components/decks/Deck';
import ValidationErrors from '../components/ui/ValidationErrors';
import CategoryType from '../enums/CategoryType';
import Deck from '../interfaces/Deck';
import { MainContentClassContext } from '../layouts/AppLayout';
import request from '../util/Requests';

const Decks: Component = () => {
	const [working, setWorking] = createSignal(false);
	const [errorTimeoutId, setErrorTimeoutId] = createSignal<number | undefined>(undefined);
	const [errors, setErrors] = createSignal<string[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [decks, setDecks] = createStore<Deck[]>([]);
	const { setMainContentClass } = useContext(MainContentClassContext);
	const { appState } = useContext(AppContext);

	const getDeckImage = (deck: Deck) => deck.categories.find(cat => cat.type === CategoryType.DECK_MASTER)?.cards[0].image ?? '';

	const setTimedErrors = (errors: string[]) => {
		setErrors(errors);
		clearTimeout(errorTimeoutId());

		setErrorTimeoutId(setTimeout(() => {
			setErrors([]);
			setErrorTimeoutId(undefined);
		}, 3000));
	};

	onMount(async () => {
		setMainContentClass('mb-auto');
		if (!appState.auth.token) {
			console.error('Unauthenticated!');
			return;
		}

		try {
			const res = await request('/decks');
			const response = await res.json();
			if (!response.success) {
				throw new Error((response.errors as string[]).join(', '));
			}

			setDecks(response.data);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching decks:', error);
		}
	});

	const importDeck = () => {
		if (working()) {
			return;
		}

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.deck';
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file) {
				return;
			}

			setWorking(true);
			try {
				const reader = new FileReader();
				reader.onload = async () => {
					const content = reader.result as string;
					if (!content) {
						setTimedErrors(['Failed to read deck file.']);
						return;
					}

					let decodedContent;

					try {
						decodedContent = JSON.parse(atob(content));
						if (!decodedContent || (typeof decodedContent !== 'object') || !('name' in decodedContent) || !('categories' in decodedContent)) {
							throw new Error();
						}
					} catch {
						setTimedErrors(['Invalid deck file format.']);
						return;
					}

					if ('notes' in decodedContent && !decodedContent.notes) {
						delete decodedContent.notes;
					}

					const res = await request('/decks/import', {
						method: 'POST',
						body: JSON.stringify(decodedContent),
					});

					const response = await res.json();
					if (!response.success) {
						setErrors(!Array.isArray(response.errors) ? (Object.values(response.errors) as string[][]).flat() : response.errors);
						return;
					}

					setDecks(response.data);
				};

				reader.readAsText(file);
			} catch (error) {
				console.error('Error importing deck:', error);
				setTimedErrors(['Failed to import deck.']);
			} finally {
				setWorking(false);
			}
		};

		input.click();
	};

	const clearErrors = () => {
		clearTimeout(errorTimeoutId());
		setErrorTimeoutId(undefined);
		setErrors([]);
	};

	onCleanup(() => setMainContentClass(''));

	return (
		<section class="text-gray-400 body-font text-center">
			<div class="mx-6 md:mx-12 md:my-6 px-6 py-8">
				<h1 class="text-3xl font-bold mb-4 text-start">
					<div class="flex flex-row justify-between">
						<div class="mb-2">My Decks</div>
						<button
							type="button"
							disabled={working()}
							class="cursor-pointer self-center inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-700"
							onClick={importDeck}
						>
							Import Deck
							<FileUp class="ml-2" size={16} />
						</button>
					</div>
					<Separator />
				</h1>
				<ValidationErrors class="text-left" errors={errors} close={clearErrors} />
				<Skeleton class="flex flex-wrap gap-4 skeleton" radius={10} height={400} visible={loading()}>
					<For each={decks}>
						{deck => (
							<Show
								when={!!deck.notes}
								fallback={(
									<DeckComponent
										id={deck.id}
										name={deck.name}
										image={getDeckImage(deck)}
										notes={deck.notes}
										valid={deck.isValid}
										setErrors={setTimedErrors}
										working={working}
										setWorking={setWorking}
										setDecks={setDecks}
									/>
								)}
							>
								<Tooltip>
									<Tooltip.Trigger>
										<DeckComponent
											id={deck.id}
											name={deck.name}
											image={getDeckImage(deck)}
											notes={deck.notes}
											valid={deck.isValid}
											setErrors={setTimedErrors}
											working={working}
											setWorking={setWorking}
											setDecks={setDecks}
										/>
									</Tooltip.Trigger>
									<Tooltip.Content class="tooltip__content">
										<Tooltip.Arrow />
										<p>{deck.notes}</p>
									</Tooltip.Content>
								</Tooltip>
							</Show>
						)}
					</For>
				</Skeleton>
			</div>
		</section>
	);
};

export default Decks;
