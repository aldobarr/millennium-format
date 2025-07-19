import { Accessor, Component, createSignal, onCleanup, onMount, Show, useContext } from 'solid-js';
import Page from '../components/Page';
import PageType from '../interfaces/Page';
import { MainContentClassContext } from '../layouts/AppLayout';
import request from '../util/Requests';

const Home: Component = () => {
	const { setMainContentClass } = useContext(MainContentClassContext);
	const [page, setPage] = createSignal<PageType | null>(null);

	onCleanup(() => setMainContentClass(''));

	onMount(async () => {
		setMainContentClass('mb-auto');

		try {
			const res = await request('/page/home');
			const response = await res.json();
			if (!response.success) {
				throw new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat());
			}

			setPage(response.data);
		} catch (error) {
			console.error('Error loading page content:', error);
		}
	});

	return (
		<section class="text-gray-400 body-font">
			<Show when={page() !== null}>
				<Page page={page as Accessor<PageType>} />
			</Show>
		</section>
	);
};

export default Home;
