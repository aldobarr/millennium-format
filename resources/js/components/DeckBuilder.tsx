import { createSignal, For, onMount, batch, createEffect, on } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import {
	DragDropProvider,
	DragDropSensors,
	DragOverlay,
	SortableProvider,
	Id,
	closestCorners,
	DragEventHandler,
	Droppable,
	Draggable,
	CollisionDetector,
	closestCenter,
} from '@thisbeyond/solid-dnd';
import type { Component } from 'solid-js';
import Big from 'big.js';
import { v4 as uuid } from 'uuid';
import CategoryComponent from './deckbuilder/Category';
import CardComponent from './deckbuilder/Card';
import Categories from '../interfaces/Categories';
import Card from '../interfaces/Card';
import DeckCount from '../interfaces/DeckCount';
import { DeckBuilderTypes } from '../util/DeckBuilder';
import Category from '../interfaces/Category';
import { Input } from './ui/Input';
import Button from './ui/Button';
import SearchCardPreview from '../interfaces/SearchCardPreview';

function sortByOrder(categories: Category[]) {
	const sorted = categories.map((item) => ({ order: new Big(item.order), item }));
	sorted.sort((a, b) => a.order.cmp(b.order));
	return sorted.map((entry) => entry.item);
}

export const DECK_MASTER_ID = 'deck-master';
export const SEARCH_CATEGORY_ID = 'search';

