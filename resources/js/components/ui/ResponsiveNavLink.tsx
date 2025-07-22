import { Link } from '@kobalte/core/link';
import { Component, JSX, Show } from 'solid-js';

const ResponsiveNavLink: Component<{
	children?: JSX.Element;
	class?: string;
	classList?: { [key: string]: boolean };
	href: string;
	show?: boolean;
	active?: boolean;
	as?: keyof JSX.HTMLElementTags;
}> = (props) => {
	return (
		<Show when={props.show ?? true}>
			<Link
				as={props.as ?? 'a'}
				href={props.href}
				class={`w-full flex items-start pl-3 pr-4 py-2 border-l-4 ${
					(props.active ?? false)
						? 'border-blue-400 text-gray-100 bg-blue-900 focus:outline-none focus:text-gray-200 focus:bg-blue-800 focus:border-blue-700'
						: 'border-transparent text-white hover:text-gray-100 hover:bg-blue-900 hover:border-blue-700'
				} text-base font-medium focus:outline-none transition duration-150 ease-in-out ${props.class ?? ''}`}
				classList={props.classList}
			>
				{props.children}
			</Link>
		</Show>
	);
};

export default ResponsiveNavLink;
