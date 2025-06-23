import { createSignal, For, onMount, batch, createEffect, on, useContext } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import {
	DragDropProvider,
	DragDropSensors,
	DragOverlay,
	SortableProvider,
	Id,
	closestCenter,
	DragEventHandler,
	Droppable,
	Draggable,
	CollisionDetector,
} from '@thisbeyond/solid-dnd';
import type { Component } from 'solid-js';
import { v4 as uuid } from 'uuid';
import { DeckBuilderTypes } from '../util/DeckBuilder';
import { Input } from './ui/Input';
import { AppContext } from '../App';
import Big from 'big.js';
import CategoryComponent from './deckbuilder/Category';
import CardComponent from './deckbuilder/Card';
import Categories from '../interfaces/Categories';
import Card from '../interfaces/Card';
import DeckCount from '../interfaces/DeckCount';
import Category from '../interfaces/Category';
import Button from './ui/Button';
import SearchCardPreview from '../interfaces/SearchCardPreview';
import SearchCard from '../interfaces/SearchCard';

function sortByOrder(categories: Category[]) {
	const sorted = categories.map(item => ({ order: new Big(item.order), item }));
	sorted.sort((a, b) => a.order.cmp(b.order));
	return sorted.map(entry => entry.item);
}

export const DECK_MASTER_ID = 'deck-master';
export const SEARCH_CATEGORY_ID = 'search';

