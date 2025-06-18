import { Accessor, Component, JSX, Setter } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Dialog } from '@kobalte/core/dialog';

export const Modal: Component<{
	show: Accessor<boolean>;
	close: Setter<boolean>;
	isStatic?: boolean;
	head?: JSX.Element | string | undefined;
	headClose?: boolean | undefined;
	children?: any;
	width?: string;
	center?: boolean;
	raw?: boolean;
}> = ({ show, close, isStatic = false, head, headClose, children, width = 'max-w-4xl', center = false, raw = false }) => {
	const handleClose = (val: boolean) => {
		if (!isStatic && !val) {
			document.activeElement instanceof HTMLElement && document.activeElement.blur();
			close(false);
		}
	};

	return (
		<Portal mount={document.body}>
			<Dialog open={show()} onOpenChange={handleClose} modal>
				<Dialog.Portal>
					<div class="fixed z-30 inset-0 overflow-y-auto">
						<div class={`flex ${center ? 'items-center' : 'items-start'} justify-center min-h-screen pt-4 px-4 pb-20 sm:text-center sm:block sm:p-0`}>
							<Dialog.Overlay class="fixed inset-0 bg-gray-500 bg-opacity-75" />
							<span class={`hidden sm:inline-block sm:align-middle ${center ? 'sm:h-screen' : 'sm:h[50vh]'}`}>&#8203;</span>
							<Dialog.Content class={`relative inline-block align-bottom ${!raw ? 'bg-gray-800 rounded-lg text-left shadow-xl sm:w-full' : ''} transform transition-all sm:my-8 sm:align-middle ${width}`}>
								{ head != undefined ? (
									<div class="px-2 pt-2">
										<div class="sm:flex sm:items-start">
											<div class="mt-3 sm:mt-0 sm:mx-3 text-left w-full">
												<Dialog.Title as="h2" class="text-lg leading-6 font-medium text-gray-100 flex justify-between items-center w-full">
													<div>
														{ head }
													</div>
													{ headClose && (
														<button onClick={() => close(false)} type="button" class="outline-none text-gray-300 bg-transparent hover:bg-gray-600 hover:text-gray-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
															<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
														</button>
													)}
												</Dialog.Title>
											</div>
										</div>
									</div>
								) : null }
								{children}
							</Dialog.Content>
						</div>
					</div>
				</Dialog.Portal>
			</Dialog>
		</Portal>
	);
}

export const ModalHead: Component<{children?: any, close: Setter<boolean> | null}> = ({ children, close = null }) => {
	return (
		<div class="px-2 pt-2">
			<div class="sm:flex sm:items-start">
				<div class="mt-3 sm:mt-0 sm:mx-3 text-left w-full">
					<Dialog.Title as="h2" class="text-lg leading-6 font-medium text-gray-100 flex justify-between items-center w-full">
						<div>
							{children}
						</div>
						{ close && (
							<button onClick={() => close(false)} type="button" class="outline-none text-gray-300 bg-transparent hover:bg-gray-600 hover:text-gray-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
							</button>
						)}
					</Dialog.Title>
				</div>
			</div>
		</div>
	);
}

export const ModalBody: Component<{children?: any}> = ({ children }) => {
	return (
		<div class="px-2 py-6">
			<div class="sm:flex sm:items-start">
				<div class="mt-3 text-gray-100 sm:mt-0 sm:mx-3 text-left w-full">
					{children}
				</div>
			</div>
		</div>
	);
}

export const ModalFoot: Component<{children?: any}> = ({ children }) => {
	return (
		<div class="px-2 pb-4 sm:flex sm:justify-end sm:mx-3">
			{ children }
		</div>
	);
}