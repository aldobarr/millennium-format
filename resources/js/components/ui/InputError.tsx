import { Component, For } from "solid-js";

const InputError: Component<{ errors?: string[] | string }> = ({ errors }) => {
	if (errors == null || errors == undefined) {
		return null;
	}

	if (errors && (typeof errors === 'string' || errors instanceof String)) {
		errors = [errors as string];
	}

	if (!Array.isArray(errors) || errors.length < 1) {
		return null;
	}

	return (
		<span class="flex items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">
			<ul class="list-none">
				<For each={errors}>
					{(error) => (
						<li>{error}</li>
					)}
				</For>
			</ul>
		</span>
	);
}

export default InputError;