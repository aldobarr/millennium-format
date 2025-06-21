import { Component, createSignal, For, onMount, Show, useContext } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Delete, Edit } from '@suid/icons-material';
import { formatDateFromUTC } from "../../util/DateTime";
import { Input } from "../../components/ui/Input";
import { AppContext } from "../../App";
import Tag from "../../interfaces/Admin/Tag";
import Table from "../../components/ui/Table";
import Spinner from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Label from "../../components/ui/Label";
import ValidationErrors from "../../components/ui/ValidationErrors";
import Pagination from "../../components/ui/Pagination";
import ShowLoadingResource from "../../components/ui/ShowLoadingResource";

const Tags: Component = () => {
	const defaultState: () => {
		tags: any,
		errors: string[],
		new: boolean,
		delete: number | null
	} = () => ({ tags: {}, errors: [], new: false, delete: null });

	const [state, setState] = createStore(defaultState());

	const defaultNewForm: () => {
		name: string,
		processing: boolean,
		errors: Record<string, string[]>
	} = () => ({ name: '', processing: false, errors: {} });

	const defaultEditForm: () => {
		show: boolean,
		id: number | null,
		name: string,
		processing: boolean,
		errors: Record<string, string[]>
	} = () => ({ show: false, id: null, name: '', processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean, errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());
	const { appState } = useContext(AppContext);

	const updateTags = (newData: any) => {
		if (!newData.success) {
			setState('errors', newData.errors);
			return;
		}

		setState('tags', reconcile(newData));
	};

	onMount(async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tags`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`
				}
			});

			const data = await response.json();
			updateTags(data);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newTag = () => {
		setNewForm({ ...defaultNewForm()});

		setState('new', true);
	};

	const closeNew = () => {
		if (newForm.processing) {
			return;
		}

		setState('new', false);
	};

	const submitNew = async (e: any) => {
		e.preventDefault();
		if (!state.new || newForm.processing) {
			return false;
		}

		setNewForm({ ...newForm, processing: false, errors: {}});

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tags`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`
				},
				body: JSON.stringify({ name: newForm.name })
			});

			const newTags = await response.json();
			if (!newTags.success) {
				setNewForm({ ...newForm, processing: false, errors: newTags.errors });
				return;
			}

			updateTags(newTags);
			setNewForm({ ...newForm, processing: false, errors: {}});
			closeNew();
		} catch (error) {
			console.error('Error submitting new tag:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the tag.'] }});
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

	const submitEdit = (e: any) => {
		e.preventDefault();
		if (!editForm.show || editForm.processing) {
			return false;
		}

		/*editForm.clearErrors();
		editForm.put(route('admin.tags.edit', editForm.data.id), {
			preserveState: true,
			preserveScroll: true,
			onSuccess: page => {
				editForm.setData('show', false);
				setState({ ...state, tags: page.props.tags });
			}
		});*/
	};

	const deleteTag = (tag_id: number) => {
		setDeleteForm('errors', []);
		setState({ ...state, delete: tag_id });
	};

	const deleteTagConfirm = () => {
		if (!state.delete || deleteForm.processing) {
			return;
		}

		setDeleteForm('errors', []);
		/*deleteForm.delete(route('admin.tags.delete', state.delete), {
			preserveState: true,
			preserveScroll: true,
			onSuccess: page => setState({ ...state, tags: page.props.tags, delete: null })
		});*/
	};

	const closeDelete = () => {
		if (deleteForm.processing) {
			return;
		}

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
						<Table.Column>Name</Table.Column>
						<Table.Column>Num Cards</Table.Column>
						<Table.Column>Created Date</Table.Column>
						<Table.Column width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Tags" inTable />}>
							<Show when={state.tags.data?.length > 0} fallback={(
								<Table.Row>
									<Table.Column colSpan={4} align="center"><strong>No Tags Exist</strong></Table.Column>
								</Table.Row>
							)}>
								<For each={state.tags.data}>
									{(tag: Tag) => (
										<Table.Row>
											<Table.Column>{tag.name}</Table.Column>
											<Table.Column>{tag.cards_count}</Table.Column>
											<Table.Column>{formatDateFromUTC(tag.created_at)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!processing()} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => editTag(tag)}>
														<Edit />
													</button>
													<button type="button" class="cursor-pointer hover:text-white hover:bg-gray-200/20 hover:rounded" onClick={() => deleteTag(tag.id)}>
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
				<Show when={!loading() && state.tags.data?.length > 0} >
					<div class="mt-4">
						<Pagination data={state.tags} updateData={updateTags} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newTag} class="float-right">Add New Tag</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={(val) => val ? setState('new', true) : closeNew() } static>
				<Modal.Header>
					New Tag
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
									handleChange={(e) => setNewForm('name', e.target.value)}
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
			<Modal open={editForm.show} onOpenChange={(val) => val ? setEditForm('show', true) : closeEdit() } static>
				<Modal.Header>
					Edit Tag
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
									handleChange={(e) => setEditForm('name', e.target.value)}
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
			<Modal open={state.delete != null} onOpenChange={(val) => !deleteForm.processing && setState('delete', val ? state.delete : null)} size="xl" static>
				<Modal.Header>
					Delete Tag
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p><strong>Warning:</strong> This will permanently delete this tag. This action is irreversible.</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteTagConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
}

export default Tags;