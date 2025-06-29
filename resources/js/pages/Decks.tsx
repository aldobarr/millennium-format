import { Component, createSignal, For, onCleanup, onMount, Show, useContext } from 'solid-js';
import { Separator } from '@kobalte/core/separator';
import { Skeleton } from '@kobalte/core/skeleton';
import { Tooltip } from '@kobalte/core/tooltip';
import { MainContentClassContext } from '../layouts/AppLayout';
import { AppContext } from '../App';
import Deck from '../interfaces/Deck';
import DeckComponent from '../components/decks/Deck';
import CategoryType from '../enums/CategoryType';

const Decks: Component = () => {
	const [loading, setLoading] = createSignal(true);
	const [decks, setDecks] = createSignal<Deck[]>([]);
	const { setMainContentClass } = useContext(MainContentClassContext);
	const { appState } = useContext(AppContext);

	const getDeckImage = (deck: Deck) => deck.categories.find(cat => cat.type === CategoryType.DECK_MASTER)?.cards[0].image ?? '';

	onMount(async () => {
		setMainContentClass('mb-auto');
		if (!appState.auth.token) {
			console.error('Unauthenticated!');
			return;
		}

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/decks`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

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

	onCleanup(() => setMainContentClass(''));

	return (
		<section class="text-gray-400 body-font text-center">
			<div class="mx-6 md:mx-12 md:my-6 px-6 py-8">
				<h1 class="text-3xl font-bold mb-4 text-start">
					<div class="mb-2">My Decks</div>
					<Separator />
				</h1>
				<Skeleton class="flex flex-wrap gap-4 skeleton" radius={10} height={400} visible={loading()}>
					<For each={decks()}>
						{deck => (
							<Show
								when={!!deck.notes}
								fallback={(
									<DeckComponent
										id={deck.id}
										name={deck.name}
										image={getDeckImage(deck)}
									/>
								)}
							>
								<Tooltip>
									<Tooltip.Trigger>
										<DeckComponent
											id={deck.id}
											name={deck.name}
											image={getDeckImage(deck)}
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
