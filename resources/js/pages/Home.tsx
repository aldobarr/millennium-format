import { Accessor, Component, createSignal, onMount, Show } from 'solid-js';
import Page from '../components/Page';
import PageType from '../interfaces/Page';
import request from '../util/Requests';

const Home: Component = () => {
	const [page, setPage] = createSignal<PageType | null>(null);

	onMount(async () => {
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
