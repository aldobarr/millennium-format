import { Component } from 'solid-js';
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
	handleChange: (e: any) => void;
	errors?: string[] | string;
	onBlur?: (e: any) => void;
	onFocus?: (e: any) => void;
	min?: number;
	max?: number;
	step?: number;
	accept?: string;
	onKeyUp?: (e: any) => void;
	onKeyDown?: (e: any) => void;
}

export const Input: Component<InputProps> = ({
	children = null,
	type = 'text',
	name,
	value = '',
	placeholder,
	class: className = '',
	autoComplete,
	required = false,
	handleChange,
	errors = [],
	onBlur,
	onFocus,
	min,
	max,
	step,
	accept,
	onKeyUp,
	onKeyDown
}) => {
	if (errors && (typeof errors === 'string' || errors instanceof String)) {
		errors = [errors as string];
	}

	const hasError = errors && errors.length > 0;
	className = (className.indexOf("w-") ? className : `w-full ${className}`) + (hasError ? ' border-red-500 text-red-400' : ' border-gray-800 text-gray-100');

	if (type == 'textarea') {
		return TextArea({ name, value, class: className, required, handleChange, errors, onBlur, onFocus, max });
	}

	return (
		<>
			<div class={`flex ${children ? 'items-center' : 'flex-col items-start'} items-start`}>
				<input
					type={type}
					name={name}
					value={value}
					class={
						`bg-gray-800 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-blue-900 rounded border focus:border-blue-700 text-base outline-none ${type != 'file' ? 'py-1 px-3' : ''} leading-8 transition-colors duration-200 ease-in-out ` +
						className
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
	errors?: string[] | string;
	onBlur?: (e: any) => void;
	onFocus?: (e: any) => void;
	max?: number;
}

export const TextArea: Component<TextAreaProps> = ({
	name,
	value = '',
	class: className,
	required,
	handleChange,
	errors = [],
	onBlur,
	onFocus,
	max
}) => {
	return (
		<>
			<div class={`flex items-start`}>
				<textarea
					name={name}
					value={value}
					class={
						`bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-blue-900 rounded border focus:border-blue-700 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ` +
						className
					}
					required={required}
					onChange={handleChange}
					onBlur={onBlur}
					onFocus={onFocus}
					maxLength={max}
				>
					{value}
				</textarea>
			</div>
			<InputError errors={errors} />
		</>
	);
}