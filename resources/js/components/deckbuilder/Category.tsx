import { For, Show } from 'solid-js';
import { createDroppable, createSortable, maybeTransformStyle, SortableProvider } from '@thisbeyond/solid-dnd';
import type { Component } from 'solid-js';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import CardComponent from './Card';
import CategoryInterface from '../../interfaces/Category';

interface CategoryProps {
	category: CategoryInterface;
	isSearch?: boolean;
	isPreview?: boolean;
}

const Category: Component<CategoryProps> = (props) => {
	const sortable = !props.isSearch && !props.isPreview
		? createSortable(props.category.id, {
			type: DeckBuilderTypes.CATEGORY,
			disabled: props.category.is_dm,
			category: props.category
		}) : undefined;

	const droppable = props.isSearch
		? createDroppable(props.category.id, {
			type: DeckBuilderTypes.CATEGORY,
			disabled: props.category.is_dm,
			category: props.category
		}) : undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	return (
		<div
			ref={!props.isSearch ? sortable?.ref : droppable?.ref}
			style={style}
			classList={{ 'opacity-25': sortable?.isActiveDraggable }}
			class={
				props.isSearch
					? 'category grid grid-cols-3 gap-2 min-h-[212px] mt-4'
					: `h-full bg-gray-700 bg-opacity-40 p-2 md:p-6 my-2 mx-0 md:mx-2 md:my-0 rounded-lg text-center relative w-full`
			}
		>
			<Show when={!props.isSearch}>
				<h2
					{...(!props.category.is_dm ? sortable?.dragActivators ?? {} : {})}
					class="title-font sm:text-2xl text-xl font-medium text-white mb-3"
					classList={{ 'cursor-move': !props.category.is_dm }}
				>
					{props.category.name}
				</h2>

				<div
					class={
						props.category.is_dm
							? 'grid grid-cols-1 justify-items-center min-h-[212px]'
							: 'flex flex-wrap justify-center md:justify-start min-h-[212px]'
					}
				>
					<SortableProvider ids={props.category.cards.map(c => c.id)}>
						<For each={props.category.cards}>
							{(card, index) => (
								<CardComponent
									card={card}
									index={index()}
									categoryId={props.category.id}
									isPreview={props.isPreview}
								/>
							)}
						</For>
					</SortableProvider>
				</div>
			</Show>
			<Show when={props.isSearch}>
				<For each={props.category.cards}>
					{(card, index) => (
						<CardComponent
							card={card}
							index={index()}
							categoryId={props.category.id}
							isPreview={props.isPreview}
							isSearch
						/>
					)}
				</For>
			</Show>
		</div>
	);
};

export default Category;
