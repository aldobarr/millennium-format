import { Alert } from '@kobalte/core/alert';
import { Accessor, Component, For, Show } from 'solid-js';

const ValidationErrors: Component<{ message?: string; errors: Accessor<string[]>; class?: string }> = (props) => {
	return (
		<Show when={props.errors().length > 0}>
			<Alert class={`${props.class ?? ''} alert alert-danger`}>
				<div class="font-bold">{props.message ?? 'Whoops! Something went wrong.'}</div>
				<ul class="mt-3 list-disc list-inside text-sm">
					<For each={props.errors()}>
						{error => (
							<li>{error}</li>
						)}
					</For>
				</ul>
			</Alert>
		</Show>
	);
};

export default ValidationErrors;
