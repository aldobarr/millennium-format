import { createDraggable, createSortable, maybeTransformStyle, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component, createSignal } from 'solid-js';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import { DECK_MASTER_ID } from '../DeckBuilder';
import CardInterface from '../../interfaces/Card';

interface CardProps {
	card: CardInterface;
	index: number;
	categoryId: string;
	isSearch?: boolean;
	isPreview?: boolean;
}

const Card: Component<CardProps> = (props) => {
	const sortable = !props.isPreview && !props.isSearch ? createSortable(props.card.id, {
		type: DeckBuilderTypes.CARD,
		category: props.categoryId,
		disabled: props.categoryId === DECK_MASTER_ID,
		card: props.card,
	}) : undefined;

	const draggable = props.isSearch ? createDraggable(props.card.id, {
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
			classList={{ "opacity-25": sortable?.isActiveDraggable, "cursor-move": props.categoryId !== DECK_MASTER_ID }}
		>
			<img
				src={props.card.image}
				alt={props.card.name}
				class={`card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in duration-200`}
				classList={{ 'hover:scale-[2.08]': !isDragging() }}
				draggable={false}
				onDragStart={(e) => e.preventDefault()}
			/>
		</div>
	);
};

export default Card;