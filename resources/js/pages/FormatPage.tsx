import { useParams } from '@solidjs/router';
import { Component, onCleanup, onMount, useContext } from 'solid-js';
import PageLoader from '../components/PageLoader';
import { MainContentClassContext } from '../layouts/AppLayout';

const FormatPage: Component = () => {
	const params = useParams();
	const { setMainContentClass } = useContext(MainContentClassContext);

	onMount(() => setMainContentClass('mb-auto'));
	onCleanup(() => setMainContentClass(''));

	return (
		<PageLoader page={params.page} child={params.child} />
	);
};

export default FormatPage;
