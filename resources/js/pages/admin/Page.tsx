import { Alert } from '@kobalte/core/alert';
import { Collapsible } from '@kobalte/core/collapsible';
import { Switch } from '@kobalte/core/switch';
import { Tabs } from '@kobalte/core/tabs';
import { useNavigate, useParams } from '@solidjs/router';
import { ChevronDown } from 'lucide-solid';
import { Component, createSignal, For, onMount, Show, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';
import RichTextEditor from '../../components/RichTextEditor';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import Modal from '../../components/ui/Modal';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Page from '../../interfaces/Page';
import { setTimedMessage } from '../../util/Helpers';
import request from '../../util/Requests';

interface TabEdit {
	id: number | null;
	name: string;
	content: string | null;
}

interface PageEdit {
	id: number | null;
	name: string;
	slug: string;
	parent: number | null;
	after: number;
	header: string | null;
	footer: string | null;
	isHome: boolean;
	isVisible: boolean;
	tabs: TabEdit[];
}

interface Order {
	id: number;
	name: string;
	order: number;
	children?: Order[];
}

const Pages: Component = () => {
	const params = useParams();
	const navigate = useNavigate();
	const pageId = params.id ? Number(params.id) : null;

	const [isChild, setIsChild] = createSignal<boolean>(false);
	const [loading, setLoading] = createSignal(true);
	const [processing, setProcessing] = createSignal(false);
	const [selectedTab, setSelectedTab] = createSignal<string>('tab-0');
	const [orders, setOrders] = createSignal<Order[]>([]);
	const [page, setPage] = createStore<PageEdit>({ id: null, name: '', slug: '', parent: 0, after: 0, header: null, footer: null, isHome: false, isVisible: true, tabs: [{ id: null, name: 'Main', content: '' }] });
	const [pageTitle, setPageTitle] = createSignal('New');
	const [newTabName, setNewTabName] = createSignal<string | null>(null);
	const [renameTab, setRenameTab] = createStore({ index: -1, name: '', show: false });
	const [successMessage, setSuccessMessage] = createSignal<string>('');
	const [messageTimeoutId, setMessageTimeoutId] = createSignal<number | undefined>(undefined);
	const [errors, setErrors] = createSignal<string[]>([]);

	const unwrapContent = (content: string | null) => {
		let contentString = content ?? '';
		if (contentString.length > 0) {
			contentString = atob(contentString);
		}

		return contentString;
	};

	const unwrapTabs = (tabs: TabEdit[]) => tabs.map(tab => ({
		...tab,
		content: unwrapContent(tab.content),
	}));

	const wrapContent = (content: string | null) => {
		if (content === null || content.length === 0) {
			return null;
		}

		return btoa(content);
	};

	const wrapTabs = (tabs: TabEdit[]) => tabs.map(tab => ({
		...tab,
		content: wrapContent(tab.content),
	}));

	const setPageData = (data: Page) => {
		setPage({
			id: data.id,
			name: data.name,
			slug: data.slug,
			parent: data.parent ? data.parent.id : null,
			after: data.order,
			header: unwrapContent(data.header),
			footer: unwrapContent(data.footer),
			isHome: data.isHome,
			isVisible: data.isVisible,
			tabs: unwrapTabs(data.tabs ?? []),
		});

		setIsChild(!!data.parent);
		setPageTitle(data.name);
	};

	const setPageOrder = () => {
		if (!!params.id && page.after > 0) {
			let afterId = 0;
			let currentOrder = -1;

			const ordersList = page.parent ? childrenOrders(page.parent) : orders();
			ordersList.forEach(({ id, order }) => {
				if (order > currentOrder && order < page.after) {
					currentOrder = order;
					afterId = id;
				}
			});

			setPage('after', afterId);
		}
	};

	const childrenOrders = (parentId: number) => {
		return orders().find(order => order.id === parentId)?.children || [];
	};

	const mountPageData = async () => {
		const getPage = async () => {
			if (!params.id) {
				return;
			}

			try {
				const res = await request('/admin/pages/' + params.id);
				const response = await res.json();
				if (!response.success) {
					throw new Error((response.errors as string[]).join(', '));
				}

				setPageData(response.data);
			} catch (error) {
				console.error('Error fetching page data:', error);
				navigate('/admin/pages', { replace: true });
			}
		};

		const getPageOrders = async () => {
			try {
				const res = await request('/admin/pages/orders');
				const response = await res.json();
				if (!response.success) {
					throw new Error((response.errors as string[]).join(', '));
				}

				const ordersData = [];
				for (const orderId in response.data) {
					const order = response.data[orderId];
					ordersData.push(order);
				}

				setOrders(ordersData);
			} catch (error) {
				console.error('Error fetching pages:', error);
				navigate('/admin/pages', { replace: true });
			}
		};

		await Promise.all([getPage(), getPageOrders()]);

		setPageOrder();
		setLoading(false);
	};

	const isChildClicked = (checked: boolean) => {
		setIsChild(checked);
		if (checked) {
			const parentId = page.after;
			const ordersList = childrenOrders(parentId);
			setPage('parent', parentId);
			setPage('after', ordersList.length > 0 ? ordersList[ordersList.length - 1].id : 0);
		} else {
			setPage('after', page.parent!);
			setPage('parent', null);
		}
	};

	const handlePositionChange = (e: Event & { currentTarget: HTMLSelectElement; target: HTMLSelectElement }) => {
		if (page.isHome) {
			return;
		}

		if (isChild()) {
			const ordersList = childrenOrders(Number(e.target.value));
			setPage('parent', Number(e.target.value));
			setPage('after', ordersList.length > 0 ? ordersList[ordersList.length - 1].id : 0);
		} else {
			setPage('after', Number(e.target.value));
		}
	};

	const changeTab = (value: string) => {
		if (value === 'new-tab') {
			return;
		}

		setSelectedTab(value);
	};

	const save = async () => {
		if (processing()) {
			return;
		}

		setProcessing(true);

		const data: Omit<PageEdit, 'isHome' | 'isVisible'> & { visible: boolean } = {
			id: pageId,
			name: page.name.trim(),
			slug: page.slug.trim(),
			parent: page.parent,
			after: page.after,
			visible: page.isVisible,
			header: wrapContent(page.header),
			footer: wrapContent(page.footer),
			tabs: wrapTabs(page.tabs),
		};

		try {
			const res = await request('/admin/pages' + (data.id !== null ? ('/' + data.id) : ''), {
				method: data.id === null ? 'POST' : 'PUT',
				body: JSON.stringify(data),
			});

			const response = await res.json();

			if (!response.success) {
				setErrors(!Array.isArray(response.errors) ? (Object.values(response.errors || {}) as string[][]).flat() : response.errors);
				return;
			}

			setTimedMessage(
				`The ${data.name} page has been ${pageId === null ? 'created' : 'updated'}`,
				messageTimeoutId,
				setMessageTimeoutId,
				setSuccessMessage,
			);

			if (pageId === null) {
				navigate(`/admin/pages/`);
				return;
			}

			setPageData(response.data.page);
			const ordersData = [];
			for (const orderId in response.data.orders) {
				const order = response.data.orders[orderId];
				ordersData.push(order);
			}

			setOrders(ordersData);
			setPageOrder();
		} catch (error) {
			console.error('Error saving page:', error);
		} finally {
			setProcessing(false);
		}
	};

	onMount(mountPageData);

	return (
		<section class="text-gray-200 body-font">
			<Show when={!loading()}>
				<h1>
					{pageTitle()}
					{' '}
					Page
				</h1>
				<ValidationErrors class="mt-2" errors={errors} />
				<Show when={successMessage().length > 0}>
					<Alert class="alert alert-success mt-4 text-start">
						<div><strong class="font-bold">Success!</strong></div>
						<div>{successMessage()}</div>
					</Alert>
				</Show>
				<div class="mt-4">
					<div class="py-2 w-full">
						<div class="relative">
							<Label for="page-name" class="leading-7 text-gray-100" value="Name" />
							<Input
								type="text"
								name="page-name"
								class="mt-1 block w-full"
								value={page.name}
								readonly={page.isHome}
								handleChange={(e) => {
									if (page.isHome) {
										return;
									}

									setPage('name', e.target.value);
								}}
							/>
						</div>
					</div>
					<div class="py-2 w-full">
						<div class="relative">
							<Label for="page-slug" class="leading-7 text-gray-100" value="Slug" />
							<Input
								type="text"
								name="page-slug"
								class="mt-1 block w-full"
								value={page.slug}
								readonly={page.isHome}
								handleChange={(e) => {
									if (page.isHome) {
										return;
									}

									setPage('slug', e.target.value.toLowerCase());
								}}
							/>
						</div>
					</div>
					<div class="py-2 w-full">
						<div class="relative">
							<div class="flex flex-row">
								<Label for="page-position" class="leading-7" value="Position" />
								<Switch
									class="switch ml-4"
									checked={isChild()}
									onChange={isChildClicked}
									disabled={page.isHome}
								>
									<Switch.Label class="switch__label">Child Page</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-4"
									checked={page.isVisible}
									onChange={() => setPage('isVisible', !page.isVisible)}
									disabled={page.isHome}
								>
									<Switch.Label class="switch__label">Visible</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
							</div>
							<Select
								name="page-position"
								class="mt-1 block w-full"
								disabled={page.isHome}
								value={!page.isHome ? String(isChild() ? page.parent : page.after) : '0'}
								handleChange={handlePositionChange}
							>
								<Show when={page.isHome}>
									<option value="0">First</option>
								</Show>
								<For each={orders().filter(order => order.id !== page.id)}>
									{({ id, name }) => (
										<option value={id}>
											{isChild() ? 'Child of: ' : 'After: '}
											{name}
										</option>
									)}
								</For>
							</Select>
						</div>
					</div>
					<Show when={!page.isHome && isChild()}>
						<div class="py-2 w-full">
							<div class="relative">
								<Label for="page-child-position" class="leading-7" value="Secondary Position" />
								<Select
									name="page-child-position"
									class="mt-1 block w-full"
									disabled={page.isHome}
									value={!page.isHome ? String(page.after) : '0'}
									handleChange={(e) => {
										if (page.isHome) {
											return;
										}

										setPage('after', Number(e.target.value));
									}}
								>
									<option value="0">First</option>
									<For each={childrenOrders(page.parent ? page.parent : -1).filter(order => order.id !== page.id)}>
										{({ id, name }) => (
											<option value={id}>
												After:
												{' '}
												{name}
											</option>
										)}
									</For>
								</Select>
							</div>
						</div>
					</Show>
					<Collapsible class="collapsible mt-2">
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Header</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<RichTextEditor html={untrack(() => page.header)} onChange={html => setPage('header', html)} />
						</Collapsible.Content>
					</Collapsible>
					<Collapsible class="collapsible mt-2" defaultOpen>
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Content</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<Tabs value={selectedTab()} onChange={changeTab} class="tabs">
								<Tabs.List class="tabs__list">
									<For each={page.tabs}>
										{(tab, index) => (
											<Tabs.Trigger
												class="tabs__trigger"
												value={`tab-${index()}`}
											>
												{tab.name}
											</Tabs.Trigger>
										)}
									</For>
									<Tabs.Trigger
										class="tabs__trigger"
										value="new-tab"
										onClick={() => setNewTabName('')}
									>
										<span class="text-gray-400">+</span>
									</Tabs.Trigger>
									<Tabs.Indicator class="tabs__indicator" />
								</Tabs.List>
								<For each={page.tabs}>
									{(tab, index) => (
										<Tabs.Content
											class="tabs__content"
											value={`tab-${index()}`}
										>
											<RichTextEditor
												html={untrack(() => tab.content)}
												onChange={html => setPage('tabs', index(), 'content', html)}
											/>
											<div class="mt-2 flex justify-end">
												<Button
													type="button"
													onClick={() => {
														setRenameTab({ index: index(), name: tab.name, show: true });
													}}
													class="mr-2"
												>
													Rename Tab
												</Button>
												<Button
													type="button"
													class="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
													onClick={() => {
														if (page.tabs.length <= 1) {
															return;
														}

														setPage('tabs', tabs => tabs.filter((_, i) => i !== index()));
													}}
													theme="danger"
													disabled={page.tabs.length <= 1}
												>
													Delete Tab
												</Button>
											</div>
										</Tabs.Content>
									)}
								</For>
							</Tabs>
						</Collapsible.Content>
					</Collapsible>
					<Collapsible class="collapsible mt-2">
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Footer</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<RichTextEditor html={untrack(() => page.footer)} onChange={html => setPage('footer', html)} />
						</Collapsible.Content>
					</Collapsible>
				</div>
				<div class="mt-4">
					<Button type="button" onClick={save} class="float-right">Save</Button>
				</div>
			</Show>
			<Modal open={newTabName() !== null} onOpenChange={val => setNewTabName(val ? newTabName() : null)} size="md" static>
				<Modal.Header>
					Add Content Tab
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
									value={newTabName() ?? ''}
									handleChange={e => setNewTabName(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button
						type="button"
						onClick={() => {
							if (newTabName() !== null && newTabName()!.trim().length > 0) {
								setPage('tabs', tabs => [...tabs, { id: null, name: newTabName()!.trim(), content: '' }]);
							}

							setNewTabName(null);
						}}
						theme="primary"
						noSpinner
					>
						Add
					</Button>
					<Button type="button" onClick={() => setNewTabName(null)} theme="secondary" class="ml-2" noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
			<Modal open={renameTab.show} onOpenChange={val => setRenameTab('show', val)} size="md" static>
				<Modal.Header>
					Rename Tab
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
									value={renameTab.name}
									handleChange={e => setRenameTab('name', e.target.value)}
								/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button
						type="button"
						onClick={() => {
							if (renameTab.name.trim().length > 0 && renameTab.index >= 0) {
								setPage('tabs', renameTab.index, 'name', renameTab.name.trim());
							}

							setRenameTab('show', false);
						}}
						theme="primary"
						noSpinner
					>
						Rename
					</Button>
					<Button type="button" onClick={() => setRenameTab('show', false)} theme="secondary" class="ml-2" noSpinner>Cancel</Button>
				</Modal.Footer>
			</Modal>
		</section>
	);
};

export default Pages;
