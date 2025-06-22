import { JSX, createSignal, createEffect, Show, splitProps } from 'solid-js';

export interface TransitionProps {
	show: boolean;
	appear?: boolean;
	enter?: string;
	enterFrom?: string;
	enterTo?: string;
	leave?: string;
	leaveFrom?: string;
	leaveTo?: string;
	duration?: number;
	children: JSX.Element | ((className: () => string) => JSX.Element);
}

// Define the transition component itself
const TransitionComponent = (props: TransitionProps): JSX.Element => {
	const [local] = splitProps(props, [
		'show',
		'children',
		'appear',
		'enter',
		'enterFrom',
		'enterTo',
		'leave',
		'leaveFrom',
		'leaveTo',
		'duration',
	]);

	const [className, setClassName] = createSignal(local.enterFrom || '');
	const [isVisible, setIsVisible] = createSignal(local.show);

	const resolveDuration = () => local.duration ?? 300;

	createEffect(() => {
		if (local.show) {
			setIsVisible(true);
			setClassName(`${local.enter ?? ''} ${local.enterFrom ?? ''}`);
			requestAnimationFrame(() => {
				setClassName(`${local.enter ?? ''} ${local.enterTo ?? ''}`);
			});
		} else {
			setClassName(`${local.leave ?? ''} ${local.leaveFrom ?? ''}`);
			requestAnimationFrame(() => {
				setClassName(`${local.leave ?? ''} ${local.leaveTo ?? ''}`);
				setTimeout(() => {
					setIsVisible(false);
				}, resolveDuration());
			});
		}
	});

	return (
		<Show when={isVisible()}>
			{typeof local.children === 'function'
				? local.children(className)
				: <div class={className()}>{local.children}</div>}
		</Show>
	);
};

// Type for the exported Transition object
type TransitionNamespace = {
	(props: TransitionProps): JSX.Element;
	Root: (props: TransitionProps) => JSX.Element;
	Child: (props: TransitionProps) => JSX.Element;
};

// Attach `.Root` and `.Child` properties
const Transition = Object.assign(TransitionComponent, {
	Root: TransitionComponent,
	Child: TransitionComponent,
}) as TransitionNamespace;

export default Transition;
