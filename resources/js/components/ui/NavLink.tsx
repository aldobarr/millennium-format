import { Component } from 'solid-js';
import { Link } from '@kobalte/core/link';

const NavLink: Component<{children?: any, href: string, show?: boolean, active: boolean}> = (props) => {
	if (props.show == null || props.show == undefined) {
		props.show = true;
	}

	if (!props.show) {
		return <></>;
	}

	return (
		<Link
			href={props.href}
			class={
				props.active
					? 'inline-flex items-center px-1 pt-1 border-b-2 border-blue-900 text-sm font-medium leading-5 text-blue-400 focus:outline-none focus:border-blue-700 transition duration-150 ease-in-out'
					: 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-400 hover:text-blue-400 hover:border-blue-300 focus:outline-none focus:text-blue-500 focus:border-blue-300 transition duration-150 ease-in-out'
			}
		>
			{props.children}
		</Link>
	);
}

export default NavLink;