const DeckBuilder: Component = () => {
	const [hideCard, setHideCard] = createStore<{ cardId: Id | undefined }>({ cardId: undefined });
	const [searchCardPreview, setSearchCardPreview] = createStore<SearchCardPreview>({ card: undefined, idx: undefined, category: undefined });
	const [categories, setCategories] = createStore<Categories>({});
	const [deck, setDeck] = createStore<DeckCount>({});
	const [search, setSearch] = createSignal('');
	const [searchResults, setSearchResults] = createStore<{ cards: Card[]; errors: string[] }>({ cards: [], errors: [] });
	const [processing, setProcessing] = createSignal(false);
	const { appState } = useContext(AppContext);

	const incDeck = (id: number) => setDeck(id, v => (v || 0) + 1);
	const decDeck = (id: number) => setDeck(produce((old) => {
		if (!(id in old)) {
			return;
		}

		if (old[id] <= 1) {
			delete old[id];
			return;
		}

		old[id] -= 1;
	}));

	const addCategory = (id: Id, name: string, isDM = false) => {
		setCategories(id.toString(), {
			id: id.toString(),
			name,
			is_dm: isDM,
			order: Object.keys(categories).length + 1,
			cards: [],
		});
	};

	const addCard = (catId: string, searchCard: SearchCard) => {
		const card: Card = { uid: uuid(), ...searchCard };
		setCategories(catId, 'cards', cards => [...cards, card]);
		incDeck(searchCard.id);
	};

	onMount(() => {
		batch(async () => {
			addCategory(DECK_MASTER_ID, 'Deck Master', true);
			addCategory('extra', 'Extra Deck', false);
			addCategory('side', 'Side Deck', false);
			addCard(DECK_MASTER_ID, {
				id: 593,
				name: 'Dark Magician Girl',
				image:'https://ms.yugipedia.com//thumb/2/2a/DarkMagicianGirl-MAMA-EN-URPR-1E.png/300px-DarkMagicianGirl-MAMA-EN-URPR-1E.png',
				limit: 1
			});
		});
	});

	const categoryItems = () => sortByOrder(
		Object.values(categories),
	) as Category[];

	const categoryItemIds = () => categoryItems().map(category => category.id).concat([SEARCH_CATEGORY_ID]);
	const isSortableCategory = (sortable: Draggable | Droppable) => sortable.data.type === DeckBuilderTypes.CATEGORY;
	const previewMove = (draggable: Draggable, droppable: Droppable | null | undefined) => {
		if (!draggable || !droppable) {
			return;
		}

		const draggableIsCategory = isSortableCategory(draggable);
		const droppableIsCategory = isSortableCategory(droppable);

		if (draggableIsCategory) {
			setHideCard({ cardId: undefined });
			setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
			if (droppable.id === DECK_MASTER_ID) {
				return;
			}

			setCategories(produce((old) => {
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
			setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
			if (destCatId === SEARCH_CATEGORY_ID) {
				setHideCard({ cardId: draggable.id });
			}

			return;
		}

		setHideCard({ cardId: undefined });
		setCategories(produce((old) => {
			if (srcCatId === SEARCH_CATEGORY_ID) {
				let idx = 0;

				if (old[destCatId]) {
					if (!droppableIsCategory) {
						idx = old[destCatId].cards.findIndex(c => c.uid === droppable.id);
					} else {
						idx = old[destCatId].cards.length;
					}
				}

				setSearchCardPreview({ card: draggable.data.card, idx: idx, category: destCatId });
				return;
			} else {
				setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
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
		const oldSearchCardPreview = JSON.parse(JSON.stringify(searchCardPreview));
		setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
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
				setCategories(produce((old) => {
					const arr = old[srcCatId]?.cards;
					const idx = arr?.findIndex(c => c.uid === cardId) ?? -1;
					if (idx !== -1) {
						arr!.splice(idx, 1);
					}
				}));

				return;
			}

			if (deck[cardObj.id] && deck[cardObj.id] >= cardObj.limit) {
				return;
			}

			cardObj.uid = uuid();
			incDeck(cardObj.id);
			setCategories(produce((old) => {
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
				setCategories(produce((old) => {
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

		if (destCatId === DECK_MASTER_ID) {
			setCategories(produce((old) => {
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

		setCategories(produce((old) => {
			if (srcCatId === destCatId) {
				return;
			}

			const srcCards = srcCatId === SEARCH_CATEGORY_ID ? searchResults.cards : old[srcCatId]?.cards;
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

	const closestEntity: CollisionDetector = (draggable, droppables, context) => {
		const inside = (pt: { x: number; y: number }, rect: { left: number; right: number; top: number; bottom: number }) =>
			(pt.x >= rect.left && pt.x <= rect.right && pt.y >= rect.top && pt.y <= rect.bottom);

		const isDragCategory = isSortableCategory(draggable);
		const point = draggable.transformed.center;
		let containing = droppables.filter(d => inside(point, d.transformed));
		if (isDragCategory) {
			const categories = droppables.filter(isSortableCategory);
			containing = categories.filter(d => inside(point, d.transformed));
		}

		let target: Droppable | null = null;

		if (containing.length > 0) {
			const entityHit = containing.find(d => isSortableCategory(d) === isDragCategory);
			target = entityHit ?? containing[0];
		} else {
			const closestCat = closestCenter(draggable, droppables.filter(isSortableCategory), context);
			if (closestCat) {
				if (isSortableCategory(draggable)) {
					target = closestCat;
				} else {
					const closestCard = closestCenter(draggable, droppables.filter(d => !isSortableCategory(d) && d.data.category === closestCat.id), context);
					target = closestCard ?? closestCat;
				}
			}
		}

		return target;
	};

	const handleSearch = (e: SubmitEvent) => {
		e.preventDefault();

		if (processing()) {
			return;
		}

		setProcessing(true);
	};

	createEffect(on(processing, async (isProcessing) => {
		if (!isProcessing) {
			return;
		}

		const searchTerm = search().trim();
		if (searchTerm.length < 1) {
			setProcessing(false);
			return;
		}

		const dm = categories[DECK_MASTER_ID]?.cards?.length > 0 ? categories[DECK_MASTER_ID].cards[0].id : 0;
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			if (appState.auth.token) {
				headers['Authorization'] = `Bearer ${appState.auth.token}`;
			}

			const searchParams: {term: string, dm?: string} = {
				term: searchTerm,
			};

			if (dm > 0) {
				searchParams.dm = `${dm}`;
			}

			const res = await fetch(`${import.meta.env.VITE_API_URL}/search?` + new URLSearchParams(searchParams).toString(), {
				method: 'GET',
				headers: headers,
			});

			const response = await res.json();
			if (response.success) {
				setSearchResults({ cards: response.data.map((card: SearchCard) => ({ ...card, uid: uuid() })), errors: [] });
				setProcessing(false);
			} else {
				setSearchResults({ cards: [], errors: (Object.values(response.errors) as string[][]).flat() });
				setProcessing(false);
			}
		} catch (error) {
			console.error(error);
			setSearchResults({ cards: [], errors: ['An unknown error occurred.'] });
			setProcessing(false);
		}
	}));

	return (
		<DragDropProvider collisionDetector={closestEntity} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
			<DragDropSensors />
			<div class="m-6 md:m-12 px-6 py-12 flex flex-col-reverse md:flex-row items-start bg-gray-900">
				<SortableProvider ids={categoryItemIds()}>
					<div class="grid grid-rows-1 gap-2 w-full my-2 mx-0 md:mx-2 md:my-0 md:w-2/3">
						<For each={categoryItems()}>
							{category => (
								<CategoryComponent
									category={category}
									searchCardPreview={searchCardPreview}
									hideCard={hideCard}
								/>
							)}
						</For>
					</div>
					<div class="h-full bg-gray-700 bg-opacity-40 px-8 py-8 my-2 mx-0 md:mx-2 md:my-0 rounded-lg text-center relative w-full md:w-1/3">
						<form onSubmit={handleSearch}>
							<div class="flex flex-row w-full items-start">
								<div class="flex-auto">
									<Input
										type="text"
										name="search"
										class="mt-1 block w-full"
										value={search()}
										handleChange={e => setSearch(e.currentTarget.value)}
										errors={() => searchResults.errors}
									/>
								</div>
								<Button class="ml-4 mt-1" processing={processing}>
									Search
								</Button>
							</div>
						</form>
						<CategoryComponent
							category={{
								id: SEARCH_CATEGORY_ID,
								name: '',
								is_dm: false,
								order: -1,
								cards: searchResults.cards,
							}}
							isSearch
						/>
					</div>
				</SortableProvider>
			</div>
			<DragOverlay class="z-100">
				{(draggable) => {
					if (!draggable) {
						return null;
					}

					const entity = draggable.data;
					return isSortableCategory(draggable)
						? (
								<CategoryComponent
									category={entity.category}
									isPreview
								/>
							)
						: (
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
