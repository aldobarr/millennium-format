import { createDraggable, createSortable, Id, maybeTransformStyle, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component, createSignal } from 'solid-js';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import { DECK_MASTER_ID } from '../DeckBuilder';
import CardInterface from '../../interfaces/Card';

interface CardProps {
	card: CardInterface;
	categoryId: string;
	hideCard?: { cardId: Id | undefined };
	isSearch?: boolean;
	isPreview?: boolean;
	isSearchCard?: boolean;
}

const Card: Component<CardProps> = (props) => {
	const sortable = !props.isPreview && !props.isSearch && !props.isSearchCard ? createSortable(props.card.uid, {
		type: DeckBuilderTypes.CARD,
		category: props.categoryId,
		disabled: props.categoryId === DECK_MASTER_ID,
		card: props.card,
	}) : undefined;

	const draggable = props.isSearch && !props.isSearchCard ? createDraggable(props.card.uid, {
		type: DeckBuilderTypes.CARD,
		category: props.categoryId,
		disabled: props.categoryId === DECK_MASTER_ID,
		card: props.card,
	}) : undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	const [, { onDragStart, onDragEnd }] = useDragDropContext()!;

	const [isDragging, setIsDragging] = createSignal(false);

	onDragStart(() => setIsDragging(true));
	onDragEnd(() => setIsDragging(false));

	return (
		<div
			ref={!props.isSearch ? sortable?.ref : draggable?.ref}
			{...(props.categoryId !== DECK_MASTER_ID ? (props.isSearch ? draggable?.dragActivators ?? {} : sortable?.dragActivators ?? {}) : {})}
			style={style}
			class="min-w-[144px] m-1"
			classList={{
				"opacity-25": sortable?.isActiveDraggable || props.isSearchCard,
				"cursor-move": props.categoryId !== DECK_MASTER_ID && !props.isSearchCard,
				"hidden": props.hideCard?.cardId === props.card.uid
			}}
		>
			<img
				src={props.card.image}
				alt={props.card.name}
				class={`card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in duration-200`}
				classList={{ 'hover:scale-[2.08]': !isDragging() && !props.isSearchCard }}
				draggable={false}
				onDragStart={(e) => e.preventDefault()}
			/>
		</div>
	);
};

export default Card;