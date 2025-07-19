import { Component } from 'solid-js';
import PageType from '../interfaces/Page';

interface PageProps {
	page: PageType;
}

const Page: Component<PageProps> = ({ page }) => {
	return (
		<>
			{page.name}
		</>
	);
};

export default Page;
