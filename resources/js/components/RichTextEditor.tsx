import { DropdownMenu } from '@kobalte/core/dropdown-menu';
import type { Editor } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import FileHandler from '@tiptap/extension-file-handler';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Ban,
	Bold,
	ChevronDown,
	Heading,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	ImagePlus,
	Italic,
	Link as LinkIcon,
	List as ListBullet,
	ListOrdered,
	Palette,
	Redo2,
	SeparatorHorizontal,
	Strikethrough,
	Subscript as SubscriptIcon,
	Superscript as SuperscriptIcon,
	TextQuote,
	Underline as UnderlineIcon,
	Undo2,
} from 'lucide-solid';
import { Accessor, Component, For, JSX, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { createEditorTransaction, createTiptapEditor } from 'solid-tiptap';

interface RichTextEditorProps {
	html?: string | null;
	onChange: (html: string) => void;
	class?: string;
}

const RichTextEditor: Component<RichTextEditorProps> = (props) => {
	const [container, setContainer] = createSignal<HTMLDivElement>();

	const editor: Accessor<Editor | undefined> = createTiptapEditor(() => ({
		element: container()!,
		extensions: [
			StarterKit,
			Underline,
			Link,
			Image,
			Color,
			Subscript,
			Superscript,
			TaskItem,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			TextStyle,
			Highlight.configure({ multicolor: true }),
			Typography,
			FileHandler.configure({
				allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
				onDrop: (currentEditor, files, pos) => {
					files.forEach((file) => {
						const fileReader = new FileReader();

						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
							currentEditor.chain().insertContentAt(pos, {
								type: 'image',
								attrs: {
									src: fileReader.result,
								},
							}).focus().run();
						};
					});
				},
				onPaste: (currentEditor, files, htmlContent) => {
					files.forEach((file) => {
						if (htmlContent) {
							console.log(htmlContent);
							return false;
						}

						const fileReader = new FileReader();

						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
							currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
								type: 'image',
								attrs: {
									src: fileReader.result,
								},
							}).focus().run();
						};
					});
				},
			}),
		],
		editorProps: {
			attributes: {
				class: 'prose prose-invert p-4 focus:outline-none max-w-full h-full',
			},
		},
		content: props.html ?? '',
		onUpdate: ({ editor }) => {
			props.onChange(editor.getHTML());
			console.log(editor.getHTML());
		},
	}));

	onCleanup(() => {
		editor()?.destroy();
	});

	return (
		<div class={`rt-editor flex flex-col gap-2 ${props.class ?? ''}`}>
			<Show when={editor()} keyed>
				{instance => <Toolbar editor={instance} />}
			</Show>
			<div
				ref={setContainer}
				class="overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-inner h-[50vh]"
			/>
		</div>
	);
};

interface ToolbarProps {
	editor: Editor | undefined;
}

interface ToolbarEditorButtonProps {
	editor: Editor;
	class?: string;
	title: string;
	key: string;
	onChange: () => void;
	isActive?: (editor: Editor) => boolean;
	children: JSX.Element;
	disabled?: boolean;
}

const EditorButton: Component<ToolbarEditorButtonProps> = (props) => {
	const flag = createEditorTransaction(
		() => props.editor,
		(instance) => {
			if (props.isActive) {
				return props.isActive(instance);
			}

			return instance.isActive(props.key);
		},
	);

	return (
		<div>
			<button
				type="button"
				class={`${props.class ?? ''} p-2 rounded-md hover:bg-gray-700 active:bg-gray-600`}
				classList={{
					'bg-indigo-600 text-white': flag(),
					'opacity-40 cursor-not-allowed': props.disabled === true,
				}}
				title={props.title}
				onClick={props.onChange}
				disabled={!!props.disabled}
			>
				{props.children}
			</button>
		</div>
	);
};

const EditorDropItem: Component<ToolbarEditorButtonProps> = (props) => {
	const flag = createEditorTransaction(
		() => props.editor,
		(instance) => {
			if (props.isActive) {
				return props.isActive(instance);
			}

			return instance.isActive(props.key);
		},
	);

	return (
		<DropdownMenu.Item
			onClick={props.onChange}
			disabled={!!props.disabled}
			class={`dropdown-menu__item ${props.class ?? ''}`}
			classList={{
				'bg-indigo-600 text-white': flag(),
				'opacity-40 cursor-not-allowed': props.disabled === true,
			}}
		>
			{props.children}
		</DropdownMenu.Item>
	);
};

