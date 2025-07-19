import { Accessor, Component, createEffect, createSignal, onCleanup, Show, useContext } from 'solid-js';
import PageType from '../interfaces/Page';
import { MainContentClassContext } from '../layouts/AppLayout';
import NotFound from '../pages/404';
import request from '../util/Requests';
import Page from './Page';

interface PageLoaderProps {
	page: string;
	child?: string;
}

const PageLoader: Component<PageLoaderProps> = (props) => {
	const [page, setPage] = createSignal<PageType | undefined | null>(undefined);
	const { mainContentClass, setMainContentClass } = useContext(MainContentClassContext);

	onCleanup(() => setMainContentClass(''));

	const shouldLoad = (page: string | null | undefined) => {
		return page && typeof page === 'string' && page.trim().length > 0;
	};

	createEffect(() => loadPage(props.page, props.child));

	if (!shouldLoad(props.page)) {
		setMainContentClass('');

		return (
			<NotFound />
		);
	}

	const loadPage = async (page: string, child?: string) => {
		if (!shouldLoad(page)) {
			return;
		}

		try {
			let path = '/page/' + page;
			if (child && typeof child === 'string' && child.trim().length > 0) {
				path += '/' + child;
			}

			const res = await request(path);
			const response = await res.json();
			if (!response.success) {
				throw new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat());
			}

			setPage(response.data);
			if (!mainContentClass().includes('mb-auto')) {
				setMainContentClass('mb-auto');
			}
		} catch (error) {
			setPage(null);
			setMainContentClass('');
			console.error('Error loading page content:', error);
		}
	};

	return (
		<Show when={page() !== null} fallback={<NotFound />}>
			<section class="text-gray-400 body-font">
				<Show when={page() === undefined}>
					<></>
				</Show>

				<Show when={page() !== undefined && page() !== null}>
					<Page page={page as Accessor<PageType>} />
				</Show>
			</section>
		</Show>

	);
};

export default PageLoader;
