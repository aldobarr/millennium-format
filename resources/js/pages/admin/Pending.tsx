import { Switch } from '@kobalte/core/switch';
import { Tooltip } from '@kobalte/core/tooltip';
import { createOptions, Select as SolidSelect } from '@thisbeyond/solid-select';
import { Check, Edit, Images, Search, Trash } from 'lucide-solid';
import { Component, createSignal, For, JSX, onMount, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ShowLoadingResource from '../../components/ui/ShowLoadingResource';
import Spinner from '../../components/ui/Spinner';
import Table from '../../components/ui/Table';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Card from '../../interfaces/admin/Card';
import Tag from '../../interfaces/admin/Tag';
import ApiResponse from '../../interfaces/api/ApiResponse';
import { formatDateFromUTC } from '../../util/DateTime';
import { getPageQuery } from '../../util/Helpers';
import request from '../../util/Requests';

const Pending: Component = () => {
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
		description: string;
		limit: number | '';
		legendary: boolean;
		errata: boolean;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ show: false, id: null, name: '', tags: [], description: '', limit: '', legendary: false, errata: false, processing: false, errors: {} });

	const defaultReplaceImageForm: () => {
		show: boolean;
		id: number | null;
		name: string;
		original: string;
		image: string;
		newImage?: File;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ show: false, id: null, name: '', original: '', image: '', processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean; errors: string[] } = () => ({ processing: false, errors: [] });

	const [imageRules, setImageRules] = createSignal<{ allowedExtensions: string[]; maxSize: number }>({ allowedExtensions: [], maxSize: 0 });
	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [replaceImageForm, setReplaceImageForm] = createStore(defaultReplaceImageForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());

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
				const response = await request('/admin/cards');
				updateCards(await response.json());
			} catch (error) {
				console.error('Error fetching cards:', error);
			}
		};

		const fetchTags = async () => {
			try {
				const response = await request('/admin/tags?all');
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

		const fetchRules = async () => {
			try {
				const response = await request('/admin/cards/rules');
				const rules = await response.json();
				if (!rules.success) {
					throw new Error(Array.isArray(rules.errors) ? rules.errors.join(', ') : (Object.values(rules.errors) as string[][]).flat().join(', '));
				}

				setImageRules({
					allowedExtensions: rules.data.allowed_extensions,
					maxSize: rules.data.max_size,
				});
			} catch (error) {
				console.error('Error fetching rules:', error);
			}
		};

		await Promise.all([fetchCards(), fetchTags(), fetchRules()]);
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
			const response = await request(`/admin/cards${query}`, {
				method: 'POST',
				body: JSON.stringify({
					link: newForm.link,
					tags: newForm.tags,
					limit: newForm.limit,
					legendary: newForm.legendary,
				}),
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
			description: card.description,
			legendary: card.legendary,
			errata: card.isErrata,
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
			const res = await request(`/admin/cards/${editForm.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					tags: editForm.tags,
					limit: editForm.limit,
					description: editForm.description,
					errata: editForm.errata,
					legendary: editForm.legendary,
				}),
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

	const replaceImage = (card: Card) => {
		setReplaceImageForm({
			...replaceImageForm,
			show: true,
			id: card.id,
			name: card.name,
			original: card.image,
			image: card.image,
			newImage: undefined,
			processing: false,
			errors: {},
		});
	};

	const replaceImageFile: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> = (e) => {
		const files = e.currentTarget.files;
		if (!files || files.length <= 0) {
			setReplaceImageForm({ ...replaceImageForm, image: replaceImageForm.original, newImage: undefined });
			return;
		}

		let allowed = false;
		const file = files[0];
		for (const ext of imageRules().allowedExtensions) {
			if (file.type === `image/${ext}`) {
				allowed = true;
				break;
			}
		}

		if (!allowed) {
			let allowedRules = '';
			for (let i = 0; i < imageRules().allowedExtensions.length - 1; i++) {
				allowedRules += imageRules().allowedExtensions[i] + ', ';
			}

			allowedRules += 'or ' + imageRules().allowedExtensions[imageRules().allowedExtensions.length - 1];
			setReplaceImageForm({ ...replaceImageForm, image: replaceImageForm.original, newImage: undefined, errors: { image: ['The image must be a ' + allowedRules + ' file.'] } });
			return;
		}

		if (file.size > imageRules().maxSize) {
			const mb = (imageRules().maxSize / 1048576).toFixed(2);
			setReplaceImageForm({ ...replaceImageForm, image: replaceImageForm.original, newImage: undefined, errors: { image: ['The image size must be less than ' + mb + 'MB.'] } });
			return;
		}

		setReplaceImageForm({ ...replaceImageForm, image: URL.createObjectURL(file), newImage: file, errors: {} });
	};

	const closeReplaceImage = () => {
		if (replaceImageForm.processing) {
			return;
		}

		setReplaceImageForm({ ...defaultReplaceImageForm() });
	};

	const submitReplaceImage = async () => {
		if (!replaceImageForm.show || replaceImageForm.processing || !replaceImageForm.newImage) {
			return false;
		}

		setReplaceImageForm({ ...replaceImageForm, processing: true, errors: {} });

		try {
			const form = new FormData();
			form.append('image', replaceImageForm.newImage);
			form.append('_method', 'PUT');

			const res = await request(`/admin/cards/${replaceImageForm.id}/image`, {
				method: 'POST',
				body: form,
			}, true);

			const response = await res.json();
			if (!response.success) {
				setReplaceImageForm({ ...replaceImageForm, processing: false, errors: response.errors });
				return;
			}

			const card: Card = response.data;
			card.image = URL.createObjectURL(replaceImageForm.newImage);
			setReplaceImageForm({ ...replaceImageForm, processing: false, errors: {} });
			setState('cards', 'data', (state.cards.data ?? []).findIndex((c: Card) => c.id === card.id), card);
			closeReplaceImage();
		} catch (error) {
			console.error('Error editing card:', error);
			setReplaceImageForm({ ...replaceImageForm, processing: false, errors: { name: ['An error occurred while editing the card.'] } });
		}
	};

	const restoreImage = async () => {
		if (!replaceImageForm.show || replaceImageForm.processing) {
			return false;
		}

		setReplaceImageForm({ ...replaceImageForm, processing: true, errors: {} });

		try {
			const res = await request(`/admin/cards/${replaceImageForm.id}/image`, {
				method: 'PATCH',
			});

			const response = await res.json();
			if (!response.success) {
				setReplaceImageForm({ ...replaceImageForm, processing: false, errors: response.errors });
				return;
			}

			const card: Card = response.data;
			card.image += '?' + new Date().getTime();
			setReplaceImageForm({ ...replaceImageForm, processing: false, errors: {} });
			setState('cards', 'data', (state.cards.data ?? []).findIndex((c: Card) => c.id === card.id), card);
			closeReplaceImage();
		} catch (error) {
			console.error('Error editing card:', error);
			setReplaceImageForm({ ...replaceImageForm, processing: false, errors: { name: ['An error occurred while editing the card.'] } });
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
			const response = await request(`/admin/cards/${state.delete}${query}`, { method: 'DELETE' });

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
			const response = await request('/admin/cards?' + new URLSearchParams({ search: state.searchTerm.trim() }));
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
						<Table.Column header>Name</Table.Column>
						<Table.Column header>Preview</Table.Column>
						<Table.Column header>Card Type</Table.Column>
						<Table.Column header>Tags</Table.Column>
						<Table.Column header>Limit</Table.Column>
						<Table.Column header>Legendary</Table.Column>
						<Table.Column header>Errata</Table.Column>
						<Table.Column header>Created At</Table.Column>
						<Table.Column header width="w-[120px]">Actions</Table.Column>
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
											<Table.Column>
												<Show when={card.isErrata}>
													<Check class="text-green-500" />
												</Show>
											</Table.Column>
											<Table.Column>{formatDateFromUTC(card.createdAt)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<Tooltip>
														<Tooltip.Trigger>
															<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => replaceImage(card)}>
																<Images />
															</button>
														</Tooltip.Trigger>
														<Tooltip.Content class="tooltip__content">
															<Tooltip.Arrow />
															<p>Replace Image</p>
														</Tooltip.Content>
													</Tooltip>
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
					<Show when={Array.isArray(newForm.errors)}>
						<ValidationErrors errors={() => newForm.errors as unknown as string[]} />
					</Show>
					<div class="flex flex-wrap">
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
										class="mt-1"
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
					<Show when={Array.isArray(editForm.errors)}>
						<ValidationErrors errors={() => editForm.errors as unknown as string[]} />
					</Show>
					<div class="flex flex-wrap">
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="tags" class="leading-7 text-sm text-gray-100" value="Tags" />
								<Show when={!loading()}>
									<SolidSelect
										multiple
										class="mt-1"
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
						<Show when={editForm.errata}>
							<div class="py-2 w-full">
								<div class="relative">
									<Label for="errata_description" class="leading-7 text-sm text-gray-100" value="Description" />
									<Input
										type="textarea"
										name="errata_description"
										class="mt-1 block w-full"
										value={editForm.description}
										handleChange={e => setEditForm('description', e.target.value)}
										errors={() => editForm.errors?.description}
										required
									/>
								</div>
							</div>
						</Show>
						<div class="py-2 w-full">
							<div class="flex justify-end">
								<Switch
									class="switch mr-2"
									checked={editForm.errata}
									onChange={checked => setEditForm('errata', checked)}
								>
									<Switch.Label class="switch__label">Is Errata</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
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
			<Modal open={replaceImageForm.show} onOpenChange={val => val ? setReplaceImageForm('show', true) : closeReplaceImage()} size="lg" static>
				<Modal.Header>
					Editing "
					{replaceImageForm.name}
					"
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(replaceImageForm.errors)}>
							<ValidationErrors errors={() => replaceImageForm.errors as unknown as string[]} />
						</Show>
						<div class="py-2 w-full flex flex-row">
							<div>
								<img src={replaceImageForm.image} alt={replaceImageForm.name} class="object-cover object-center h-40 shadow-md rounded-md" />
							</div>
							<div class="flex-grow self-center ml-4">
								<Input
									type="file"
									name="image"
									value=""
									accept="image/png, image/jpeg, image/jpg"
									class="mt-1 block w-full"
									handleChange={replaceImageFile}
									errors={() => replaceImageForm.errors?.image}
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer class="justify-between!">
					<Button type="button" onClick={restoreImage} theme="success" processing={() => replaceImageForm.processing}>Restore Original</Button>
					<div class="flex justify-end gap-2">
						<Button type="button" onClick={submitReplaceImage} processing={() => replaceImageForm.processing}>Submit</Button>
						<Button type="button" onClick={closeReplaceImage} theme="secondary" processing={() => replaceImageForm.processing} noSpinner>Cancel</Button>
					</div>
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

export default Pending;
