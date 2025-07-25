import { Edit, Trash } from 'lucide-solid';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
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
import Tag from '../../interfaces/admin/Tag';
import ApiResponse from '../../interfaces/api/ApiResponse';
import { formatDateFromUTC } from '../../util/DateTime';
import { getPageQuery } from '../../util/Helpers';
import request from '../../util/Requests';

const Tags: Component = () => {
	const defaultState: () => {
		tags: ApiResponse<Tag[]>;
		errors: string[];
		new: boolean;
		delete: number | null;
	} = () => ({ tags: { success: true }, errors: [], new: false, delete: null });

	const [state, setState] = createStore(defaultState());

	const defaultNewForm: () => {
		name: string;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ name: '', processing: false, errors: {} });

	const defaultEditForm: () => {
		show: boolean;
		id: number | null;
		name: string;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ show: false, id: null, name: '', processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean; errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());

	const updateTags = (newData: ApiResponse<Tag[]>) => {
		if (!newData.success) {
			setState('errors', newData.errors as string[]);
			return;
		}

		setState('tags', reconcile(newData));
	};

	onMount(async () => {
		try {
			const response = await request('/admin/tags');
			updateTags(await response.json());
			setLoading(false);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newTag = () => {
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
			const query = getPageQuery(state.tags);
			const response = await request(`/admin/tags${query}`, {
				method: 'POST',
				body: JSON.stringify({ name: newForm.name }),
			});

			const newTags = await response.json();
			if (!newTags.success) {
				setNewForm({ ...newForm, processing: false, errors: newTags.errors });
				return;
			}

			updateTags(newTags);
			setNewForm({ ...newForm, processing: false, errors: {} });
			closeNew();
		} catch (error) {
			console.error('Error submitting new tag:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the tag.'] } });
		}
	};

	const editTag = (tag: Tag) => {
		setEditForm({ ...editForm, show: true, id: tag.id, name: tag.name });
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
			const res = await request(`/admin/tags/${editForm.id}`, {
				method: 'PUT',
				body: JSON.stringify({ name: editForm.name }),
			});

			const response = await res.json();
			if (!response.success) {
				setEditForm({ ...editForm, processing: false, errors: response.errors });
				return;
			}

			const tag: Tag = response.data;
			setEditForm({ ...editForm, processing: false, errors: {} });
			setState('tags', 'data', (state.tags.data ?? []).findIndex((t: Tag) => t.id === tag.id), tag);
			closeEdit();
		} catch (error) {
			console.error('Error editing tag:', error);
			setEditForm({ ...editForm, processing: false, errors: { name: ['An error occurred while editing the tag.'] } });
		}
	};

	const deleteTag = (tag_id: number) => {
		setDeleteForm('errors', []);
		setState({ ...state, delete: tag_id });
	};

	const deleteTagConfirm = async () => {
		if (!state.delete || deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...deleteForm, processing: true, errors: [] });

		try {
			const query = getPageQuery(state.tags);
			const response = await request(`/admin/tags/${state.delete}${query}`, { method: 'DELETE' });
			const newTags = await response.json();
			if (!newTags.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: (Object.values(newTags.errors || {}) as string[][]).flat() });
				return;
			}

			setDeleteForm({ ...deleteForm, processing: false, errors: [] });
			updateTags(newTags);
			closeDelete();
		} catch (error) {
			console.error('Error editing tag:', error);
			setDeleteForm({ ...deleteForm, processing: false, errors: ['An error occurred while deleting the tag.'] });
		}
	};

	const closeDelete = () => {
		if (deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...defaultDeleteForm() });
		setState({ ...state, delete: null });
	};

	return (
		<section class="text-gray-200 body-font">
			<div>
				<h1>Tags</h1>
				<Show when={state.errors?.length > 0}>
					<div class="mt-4">
						<ValidationErrors errors={() => state.errors} />
					</div>
				</Show>
				<Table class="mt-4">
					<Table.Head>
						<Table.Column header>Name</Table.Column>
						<Table.Column header>Num Cards</Table.Column>
						<Table.Column header>Created Date</Table.Column>
						<Table.Column header width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Tags" inTable />}>
							<Show
								when={(state.tags.data?.length ?? 0) > 0}
								fallback={(
									<Table.Row>
										<Table.Column colSpan={4} align="center"><strong class="font-bold">No Tags Exist</strong></Table.Column>
									</Table.Row>
								)}
							>
								<For each={state.tags.data}>
									{(tag: Tag) => (
										<Table.Row>
											<Table.Column>{tag.name}</Table.Column>
											<Table.Column>{tag.cardsCount}</Table.Column>
											<Table.Column>{formatDateFromUTC(tag.createdAt)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => editTag(tag)}>
														<Edit />
													</button>
													<button type="button" class="cursor-pointer text-gray-300 hover:text-white" onClick={() => deleteTag(tag.id)}>
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
				<Show when={!loading() && (state.tags.data?.length ?? 0) > 0}>
					<div class="mt-4">
						<Pagination data={state.tags} updateData={updateTags} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newTag} class="float-right">Add New Tag</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={val => val ? setState('new', true) : closeNew()} static>
				<Modal.Header>
					New Tag
				</Modal.Header>
				<Modal.Body>
					<Show when={Array.isArray(newForm.errors)}>
						<ValidationErrors errors={() => newForm.errors as unknown as string[]} />
					</Show>
					<div class="flex flex-wrap">
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="name" class="leading-7 text-sm text-gray-100" value="Name" />
								<Input
									type="text"
									name="name"
									class="mt-1 block w-full"
									value={newForm.name}
									handleChange={e => setNewForm('name', e.target.value)}
									errors={() => newForm.errors?.name}
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
			<Modal open={editForm.show} onOpenChange={val => val ? setEditForm('show', true) : closeEdit()} static>
				<Modal.Header>
					Edit Tag
				</Modal.Header>
				<Modal.Body>
					<Show when={Array.isArray(editForm.errors)}>
						<ValidationErrors errors={() => editForm.errors as unknown as string[]} />
					</Show>
					<div class="flex flex-wrap">
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="name" class="leading-7 text-sm text-gray-100" value="Name" />
								<Input
									type="text"
									name="name"
									class="mt-1 block w-full"
									value={editForm.name}
									handleChange={e => setEditForm('name', e.target.value)}
									errors={() => editForm.errors?.name}
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
			<Modal open={state.delete != null} onOpenChange={val => !deleteForm.processing && setState('delete', val ? state.delete : null)} size="lg" static>
				<Modal.Header>
					Delete Tag
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p>
						<strong class="font-bold">Warning:</strong>
						{' '}
						This will permanently delete this tag. This action is irreversible.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteTagConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
};

export default Tags;
