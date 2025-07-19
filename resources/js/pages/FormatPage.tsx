import { useParams } from '@solidjs/router';
import { Component, createSignal, onMount, Show } from 'solid-js';
import Page from '../components/Page';
import PageType from '../interfaces/Page';
import request from '../util/Requests';
import NotFound from './404';

const FormatPage: Component = () => {
	const params = useParams();
	const [page, setPage] = createSignal<PageType | undefined | null>(undefined);

	if (!params.page || typeof params.page !== 'string' || params.page.trim().length === 0) {
		return (
			<NotFound />
		);
	}

	onMount(async () => {
		try {
			let path = '/page/' + params.page;
			if (params.child && typeof params.child === 'string' && params.child.trim().length > 0) {
				path += '/' + params.child;
			}

			const res = await request(path);
			const response = await res.json();
			if (!response.success) {
				throw new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat());
			}

			setPage(response.data);
		} catch (error) {
			setPage(null);
			console.error('Error loading page content:', error);
		}
	});

	return (
		<Show when={page() !== null} fallback={<NotFound />}>
			<section class="text-gray-400 body-font">
				<Show when={page() === undefined}>
					<></>
				</Show>

				<Show when={page() !== undefined && page() !== null}>
					<Page page={page()!} />
				</Show>
			</section>
		</Show>

	);
};

export default FormatPage;
