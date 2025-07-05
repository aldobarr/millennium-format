import { createSortable, Id, maybeTransformStyle, SortableProvider } from '@thisbeyond/solid-dnd';
import { Pencil, Save } from 'lucide-solid';
import type { Accessor, Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { produce, SetStoreFunction } from 'solid-js/store';
import CategoryType from '../../enums/CategoryType';
import Categories from '../../interfaces/Categories';
import CategoryInterface from '../../interfaces/Category';
import SearchCardPreview from '../../interfaces/SearchCardPreview';
import { DeckBuilderTypes } from '../../util/DeckBuilder';
import { mainDeckCount } from '../DeckBuilder';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';
import CardComponent from './Card';

interface CategoryProps {
	category: CategoryInterface;
	searchCardPreview?: SearchCardPreview;
	categories: Categories;
	setCategories: SetStoreFunction<Categories>;
	decDeck: (id: number) => void;
	invalidCards?: Accessor<Set<string>>;
	invalidLegendaries?: Accessor<Set<string>>;
	hideCard?: { cardId: Id | undefined };
	isSearch?: boolean;
	isPreview?: boolean;
	canEdit: Accessor<boolean>;
}

const Category: Component<CategoryProps> = (props) => {
	const [editCategory, setEditCategory] = createSignal(false);
	const [newCategoryName, setNewCategoryName] = createSignal(props.category.name);
	const [confirmModal, setConfirmModal] = createSignal(false);

	const sortable = !props.isPreview && props.canEdit()
		? createSortable(props.category.id, {
				type: DeckBuilderTypes.CATEGORY,
				disabled: props.category.type !== CategoryType.MAIN,
				category: props.category,
			})
		: undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	const editThisCategory = () => {
		if (props.category.type !== CategoryType.MAIN) {
			return;
		}

		props.setCategories((categories) => {
			return {
				...categories,
				[props.category.id]: {
					...props.category,
					name: newCategoryName(),
				},
			};
		});

		setEditCategory(false);
	};

	const confirmDeleteCategory = () => {
		if (props.category.type !== CategoryType.MAIN || Object.keys(props.categories).filter(id => props.categories[id].type === CategoryType.MAIN).length <= 1) {
			return;
		}

		if (props.categories[props.category.id].cards.length > 0) {
			setConfirmModal(true);
		} else {
			deleteCategory();
		}
	};

	const deleteCategory = () => {
		if (props.category.type !== CategoryType.MAIN || Object.keys(props.categories).filter(id => props.categories[id].type === CategoryType.MAIN).length <= 1) {
			return;
		}

		if (props.categories[props.category.id].cards.length > 0) {
			props.categories[props.category.id].cards.forEach(card => props.decDeck(card.id));
		}

		props.setCategories(produce((categories) => {
			const order = categories[props.category.id].order;
			Object.keys(categories).forEach((id) => {
				if (categories[id].order > order) {
					categories[id].order--;
				}
			});

			delete categories[props.category.id];
		}));
	};

	const catLimit = () => {
		if (props.category.type === CategoryType.MAIN) {
			return 60;
		}

		return 15;
	};

	return (
		<div ref={sortable?.ref} style={style} class="relative" classList={{ 'opacity-25': sortable?.isActiveDraggable }}>
			<Show when={props.category.type !== CategoryType.DECK_MASTER && props.category.type !== CategoryType.SEARCH}>
				<div class="category-count" classList={{ invalid: props.category.cards.length > catLimit() }}>{props.category.cards.length}</div>
			</Show>
			<Show when={props.category.type === CategoryType.DECK_MASTER}>
				<div class="category-count" classList={{ invalid: mainDeckCount(props.categories) !== 60 }}>{mainDeckCount(props.categories)}</div>
			</Show>
			<Show when={props.category.type === CategoryType.MAIN && !props.isPreview && props.canEdit()}>
				<div class="category-delete" onClick={confirmDeleteCategory}></div>
			</Show>
			<div
				class={
					props.isSearch
						? 'category grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2 min-h-[212px] mt-4'
						: `h-full bg-gray-700 bg-opacity-40 p-2 md:p-6 my-2 mx-0 md:mx-2 md:my-0 rounded-lg text-center relative w-full`
				}
			>
				<Show when={!props.isSearch}>
					<Show
						when={!editCategory()}
						fallback={(
							<h2 class="title-font sm:text-2xl text-xl font-medium text-white mb-3">
								<form onSubmit={editThisCategory} class="flex flex-row justify-center">
									<Input
										type="text"
										name="new_category"
										value={newCategoryName()}
										handleChange={e => setNewCategoryName(e.currentTarget.value)}
										class="w-full"
										placeholder="Category Name"
									/>
									<button type="submit" class="cursor-pointer text-gray-200 hover:text-white ml-2">
										<Save />
									</button>
								</form>
							</h2>
						)}
					>
						<h2
							{...(props.category.type === CategoryType.MAIN ? sortable?.dragActivators ?? {} : {})}
							class="title-font flex flex-row justify-center sm:text-2xl text-xl font-medium text-gray-300 mb-3"
							classList={{ 'cursor-move': props.category.type === CategoryType.MAIN && props.canEdit() }}
						>
							<div>{props.category.name}</div>
							<Show when={props.category.type === CategoryType.MAIN && props.canEdit()}>
								<button type="button" class="cursor-pointer text-gray-300 hover:text-white ml-2" onClick={() => setEditCategory(true)}>
									<Pencil />
								</button>
							</Show>
						</h2>
					</Show>

					<div
						class={
							(props.category.type === CategoryType.DECK_MASTER)
								? 'grid grid-cols-1 justify-items-center min-h-[212px]'
								: 'grid grid-cols-category justify-items-center md:justify-items-start min-h-[212px]'
						}
					>
						<SortableProvider ids={props.category.cards.map(c => c.uid)}>
							<For each={props.category.cards}>
								{(card, index) => (
									<>
										<Show when={!!props.searchCardPreview && !!props.searchCardPreview.card && props.category.id === props.searchCardPreview.category && props.searchCardPreview.idx === index()}>
											<CardComponent
												card={props.searchCardPreview!.card!}
												category={props.category}
												isPreview={props.isPreview}
												invalid={!!props.invalidCards && props.invalidCards().has(card.uid)}
												invalidLegendary={!!props.invalidLegendaries && props.invalidLegendaries().has(card.uid)}
												canEdit={props.canEdit}
												isSearchCard
											/>
										</Show>
										<CardComponent
											card={card}
											category={props.category}
											isPreview={props.isPreview}
											invalid={!!props.invalidCards && props.invalidCards().has(card.uid)}
											invalidLegendary={!!props.invalidLegendaries && props.invalidLegendaries().has(card.uid)}
											hideCard={props.hideCard}
											canEdit={props.canEdit}
										/>
									</>
								)}
							</For>
							<Show when={!!props.searchCardPreview && !!props.searchCardPreview.card && props.category.id === props.searchCardPreview.category && props.category.cards.length === props.searchCardPreview.idx}>
								<CardComponent
									card={props.searchCardPreview!.card!}
									category={props.category}
									canEdit={props.canEdit}
									isSearchCard
								/>
							</Show>
						</SortableProvider>
					</div>
				</Show>
				<Show when={props.isSearch}>
					<For each={props.category.cards}>
						{card => (
							<CardComponent
								card={card}
								category={props.category}
								isPreview={props.isPreview}
								canEdit={props.canEdit}
								isSearch
							/>
						)}
					</For>
				</Show>
			</div>
			<Modal
				open={confirmModal()}
				onOpenChange={setConfirmModal}
				size="lg"
			>
				<Modal.Header>
					<h2 class="text-2xl font-bold">This Category Contains Cards!</h2>
				</Modal.Header>
				<Modal.Body>
					<div>Are you sure you want to delete it?</div>
					<div class="mt-2 flex justify-end">
						<Button type="button" onClick={deleteCategory} theme="danger" noSpinner>Yes</Button>
						<Button type="button" onClick={() => setConfirmModal(false)} theme="secondary" class="ml-2" noSpinner>Cancel</Button>
					</div>
				</Modal.Body>
			</Modal>
		</div>
	);
};

export default Category;
