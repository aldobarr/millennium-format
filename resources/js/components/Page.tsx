import { Tabs } from '@kobalte/core/tabs';
import { Accessor, Component, For, Show } from 'solid-js';
import PageType from '../interfaces/Page';

interface PageProps {
	page: Accessor<PageType>;
}

const Page: Component<PageProps> = (props) => {
	return (
		<div class="mx-6 mb-2 mt-6 md:mx-12 md:my-6 p-6 bg-gray-900 rounded-md">
			<Show when={!!props.page().header}>
				<header>
					<div class="prose prose-invert" innerHTML={atob(props.page().header!)} />
				</header>
			</Show>
			<Show when={!!props.page().tabs && props.page().tabs!.length > 0}>
				<div class="format-body" classList={{ 'mt-8': !!props.page().header, 'mb-8': !!props.page().footer }}>
					<Show
						when={props.page().tabs!.length > 1}
						fallback={
							<div class="prose prose-invert" innerHTML={atob(props.page().tabs![0].content)} />
						}
					>
						<Tabs class="tabs">
							<Tabs.List class="tabs__list">
								<For each={props.page().tabs}>
									{(tab, index) => (
										<Tabs.Trigger
											class="tabs__trigger"
											value={`tab-${index()}`}
										>
											{tab.name}
										</Tabs.Trigger>
									)}
								</For>
								<Tabs.Indicator class="tabs__indicator" />
							</Tabs.List>
							<For each={props.page().tabs}>
								{(tab, index) => (
									<Tabs.Content class="tabs__content" value={`tab-${index()}`}>
										<div class="prose prose-invert" innerHTML={atob(tab.content)} />
									</Tabs.Content>
								)}
							</For>
						</Tabs>
					</Show>
				</div>
			</Show>
			<Show when={!!props.page().footer}>
				<footer>
					<div class="prose prose-invert" innerHTML={atob(props.page().header!)} />
				</footer>
			</Show>
		</div>
	);
};

export default Page;
