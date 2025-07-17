import { Collapsible } from '@kobalte/core/collapsible';
import { Tabs } from '@kobalte/core/tabs';
import { useNavigate, useParams } from '@solidjs/router';
import { ChevronDown } from 'lucide-solid';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import RichTextEditor from '../../components/RichTextEditor';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import Modal from '../../components/ui/Modal';
import ValidationErrors from '../../components/ui/ValidationErrors';
import request from '../../util/Requests';

interface TabEdit {
	id: number | null;
	name: string;
	content: string;
}

interface PageEdit {
	id: number | null;
	name: string;
	after: number;
	header: string | null;
	footer: string | null;
	isHome: boolean;
	tabs: TabEdit[];
}

interface Order {
	id: number;
	name: string;
	order: number;
}

const Pages: Component = () => {
	const params = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = createSignal(true);
	const [processing, setProcessing] = createSignal(false);
	const [selectedTab, setSelectedTab] = createSignal<string>('tab-0');
	const [orders, setOrders] = createSignal<Order[]>([]);
	const [page, setPage] = createStore<PageEdit>({ id: null, name: '', after: 0, header: null, footer: null, isHome: false, tabs: [{ id: null, name: 'Main', content: '' }] });
	const [pageTitle, setPageTitle] = createSignal('New Page');
	const [newTabName, setNewTabName] = createSignal<string | null>(null);
	const [renameTab, setRenameTab] = createStore({ index: -1, name: '', show: false });
	const [errors, setErrors] = createSignal<string[]>([]);

	const [newPageHeader, setNewPageHeader] = createSignal<string>('');
	const [newTabContents, setNewTabContents] = createStore<TabEdit[]>([]);
	const [newPageFooter, setNewPageFooter] = createSignal<string>('');

	const mountPageData = async () => {
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

				setPage({
					id: response.data.id,
					name: response.data.name,
					after: response.data.order,
					header: unwrapContent(response.data.header),
					footer: unwrapContent(response.data.footer),
					isHome: response.data.isHome,
					tabs: unwrapTabs(response.data.tabs),
				});

				setNewTabContents(unwrapTabs(response.data.tabs));
				setPageTitle(response.data.name);
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

				setOrders(response.data);
			} catch (error) {
				console.error('Error fetching pages:', error);
				navigate('/admin/pages', { replace: true });
			}
		};

		await Promise.all([getPage(), getPageOrders()]);

		if (!!params.id && page.after > 0) {
			let afterId = 0;
			let currentOrder = 0;

			orders().forEach(({ id, order }) => {
				if (order > currentOrder && order < page.after) {
					currentOrder = order;
					afterId = id;
				}
			});

			setPage('after', afterId);
		}

		setLoading(false);
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

		const newPage: PageEdit = {
			id: page.id,
			name: page.name.trim(),
			after: page.after,
			header: newPageHeader() ?? null,
			footer: newPageFooter() ?? null,
			isHome: false,
			tabs: newTabContents.map(tab => ({
				id: tab.id,
				name: tab.name.trim(),
				content: btoa(tab.content),
			})),
		};

		try {
			const response = await request('/admin/pages', {
				method: 'POST',
				body: JSON.stringify(newPage),
			});

			const result = await response.json();

			if (!result.success) {
				setErrors(!Array.isArray(result.errors) ? (Object.values(result.errors || {}) as string[][]).flat() : result.errors);
				return;
			}

			// navigate('/admin/pages/' + result.data.id, { replace: true });
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
				<div class="mt-4">
					<div class="py-2 w-full">
						<div class="relative">
							<Label for="page-name" class="leading-7 text-sm text-gray-100" value="Name" />
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
							<Label for="page-name" class="leading-7 text-sm text-gray-100" value="Show After" />
							<Select
								name="page-name"
								class="mt-1 block w-full"
								value={page.name}
								disabled={page.isHome && false}
								handleChange={(e) => {
									if (page.isHome) {
										return;
									}

									setPage('after', Number(e.target.value));
								}}
							>
								<option value="0" selected={page.isHome}>First</option>
								<For each={orders()}>
									{({ id, name }) => (
										<option value={id} selected={page.after === id}>
											{name}
										</option>
									)}
								</For>
							</Select>
						</div>
					</div>
					<Collapsible class="collapsible mt-2">
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Header</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<RichTextEditor html={unwrap(page.header)} onChange={setNewPageHeader} />
						</Collapsible.Content>
					</Collapsible>
					<Collapsible class="collapsible" defaultOpen>
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Content</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<Tabs value={selectedTab()} onChange={changeTab} aria-label="Main navigation" class="tabs">
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
												html={unwrap(tab.content)}
												onChange={(html) => {
													setNewTabContents(index(), 'content', html);
												}}
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
					<Collapsible class="collapsible">
						<Collapsible.Trigger class="collapsible__trigger">
							<span>Footer</span>
							<ChevronDown class="collapsible__trigger-icon" />
						</Collapsible.Trigger>
						<Collapsible.Content class="collapsible__content">
							<RichTextEditor html={unwrap(page.footer)} onChange={setNewPageFooter} />
						</Collapsible.Content>
					</Collapsible>
				</div>
				<div class="mt-4">
					<Button type="button" onClick={save} class="float-right">Save</Button>
				</div>
			</Show>
			<Modal open={newTabName() !== null} onOpenChange={val => setNewTabName(val ? newTabName() : null)} size="md" static>
				<Modal.Header>
					New Page Tab
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
								setNewTabContents(tabs => [...tabs, { id: null, name: newTabName()!.trim(), content: '' }]);
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
								setNewTabContents(renameTab.index, 'name', renameTab.name.trim());
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
