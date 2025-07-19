import { Accessor, Component } from 'solid-js';
import PageType from '../interfaces/Page';

interface PageProps {
	page: Accessor<PageType>;
}

const Page: Component<PageProps> = (props) => {
	return (
		<>
			{props.page().name}
		</>
	);
};

export default Page;
