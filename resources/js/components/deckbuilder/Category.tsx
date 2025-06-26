import { createSignal, For, Show } from 'solid-js';
import { createSortable, Id, maybeTransformStyle, SortableProvider } from '@thisbeyond/solid-dnd';
import type { Component } from 'solid-js';
import { DECK_MASTER_ID, DeckBuilderTypes, isSpecialCategory } from '../../util/DeckBuilder';
import { produce, SetStoreFunction } from 'solid-js/store';
import { Pencil, Save } from 'lucide-solid';
import { Input } from '../ui/Input';
import CardComponent from './Card';
import CategoryInterface from '../../interfaces/Category';
import SearchCardPreview from '../../interfaces/SearchCardPreview';
import Categories from '../../interfaces/Categories';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface CategoryProps {
	category: CategoryInterface;
	searchCardPreview?: SearchCardPreview;
	categories: Categories;
	setCategories: SetStoreFunction<Categories>;
	decDeck: (id: number) => void;
	hideCard?: { cardId: Id | undefined };
	isSearch?: boolean;
	isPreview?: boolean;
}

const Category: Component<CategoryProps> = (props) => {
	const [editCategory, setEditCategory] = createSignal(false);
	const [newCategoryName, setNewCategoryName] = createSignal(props.category.name);
	const [confirmModal, setConfirmModal] = createSignal(false);

	const sortable = !props.isPreview
		? createSortable(props.category.id, {
				type: DeckBuilderTypes.CATEGORY,
				disabled: isSpecialCategory(props.category.id),
				category: props.category,
			})
		: undefined;

	const style = sortable ? maybeTransformStyle(sortable.transform) : undefined;

	const editThisCategory = () => {
		if (isSpecialCategory(props.category.id)) {
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
		if (isSpecialCategory(props.category.id) || Object.keys(props.categories).filter(id => !isSpecialCategory(id)).length <= 1) {
			return;
		}

		if (props.categories[props.category.id].cards.length > 0) {
			setConfirmModal(true);
		} else {
			deleteCategory();
		}
	};

	const deleteCategory = () => {
		if (isSpecialCategory(props.category.id) || Object.keys(props.categories).filter(id => !isSpecialCategory(id)).length <= 1) {
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

	return (
		<div ref={sortable?.ref} style={style} class="relative" classList={{ 'opacity-25': sortable?.isActiveDraggable }}>
			<Show when={!isSpecialCategory(props.category.id) && !props.isPreview && props.setCategories}>
				<div class="category-delete" onClick={confirmDeleteCategory}></div>
			</Show>
			<div
				class={
					props.isSearch
						? 'category grid grid-cols-3 gap-2 min-h-[212px] mt-4'
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
							{...(!isSpecialCategory(props.category.id) ? sortable?.dragActivators ?? {} : {})}
							class="title-font flex flex-row justify-center sm:text-2xl text-xl font-medium text-gray-300 mb-3"
							classList={{ 'cursor-move': !isSpecialCategory(props.category.id) }}
						>
							<div>{props.category.name}</div>
							<Show when={!isSpecialCategory(props.category.id) && props.setCategories}>
								<button type="button" class="cursor-pointer text-gray-300 hover:text-white ml-2" onClick={() => setEditCategory(true)}>
									<Pencil />
								</button>
							</Show>
						</h2>
					</Show>

					<div
						class={
							(props.category.id === DECK_MASTER_ID)
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
						{card => (
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
