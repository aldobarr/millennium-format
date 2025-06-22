import { Component, createSignal, For, onMount, Show, useContext } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { Delete, Edit } from '@suid/icons-material';
import { formatDateFromUTC } from '../../util/DateTime';
import { Input } from '../../components/ui/Input';
import { AppContext } from '../../App';
import Category from '../../interfaces/admin/Category';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Label from '../../components/ui/Label';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Pagination from '../../components/ui/Pagination';
import ShowLoadingResource from '../../components/ui/ShowLoadingResource';
import ApiResponse from '../../interfaces/api/ApiResponse';

const Categories: Component = () => {
	const defaultState: () => {
		categories: ApiResponse<Category[]>;
		errors: string[];
		new: boolean;
		delete: number | null;
	} = () => ({ categories: { success: true }, errors: [], new: false, delete: null });

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
	const { appState } = useContext(AppContext);

	const updateCategories = (newData: ApiResponse<Category[]>) => {
		if (!newData.success) {
			setState('errors', newData.errors as string[]);
			return;
		}

		setState('categories', reconcile(newData));
	};

	onMount(async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

			updateCategories(await response.json());
			setLoading(false);
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newCategory = () => {
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
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
				body: JSON.stringify({ name: newForm.name }),
			});

			const newCategories = await response.json();
			if (!newCategories.success) {
				setNewForm({ ...newForm, processing: false, errors: newCategories.errors });
				return;
			}

			updateCategories(newCategories);
			setNewForm({ ...newForm, processing: false, errors: {} });
			closeNew();
		} catch (error) {
			console.error('Error submitting new category:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the category.'] } });
		}
	};

	const editCategory = (category: Category) => {
		setEditForm({ ...editForm, show: true, id: category.id, name: category.name });
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
			const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories/${editForm.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
				body: JSON.stringify({ name: editForm.name }),
			});

			const response = await res.json();
			if (!response.success) {
				setEditForm({ ...editForm, processing: false, errors: response.errors });
				return;
			}

			const category: Category = response.data;
			setEditForm({ ...editForm, processing: false, errors: {} });
			setState('categories', 'data', (state.categories.data ?? []).findIndex((c: Category) => c.id === category.id), category);
			closeEdit();
		} catch (error) {
			console.error('Error editing category:', error);
			setEditForm({ ...editForm, processing: false, errors: { name: ['An error occurred while editing the category.'] } });
		}
	};

	const deleteCategory = (category_id: number) => {
		setDeleteForm('errors', []);
		setState({ ...state, delete: category_id });
	};

	const deleteCategoryConfirm = async () => {
		if (!state.delete || deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...deleteForm, processing: true, errors: [] });

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories/${state.delete}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

			const newCategories = await response.json();
			if (!newCategories.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: (Object.values(newCategories.errors || {}) as string[][]).flat() });
				return;
			}

			updateCategories(newCategories);
			closeDelete();
		} catch (error) {
			console.error('Error editing category:', error);
			setDeleteForm({ ...deleteForm, processing: false, errors: ['An error occurred while deleting the category.'] });
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
				<h1>Categories</h1>
				<Show when={state.errors?.length > 0}>
					<div class="mt-4">
						<ValidationErrors errors={() => state.errors} />
					</div>
				</Show>
				<Table class="mt-4">
					<Table.Head>
						<Table.Column>Name</Table.Column>
						<Table.Column>Num Cards</Table.Column>
						<Table.Column>Created Date</Table.Column>
						<Table.Column width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Categories" inTable />}>
							<Show
								when={(state.categories.data?.length ?? 0) > 0}
								fallback={(
									<Table.Row>
										<Table.Column colSpan={4} align="center"><strong class="font-bold">No Categories Exist</strong></Table.Column>
									</Table.Row>
								)}
							>
								<For each={state.categories.data}>
									{(category: Category) => (
										<Table.Row>
											<Table.Column>{category.name}</Table.Column>
											<Table.Column>{category.cards_count}</Table.Column>
											<Table.Column>{formatDateFromUTC(category.created_at)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => editCategory(category)}>
														<Edit />
													</button>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => deleteCategory(category.id)}>
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
				<Show when={!loading() && (state.categories.data?.length ?? 0) > 0}>
					<div class="mt-4">
						<Pagination data={state.categories} updateData={updateCategories} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newCategory} class="float-right">Add New Category</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={val => val ? setState('new', true) : closeNew()} static>
				<Modal.Header>
					New Category
				</Modal.Header>
				<Modal.Body>
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
					Edit Category
				</Modal.Header>
				<Modal.Body>
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
					Delete Category
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p>
						<strong class="font-bold">Warning:</strong>
						{' '}
						This will permanently delete this category. This action is irreversible.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteCategoryConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
};

export default Categories;
