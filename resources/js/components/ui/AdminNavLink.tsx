import { Link } from '@kobalte/core/link';
import { Component, For, JSXElement, Show } from 'solid-js';
import { locationIs } from '../../util/Helpers';

interface AdminNavChildLink {
	href: string;
	label: string;
	path: string;
};

const AdminNavLink: Component<{ href: string; show?: boolean; active?: boolean; children?: JSXElement; childLinks?: AdminNavChildLink[] }> = (props) => {
	const childActive = () => !!props.childLinks && props.childLinks.some(link => locationIs(link.path));

	return (
		<Show when={props.show ?? true}>
			<Link
				href={props.href}
				class={`
					${props.active
			? `${!childActive() ? 'border-r-2 border-white' : ''} text-white`
			: 'text-gray-300 hover:text-white'
		}
					${!props.childLinks || !props.active ? 'mb-4' : ''} pl-2 capitalize font-medium text-md transition ease-in-out duration-500
				`}
			>
				{props.children}
			</Link>
			<Show when={!!props.childLinks && props.active}>
				<div class="my-2 ml-4">
					<For each={props.childLinks}>
						{childLink => (
							<Link
								href={childLink.href}
								class={`
							block ml-4 mb-2 text-sm
							${locationIs(childLink.path)
								? 'text-gray-200 hover:text-white border-r-2 border-white '
								: 'text-gray-400 hover:text-white'}
						`}
							>
								{childLink.label}
							</Link>
						)}
					</For>
				</div>
			</Show>
		</Show>
	);
};

export default AdminNavLink;
