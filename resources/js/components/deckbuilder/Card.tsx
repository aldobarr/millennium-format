import { Tooltip } from '@kobalte/core/tooltip';
import { createDraggable, createSortable, Id, maybeTransformStyle, useDragDropContext } from '@thisbeyond/solid-dnd';
import { RefreshCw } from 'lucide-solid';
import { Accessor, Component, createSignal, For, Show } from 'solid-js';
import { produce, SetStoreFunction } from 'solid-js/store';
import CategoryType from '../../enums/CategoryType';
import CardInterface from '../../interfaces/Card';
import Categories from '../../interfaces/Categories';
import Category from '../../interfaces/Category';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface CardProps {
	card: CardInterface;
	category: Category;
	invalid?: boolean;
	invalidLegendary?: boolean;
	hideCard?: { cardId: Id | undefined };
	isSearch?: boolean;
	isPreview?: boolean;
	isSearchCard?: boolean;
	setCategories?: SetStoreFunction<Categories>;
	canEdit: Accessor<boolean>;
}

const Card: Component<CardProps> = (props) => {
	const sortable = !!props.card && !props.isPreview && !props.isSearch && !props.isSearchCard && props.canEdit()
		? createSortable(props.card.uid, {
				type: DeckBuilderTypes.CARD,
				category: props.category.id,
				disabled: props.category.type === CategoryType.DECK_MASTER,
				card: props.card,
			})
		: undefined;

	const draggable = !!props.card && props.isSearch && !props.isSearchCard && props.canEdit()
		? createDraggable(props.card.uid, {
				type: DeckBuilderTypes.CARD,
				category: props.category.id,
				disabled: props.category.type === CategoryType.DECK_MASTER,
				card: props.card,
			})
		: undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	const [, { onDragStart, onDragEnd }] = useDragDropContext()!;

	const [selectedAlt, setSelectedAlt] = createSignal(props.card?.alternate?.id ?? 0);
	const [isDragging, setIsDragging] = createSignal(false);
	const [tooltipOpen, setTooltipOpen] = createSignal('');
	const [alternates, setAlternates] = createSignal(false);

	const closeAlternates = () => {
		setAlternates(false);
		setSelectedAlt(props.card?.alternate?.id ?? 0);
	};

	const setAlternate = () => {
		if (!props.setCategories || !props.canEdit() || props.isSearch || props.isPreview || props.isSearchCard || !props.card.alternates || props.card.alternates.length <= 1) {
			closeAlternates();
			return;
		}

		const index = props.category.cards.findIndex(card => card.uid === props.card.uid);
		if (index < 0) {
			closeAlternates();
			return;
		}

		props.setCategories(produce((categories) => {
			categories[props.category.id].cards[index].alternate = props.card.alternates?.find(alt => alt.id === selectedAlt()) ?? props.card.alternate;
		}));

		closeAlternates();
	};

	onDragStart(() => setIsDragging(true));
	onDragEnd(() => setIsDragging(false));

	return (
		<Tooltip open={tooltipOpen() === props.card.uid && !props.canEdit() && !props.isSearch && !props.isSearchCard && !props.isPreview}>
			<Tooltip.Trigger>
				<div
					ref={!props.isSearch ? sortable?.ref : draggable?.ref}
					{...(props.category.type !== CategoryType.DECK_MASTER ? (props.isSearch ? draggable?.dragActivators ?? {} : sortable?.dragActivators ?? {}) : {})}
					style={style}
					class="min-w-[144px] m-1"
					classList={{
						'opacity-25': sortable?.isActiveDraggable || props.isSearchCard,
						'cursor-move': props.category.type !== CategoryType.DECK_MASTER && !props.isSearchCard && props.canEdit(),
						'invisible': !props.card || (props.hideCard?.cardId === props.card?.uid),
						'group': props.canEdit() && !props.isSearch && !props.isPreview && !props.isSearchCard,
						'relative': !props.isSearch && !props.isPreview && !props.isSearchCard,
					}}
				>
					<img
						src={props.card?.alternate?.image ?? props.card?.image}
						alt={props.card?.name}
						class="card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in-out duration-200"
						classList={{
							'hover:scale-[2.08]': !isDragging() && !props.isSearchCard,
							'group-hover:scale-[2.08]': !isDragging() && !props.isSearch && !props.isPreview && !props.isSearchCard,
							'border-pulse': props.invalid || props.invalidLegendary,
							'legendary': props.invalidLegendary,
						}}
						draggable={false}
						onDragStart={e => e.preventDefault()}
						onClick={() => setTooltipOpen(props.card.uid)}
						onMouseLeave={() => setTooltipOpen('')}
					/>
					<Show when={props.canEdit() && !props.isSearch && !props.isPreview && !props.isSearchCard && props.card.alternates && props.card.alternates.length > 1}>
						<div class="absolute inset-0 left-44 top-[2.90rem] z-60 opacity-0 group-hover:opacity-100 group-hover:scale-[2.08] transition-all ease-in-out duration-50">
							<button
								class="
									cursor-pointer p-1 disabled:cursor-default rounded-l-sm font-semibold text-white uppercase tracking-widest
									border border-gray-100/50 hover:bg-gray-300/30
								"
								onclick={() => setAlternates(true)}
							>
								<RefreshCw size={12} />
							</button>
						</div>
					</Show>
				</div>
				<Show when={props.canEdit() && !props.isSearch && !props.isPreview && !props.isSearchCard && props.card.alternates && props.card.alternates.length > 1}>
					<Modal
						open={alternates()}
						onOpenChange={val => val ? setAlternates(true) : closeAlternates()}
						size="xl"
					>
						<Modal.Header>
							<h2 class="text-2xl font-bold">Alternate Art</h2>
						</Modal.Header>
						<Modal.Body>
							<div class="flex flex-wrap gap-2">
								<For each={props.card.alternates}>
									{alternate => (
										<img
											src={alternate.image}
											alt={props.card.name}
											class="card min-w-[144px] max-w-[144px] cursor-pointer"
											classList={{
												'border-3': alternate.id === selectedAlt(),
												'border-white': alternate.id === selectedAlt(),
												'rounded-md': alternate.id === selectedAlt(),
											}}
											onClick={() => setSelectedAlt(alternate.id)}
											draggable={false}
										/>
									)}
								</For>
							</div>
							<div class="flex flex-row justify-end mt-4">
								<Button
									type="button"
									onClick={() => setAlternate()}
								>
									Set Alternate
								</Button>
								<Button
									class="ml-2"
									theme="secondary"
									type="button"
									onClick={() => closeAlternates()}
								>
									Cancel
								</Button>
							</div>
						</Modal.Body>
					</Modal>
				</Show>
			</Tooltip.Trigger>
			<Tooltip.Content class="tooltip__content">
				<p innerHTML={props.card.description.replaceAll('\r\n', '<br>')} />
			</Tooltip.Content>
		</Tooltip>
	);
};

export default Card;
