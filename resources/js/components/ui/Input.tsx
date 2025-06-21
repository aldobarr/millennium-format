import { Component, createSignal, Show } from 'solid-js';
import VisibilityIcon from '@suid/icons-material/Visibility';
import VisibilityOffIcon from '@suid/icons-material/VisibilityOff';
import InputError from './InputError';

interface InputProps {
	children?: any;
	type?: string;
	name: string;
	value?: string | number;
	placeholder?: string;
	class?: string;
	autoComplete?: string;
	required?: boolean;
	darkBg?: boolean;
	handleChange: (e: any) => void;
	errors?: () => string[] | string;
	onBlur?: (e: any) => void;
	onFocus?: (e: any) => void;
	min?: number;
	max?: number;
	step?: number;
	accept?: string;
	onKeyUp?: (e: any) => void;
	onKeyDown?: (e: any) => void;
}

const hasError = (errors?: () => string[] | string) => {
	return errors && ((Array.isArray(errors()) && errors().length > 0) || (typeof errors() === "string" && errors().length > 0));
}

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
		onKeyDown
	} = props;

	const getClassName = () => {
		let cName = className.indexOf("w-") ? className : `w-full ${className}`;
		if (hasError(errors)) {
			cName += ' border-red-500 text-red-400';
		} else {
			cName += ' border-gray-900 text-gray-100';
		}

		return cName;
	}

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
							`bg-gray-${props.darkBg ? '800' : '900'} bg-opacity-20 focus:bg-transparent rounded border focus:border-blue-700 text-base outline-none ${type != 'file' ? 'py-1 px-3' : ''} leading-8 transition-colors duration-200 ease-in-out ` +
							getClassName()
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
					/>
					<Show when={isPassword}>
						<button
							type="button"
							aria-label={showPass() ? 'Hide password' : 'Show password'}
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
							onClick={() => setShowPass((pass) => !pass)}
						>
							<Show when={showPass()} fallback={<VisibilityIcon />}>
								<VisibilityOffIcon />
							</Show>
						</button>
					</Show>
				</div>
				{children}
			</div>
			<InputError errors={errors} />
		</>
	);
}

interface TextAreaProps {
	name: string;
	value: string | number;
	class?: string;
	required?: boolean;
	handleChange: (e: any) => void;
	errors?: () => string[] | string;
	onBlur?: (e: any) => void;
	onFocus?: (e: any) => void;
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
		max
	} = props;

	return (
		<>
			<div class={`flex items-start`}>
				<textarea
					name={name}
					value={props.value}
					class={
						`bg-gray-600 bg-opacity-20 focus:bg-transparent rounded border focus:border-blue-700 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ` +
						className
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
}