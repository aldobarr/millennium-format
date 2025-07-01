import { Component, createSignal, For, onMount, Show, useContext } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { Check, Edit, Search, Trash } from 'lucide-solid';
import { createOptions, Select as SolidSelect } from '@thisbeyond/solid-select';
import { Switch } from '@kobalte/core/switch';
import { formatDateFromUTC } from '../../util/DateTime';
import { Input } from '../../components/ui/Input';
import { AppContext } from '../../App';
import { getPageQuery } from '../../util/Helpers';
import Card from '../../interfaces/admin/Card';
import Tag from '../../interfaces/admin/Tag';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Label from '../../components/ui/Label';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Pagination from '../../components/ui/Pagination';
import ShowLoadingResource from '../../components/ui/ShowLoadingResource';
import ApiResponse from '../../interfaces/api/ApiResponse';

const Cards: Component = () => {
	const defaultState: () => {
		cards: ApiResponse<Card[]>;
		tags: Tag[];
		errors: string[];
		new: boolean;
		delete: number | null;
		showCardImage: boolean;
		cardImage: string | undefined;
		searchTerm: string;
	} = () => ({ cards: { success: true }, tags: [], errors: [], new: false, delete: null, showCardImage: false, cardImage: undefined, searchTerm: '' });

	const [state, setState] = createStore(defaultState());
	const [editTags, setEditTags] = createSignal<Tag[]>([]);

	const defaultNewForm: () => {
		link: string;
		tags: number[];
		limit: number | '';
		legendary: boolean;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ link: '', tags: [], limit: '', legendary: false, processing: false, errors: {} });

	const defaultEditForm: () => {
		show: boolean;
		id: number | null;
		name: string;
		tags: number[];
		limit: number | '';
		legendary: boolean;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ show: false, id: null, name: '', tags: [], limit: '', legendary: false, processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean; errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());
	const { appState } = useContext(AppContext);

	const updateCards = (newData: ApiResponse<Card[]>) => {
		if (!newData.success) {
			setState('errors', newData.errors as string[]);
			return;
		}

		setState('searchTerm', '');
		setState('cards', reconcile(newData));
	};

	onMount(async () => {
		const fetchCards = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${appState.auth.token}`,
					},
				});

				updateCards(await response.json());
			} catch (error) {
				console.error('Error fetching cards:', error);
			}
		};

		const fetchTags = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tags?all`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${appState.auth.token}`,
					},
				});

				const tags = await response.json();
				if (tags.success) {
					setState('tags', reconcile(tags.data));
				} else {
					setState('errors', reconcile(tags.errors));
				}
			} catch (error) {
				console.error('Error fetching tags:', error);
			}
		};

		await Promise.all([fetchCards(), fetchTags()]);
		setLoading(false);
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newCard = () => {
		setNewForm({ ...defaultNewForm() });

		setState('new', true);
	};

	const closeNew = () => {
		if (newForm.processing) {
			return;
		}

		setState('new', false);
	};

	const submitNew = async () => {
		if (!state.new || newForm.processing) {
			return false;
		}

		setNewForm({ ...newForm, processing: true, errors: {} });

		try {
			const query = getPageQuery(state.cards);
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards${query}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
				body: JSON.stringify({ link: newForm.link, tags: newForm.tags, limit: newForm.limit, legendary: newForm.legendary }),
			});

			const newCards = await response.json();
			if (!newCards.success) {
				setNewForm({ ...newForm, processing: false, errors: newCards.errors });
				return;
			}

			updateCards(newCards);
			setNewForm({ ...newForm, processing: false, errors: {} });
			closeNew();
		} catch (error) {
			console.error('Error submitting new card:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the card.'] } });
		}
	};

	const editCard = (card: Card) => {
		setEditTags(card.tags);
		setEditForm({
			...editForm,
			show: true,
			id: card.id,
			name: card.name,
			tags: card.tags.map((tag: Tag) => tag.id),
			limit: card.limit,
			legendary: card.legendary,
			processing: false,
			errors: {},
		});
	};

	const closeEdit = () => {
		if (editForm.processing) {
			return;
		}

		setEditForm({ ...defaultEditForm() });
	};

	const submitEdit = async () => {
		if (!editForm.show || editForm.processing) {
			return false;
		}

		setEditForm({ ...editForm, processing: true, errors: {} });

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards/${editForm.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
				body: JSON.stringify({ tags: editForm.tags, limit: editForm.limit, legendary: editForm.legendary }),
			});

			const response = await res.json();
			if (!response.success) {
				setEditForm({ ...editForm, processing: false, errors: response.errors });
				return;
			}

			const card: Card = response.data;
			setEditForm({ ...editForm, processing: false, errors: {} });
			setState('cards', 'data', (state.cards.data ?? []).findIndex((c: Card) => c.id === card.id), card);
			closeEdit();
		} catch (error) {
			console.error('Error editing card:', error);
			setEditForm({ ...editForm, processing: false, errors: { name: ['An error occurred while editing the card.'] } });
		}
	};

	const deleteCard = (card_id: number) => {
		setDeleteForm('errors', []);
		setState({ ...state, delete: card_id });
	};

	const deleteCardConfirm = async () => {
		if (!state.delete || deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...deleteForm, processing: true, errors: [] });

		try {
			const query = getPageQuery(state.cards);
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards/${state.delete}${query}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

			const newCards = await response.json();
			if (!newCards.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: (Object.values(newCards.errors || {}) as string[][]).flat() });
				return;
			}

			setDeleteForm({ ...deleteForm, processing: false, errors: [] });
			updateCards(newCards);
			closeDelete();
		} catch (error) {
			console.error('Error editing card:', error);
			setDeleteForm({ ...deleteForm, processing: false, errors: ['An error occurred while deleting the card.'] });
		}
	};

	const closeDelete = () => {
		if (deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...defaultDeleteForm() });
		setState({ ...state, delete: null });
	};

	const search = async (e: SubmitEvent) => {
		e.preventDefault();
		setLoading(true);
		setState('errors', []);

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards?` + new URLSearchParams({
				search: state.searchTerm.trim(),
			}), {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

			updateCards(await response.json());
			setLoading(false);
		} catch (error) {
			console.error('Error fetching cards:', error);
		}
	};

	return (
		<section class="text-gray-200 body-font">
			<div>
				<div class="flex justify-between">
					<h1>Format Cards</h1>
					<form onSubmit={search} class="relative text-gray-600 focus-within:text-gray-400">
						<Input
							name="search"
							placeholder="Search"
							class="w-96"
							value=""
							handleChange={e => setState('searchTerm', e.target.value)}
						>
							<span class="absolute inset-y-0 left-[21rem] flex items-center pl-2">
								<button type="submit" class="p-1 cursor-pointer hover:text-gray-400">
									<Search />
								</button>
							</span>
						</Input>
					</form>
				</div>
				<Show when={state.errors?.length > 0}>
					<div class="mt-4">
						<ValidationErrors errors={() => state.errors} />
					</div>
				</Show>
				<Table class="mt-4">
					<Table.Head>
						<Table.Column>Name</Table.Column>
						<Table.Column>Preview</Table.Column>
						<Table.Column>Card Type</Table.Column>
						<Table.Column>Tags</Table.Column>
						<Table.Column>Limit</Table.Column>
						<Table.Column>Legendary</Table.Column>
						<Table.Column>Created At</Table.Column>
						<Table.Column width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Cards" inTable />}>
							<Show
								when={(state.cards.data?.length ?? 0) > 0}
								fallback={(
									<Table.Row>
										<Table.Column colSpan={8} align="center"><strong class="font-bold">No Cards Exist</strong></Table.Column>
									</Table.Row>
								)}
							>
								<For each={state.cards.data}>
									{(card: Card) => (
										<Table.Row>
											<Table.Column>
												<div class="hover:underline cursor-pointer">
													<p
														data-place="top"
														data-class="max-w-md whitespace-normal break-words"
														data-tip={card.description}
														data-type="dark"
													>
														{card.name}
													</p>
												</div>
											</Table.Column>
											<Table.Column>
												<img
													class="object-cover object-center h-24 cursor-pointer shadow-md rounded"
													src={card.image}
													alt={card.name}
													onClick={() => setState({ ...state, showCardImage: true, cardImage: card.image })}
												/>
											</Table.Column>
											<Table.Column>{card.type}</Table.Column>
											<Table.Column>
												<Show when={card.tags.length > 0} fallback={<strong class="font-bold">NONE</strong>}>
													{card.tags.map((tag: Tag) => tag.name).join(', ')}
												</Show>
											</Table.Column>
											<Table.Column>{card.limit}</Table.Column>
											<Table.Column>
												<Show when={card.legendary}>
													<Check class="text-green-500" />
												</Show>
											</Table.Column>
											<Table.Column>{formatDateFromUTC(card.created_at)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => editCard(card)}>
														<Edit />
													</button>
													<button type="button" class="cursor-pointer text-gray-300 hover:text-white" onClick={() => deleteCard(card.id)}>
														<Trash />
													</button>
												</Show>
											</Table.Column>
										</Table.Row>
									)}
								</For>
							</Show>
						</Show>
					</Table.Body>
				</Table>
				<Show when={!loading() && (state.cards.data?.length ?? 0) > 0}>
					<div class="mt-4">
						<Pagination data={state.cards} updateData={updateCards} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newCard} processing={loading} noSpinner class="float-right">Add New Card</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={val => val ? setState('new', true) : closeNew()} size="lg" static>
				<Modal.Header>
					New Card
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(newForm.errors)}>
							<ValidationErrors errors={() => newForm.errors as unknown as string[]} />
						</Show>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="card" class="leading-7 text-sm text-gray-100" value="Card Link" />
								<Input
									type="url"
									name="link"
									class="mt-1 block w-full"
									value={newForm.link}
									handleChange={e => setNewForm('link', e.target.value)}
									errors={() => newForm.errors?.link}
									required
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="tags" class="leading-7 text-sm text-gray-100" value="Tags" />
								<Show when={!loading()}>
									<SolidSelect
										multiple
										name="tags"
										onChange={value => setNewForm('tags', value.map((tag: Tag) => tag.id))}
										{...createOptions(state.tags.filter((tag: Tag) => !newForm.tags.includes(tag.id)), { filterable: true, key: 'name' })}
									/>
								</Show>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="limit" class="leading-7 text-sm text-gray-100" value="Card Limit" />
								<Input
									type="number"
									name="limit"
									class="mt-1 block w-full"
									value={newForm.limit}
									handleChange={e => setNewForm('limit', parseInt(e.target.value))}
									errors={() => newForm.errors?.limit}
									required
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="flex justify-end">
								<Switch
									class="switch"
									checked={newForm.legendary}
									onChange={checked => setNewForm('legendary', checked)}
								>
									<Switch.Label class="switch__label">Legendary Card</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={submitNew} processing={() => newForm.processing}>Submit</Button>
					<Button type="button" onClick={() => closeNew()} theme="secondary" class="ml-2" processing={() => newForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={editForm.show} onOpenChange={val => val ? setEditForm('show', true) : closeEdit()} size="lg" static>
				<Modal.Header>
					Editing "
					{editForm.name}
					"
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(editForm.errors)}>
							<ValidationErrors errors={() => editForm.errors as unknown as string[]} />
						</Show>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="tags" class="leading-7 text-sm text-gray-100" value="Tags" />
								<Show when={!loading()}>
									<SolidSelect
										multiple
										name="tags"
										initialValue={editTags()}
										onChange={(value) => {
											setEditTags(value);
											setEditForm('tags', value.map((tag: Tag) => tag.id));
										}}
										{...createOptions(state.tags.filter((tag: Tag) => !editForm.tags.includes(tag.id)), { filterable: true, key: 'name' })}
									/>
								</Show>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="limit" class="leading-7 text-sm text-gray-100" value="Card Limit" />
								<Input
									type="number"
									name="limit"
									class="mt-1 block w-full"
									value={editForm.limit}
									handleChange={e => setEditForm('limit', parseInt(e.target.value))}
									errors={() => editForm.errors?.limit}
									required
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="flex justify-end">
								<Switch
									class="switch"
									checked={editForm.legendary}
									onChange={checked => setEditForm('legendary', checked)}
								>
									<Switch.Label class="switch__label">Legendary Card</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={submitEdit} processing={() => editForm.processing}>Submit</Button>
					<Button type="button" onClick={closeEdit} theme="secondary" class="ml-2" processing={() => editForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={state.delete != null} onOpenChange={val => !deleteForm.processing && setState('delete', val ? state.delete : null)} size="lg" static>
				<Modal.Header>
					Delete Card
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p>
						<strong class="font-bold">Warning:</strong>
						{' '}
						This will permanently delete this card. This action is irreversible.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteCardConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={state.showCardImage} onOpenChange={val => setState('showCardImage', val)} raw>
				<img src={state.cardImage} alt="Card Preview" />
			</Modal>
		</section>
	);
};

export default Cards;
