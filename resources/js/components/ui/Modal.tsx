import { Dialog } from "@kobalte/core";
import { Portal } from "solid-js/web";
import { Component, JSX, splitProps } from "solid-js";

interface ModalRootProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	static?: boolean;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	children: JSX.Element;
};

const SIZE_CLASS: Record<NonNullable<ModalRootProps["size"]>, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-2xl",
	xl: "max-w-4xl",
	full: "max-w-[90vw]",
};

const ModalRoot: Component<ModalRootProps> = (props) => {
	const [local, others] = splitProps(props, [
		"size",
		"children",
		"open",
		"defaultOpen",
		"onOpenChange",
		"static"
	]);

	const size = local.size ?? "md";

	const handleInteractOutside = (event: any) => {
		if (local.static) {
			event.preventDefault();
		}
	};

	const handleEscapeKeyDown = (event: any) => {
		if (local.static) {
			event.preventDefault();
		}
	};

	return (
		<Dialog.Root
			open={local.open}
			defaultOpen={local.defaultOpen}
			onOpenChange={local.onOpenChange}
		>
			<Portal>
				<Dialog.Overlay class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
				<Dialog.Content
					onInteractOutside={handleInteractOutside}
					onEscapeKeyDown={handleEscapeKeyDown}
					class={`modal-content fixed inset-x-0 top-20 mx-auto z-50 w-full ${SIZE_CLASS[size]}
						bg-gray-800 border border-gray-700
						rounded-lg shadow-lg text-gray-400`}
					{...others}
				>
					{local.children}
				</Dialog.Content>
			</Portal>
		</Dialog.Root>
	);
};

const ModalHeader: Component<{ children: JSX.Element }> = (props) => (
	<header class="flex items-center justify-between p-4 border-b border-gray-700">
		<Dialog.Title class="text-lg font-semibold leading-none tracking-tight">
			{props.children}
		</Dialog.Title>
		<Dialog.CloseButton
			class="cursor-pointer ml-2 text-gray-400 hover:text-white focus:outline-none"
			aria-label="Close"
		>
			<span aria-hidden="true" class="text-2xl leading-none">&times;</span>
		</Dialog.CloseButton>
	</header>
);

const ModalBody: Component<{ children: JSX.Element }> = (props) => (
	<div class="p-4">{props.children}</div>
);

const ModalFooter: Component<{ children: JSX.Element }> = (props) => (
	<footer class="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
		{props.children}
	</footer>
);

export const Modal = Object.assign(ModalRoot, {
	Header: ModalHeader,
	Body: ModalBody,
	Footer: ModalFooter,
	Trigger: Dialog.Trigger,
	Close: Dialog.CloseButton,
});

export default Modal;