import { Component, JSXElement } from 'solid-js';

const Label: Component<{
	for?: string;
	value?: string;
	class?: string;
	children?: JSXElement;
}> = ({ for: forInput, value, class: className, children }) => {
	return (
		<label for={forInput} class={className}>
			{value ? value : children}
		</label>
	);
};

export default Label;
