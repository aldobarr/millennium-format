import { Eye, EyeOff } from 'lucide-solid';
import { Component, createSignal, JSX, JSXElement, Show } from 'solid-js';
import InputError from './InputError';

interface InputProps {
	children?: JSXElement;
	type?: string;
	name: string;
	value?: string | number;
	placeholder?: string;
	class?: string;
	autoComplete?: string;
	required?: boolean;
	darkBg?: boolean;
	handleChange: JSX.IntrinsicElements['input']['onChange'];
	errors?: () => string[] | string;
	onBlur?: JSX.IntrinsicElements['input']['onBlur'];
	onFocus?: JSX.IntrinsicElements['input']['onFocus'];
	min?: number;
	max?: number;
	step?: number;
	accept?: string;
	readonly?: boolean;
	onKeyUp?: JSX.IntrinsicElements['input']['onKeyUp'];
	onKeyDown?: JSX.IntrinsicElements['input']['onKeyDown'];
}

const hasError = (errors?: () => string[] | string) => {
	return errors && ((Array.isArray(errors()) && errors().length > 0) || (typeof errors() === 'string' && errors().length > 0));
};

export const Input: Component<InputProps> = (props) => {
	const {
		children = null,
		type = 'text',
		name,
		placeholder,
		class: className = '',
		autoComplete,
		required = false,
		handleChange,
		errors,
		onBlur,
		onFocus,
		min,
		max,
		step,
		accept,
		onKeyUp,
		onKeyDown,
	} = props;

	const getClassName = () => {
		let cName = className.indexOf('w-') >= 0 ? className : `w-full ${className}`;
		if (hasError(errors)) {
			cName += ' border-red-500 text-red-400';
		} else {
			cName += ' border-gray-900 text-gray-100';
		}

		return cName;
	};

	const isPassword = type === 'password';
	const [showPass, setShowPass] = createSignal(false);
	const actualType = () => isPassword ? (showPass() ? 'text' : 'password') : type;

	if (type == 'textarea') {
		return TextArea(props as TextAreaProps);
	}

	return (
		<>
			<div class={`flex ${children ? 'items-center' : 'flex-col'} items-start`}>
				<div class="relative w-full">
					<input
						type={actualType()}
						name={name}
						value={props.value}
						class={
							`bg-gray-${props.darkBg ? '800' : '900'} bg-opacity-20 read-only:bg-gray-500
							${!props.readonly ? 'focus:bg-transparent focus:border-blue-700' : ''} rounded border text-base
							outline-none ${type != 'file' ? 'py-1 px-3' : ''} leading-8 transition-colors duration-200 ease-in-out `
							+ getClassName()
						}
						autocomplete={autoComplete}
						required={required}
						onChange={handleChange}
						onBlur={onBlur}
						onFocus={onFocus}
						min={min}
						max={max}
						step={step}
						accept={accept}
						placeholder={placeholder}
						onKeyUp={onKeyUp}
						onKeyDown={onKeyDown}
						readonly={props.readonly}
					/>
					<Show when={isPassword}>
						<button
							type="button"
							aria-label={showPass() ? 'Hide password' : 'Show password'}
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none cursor-pointer"
							onClick={() => setShowPass(pass => !pass)}
						>
							<Show when={showPass()} fallback={<Eye />}>
								<EyeOff />
							</Show>
						</button>
					</Show>
				</div>
				{children}
			</div>
			<InputError errors={errors} />
		</>
	);
};

interface SelectProps {
	children?: JSXElement;
	name: string;
	value?: string | number;
	class?: string;
	required?: boolean;
	darkBg?: boolean;
	handleChange: JSX.IntrinsicElements['select']['onChange'];
	errors?: () => string[] | string;
	onBlur?: JSX.IntrinsicElements['select']['onBlur'];
	onFocus?: JSX.IntrinsicElements['select']['onFocus'];
	onKeyUp?: JSX.IntrinsicElements['select']['onKeyUp'];
	onKeyDown?: JSX.IntrinsicElements['select']['onKeyDown'];
	disabled?: boolean;
}

export const Select: Component<SelectProps> = (props) => {
	const {
		children = null,
		name,
		class: className = '',
		required = false,
		handleChange,
		errors,
		onBlur,
		onFocus,
		onKeyUp,
		onKeyDown,
	} = props;

	const getClassName = () => {
		let cName = className.indexOf('w-') >= 0 ? className : `w-full ${className}`;
		if (hasError(errors)) {
			cName += ' border-red-500 text-red-400';
		} else {
			cName += ' border-gray-900 text-gray-100';
		}

		return cName;
	};

	return (
		<>
			<div class={`flex ${children ? 'items-center' : 'flex-col'} items-start`}>
				<select
					name={name}
					value={props.value}
					class={
						`bg-gray-${props.darkBg ? '800' : '900'} bg-opacity-20 disabled:bg-gray-500
						${!props.disabled ? 'focus:bg-transparent focus:border-blue-700' : ''} rounded border text-base
						outline-none py-2 px-3 leading-8 transition-colors duration-200 ease-in-out `
						+ getClassName()
					}
					required={required}
					onChange={handleChange}
					onBlur={onBlur}
					onFocus={onFocus}
					onKeyUp={onKeyUp}
					onKeyDown={onKeyDown}
					disabled={props.disabled}
				>
					{children}
				</select>
			</div>
			<InputError errors={errors} />
		</>
	);
};

interface TextAreaProps {
	name: string;
	value: string | number;
	class?: string;
	required?: boolean;
	handleChange: JSX.IntrinsicElements['textarea']['onChange'];
	errors?: () => string[] | string;
	onBlur?: JSX.IntrinsicElements['textarea']['onBlur'];
	onFocus?: JSX.IntrinsicElements['textarea']['onFocus'];
	max?: number;
}

export const TextArea: Component<TextAreaProps> = (props) => {
	const {
		name,
		class: className,
		required,
		handleChange,
		errors,
		onBlur,
		onFocus,
		max,
	} = props;

	return (
		<>
			<div class="flex items-start">
				<textarea
					name={name}
					value={props.value}
					class={
						`bg-gray-600 bg-opacity-20 focus:bg-transparent rounded border focus:border-blue-700 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out `
						+ className
					}
					required={required}
					onChange={handleChange}
					onBlur={onBlur}
					onFocus={onFocus}
					maxLength={max}
				>
					{props.value}
				</textarea>
			</div>
			<InputError errors={errors} />
		</>
	);
};
