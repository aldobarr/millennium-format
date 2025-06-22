import { JSXElement } from 'solid-js';
import { Component } from 'solid-js';

interface InputToggleProps {
	id?: string;
	name?: string;
	inline?: boolean;
	disabled?: boolean;
	onChange?: (e: Event) => void;
	checked?: boolean;
	children?: JSXElement;
}

const InputToggle: Component<InputToggleProps> = ({ id, name, inline = true, disabled = false, onChange, checked, children }) => {
	return (
		<label onClick={onChange} for={id ? id : name} class={`${inline ? 'inline-flex' : 'flex'} items-center cursor-pointer ml-1 mr-2`}>
			<div class="relative">
				<input id={id} name={name} type="checkbox" checked={checked} disabled={disabled} class="hidden" onChange={onChange} />
				<div class="toggle__line w-6 h-3 bg-gray-400 rounded-full shadow-inner"></div>
				<div class="toggle__dot absolute w-4 h-4 bg-white rounded-full shadow inset-y-0 left-0"></div>
			</div>
			<div class="ml-3 text-gray-400 text-md">{children}</div>
		</label>
	);
};

export default InputToggle;
