import { Component } from 'solid-js';
import Spinner from './Spinner';

const Button: Component<{
	type?: "submit" | "reset" | "button" | undefined,
	theme?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "link",
	noSpinner?: boolean,
	class?: string,
	processing?: boolean,
	children?: any,
	onClick?: ((event: MouseEvent) => void) | undefined
}> = (props) => {
	if (props.type == undefined) {
		props.type = 'submit';
	}

	if (props.theme == undefined) {
		props.theme = 'primary';
	}

	if (props.noSpinner == undefined) {
		props.noSpinner = false;
	}

	if (props.processing == undefined) {
		props.processing = false;
	}

	if (props.class == undefined) {
		props.class = '';
	}

	if (!props.class.includes('text-')) {
		props.class += (props.class != '' ? ' ' : '') + 'text-sm';
	}

	const themes = {
		primary: "bg-blue-500 hover:bg-blue-600 active:bg-blue-600",
		secondary: "bg-gray-400 hover:bg-gray-500 active:bg-gray-500 text-gray-800",
		success: "bg-green-500 hover:bg-green-600 active:bg-green-600",
		danger: "bg-red-500 hover:bg-red-600 active:bg-red-600",
		warning: "bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-500",
		info: "bg-cyan-400 hover:bg-cyan-500 active:bg-cyan-500",
		link: "text-blue-400 hover:underline"
	};

	const theme_bgs = themes[props.theme];

	return (
		<button
			type={props.type}
			class={
				`inline-flex items-center px-4 py-2 ${theme_bgs} cursor-pointer border border-transparent rounded-md font-semibold text-white uppercase tracking-widest transition ease-in-out duration-150 ${
					props.processing && 'opacity-25'
				} ` + props.class
			}
			disabled={props.processing}
			onClick={props.onClick}
		>
			{props.children}
			{props.processing && !props.noSpinner && (
				<Spinner />
			)}
		</button>
	);
}

export default Button;