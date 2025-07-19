import { Link } from '@kobalte/core/link';
import { ChevronDown, ChevronUp } from 'lucide-solid';
import { Component, Context, createContext, createSignal, JSX, JSXElement, Show, useContext } from 'solid-js';
import Transition from '../ui/Transition';

type DropdownContextType = [
	() => boolean,
	{
		toggle: () => void;
		setOpen: (value: boolean) => void;
	},
];

const DropdownContext: Context<DropdownContextType> = createContext([() => false, { toggle: () => {}, setOpen: () => {} }] as DropdownContextType);

interface DropdownComponent extends Component<{ children?: JSXElement }> {
	Trigger: typeof Trigger;
	Content: typeof Content;
	Link: typeof DropdownLink;
	Button: typeof DropdownButton;
}

const Dropdown: DropdownComponent = (props) => {
	const [open, setOpen] = createSignal(false);

	const toggler: DropdownContextType = [
		open,
		{
			toggle() {
				setOpen(prev => !prev);
			},
			setOpen(value: boolean) {
				setOpen(value);
			},
		},
	];

	return (
		<DropdownContext.Provider value={toggler}>
			<div class="relative z-100">{props.children}</div>
		</DropdownContext.Provider>
	);
};

const Trigger: Component<{ children?: JSXElement; toggleIcon?: boolean }> = (props) => {
	const [open, { toggle, setOpen }] = useContext(DropdownContext);
	const toggleIcon: boolean = props.toggleIcon ?? true;

	return (
		<>
			<div onClick={() => toggle()}>
				<span class="inline-flex rounded-md">
					<button
						type="button"
						class="z-50 cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-900 hover:text-blue-400 focus:text-blue-500 focus:outline-none transition ease-in-out duration-150"
					>
						{props.children}
						<Show when={toggleIcon}>
							<Show
								when={!open()}
								fallback={
									<ChevronUp class="ml-1" size={16} />
								}
							>
								<ChevronDown class="ml-1" size={16} />
							</Show>
						</Show>
					</button>
				</span>
			</div>

			<Show when={open()}>
				<div class="fixed inset-0" onClick={() => setOpen(false)}></div>
			</Show>
		</>
	);
};

const Content: Component<{ children?: JSXElement; align?: string; width?: string; contentClasses?: string }>
	= ({ align = 'right', width = '48', contentClasses = 'py-1 bg-gray-800', children }) => {
		const [open, { setOpen }] = useContext(DropdownContext);

		let alignmentClasses = 'origin-top';

		if (align === 'left') {
			alignmentClasses = 'origin-top-left left-0';
		} else if (align === 'right') {
			alignmentClasses = 'origin-top-right right-0';
		}

		let widthClasses = '';

		if (width === '48') {
			widthClasses = 'w-48';
		}

		return (
			<>
				<Transition
					show={open()}
					enter="transition ease-out duration-200"
					enterFrom="transform opacity-0 scale-95"
					enterTo="transform opacity-100 scale-100"
					leave="transition ease-in duration-75"
					leaveFrom="transform opacity-100 scale-100"
					leaveTo="transform opacity-0 scale-95"
				>
					{open() && (
						<div
							class={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
							onClick={() => setOpen(false)}
						>
							<div class={`rounded-md ring-1 ring-black ring-opacity-5 ` + contentClasses}>
								{children}
							</div>
						</div>
					)}
				</Transition>
			</>
		);
	};

const DropdownLink: Component<{ children?: JSXElement; href: string; as?: keyof JSX.HTMLElementTags }> = ({ href, children, as = 'a' }) => {
	return (
		<Link
			href={href}
			as={as}
			class="block w-full px-4 py-2 text-left text-sm leading-5 text-gray-400 hover:text-blue-400 focus:outline-none transition duration-150 ease-in-out"
		>
			{children}
		</Link>
	);
};

type ButtonType = 'submit' | 'reset' | 'button' | 'menu' | undefined;
const DropdownButton: Component<{ children?: JSXElement; type?: ButtonType; onClick?: ((event: MouseEvent) => void) | undefined }> = (props) => {
	return (
		<button
			type={props.type ?? 'button'}
			onclick={props.onClick}
			class="cursor-pointer block w-full px-4 py-2 text-left text-sm leading-5 text-gray-400 hover:text-blue-400 focus:outline-none transition duration-150 ease-in-out"
		>
			{props.children}
		</button>
	);
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Button = DropdownButton;

export default Dropdown;
