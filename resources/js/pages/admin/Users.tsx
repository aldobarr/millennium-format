import { Switch } from '@kobalte/core/switch';
import { Edit, OctagonMinus, ShieldUser, Trash } from 'lucide-solid';
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
import User from '../../interfaces/admin/User';
import ApiResponse from '../../interfaces/api/ApiResponse';
import { formatDateFromUTC } from '../../util/DateTime';
import { getPageQuery } from '../../util/Helpers';
import request from '../../util/Requests';

const Users: Component = () => {
	const defaultState: () => {
		users: ApiResponse<User[]>;
		errors: string[];
		new: boolean;
		delete: number | null;
	} = () => ({ users: { success: true }, errors: [], new: false, delete: null });

	const [state, setState] = createStore(defaultState());

	const defaultNewForm: () => {
		name: string;
		email: string;
		password: string;
		password_confirmation: string;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ name: '', email: '', password: '', password_confirmation: '', processing: false, errors: {} });

	const defaultEditForm: () => {
		show: boolean;
		id: number | null;
		name: string;
		email: string;
		changePassword: boolean;
		password: string;
		password_confirmation: string;
		processing: boolean;
		errors: Record<string, string[]>;
	} = () => ({ show: false, id: null, name: '', email: '', changePassword: false, password: '', password_confirmation: '', processing: false, errors: {} });

	const defaultDeleteForm: () => { processing: boolean; errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [newForm, setNewForm] = createStore(defaultNewForm());
	const [editForm, setEditForm] = createStore(defaultEditForm());
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());

	const updateUsers = (newData: ApiResponse<User[]>) => {
		if (!newData.success) {
			setState('errors', newData.errors as string[]);
			return;
		}

		setState('users', reconcile(newData));
	};

	onMount(async () => {
		try {
			const response = await request('/admin/users');
			updateUsers(await response.json());
			setLoading(false);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	});

	const processing = () => {
		return newForm.processing || editForm.processing || deleteForm.processing;
	};

	const newUser = () => {
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
			const query = getPageQuery(state.users);
			const response = await request(`/admin/users${query}`, {
				method: 'POST',
				body: JSON.stringify({
					name: newForm.name,
					email: newForm.email,
					password: newForm.password,
					password_confirmation: newForm.password_confirmation,
				}),
			});

			const newUsers = await response.json();
			if (!newUsers.success) {
				setNewForm({ ...newForm, processing: false, errors: newUsers.errors });
				return;
			}

			updateUsers(newUsers);
			setNewForm({ ...newForm, processing: false, errors: {} });
			closeNew();
		} catch (error) {
			console.error('Error submitting new user:', error);
			setNewForm({ ...newForm, processing: false, errors: { name: ['An error occurred while creating the user.'] } });
		}
	};

	const editUser = (user: User) => {
		setEditForm({ ...editForm, show: true, id: user.id, name: user.name, email: user.email });
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
			const body: Record<string, string> = {
				name: editForm.name,
				email: editForm.email,
			};

			if (editForm.changePassword) {
				body.password = editForm.password;
				body.password_confirmation = editForm.password_confirmation;
			}

			const res = await request(`/admin/users/${editForm.id}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			});

			const response = await res.json();
			if (!response.success) {
				setEditForm({ ...editForm, processing: false, errors: response.errors });
				return;
			}

			const user: User = response.data;
			setEditForm({ ...editForm, processing: false, errors: {} });
			setState('users', 'data', (state.users.data ?? []).findIndex((u: User) => u.id === user.id), user);
			closeEdit();
		} catch (error) {
			console.error('Error editing user:', error);
			setEditForm({ ...editForm, processing: false, errors: { name: ['An error occurred while editing the user.'] } });
		}
	};

	const deleteUser = (user_id: number) => {
		setDeleteForm('errors', []);
		setState({ ...state, delete: user_id });
	};

	const deleteUserConfirm = async () => {
		if (!state.delete || deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...deleteForm, processing: true, errors: [] });

		try {
			const query = getPageQuery(state.users);
			const response = await request(`/admin/users/${state.delete}${query}`, { method: 'DELETE' });
			const newUsers = await response.json();
			if (!newUsers.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: (Object.values(newUsers.errors || {}) as string[][]).flat() });
				return;
			}

			setDeleteForm({ ...deleteForm, processing: false, errors: [] });
			updateUsers(newUsers);
			closeDelete();
		} catch (error) {
			console.error('Error editing user:', error);
			setDeleteForm({ ...deleteForm, processing: false, errors: ['An error occurred while deleting the user.'] });
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
				<h1>Users</h1>
				<Show when={state.errors?.length > 0}>
					<div class="mt-4">
						<ValidationErrors errors={() => state.errors} />
					</div>
				</Show>
				<Table class="mt-4">
					<Table.Head>
						<Table.Column>Name</Table.Column>
						<Table.Column>Email</Table.Column>
						<Table.Column>Num Decks</Table.Column>
						<Table.Column>Created Date</Table.Column>
						<Table.Column width="w-[120px]">Actions</Table.Column>
					</Table.Head>
					<Table.Body>
						<Show when={!loading()} fallback={<ShowLoadingResource resource="Users" inTable />}>
							<Show
								when={(state.users.data?.length ?? 0) > 0}
								fallback={(
									<Table.Row>
										<Table.Column colSpan={4} align="center"><strong class="font-bold">No Users Exist... Wait what?</strong></Table.Column>
									</Table.Row>
								)}
							>
								<For each={state.users.data}>
									{(user: User) => (
										<Table.Row>
											<Table.Column>
												<div class="flex flex-row items-center">
													<Show when={user.is_admin}>
														<ShieldUser class="mr-1" size={20} />
													</Show>
													{user.name}
												</div>
											</Table.Column>
											<Table.Column>{user.email}</Table.Column>
											<Table.Column>{user.decks_count}</Table.Column>
											<Table.Column>{formatDateFromUTC(user.created_at)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!user.is_admin} fallback={<OctagonMinus />}>
													<Show when={!processing()} fallback={<Spinner />}>
														<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => editUser(user)}>
															<Edit />
														</button>
														<button type="button" class="cursor-pointer text-gray-300 hover:text-white" onClick={() => deleteUser(user.id)}>
															<Trash />
														</button>
													</Show>
												</Show>
											</Table.Column>
										</Table.Row>
									)}
								</For>
							</Show>
						</Show>
					</Table.Body>
				</Table>
				<Show when={!loading() && (state.users.data?.length ?? 0) > 0}>
					<div class="mt-4">
						<Pagination data={state.users} updateData={updateUsers} />
					</div>
				</Show>

				<div class="mt-4">
					<Button type="button" onClick={newUser} class="float-right">Create User</Button>
				</div>
			</div>
			<Modal open={state.new} onOpenChange={val => val ? setState('new', true) : closeNew()} size="lg" static>
				<Modal.Header>
					New User
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(newForm.errors)}>
							<ValidationErrors errors={() => newForm.errors as unknown as string[]} />
						</Show>
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
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="email" class="leading-7 text-sm text-gray-100" value="Email" />
								<Input
									type="email"
									name="email"
									class="mt-1 block w-full"
									value={newForm.email}
									handleChange={e => setNewForm('email', e.target.value)}
									errors={() => newForm.errors?.email}
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="password" class="leading-7 text-sm text-gray-100" value="Password" />
								<Input
									type="password"
									name="password"
									class="mt-1 block w-full"
									value={newForm.password}
									handleChange={e => setNewForm('password', e.target.value)}
									errors={() => newForm.errors?.password}
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="password_confirmation" class="leading-7 text-sm text-gray-100" value="Confirm Password" />
								<Input
									type="password"
									name="password_confirmation"
									class="mt-1 block w-full"
									value={newForm.password_confirmation}
									handleChange={e => setNewForm('password_confirmation', e.target.value)}
									errors={() => newForm.errors?.password_confirmation}
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
			<Modal open={editForm.show} onOpenChange={val => val ? setEditForm('show', true) : closeEdit()} size="lg" static>
				<Modal.Header>
					Edit User
				</Modal.Header>
				<Modal.Body>
					<div class="flex flex-wrap">
						<Show when={Array.isArray(editForm.errors)}>
							<ValidationErrors errors={() => editForm.errors as unknown as string[]} />
						</Show>
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
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="email" class="leading-7 text-sm text-gray-100" value="Email" />
								<Input
									type="email"
									name="email"
									class="mt-1 block w-full"
									value={editForm.email}
									handleChange={e => setEditForm('email', e.target.value)}
									errors={() => editForm.errors?.email}
								/>
							</div>
						</div>
						<Show when={editForm.changePassword}>
							<div class="py-2 w-full">
								<div class="relative">
									<Label for="password" class="leading-7 text-sm text-gray-100" value="Password" />
									<Input
										type="password"
										name="password"
										class="mt-1 block w-full"
										value={editForm.password}
										handleChange={e => setEditForm('password', e.target.value)}
										errors={() => editForm.errors?.password}
									/>
								</div>
							</div>
							<div class="py-2 w-full">
								<div class="relative">
									<Label for="password_confirmation" class="leading-7 text-sm text-gray-100" value="Confirm Password" />
									<Input
										type="password"
										name="password_confirmation"
										class="mt-1 block w-full"
										value={editForm.password_confirmation}
										handleChange={e => setEditForm('password_confirmation', e.target.value)}
										errors={() => editForm.errors?.password_confirmation}
									/>
								</div>
							</div>
						</Show>
						<div class="py-2 w-full">
							<div class="flex justify-end">
								<Switch
									class="switch"
									checked={editForm.changePassword}
									onChange={checked => setEditForm('changePassword', checked)}
								>
									<Switch.Label class="switch__label">Change Password</Switch.Label>
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
					Delete User
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p>
						<strong class="font-bold">Warning:</strong>
						{' '}
						This will permanently delete this user. This action is irreversible.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deleteUserConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
};

export default Users;
