import { useNavigate } from '@solidjs/router';
import { Check, Edit, Trash, X } from 'lucide-solid';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ShowLoadingResource from '../../components/ui/ShowLoadingResource';
import Spinner from '../../components/ui/Spinner';
import Table from '../../components/ui/Table';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Page from '../../interfaces/Page';
import ApiResponse from '../../interfaces/api/ApiResponse';
import { formatDateFromUTC } from '../../util/DateTime';
import { getPageQuery } from '../../util/Helpers';
import request from '../../util/Requests';

const Pages: Component = () => {
	const navigate = useNavigate();
	const defaultDeleteForm: () => { processing: boolean; errors: string[] } = () => ({ processing: false, errors: [] });

	const [loading, setLoading] = createSignal(true);
	const [pages, setPages] = createStore<ApiResponse<Page[]>>({ success: false });
	const [deleting, setDeleting] = createSignal<number | null>(null);
	const [deleteForm, setDeleteForm] = createStore(defaultDeleteForm());

	const updatePages = (newData: ApiResponse<Page[]>) => {
		if (!newData.success) {
			setPages('errors', newData.errors as string[]);
			return;
		}

		setPages(reconcile(newData));
	};

	const getPages = async () => {
		try {
			const res = await request('/admin/pages');
			const response = await res.json();
			if (!response.success) {
				throw new Error((response.errors as string[]).join(', '));
			}

			setPages(response);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching decks:', error);
		}
	};

	const deletePage = (id: number) => {
		setDeleteForm('errors', []);
		setDeleting(id);
	};

	const deletePageConfirm = async () => {
		if (!deleting() || deleteForm.processing) {
			return;
		}

		setDeleteForm({ ...deleteForm, processing: true, errors: [] });

		try {
			const query = getPageQuery(pages);
			const res = await request(`/admin/pages/${deleting()}${query}`, { method: 'DELETE' });
			const response = await res.json();
			if (!response.success) {
				setDeleteForm({ ...deleteForm, processing: false, errors: response.errors });
				return;
			}

			setDeleteForm({ ...deleteForm, processing: false, errors: [] });
			updatePages(response);
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
		setDeleting(null);
	};

	onMount(getPages);

	return (
		<section class="text-gray-200 body-font">
			<h1>Public Pages</h1>
			<Table class="mt-4">
				<Table.Head>
					<Table.Column header>Name</Table.Column>
					<Table.Column header>Standard Page</Table.Column>
					<Table.Column header>Visible</Table.Column>
					<Table.Column header>Last Updated Date</Table.Column>
					<Table.Column header>Created Date</Table.Column>
					<Table.Column header width="w-[120px]">Actions</Table.Column>
				</Table.Head>
				<Table.Body>
					<Show when={!loading()} fallback={<ShowLoadingResource resource="Pages" inTable />}>
						<Show
							when={(pages.data?.length ?? 0) > 0}
							fallback={(
								<Table.Row>
									<Table.Column colSpan={4} align="center"><strong class="font-bold">No Tags Exist</strong></Table.Column>
								</Table.Row>
							)}
						>
							<For each={pages.data}>
								{(page: Page) => (
									<>
										<Table.Row>
											<Table.Column>{page.name}</Table.Column>
											<Table.Column>
												<Show when={!page.isPlaceholder} fallback={<X class="text-red-500" />}>
													<Check class="text-green-500" />
												</Show>
											</Table.Column>
											<Table.Column>
												<Show when={page.isVisible} fallback={<X class="text-red-500" />}>
													<Check class="text-green-500" />
												</Show>
											</Table.Column>
											<Table.Column>{formatDateFromUTC(page.updatedAt)}</Table.Column>
											<Table.Column>{formatDateFromUTC(page.createdAt)}</Table.Column>
											<Table.Column width="w-[120px]">
												<Show when={!deleteForm.processing} fallback={<Spinner />}>
													<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => navigate(`/admin/pages/${page.id}`)}>
														<Edit />
													</button>
													<Show
														when={!page.isHome}
														fallback={(
															<button type="button" class="cursor-pointer text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
																<Trash />
															</button>
														)}
													>
														<button type="button" class="cursor-pointer text-gray-300 hover:text-white" onClick={() => deletePage(page.id)}>
															<Trash />
														</button>
													</Show>
												</Show>
											</Table.Column>
										</Table.Row>
										<Show when={page.children && page.children.length > 0}>
											<Table.Row>
												<Table.Column colSpan={6}>
													<Table>
														<Table.Head>
															<Table.Column header colSpan={6}><strong>Children:</strong></Table.Column>
														</Table.Head>
														<Table.Body>
															<For each={page.children}>
																{(child: Page) => (
																	<Table.Row>
																		<Table.Column>{child.name}</Table.Column>
																		<Table.Column>
																			<Show when={!child.isPlaceholder} fallback={<X class="text-red-500" />}>
																				<Check class="text-green-500" />
																			</Show>
																		</Table.Column>
																		<Table.Column>
																			<Show when={child.isVisible} fallback={<X class="text-red-500" />}>
																				<Check class="text-green-500" />
																			</Show>
																		</Table.Column>
																		<Table.Column>{formatDateFromUTC(child.updatedAt)}</Table.Column>
																		<Table.Column>{formatDateFromUTC(child.createdAt)}</Table.Column>
																		<Table.Column width="w-[120px]">
																			<Show when={!deleteForm.processing} fallback={<Spinner />}>
																				<button type="button" class="cursor-pointer text-gray-300 hover:text-white mr-2" onClick={() => navigate(`/admin/pages/${child.id}`)}>
																					<Edit />
																				</button>
																				<button type="button" class="cursor-pointer text-gray-300 hover:text-white" onClick={() => deletePage(child.id)}>
																					<Trash />
																				</button>
																			</Show>
																		</Table.Column>
																	</Table.Row>
																)}
															</For>
														</Table.Body>
													</Table>
												</Table.Column>
											</Table.Row>
										</Show>
									</>
								)}
							</For>
						</Show>
					</Show>
				</Table.Body>
			</Table>
			<Show when={!loading() && (pages.data?.length ?? 0) > 0}>
				<div class="mt-4">
					<Pagination data={pages} updateData={updatePages} />
				</div>
			</Show>
			<div class="mt-4">
				<Button type="button" onClick={() => navigate('/admin/pages/new')} class="float-right">Add New Page</Button>
			</div>
			<Modal open={deleting() != null} onOpenChange={val => !deleteForm.processing && setDeleting(val ? deleting() : null)} size="lg" static>
				<Modal.Header>
					Delete Page
				</Modal.Header>
				<Modal.Body>
					<ValidationErrors errors={() => deleteForm.errors} />
					<p>
						<strong class="font-bold">Warning:</strong>
						{' '}
						This will permanently delete this page. This action is irreversible.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button type="button" onClick={deletePageConfirm} theme="danger" processing={() => deleteForm.processing}>Delete</Button>
					<Button type="button" onClick={closeDelete} theme="secondary" class="ml-2" processing={() => deleteForm.processing} noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
};

export default Pages;
