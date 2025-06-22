import { Link } from '@kobalte/core/link';
import { Component, JSXElement, Show } from 'solid-js';

const AdminNavLink: Component<{ href: string; show?: boolean; active?: boolean; children?: JSXElement }> = (props) => {
	return (
		<Show when={props.show ?? true}>
			<Link
				href={props.href}
				class={`
					${props.active
			? 'border-r-2 border-white text-white'
			: 'text-gray-300 hover:text-white'
		}
					mb-4 pl-2 capitalize font-medium text-md transition ease-in-out duration-500
				`}
			>
				{props.children}
			</Link>
		</Show>
	);
};

export default AdminNavLink;
