import { Alert } from "@kobalte/core/alert";
import { Accessor, Component, For, Show } from "solid-js";

const ValidationErrors: Component<{ errors: Accessor<string[]> }> = ({ errors }) => {
	return (
		<Show when={errors().length > 0}>
			<Alert class="alert alert-danger">
				<div class="font-bold">Whoops! Something went wrong.</div>
				<ul class="mt-3 list-disc list-inside text-sm">
					<For each={errors()}>
						{(error) => (
							<li>{error}</li>
						)}
					</For>
				</ul>
			</Alert>
		</Show>
	);
}

export default ValidationErrors;