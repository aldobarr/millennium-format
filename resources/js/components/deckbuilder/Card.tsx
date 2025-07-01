import { createDraggable, createSortable, Id, maybeTransformStyle, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component, createSignal } from 'solid-js';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import CardInterface from '../../interfaces/Card';
import Category from '../../interfaces/Category';
import CategoryType from '../../enums/CategoryType';

interface CardProps {
	card: CardInterface;
	category: Category;
	hideCard?: { cardId: Id | undefined };
	isSearch?: boolean;
	isPreview?: boolean;
	isSearchCard?: boolean;
}

const Card: Component<CardProps> = (props) => {
	const sortable = !!props.card && !props.isPreview && !props.isSearch && !props.isSearchCard
		? createSortable(props.card.uid, {
				type: DeckBuilderTypes.CARD,
				category: props.category.id,
				disabled: props.category.type === CategoryType.DECK_MASTER,
				card: props.card,
			})
		: undefined;

	const draggable = !!props.card && props.isSearch && !props.isSearchCard
		? createDraggable(props.card.uid, {
				type: DeckBuilderTypes.CARD,
				category: props.category.id,
				disabled: props.category.type === CategoryType.DECK_MASTER,
				card: props.card,
			})
		: undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	const [, { onDragStart, onDragEnd }] = useDragDropContext()!;

	const [isDragging, setIsDragging] = createSignal(false);

	onDragStart(() => setIsDragging(true));
	onDragEnd(() => setIsDragging(false));

	return (
		<div
			ref={!props.isSearch ? sortable?.ref : draggable?.ref}
			{...(props.category.type !== CategoryType.DECK_MASTER ? (props.isSearch ? draggable?.dragActivators ?? {} : sortable?.dragActivators ?? {}) : {})}
			style={style}
			class="min-w-[144px] m-1"
			classList={{
				'opacity-25': sortable?.isActiveDraggable || props.isSearchCard,
				'cursor-move': props.category.type !== CategoryType.DECK_MASTER && !props.isSearchCard,
				'hidden': !props.card || (props.hideCard?.cardId === props.card?.uid),
			}}
		>
			<img
				src={props.card?.image}
				alt={props.card?.name}
				class="card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in duration-200"
				classList={{ 'hover:scale-[2.08]': !isDragging() && !props.isSearchCard }}
				draggable={false}
				onDragStart={e => e.preventDefault()}
			/>
		</div>
	);
};

export default Card;
