import { Accessor, Component, JSX, JSXElement } from 'solid-js';
import Spinner from './Spinner';

const Button: Component<{
	type?: 'submit' | 'reset' | 'button' | undefined;
	theme?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'link';
	noSpinner?: boolean;
	class?: string;
	style?: JSX.CSSProperties | string;
	classList?: JSX.CustomAttributes<HTMLButtonElement>['classList'];
	processing?: Accessor<boolean>;
	onClick?: ((event: MouseEvent) => void) | undefined;
	children?: JSXElement;
	disabled?: boolean;
}> = (props) => {
	let className = props.class ?? '';
	if (!className.includes('text-')) {
		className += (className != '' ? ' ' : '') + 'text-sm';
	}

	const themes = {
		primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-600',
		secondary: 'bg-gray-400 hover:bg-gray-500 active:bg-gray-500 text-gray-800',
		success: 'bg-green-500 hover:bg-green-600 active:bg-green-600',
		danger: 'bg-red-500 hover:bg-red-600 active:bg-red-600',
		warning: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-500',
		info: 'bg-cyan-400 hover:bg-cyan-500 active:bg-cyan-500',
		link: 'text-blue-400 hover:underline',
	};

	const theme_bgs = themes[props.theme ?? 'primary'];

	return (
		<button
			type={props.type}
			classList={props.classList}
			style={props.style}
			class={
				`inline-flex items-center px-4 py-2 ${theme_bgs} cursor-pointer disabled:cursor-default border border-transparent rounded-md font-semibold text-white uppercase tracking-widest transition ease-in-out duration-150 ${
					(props.processing && props.processing()) && 'opacity-25'
				} ` + className
			}
			disabled={!!props.disabled || (props.processing && props.processing())}
			onClick={props.onClick}
		>
			{props.children}
			{props.processing && props.processing() && !props.noSpinner && (
				<Spinner />
			)}
		</button>
	);
};

export default Button;