const DeckBuilder: Component = () => {
	const [searchCardPreview, setSearchCardPreview] = createStore<SearchCardPreview>({card: undefined, idx: undefined, category: undefined});
	const [categories, setCategories] = createStore<Categories>({});
	const [deck, setDeck] = createStore<DeckCount>({});
	const [search, setSearch] = createSignal('');
	const [searchResults, setSearchResults] = createSignal<Card[]>([]);
	const [searchErrors, setSearchErrors] = createSignal<string[]>([]);
	const [processing, setProcessing] = createSignal(false);

	const addCategory = (id: Id, name: string, isDM = false) => {
		setCategories(id.toString(), {
			id: id.toString(),
			name,
			is_dm: isDM,
			order: Object.keys(categories).length + 1,
			cards: []
		});
	};

	const addCard = (id: number, name: string, image: string, catId: Id) => {
		const card: Card = { uid: uuid(), id, name, image, limit: 3 };
		setCategories(catId.toString(), 'cards', (cards) => [...cards, card]);
		setDeck(id, (v) => (v || 0) + 1);
	};

	onMount(() => {
		batch(() => {
			addCategory(DECK_MASTER_ID, 'Deck Master', true);
			addCategory('monsters', 'Monsters');
			addCategory('spells', 'Spells');

			addCard(1, 'Dark Magician', 'https://ms.yugipedia.com//thumb/b/bf/DarkMagician-HAC1-EN-DUPR-1E.png/300px-DarkMagician-HAC1-EN-DUPR-1E.png', DECK_MASTER_ID);
			addCard(2, 'Dark Magician Girl', 'https://ms.yugipedia.com//thumb/2/2a/DarkMagicianGirl-MAMA-EN-URPR-1E.png/300px-DarkMagicianGirl-MAMA-EN-URPR-1E.png', 'monsters');
			addCard(3, 'Apprentice Magician', 'https://ms.yugipedia.com//thumb/2/2c/ApprenticeMagician-SGX1-EN-C-1E.png/300px-ApprenticeMagician-SGX1-EN-C-1E.png', 'monsters');

			addCard(4, 'Dark Magic Attack', 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png', 'spells');
			addCard(5, 'Dark Magic Curtain', 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png', 'spells');
			addCard(6, 'Veil of Darkness', 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png', 'spells');
			addCard(7, 'Dark Magic Attack', 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png', 'spells');
			addCard(8, 'Dark Magic Curtain', 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png', 'spells');
			addCard(9, 'Veil of Darkness', 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png', 'spells');
			addCard(10, 'Dark Magic Attack', 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png', 'spells');
			addCard(11, 'Dark Magic Curtain', 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png', 'spells');
			addCard(12, 'Veil of Darkness', 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png', 'spells');
		});
	});

	const categoryItems = () => sortByOrder(
		Object.values(categories)
    ) as Category[];

	const categoryItemIds = () => categoryItems().map((category) => category.id).concat([SEARCH_CATEGORY_ID]);

	const isSortableCategory = (sortable: Draggable | Droppable) => sortable.data.type === DeckBuilderTypes.CATEGORY;

	const incDeck = (id: number) => setDeck(id, v => (v || 0) + 1);
	const decDeck = (id: number) => setDeck(id, v => {
		if (!v || v <= 1) return undefined as any;
		return v - 1;
	});

	const previewMove = (draggable: Draggable, droppable: Droppable | null | undefined) => {
		if (!draggable || !droppable) {
			return;
		}

		const draggableIsCategory = isSortableCategory(draggable);
		const droppableIsCategory = isSortableCategory(droppable);

		if (draggableIsCategory) {
			setSearchCardPreview({card: undefined, idx: undefined, category: undefined});
			if (droppable.id === DECK_MASTER_ID) {
				return;
			}

			setCategories(produce(old => {
				const aOrder = old[draggable.id].order;
				const bOrder = old[droppable.id].order;
				old[draggable.id].order = bOrder;
				old[droppable.id].order = aOrder;
			}));

			return;
		}

		const srcCatId = draggable.data.category as string;
		const destCatId = droppableIsCategory ? droppable.id as string : droppable.data.category as string;

		if (srcCatId == DECK_MASTER_ID || destCatId == DECK_MASTER_ID || destCatId === SEARCH_CATEGORY_ID) {
			setSearchCardPreview({card: undefined, idx: undefined, category: undefined});
			return;
		}

		setCategories(produce(old => {
			if (srcCatId === SEARCH_CATEGORY_ID) {
				let idx = 0;

				if (old[destCatId]) {
					if (!droppableIsCategory) {
						idx = old[destCatId].cards.findIndex(c => c.uid === droppable.id);
					} else {
						idx = old[destCatId].cards.length;
					}
				}

				setSearchCardPreview({card: draggable.data.card, idx: idx, category: destCatId});
				return;
			} else {
				setSearchCardPreview({card: undefined, idx: undefined, category: undefined});
			}

			const cardId = draggable.id;
			const srcCards = old[srcCatId]?.cards;
			if (!srcCards) {
				return;
			}

			const cardIdx = srcCards.findIndex(c => c.uid === cardId);
			if (cardIdx === -1) {
				return;
			}

			const card = srcCatId === SEARCH_CATEGORY_ID ? JSON.parse(JSON.stringify(srcCards[cardIdx])) : srcCards[cardIdx];

			srcCards.splice(cardIdx, 1);
			if (destCatId === srcCatId) {
				if (droppableIsCategory) {
					srcCards.push(card);
				} else {
					let destIdx = srcCards.findIndex(c => c.uid === droppable.id);
					if (destIdx > -1 && destIdx > cardIdx) {
						destIdx -= 1;
					}

					srcCards.splice(destIdx, 0, card);
				}
			} else {
				const destCards = old[destCatId]?.cards;
				if (!destCards) {
					return;
				}

				const dupeIdx = destCards.findIndex(c => c.uid === cardId);
				if (dupeIdx !== -1) {
					destCards.splice(dupeIdx, 1);
				}

				if (droppableIsCategory) {
					destCards.push(card);
				} else {
					const destIdx = destCards.findIndex(c => c.uid === droppable.id);
					destCards.splice(destIdx, 0, card);
				}
			}
		}));
	};

	const finalizeMove = (draggable: Draggable, droppable: Droppable | null | undefined) => {
		let oldSearchCardPreview = JSON.parse(JSON.stringify(searchCardPreview));
		setSearchCardPreview({card: undefined, idx: undefined, category: undefined});
		if (!draggable || !droppable) {
			return;
		}

		const draggableIsCategory = isSortableCategory(draggable);
		const droppableIsCategory = isSortableCategory(droppable);

		if (draggableIsCategory) {
			return;
		}

		const srcCatId = draggable.data.category as string;
		const destCatId = droppableIsCategory ? droppable.id as string : droppable.data.category as string;
		const cardId = draggable.id;
		const cardObj: Card = (srcCatId === SEARCH_CATEGORY_ID ? JSON.parse(JSON.stringify(draggable.data.card)) : draggable.data.card) as Card;

		if (srcCatId === SEARCH_CATEGORY_ID) {
			if (destCatId === SEARCH_CATEGORY_ID) {
				setCategories(produce(old => {
					const arr = old[srcCatId]?.cards;
					const idx = arr?.findIndex(c => c.uid === cardId) ?? -1
					if (idx !== -1) {
						arr!.splice(idx, 1);
					}
				}));

				return;
			}

			cardObj.uid = uuid();
			incDeck(cardObj.id);
			setCategories(produce(old => {
				if (destCatId === DECK_MASTER_ID) {
					old[destCatId].cards = [cardObj];
					return;
				}

				old[destCatId]?.cards.splice(oldSearchCardPreview.idx ?? old[destCatId]?.cards.length, 0, cardObj);
			}));

			return;
		}

		if (srcCatId === DECK_MASTER_ID) {
			return;
		}

		if (destCatId === SEARCH_CATEGORY_ID) {
			if (srcCatId !== SEARCH_CATEGORY_ID) {
				setCategories(produce(old => {
					const arr = old[srcCatId]?.cards;
					const idx = arr?.findIndex(c => c.uid === cardId) ?? -1;
					if (idx !== -1) {
						arr!.splice(idx, 1);
					}
				}));

				decDeck(draggable.data.card.id);
			}

			return;
		}

		if (srcCatId === SEARCH_CATEGORY_ID && destCatId !== SEARCH_CATEGORY_ID) {
			incDeck(draggable.data.card.id);
		}

		if (destCatId === DECK_MASTER_ID) {
			setCategories(produce(old => {
				const dmCards = old[DECK_MASTER_ID].cards;
				const previousDm = dmCards[0];

				dmCards.splice(0, 1, cardObj);

				const srcCards = old[srcCatId].cards;
				const removalIdx = srcCards.findIndex(c => c.uid === cardId);
				if (removalIdx !== -1) {
					srcCards.splice(removalIdx, 1, previousDm);
				}
			}));

			return;
		}

		setCategories(produce(old => {
			if (srcCatId === destCatId) {
				return;
			}

			const srcCards = srcCatId === SEARCH_CATEGORY_ID ? searchResults() : old[srcCatId]?.cards;
			const idx = srcCards?.findIndex(c => c.uid === cardId) ?? -1;
			if (idx !== -1) {
				srcCards!.splice(idx, 1);
			}

			const destCards = old[destCatId]?.cards;
			if (!destCards) {
				return;
			}

			if (!destCards.some(c => c.uid === cardId)) {
				destCards.push(cardObj);
			}
		}));
	};

	const handleDragOver: DragEventHandler = ({ draggable, droppable }) => previewMove(draggable, droppable);

	const handleDragEnd: DragEventHandler = ({ draggable, droppable }) => finalizeMove(draggable, droppable);

	const closestEntity: CollisionDetector = (draggable: Draggable, droppables: Droppable[], context: { activeDroppableId: Id | null }) => {
		console.log(draggable, droppables);
		const closestCategory = closestCorners(
			draggable,
			droppables.filter((droppable) => isSortableCategory(droppable)),
			context
		);

		if (isSortableCategory(draggable)) {
			return closestCategory;
		}

		if (!closestCategory) {
			return null;
		}

		const closestCard = closestCorners(
			draggable,
			droppables.filter(
			(droppable) =>
				!isSortableCategory(droppable) &&
				droppable.data.category === closestCategory.id
			),
			context
		);

		if (!closestCard) {
			return closestCategory;
		}

		const changingCategory = draggable.data.category !== closestCategory.id;
		if (changingCategory) {
			const belowLastItem =
				closestCategory.data.category.cards.map((card: Card) => card.uid).at(-1) === closestCard.id
				&& draggable.transformed.center.y > closestCard.transformed.center.y;

			if (belowLastItem) {
				return closestCategory;
			}
		}

		return closestCard;
	};

	const handleSearch = (e: any) => {
		e.preventDefault();

		if (processing()) {
			return;
		}

		setProcessing(true);
	};

	createEffect(on(processing, (isProcessing) => {
		if (!isProcessing) {
			return;
		}

		const searchTerm = search().trim();
		if (searchTerm.length < 1) {
			setProcessing(false);
			return;
		}

		const dm = categories[DECK_MASTER_ID]?.cards?.length > 0 ? categories[DECK_MASTER_ID].cards[0].id : 0;
		fetch(`${import.meta.env.VITE_API_URL}/search?term=${encodeURIComponent(searchTerm)}&dm=${dm}`)
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					setSearchResults(data.results.map((card: any) => ({ ...card, uid: uuid() })));
					setSearchErrors([]);
					setProcessing(false);
				} else {
					setSearchResults([]);
					setSearchErrors([data.error]);
					setProcessing(false);
				}
			})
			.catch((e) => {
				console.error(e);
				setSearchResults([]);
				setSearchErrors([]);
				setProcessing(false);
			});
	}));

	return (
		<DragDropProvider collisionDetector={closestEntity} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
			<DragDropSensors />
			<div class="m-6 md:m-12 px-6 py-12 flex flex-col-reverse md:flex-row items-start bg-gray-900">
				<SortableProvider ids={categoryItemIds()}>
					<div class="grid grid-rows-1 gap-2 w-full my-2 mx-0 md:mx-2 md:my-0 md:w-2/3">
						<For each={categoryItems()}>{(category) => (
							<CategoryComponent
								category={category}
								searchCardPreview={searchCardPreview}
							/>
						)}</For>
					</div>
					<div class="h-full bg-gray-700 bg-opacity-40 px-8 py-8 my-2 mx-0 md:mx-2 md:my-0 rounded-lg text-center relative w-full md:w-1/3">
						<form onSubmit={handleSearch}>
							<div class="flex flex-row w-full">
								<div class="flex-auto">
									<Input
										type="text"
										name="search"
										class="mt-1 block w-full"
										value={search()}
										handleChange={(e) => setSearch(e.currentTarget.value)}
										errors={searchErrors()}
									/>
								</div>
								<Button class="ml-4" processing={processing()}>
									Search
								</Button>
							</div>
						</form>
						<CategoryComponent category={{
							id: SEARCH_CATEGORY_ID,
							name: '',
							is_dm: false,
							order: -1,
							cards: searchResults(),
						}} isSearch />
					</div>
				</SortableProvider>
			</div>
			<DragOverlay class="z-100">
				{(draggable) => {
					if (!draggable) {
						return null;
					}

					const entity = draggable.data;
					return isSortableCategory(draggable) ? (
						<div class="grid grid-rows-1 gap-2 w-full my-2 mx-0 md:mx-2 md:my-0 md:w-2/3">
							<CategoryComponent
								category={entity.category}
								isPreview
							/>
						</div>
					) : (
						<CardComponent
							card={entity.card}
							categoryId={entity.category}
							isPreview
						/>
					);
				}}
			</DragOverlay>
		</DragDropProvider>
	);
};

export default DeckBuilder;