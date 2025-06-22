import { Component, createSignal, For, onMount, Show, useContext } from "solid-js";
import { createStore, reconcile, SetStoreFunction, unwrap } from "solid-js/store";
import { Delete, Edit, Search } from '@suid/icons-material';
import { createOptions, CreateSelectValue, Select as SolidSelect } from "@thisbeyond/solid-select";
import { formatDateFromUTC } from "../../util/DateTime";
import { Input, Select } from "../../components/ui/Input";
import { AppContext } from "../../App";
import Card from "../../interfaces/Admin/Card";
import Category from "../../interfaces/Admin/Category";
import Tag from "../../interfaces/Admin/Tag";
import Table from "../../components/ui/Table";
import Spinner from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Label from "../../components/ui/Label";
import ValidationErrors from "../../components/ui/ValidationErrors";
import Pagination from "../../components/ui/Pagination";
import ShowLoadingResource from "../../components/ui/ShowLoadingResource";

const Cards: Component = () => {
	const defaultState: () => {
		cards: any,
		categories: Category[],
		tags: Tag[],
		errors: string[],
		new: boolean,
		delete: number | null,
		showCardImage: boolean,
		cardImage: string | undefined
	} = () => ({ cards: {}, categories: [], tags: [], errors: [], new: false, delete: null, showCardImage: false, cardImage: undefined });

	const [state, setState] = createStore(defaultState());
	const [editTags, setEditTags] = createSignal<Tag[]>([]);

	const defaultNewForm: () => {
		link: string,
		category: number | "",
		tags: number[],
		limit: number | "",
		processing: boolean,
		errors: Record<string, string[]>
	} = () => ({ link: '', category: "", tags: [], limit: '', processing: false, errors: {} });

	const defaultEditForm: () => {
		show: boolean,
		id: number | null,
		name: string,
		category: number | "",
		tags: number[],
		limit: number | "",
		processing: boolean,
		errors: Record<string, string[]>
	} = () => ({ show: false, id: null, name: "", category: "", tags: [], limit: "", processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean, errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());
	const { appState } = useContext(AppContext);

	const updateCards = (newData: any) => {
		if (!newData.success) {
			setState('errors', newData.errors);
			return;
		}

		setState('cards', reconcile(newData));
	};

	onMount(async () => {
		const fetchCards = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${appState.auth.token}`
					}
				});

				updateCards(await response.json());
			} catch (error) {
				console.error('Error fetching cards:', error);
			}
		};

		const fetchCategories = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${appState.auth.token}`
					}
				});

				const categories = await response.json();
				if (categories.success) {
					setState('categories', reconcile(categories.data));
				} else {
					setState('errors', reconcile(categories.errors));
				}
			} catch (error) {
				console.error('Error fetching categories:', error);
			}
		};

		const fetchTags = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tags`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${appState.auth.token}`
					}
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

		await Promise.all([fetchCards(), fetchCategories(), fetchTags()]);
		setLoading(false);
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newCard = () => {
		setNewForm({ ...defaultNewForm()});

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
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`
				},
				body: JSON.stringify({ link: newForm.link, category: newForm.category, tags: newForm.tags, limit: newForm.limit })
			});

			const newCards = await response.json();
			if (!newCards.success) {
				setNewForm({ ...newForm, processing: false, errors: newCards.errors });
				return;
			}

			updateCards(newCards);
			setNewForm({ ...newForm, processing: false, errors: {}});
			closeNew();
		} catch (error) {
			console.error('Error submitting new card:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the card.'] }});
		}
	};

	const editCard = (card: Card) => {
		setEditTags(card.tags);
		setEditForm({
			...editForm,
			show: true,
			id: card.id,
			name: card.name,
			category: card.category.id,
			tags: card.tags.map((tag: Tag) => tag.id),
			limit: card.limit,
			processing: false,
			errors: {}
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
					'Authorization': `Bearer ${appState.auth.token}`
				},
				body: JSON.stringify({ category: editForm.category, tags: editForm.tags, limit: editForm.limit })
			});

			const response = await res.json();
			if (!response.success) {
				setEditForm({ ...editForm, processing: false, errors: response.errors });
				return;
			}

			const card: Card = response.data;
			setEditForm({ ...editForm, processing: false, errors: {}});
			setState("cards", "data", state.cards.data.findIndex((c: Card) => c.id === card.id), card);
			closeEdit();
		} catch (error) {
			console.error('Error editing card:', error);
			setEditForm({ ...editForm, processing: false, errors: { name: ['An error occurred while editing the card.'] }});
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
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cards/${state.delete}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`
				}
			});

			const newCards = await response.json();
			if (!newCards.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: (Object.values(newCards.errors || {}) as string[][]).flat() });
				return;
			}

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

	const setTagSelect = (setForm: SetStoreFunction<any>, value: CreateSelectValue) => {
		setForm('tags', value.map((tag: Tag) => tag.id));
	};

	const search = (e: any) => {
		e.preventDefault();
		console.log(e);
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
							handleChange={(e) => {}}
						>
							<span class="absolute inset-y-0 left-[21rem] flex items-center pl-2">
								<button type="submit" class="p-1 cursor-pointer focus:outline-none focus:shadow-outline">
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
						<Table.Column>Deck Type</Table.Column>
						<Table.Column>Category</Table.Column>
						<Table.Column>Tags</Table.Column>
						<Table.Column>Limit</Table.Column>
						<Table.Column>Created At</Table.Column>
						<Table.Column width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Cards" inTable />}>
							<Show when={state.cards.data?.length > 0} fallback={(
								<Table.Row>
									<Table.Column colSpan={8} align="center"><strong class="font-bold">No Cards Exist</strong></Table.Column>
								</Table.Row>
							)}>
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
											<Table.Column>{card.deck_type}</Table.Column>
											<Table.Column>{card.category.name}</Table.Column>
											<Table.Column>
												<Show when={card.tags.length > 0} fallback={<strong class="font-bold">NONE</strong>}>
													{card.tags.map((tag: Tag) => tag.name).join(', ')}
												</Show>
											</Table.Column>
											<Table.Column>{card.limit}</Table.Column>
											<Table.Column>{formatDateFromUTC(card.created_at)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => editCard(card)}>
														<Edit />
													</button>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => deleteCard(card.id)}>
														<Delete />
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
				<Show when={!loading() && state.cards.data?.length > 0} >
					<div class="mt-4">
						<Pagination data={state.cards} updateData={updateCards} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newCard} processing={loading} noSpinner class="float-right">Add New Card</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={(val) => val ? setState('new', true) : closeNew() } size="lg" static>
				<Modal.Header>
					New Card
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="card" class="leading-7 text-sm text-gray-100" value="Card Link" />
								<Input
									type="url"
									name="card"
									class="mt-1 block w-full"
									value={newForm.link}
									handleChange={(e) => setNewForm('link', e.target.value)}
									errors={() => newForm.errors?.name}
									required
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="category" class="leading-7 text-sm text-gray-100" value="Category" />
								<Select
									name="category"
									value={newForm.category}
									class="mt-1 block w-full"
									handleChange={(e) => setNewForm('category', e.target.value)}
									errors={() => newForm.errors?.category}
									required
								>
									<option value=""></option>
									<For each={state.categories}>
										{(category: Category) => (
											<option value={category.id}>{category.name}</option>
										)}
									</For>
								</Select>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="tags" class="leading-7 text-sm text-gray-100" value="Tags" />
								<Show when={!loading()}>
									<SolidSelect
										multiple
										name="tags"
										onChange={(value) => setTagSelect(setNewForm, value)}
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
									handleChange={(e) => setNewForm('limit', e.target.value)}
									errors={() => newForm.errors?.limit}
									required
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={submitNew} processing={() => newForm.processing}>Submit</Button>
					<Button type="button" onClick={() => closeNew()} theme="secondary" class="ml-2" processing={() => newForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={editForm.show} onOpenChange={(val) => val ? setEditForm('show', true) : closeEdit() } size="lg" static>
				<Modal.Header>
					Editing "{editForm.name}"
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="category" class="leading-7 text-sm text-gray-100" value="Category" />
								<Select
									name="category"
									value={editForm.category}
									class="mt-1 block w-full"
									handleChange={(e) => setEditForm('category', e.target.value)}
									errors={() => editForm.errors?.category}
									required
								>
									<option value=""></option>
									<For each={state.categories}>
										{(category: Category) => (
											<option value={category.id}>{category.name}</option>
										)}
									</For>
								</Select>
							</div>
						</div>
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
											setTagSelect(setEditForm, value);
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
									handleChange={(e) => setEditForm('limit', e.target.value)}
									errors={() => editForm.errors?.limit}
									required
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={submitEdit} processing={() => editForm.processing}>Submit</Button>
					<Button type="button" onClick={closeEdit} theme="secondary" class="ml-2" processing={() => editForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={state.delete != null} onOpenChange={(val) => !deleteForm.processing && setState('delete', val ? state.delete : null)} size="lg" static>
				<Modal.Header>
					Delete Card
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p><strong class="font-bold">Warning:</strong> This will permanently delete this card. This action is irreversible.</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteCardConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={state.showCardImage} onOpenChange={(val) => setState('showCardImage', val)} raw>
				<Modal.Body>
					<img src={state.cardImage} alt="Card Preview" />
				</Modal.Body>
			</Modal>
		</section>
	);
}

export default Cards;