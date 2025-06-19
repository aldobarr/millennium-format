import { For, Show } from 'solid-js';
import { createDroppable, createSortable, Id, maybeTransformStyle, SortableProvider } from '@thisbeyond/solid-dnd';
import type { Component } from 'solid-js';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import CardComponent from './Card';
import CategoryInterface from '../../interfaces/Category';
import SearchCardPreview from '../../interfaces/SearchCardPreview';

interface CategoryProps {
	category: CategoryInterface;
	searchCardPreview?: SearchCardPreview;
	hideCard?: {cardId: Id | undefined}
	isSearch?: boolean;
	isPreview?: boolean;
}

const Category: Component<CategoryProps> = (props) => {
	const sortable = !props.isPreview
		? createSortable(props.category.id, {
			type: DeckBuilderTypes.CATEGORY,
			disabled: props.category.is_dm,
			category: props.category
		}) : undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	return (
		<div
			ref={sortable?.ref}
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
					{...(!props.category.is_dm && !props.isSearch ? sortable?.dragActivators ?? {} : {})}
					class="title-font sm:text-2xl text-xl font-medium text-white mb-3"
					classList={{ 'cursor-move': !props.category.is_dm }}
				>
					{props.category.name}
				</h2>

				<div
					class={
						props.category.is_dm
							? 'grid grid-cols-1 justify-items-center min-h-[212px]'
							: 'grid grid-cols-category justify-items-center md:justify-items-start min-h-[212px]'
					}
				>
					<SortableProvider ids={props.category.cards.map(c => c.uid)}>
						<For each={props.category.cards}>
							{(card, index) => (
								<>
									<Show when={props.searchCardPreview && props.searchCardPreview.card && props.category.id === props.searchCardPreview.category && props.searchCardPreview.idx === index()}>
										<CardComponent
											card={props.searchCardPreview!.card!}
											categoryId={props.category.id}
											isPreview={props.isPreview}
											isSearchCard
										/>
									</Show>
									<CardComponent
										card={card}
										categoryId={props.category.id}
										isPreview={props.isPreview}
										hideCard={props.hideCard}
									/>
								</>
							)}
						</For>
						<Show when={props.searchCardPreview && props.category.id === props.searchCardPreview.category && props.category.cards.length === props.searchCardPreview.idx}>
							<CardComponent
								card={props.searchCardPreview!.card!}
								categoryId={props.category.id}
								isSearchCard
							/>
						</Show>
					</SortableProvider>
				</div>
			</Show>
			<Show when={props.isSearch}>
				<For each={props.category.cards}>
					{(card, index) => (
						<CardComponent
							card={card}
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
