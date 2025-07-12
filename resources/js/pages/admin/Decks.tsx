import { Alert } from '@kobalte/core/alert';
import { Skeleton } from '@kobalte/core/skeleton';
import { Tooltip } from '@kobalte/core/tooltip';
import { Search } from 'lucide-solid';
import { Component, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import DeckComponent from '../../components/decks/Deck';
import { Input } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import ValidationErrors from '../../components/ui/ValidationErrors';
import ApiResponse from '../../interfaces/api/ApiResponse';
import Deck from '../../interfaces/Deck';
import { getDeckImage } from '../../util/Helpers';
import request from '../../util/Requests';

const Decks: Component = () => {
	const [loading, setLoading] = createSignal(true);
	const [successMsgTimeoutId, setSuccessMsgTimeoutId] = createSignal<number | undefined>(undefined);
	const [successMessage, setSuccessMessage] = createSignal('');
	const [errorTimeoutId, setErrorTimeoutId] = createSignal<number | undefined>(undefined);
	const [errors, setErrors] = createSignal<string[]>([]);
	const [decks, setDecks] = createStore<ApiResponse<Deck[]>>({ success: false });
	const [searchTerm, setSearchTerm] = createSignal('');

	const setTimedSuccessMessage = (msg: string) => {
		setSuccessMessage(msg);
		clearTimeout(successMsgTimeoutId());

		setSuccessMsgTimeoutId(setTimeout(() => {
			setSuccessMessage('');
			setSuccessMsgTimeoutId(undefined);
		}, 3000));
	};

	const setTimedErrors = (errors: string[]) => {
		setErrors(errors);
		clearTimeout(errorTimeoutId());

		setErrorTimeoutId(setTimeout(() => {
			setErrors([]);
			setErrorTimeoutId(undefined);
		}, 3000));
	};

	const clearErrors = () => {
		clearTimeout(errorTimeoutId());
		setErrorTimeoutId(undefined);
		setErrors([]);
	};

	onCleanup(() => {
		clearTimeout(successMsgTimeoutId());
		clearTimeout(errorTimeoutId());
	});

	const updateDecks = (newData: ApiResponse<Deck[]>) => {
		if (!newData.success) {
			setDecks('errors', newData.errors as string[]);
			return;
		}

		setDecks(reconcile(newData));
	};

	const getCards = async (search: string = '') => {
		try {
			let endpoint = '/admin/decks';
			if (search.trim().length > 0) {
				endpoint += '?search=' + encodeURIComponent(search.trim());
			}

			const res = await request(endpoint);
			const response = await res.json();
			if (!response.success) {
				throw new Error((response.errors as string[]).join(', '));
			}

			setDecks(response);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching decks:', error);
		}
	};

	onMount(getCards);

	return (
		<section class="text-gray-200 body-font">
			<div>
				<div class="flex justify-between">
					<h1>Player Decks</h1>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							getCards(searchTerm());
						}}
						class="relative text-gray-600 focus-within:text-gray-400"
					>
						<Input
							name="search"
							placeholder="Search"
							class="w-96"
							value={searchTerm()}
							handleChange={e => setSearchTerm(e.target.value)}
						>
							<span class="absolute inset-y-0 left-[21rem] flex items-center pl-2">
								<button type="submit" class="p-1 cursor-pointer hover:text-gray-400">
									<Search />
								</button>
							</span>
						</Input>
					</form>
				</div>
				<ValidationErrors class="text-left mt-4" errors={errors} close={clearErrors} />
				<Show when={successMessage().length > 0}>
					<Alert class="alert alert-success my-4 text-start">
						<div>{successMessage()}</div>
					</Alert>
				</Show>
				<Show
					when={!loading()}
					fallback={(
						<Skeleton class="skeleton mt-4" radius={10} height={400} visible={loading()}>
							<div></div>
						</Skeleton>
					)}
				>
					<div class="flex flex-wrap gap-4 mt-4">
						<For each={decks.data}>
							{deck => (
								<Show
									when={!!deck.notes}
									fallback={(
										<DeckComponent
											id={deck.id}
											name={deck.name}
											user={deck.user}
											image={getDeckImage(deck)}
											notes={deck.notes}
											valid={deck.isValid}
											adminView={true}
											setErrors={setTimedErrors}
											working={() => false}
											setWorking={() => {}}
											setSuccessMessage={setTimedSuccessMessage}
											setDecks={() => {}}
										/>
									)}
								>
									<Tooltip>
										<Tooltip.Trigger>
											<DeckComponent
												id={deck.id}
												name={deck.name}
												user={deck.user}
												image={getDeckImage(deck)}
												notes={deck.notes}
												valid={deck.isValid}
												adminView={true}
												setErrors={setTimedErrors}
												working={() => false}
												setWorking={() => {}}
												setSuccessMessage={setTimedSuccessMessage}
												setDecks={() => {}}
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
					</div>
					<div class="mt-4">
						<Pagination data={decks} updateData={updateDecks} />
					</div>
				</Show>
			</div>
		</section>
	);
};

export default Decks;
