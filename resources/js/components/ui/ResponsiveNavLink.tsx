import { Link } from '@kobalte/core/link';
import { Component, JSX } from 'solid-js';

const ResponsiveNavLink: Component<{
	children?: JSX.Element;
	href: string;
	show?: boolean;
	active?: boolean;
	as?: keyof JSX.HTMLElementTags;
}> = ({ as = 'a', href, show = true, active = false, children }) => {
	if (!show) {
		return <></>;
	}

	return (
		<Link
			as={as}
			href={href}
			class={`w-full flex items-start pl-3 pr-4 py-2 border-l-4 ${
				active
					? 'border-blue-400 text-gray-100 bg-blue-900 focus:outline-none focus:text-gray-200 focus:bg-blue-800 focus:border-blue-700'
					: 'border-transparent text-white hover:text-gray-100 hover:bg-blue-900 hover:border-blue-700'
			} text-base font-medium focus:outline-none transition duration-150 ease-in-out`}
		>
			{children}
		</Link>
	);
};

export default ResponsiveNavLink;
