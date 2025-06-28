import { Alert } from '@kobalte/core/alert';
import { X } from 'lucide-solid';
import { Accessor, Component, For, Setter, Show } from 'solid-js';

const ValidationErrors: Component<{ message?: string; errors: Accessor<string[]>; close?: Setter<string[]>; class?: string }> = (props) => {
	return (
		<Show when={props.errors().length > 0}>
			<Alert class={`${props.class ?? ''} alert alert-danger`}>
				<Show
					when={props.close !== undefined}
					fallback={
						<div class="font-bold">{props.message ?? 'Whoops! Something went wrong.'}</div>
					}
				>
					<div class="flex flex-row relative">
						<div class="font-bold flex-auto">{props.message ?? 'Whoops! Something went wrong.'}</div>
						<button
							type="button"
							class="absolute z-1 hover:text-red-700 cursor-pointer top-[-5px] right-[-5px] flex items-center justify-center hover:scale-[1.1]"
							onClick={() => props.close!([])}
						>
							<X size={12} />
						</button>
					</div>
				</Show>
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
