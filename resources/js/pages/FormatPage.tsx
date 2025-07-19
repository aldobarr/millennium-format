import { useParams } from '@solidjs/router';
import { Component } from 'solid-js';
import PageLoader from '../components/PageLoader';

const FormatPage: Component = () => {
	const params = useParams();

	return (
		<PageLoader page={params.page} child={params.child} />
	);
};

export default FormatPage;
