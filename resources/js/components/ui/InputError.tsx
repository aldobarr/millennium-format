import { Component, For, Show } from "solid-js";

const InputError: Component<{ errors?: () => string[] | string }> = ({ errors }) => {
	return (
		<Show when={errors && ((Array.isArray(errors()) && errors().length > 0) || (typeof errors() === "string" && errors().length > 0))}>
			<span class="flex items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">
				<ul class="list-none">
					<Show when={!Array.isArray(errors!())}>
						<li>{errors!()}</li>
					</Show>
					<Show when={Array.isArray(errors!())}>
						<For each={errors!() as string[]}>
							{(error) => (
								<li>{error}</li>
							)}
						</For>
					</Show>
				</ul>
			</span>
		</Show>
	);
}

export default InputError;