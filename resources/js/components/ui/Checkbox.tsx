import { Component, JSX } from 'solid-js';

const Checkbox: Component<{
	name?: string;
	checked?: boolean;
	handleChange: JSX.IntrinsicElements['input']['onChange'];
}> = (props) => {
	return (
		<input
			type="checkbox"
			name={props.name}
			checked={props.checked}
			class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
			onChange={props.handleChange}
		/>
	);
};

export default Checkbox;
