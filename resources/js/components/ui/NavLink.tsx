import { Link } from '@kobalte/core/link';
import { ChevronDown } from 'lucide-solid';
import { Component, JSX, Show } from 'solid-js';

const NavLink: Component<{ children?: JSX.Element; href: string; show?: boolean; name: string; active: boolean }> = (props) => {
	return (
		<Show when={props.show ?? true}>
			<Show when={!props.children}>
				<Link
					href={props.href}
					class={
						props.active
							? 'inline-flex items-center px-1 pt-1 border-b-2 border-blue-900 text-sm font-medium leading-5 text-blue-400 focus:outline-none focus:border-blue-700 transition duration-150 ease-in-out'
							: 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-400 hover:text-blue-400 hover:border-blue-300 focus:outline-none focus:text-blue-500 focus:border-blue-300 transition duration-150 ease-in-out'
					}
				>
					{props.name}
				</Link>
			</Show>
			<Show when={!!props.children}>
				<Link
					href={props.href}
					class={
						props.active
							? 'group inline-flex items-center px-1 pt-1 border-b-2 border-blue-900 text-sm font-medium leading-5 text-blue-400 focus:outline-none focus:border-blue-700 transition duration-150 ease-in-out'
							: 'group inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-400 hover:text-blue-400 hover:border-blue-300 focus:outline-none focus:text-blue-500 focus:border-blue-300 transition duration-150 ease-in-out'
					}
				>
					<div class="relative">
						<div class="flex flex-row items-center">
							{props.name}
							<ChevronDown size={14} class="ml-1" />
						</div>
						<div class="absolute z-10 hidden bg-gray-800 text-white rounded-md shadow-lg mt-2 group-hover:block origin-top-left -left-1 min-w-35 w-auto">
							<div class="rounded-md ring-1 ring-black ring-opacity-5">
								{props.children}
							</div>
						</div>
					</div>
				</Link>
			</Show>
		</Show>
	);
};

export default NavLink;
