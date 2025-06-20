import { Component } from "solid-js";

const Checkbox: Component<{
	name?: string;
	value?: any;
	handleChange: (e: any) => void;
}> = ({ name, value, handleChange }) => {
	return (
		<input
			type="checkbox"
			name={name}
			value={value}
			class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
			onChange={handleChange}
		/>
	);
}

export default Checkbox;