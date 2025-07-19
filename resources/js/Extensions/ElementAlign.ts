import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		customExtension: {
			/**
			 * Set the element align attribute
			 * @param alignment The alignment
			 * @example editor.commands.setElementAlign('left')
			 */
			setElementAlign: (alignment: string) => ReturnType;
			/**
			 * Unset the element align attribute
			 * @example editor.commands.unsetElementAlign()
			 */
			unsetElementAlign: () => ReturnType;
			/**
			 * Toggle the element align attribute
			 * @param alignment The alignment
			 * @example editor.commands.toggleElementAlign('right')
			 */
			toggleElementAlign: (alignment: string) => ReturnType;
		};
	}
}

export interface ElementAlignOptions {
	/**
	 * The types where the text align attribute can be applied.
	 * @default []
	 * @example ['image', 'table']
	 */
	types: string[];
	/**
	 * The alignments which are allowed.
	 * @default ['left', 'center', 'right', 'justify']
	 * @example ['left', 'right']
	 */
	alignments: string[];
	/**
	 * The default alignment.
	 * @default null
	 * @example 'center'
	 */
	defaultAlignment: string | null;
}

export const ElementAlign = Extension.create<ElementAlignOptions>({
	name: 'elementAlign',

	addOptions() {
		return {
			types: ['image', 'table', 'heading', 'paragraph'],
			alignments: ['left', 'center', 'right'],
			defaultAlignment: null,
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					elementAlign: {
						default: null,
						parseHTML: (element) => {
							const ml = element.style.marginLeft;
							const mr = element.style.marginRight;
							const alignment = ml === 'auto' && mr === 'auto'
								? 'center'
								: ml === 'auto'
									? 'right'
									: mr === 'auto' ? 'left' : null;

							return alignment;
						},
						renderHTML: (attributes) => {
							if (!attributes.elementAlign) {
								return {};
							}

							if (attributes.elementAlign === 'right') {
								return { style: 'margin-left: auto;' };
							} else if (attributes.elementAlign === 'center') {
								return { style: 'margin-left: auto; margin-right: auto;' };
							} else if (attributes.elementAlign === 'left') {
								return { style: 'margin-right: auto;' };
							}

							return { };
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setElementAlign: (alignment: string) => ({ commands }) => {
				if (!this.options.alignments.includes(alignment)) {
					return false;
				}

				return this.options.types
					.map((type) => {
						if (['heading', 'paragraph'].includes(type)) {
							return commands.updateAttributes(type, { textAlign: alignment });
						}

						return commands.updateAttributes(type, { elementAlign: alignment });
					}).every(response => response);
			},
			unsetElementAlign: () => ({ commands }) => {
				return this.options.types
					.map(type => commands.resetAttributes(type, 'elementAlign'))
					.every(response => response);
			},
			toggleElementAlign: (alignment: string) => ({ editor, commands }) => {
				if (!this.options.alignments.includes(alignment)) {
					return false;
				}

				if (editor.isActive({ textAlign: alignment })) {
					return commands.unsetElementAlign();
				}

				return commands.setElementAlign(alignment);
			},
		};
	},
});
