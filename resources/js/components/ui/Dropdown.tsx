import { Component, Context, createContext, createSignal, useContext, JSX } from 'solid-js';
import { Link } from '@kobalte/core/link';
import Transition from '../ui/Transition';

const DropdownContext: Context<any> = createContext();

interface DropdownComponent extends Component<{ children?: any }> {
	Trigger: typeof Trigger;
	Content: typeof Content;
	Link: typeof DropdownLink;
	Button: typeof DropdownButton;
}

const Dropdown: DropdownComponent = (props) => {
	const [open, setOpen] = createSignal(false);

	const toggler = [
        open,
        {
            toggle() {
                setOpen(prev => !prev);
            },
			setOpen(value: boolean) {
				setOpen(value);
			},
        },
    ]

	return (
		<DropdownContext.Provider value={toggler}>
			<div class="relative z-100">{props.children}</div>
		</DropdownContext.Provider>
	);
};

const Trigger: Component<{children?: any}> = ({ children }) => {
	const [open, { toggle, setOpen }] = useContext(DropdownContext);

	return (
		<>
			<div onClick={() => toggle()}>{children}</div>

			{open() && <div class="fixed inset-0" onClick={() => setOpen(false)}></div>}
		</>
	);
};

const Content: Component<{children?: any, align?: string, width?: string, contentClasses?: string}> =
	({ align = 'right', width = '48', contentClasses = 'py-1 bg-gray-800', children }) => {
	const [open, { toggle, setOpen }] = useContext(DropdownContext);

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

const DropdownLink: Component<{children?: any, href: string, as?: keyof JSX.HTMLElementTags}> = ({ href, children, as = 'a' }) => {
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

type ButtonType = "submit" | "reset" | "button" | "menu" | undefined;
const DropdownButton: Component<{children?: any, type?: ButtonType, onClick: any}> = ({ onClick, type = "button", children }) => {
	return (
		<button
			type={type}
			onclick={onClick}
			class="cursor-pointer block w-full px-4 py-2 text-left text-sm leading-5 text-gray-400 hover:text-blue-400 focus:outline-none transition duration-150 ease-in-out"
		>
			{children}
		</button>
	);
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Button = DropdownButton;

export default Dropdown;