const Toolbar: Component<ToolbarProps> = (props) => {
	const editor = props.editor!;

	const highlighterListener = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (!target.closest('.rt-editor')) {
			setShowHighlight(false);
		}
	};

	onMount(() => {
		document.addEventListener('click', highlighterListener);
	});

	onCleanup(() => {
		document.removeEventListener('click', highlighterListener);
	});

	const dropdownClass = (open: boolean) => {
		return `dropdown-menu__trigger ${open ? 'bg-gray-800!' : 'bg-transparent!'} hover:bg-gray-700! gap-0! p-2! h-auto!`;
	};

	const [headingOpen, setHeadingOpen] = createSignal(false);

	const colors = ['#A7FFEB', '#CBF0F8', '#F28B82', '#D7AEFB', '#FFF475'];
	const [showHighlight, setShowHighlight] = createSignal(false);
	const [highlightColorInput, setHighlightColorInput] = createSignal<HTMLInputElement>();
	const handleHighlightColorChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		editor.chain().focus().toggleHighlight({ color: target.value }).run();
	};

	const [colorInput, setColorInput] = createSignal<HTMLInputElement>();
	const handleColorChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		editor.chain().focus().setColor(target.value).run();
	};

	return (
		<div class="flex flex-wrap gap-1 border border-gray-700 rounded-md p-2 bg-gray-900">
			<EditorButton key="undo" title="Undo" editor={editor} onChange={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
				<Undo2 size={18} />
			</EditorButton>
			<EditorButton key="redo" title="Redo" editor={editor} onChange={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
				<Redo2 size={18} />
			</EditorButton>

			<Separator />

			<DropdownMenu open={headingOpen()} onOpenChange={setHeadingOpen}>
				<DropdownMenu.Trigger class={dropdownClass(headingOpen())}>
					<Heading size={18} />
					<ChevronDown size={10} />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content class="dropdown-menu__content text-editor-menu">
						<EditorDropItem key="heading-1" title="Heading 1" editor={editor} onChange={() => editor.chain().focus().setHeading({ level: 1 }).run()} isActive={editor => editor.isActive('heading', { level: 1 })}>
							<Heading1 size={20} />
							<div class="dropdown-menu__item-right-slot">Heading 1</div>
						</EditorDropItem>
						<EditorDropItem key="heading-2" title="Heading 2" editor={editor} onChange={() => editor.chain().focus().setHeading({ level: 2 }).run()} isActive={editor => editor.isActive('heading', { level: 2 })}>
							<Heading2 size={20} />
							<div class="dropdown-menu__item-right-slot">Heading 2</div>
						</EditorDropItem>
						<EditorDropItem key="heading-3" title="Heading 3" editor={editor} onChange={() => editor.chain().focus().setHeading({ level: 3 }).run()} isActive={editor => editor.isActive('heading', { level: 3 })}>
							<Heading3 size={20} />
							<div class="dropdown-menu__item-right-slot">Heading 3</div>
						</EditorDropItem>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu>
			<EditorButton key="bullet-list" title="Bullet List" editor={editor} onChange={() => editor.chain().focus().toggleBulletList().run()}>
				<ListBullet size={18} />
			</EditorButton>
			<EditorButton key="ordered-list" title="Ordered List" editor={editor} onChange={() => editor.chain().focus().toggleOrderedList().run()}>
				<ListOrdered size={18} />
			</EditorButton>
			<EditorButton key="blockquote" title="Block Quote" editor={editor} onChange={() => editor.chain().focus().toggleBlockquote().run()}>
				<TextQuote size={18} />
			</EditorButton>

			<Separator />

			<EditorButton key="bold" title="Bold" editor={editor} onChange={() => editor.chain().focus().toggleBold().run()}>
				<Bold size={18} />
			</EditorButton>
			<EditorButton key="italic" title="Italic" editor={editor} onChange={() => editor.chain().focus().toggleItalic().run()}>
				<Italic size={18} />
			</EditorButton>
			<EditorButton key="underline" title="Underline" editor={editor} onChange={() => editor.chain().focus().toggleUnderline().run()}>
				<UnderlineIcon size={18} />
			</EditorButton>
			<EditorButton key="strike" title="Strike" editor={editor} onChange={() => editor.chain().focus().toggleStrike().run()}>
				<Strikethrough size={18} />
			</EditorButton>

			<Separator />

			<div class="relative">
				<Show when={showHighlight()}>
					<div class="absolute -top-14 -left-20 flex gap-1 rounded-md border border-gray-700 bg-gray-900 p-1 shadow highlighter-toolbar">
						<div class="relative">
							<EditorButton key="highlighter-color" title="Highlighter Color" editor={editor} onChange={() => highlightColorInput()?.click()}>
								<Palette size={18} />
							</EditorButton>
							<input ref={setHighlightColorInput} type="color" class="absolute opacity-0 w-0 h-0" onChange={handleHighlightColorChange} />
						</div>
						<For each={colors}>
							{color => (
								<EditorButton
									key={color}
									title={`Highlight with ${color}`}
									editor={editor}
									onChange={() => editor.chain().focus().toggleHighlight({ color }).run()}
									isActive={editor => editor.isActive('highlight', { color })}
								>
									<div class="w-4 h-4 rounded-full border border-gray-600" style={{ 'background-color': color }} />
								</EditorButton>
							)}
						</For>
						<Separator />
						<EditorButton
							key="unset-highlight"
							title="Unset Highlight"
							editor={editor}
							onChange={() => editor.chain().focus().unsetHighlight().run()}
						>
							<Ban size={18} />
						</EditorButton>
					</div>
				</Show>
				<EditorButton key="highlight" title="Highlight" editor={editor} onChange={() => setShowHighlight(!showHighlight())}>
					<Highlighter size={18} />
				</EditorButton>
			</div>
			<EditorButton
				key="link"
				title="Link"
				editor={editor}
				onChange={() => {
					const url = window.prompt('URL');
					if (url) {
						editor.chain().focus().toggleLink({ href: url }).run();
					}
				}}
			>
				<LinkIcon size={18} />
			</EditorButton>
			<EditorButton
				key="image"
				title="Image"
				editor={editor}
				onChange={() => editor.chain().insertContentAt(editor.state.selection.anchor, { type: 'filehandler' }).focus().run()}
			>
				<ImagePlus size={18} />
			</EditorButton>
			<div class="relative">
				<EditorButton key="color" title="Text Color" editor={editor} onChange={() => colorInput()?.click()}>
					<Palette size={18} />
				</EditorButton>
				<input ref={setColorInput} type="color" class="absolute opacity-0 w-0 h-0" onChange={handleColorChange} />
			</div>

			<Separator />

			<EditorButton key="superscript" title="Superscript" editor={editor} onChange={() => editor.chain().focus().toggleSuperscript().run()}>
				<SuperscriptIcon size={18} />
			</EditorButton>
			<EditorButton key="subscript" title="Subscript" editor={editor} onChange={() => editor.chain().focus().toggleSubscript().run()}>
				<SubscriptIcon size={18} />
			</EditorButton>
			<EditorButton key="subscript" title="Subscript" editor={editor} onChange={() => editor.chain().focus().setHorizontalRule().run()}>
				<SeparatorHorizontal size={18} />
			</EditorButton>

			<Separator />

			<EditorButton key="text-left" title="Align Text Left" editor={editor} onChange={() => editor.commands.toggleTextAlign('left')}>
				<AlignLeft size={18} />
			</EditorButton>
			<EditorButton key="text-center" title="Align Text Center" editor={editor} onChange={() => editor.commands.toggleTextAlign('center')}>
				<AlignCenter size={18} />
			</EditorButton>
			<EditorButton key="text-right" title="Align Text Right" editor={editor} onChange={() => editor.commands.toggleTextAlign('right')}>
				<AlignRight size={18} />
			</EditorButton>
			<EditorButton key="text-justify" title="Align Text Justify" editor={editor} onChange={() => editor.commands.toggleTextAlign('justify')}>
				<AlignJustify size={18} />
			</EditorButton>
		</div>
	);
};

function Separator() {
	return (
		<div class="mx-2 flex items-center text-white" aria-hidden="true">
			<div class="h-[80%] border-l border-gray-300" />
		</div>
	);
}

export default RichTextEditor;
