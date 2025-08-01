import { Alert } from '@kobalte/core/alert';
import { Separator } from '@kobalte/core/separator';
import { Switch } from '@kobalte/core/switch';
import {
	closestCenter,
	CollisionDetector,
	DragDropProvider,
	DragDropSensors,
	DragEventHandler,
	Draggable,
	DragOverlay,
	Droppable,
	Id,
	SortableProvider,
} from '@thisbeyond/solid-dnd';
import Big from 'big.js';
import type { Component } from 'solid-js';
import { batch, createContext, createEffect, createSignal, For, on, onCleanup, Show, useContext } from 'solid-js';
import { createStore, produce, reconcile, SetStoreFunction, unwrap } from 'solid-js/store';
import { v4 as uuid } from 'uuid';
import { AppContext } from '../App';
import CardType from '../enums/CardType';
import CategoryType from '../enums/CategoryType';
import DeckType from '../enums/DeckType';
import { convertStringToEnum } from '../enums/enumHelpers';
import ApiResponse from '../interfaces/api/ApiResponse';
import Card from '../interfaces/Card';
import Categories from '../interfaces/Categories';
import Category from '../interfaces/Category';
import Deck from '../interfaces/Deck';
import DeckCount from '../interfaces/DeckCount';
import SearchCard from '../interfaces/SearchCard';
import SearchCardPreview from '../interfaces/SearchCardPreview';
import TransportCategory from '../interfaces/TransportCategory';
import { DECK_MASTER_MINIMUM_LEVEL, DeckBuilderTypes, EXTRA_DECK_LIMIT, MAIN_DECK_LIMIT, SEARCH_CATEGORY_ID, SIDE_DECK_LIMIT } from '../util/DeckBuilder';
import { arrayIntersectById } from '../util/Helpers';
import request from '../util/Requests';
import CardComponent from './deckbuilder/Card';
import CategoryComponent from './deckbuilder/Category';
import Button from './ui/Button';
import { Input } from './ui/Input';
import Label from './ui/Label';
import Pagination from './ui/Pagination';
import ValidationErrors from './ui/ValidationErrors';

function sortByOrder(categories: Category[]) {
	const sorted = categories.map(item => ({ order: new Big(item.order), item }));
	sorted.sort((a, b) => a.order.cmp(b.order));
	return sorted.map(entry => entry.item);
}

interface Point {
	x: number;
	y: number;
}

interface Rectangle {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

interface SpecialCategoryIds {
	DECK_MASTER_ID: string;
	EXTRA_DECK_ID: string;
	SIDE_DECK_ID: string;
}

const baseSpecialCategoryIds: SpecialCategoryIds = {
	DECK_MASTER_ID: '',
	EXTRA_DECK_ID: '',
	SIDE_DECK_ID: '',
};

export type SpecialCategoryIdsContextType = {
	specialCategoryIds: SpecialCategoryIds;
	setSpecialCategoryIds: SetStoreFunction<SpecialCategoryIds>;
};
export const SpecialCategoryIdsContext = createContext<SpecialCategoryIdsContextType>({} as SpecialCategoryIdsContextType);
const [specialCategoryIds, setSpecialCategoryIds] = createStore<SpecialCategoryIds>(baseSpecialCategoryIds);

interface DeckBuilderTypes {
	deckId?: number;
	readonly?: boolean;
}

const SCROLL_ZONE = 75;
const MAX_PIXEL_SCROLL = 20;
const MIN_PIXEL_SCROLL = 2;

export const mainDeckCount = (categories: Categories) =>
	Object.keys(categories).filter(catId => categories[catId].type === CategoryType.DECK_MASTER || categories[catId].type === CategoryType.MAIN)
		.map(catId => categories[catId].cards).flat().length;

const DeckBuilder: Component<DeckBuilderTypes> = (props) => {
	const [deckId, setDeckId] = createSignal<number | undefined>(props.deckId);
	const [canEdit, setCanEdit] = createSignal(true);
	const [hideCard, setHideCard] = createStore<{ cardId: Id | undefined }>({ cardId: undefined });
	const [searchCardPreview, setSearchCardPreview] = createStore<SearchCardPreview>({ card: undefined, idx: undefined, category: undefined });
	const [categories, setCategories] = createStore<Categories>({});
	const [deck, setDeck] = createStore<DeckCount>({});
	const [search, setSearch] = createSignal('');
	const [searchResults, setSearchResults] = createStore<{ cards: Card[]; errors: string[] }>({ cards: [], errors: [] });
	const [searchResultsPagination, setSearchResultsPagination] = createSignal<ApiResponse<Card[]>>({ success: true });
	const [processing, setProcessing] = createSignal(false);
	const [deckName, setDeckName] = createSignal<string>('');
	const [deckNameError, setDeckNameError] = createSignal<string>('');
	const [newCategory, setNewCategory] = createSignal<string>('');
	const [deckSuccessMessage, setDeckSuccessMessage] = createSignal<string>('');
	const [deckErrors, setDeckErrors] = createSignal<string[]>([]);
	const [invalidCards, setInvalidCards] = createSignal<Set<string>>(new Set<string>());
	const [invalidLegendaries, setInvalidLegendaries] = createSignal<Set<string>>(new Set<string>());
	const [strictBuilder, setStrictBuilder] = createSignal(false);
	const [draggableStartOffset, setDraggableStartOffset] = createSignal<Point>({ x: 0, y: 0 });
	const [autoScrollId, setAutoScrollId] = createSignal<number | undefined>(undefined);
	const [velocity, setVelocity] = createSignal(0);
	const [excludeDM, setExcludeDM] = createSignal(false);
	const [excludeMonsters, setExcludeMonsters] = createSignal(false);
	const [excludeSpells, setExcludeSpells] = createSignal(false);
	const [excludeTraps, setExcludeTraps] = createSignal(false);
	const { appState } = useContext(AppContext);

	const searchCategory: Category = {
		id: SEARCH_CATEGORY_ID,
		name: 'Search',
		order: -1,
		cards: [],
		type: CategoryType.SEARCH,
	};

	const resetState = () => {
		batch(() => {
			setCanEdit(true);
			setHideCard(reconcile({ cardId: undefined }));
			setSearchCardPreview(reconcile({ card: undefined, idx: undefined, category: undefined }));
			setCategories(reconcile({}));
			setDeck(reconcile({}));
			setSearch('');
			setSearchResults(reconcile({ cards: [], errors: [] }));
			setSearchResultsPagination({ success: true });
			setProcessing(false);
			setDeckName('');
			setDeckNameError('');
			setNewCategory('');
			setDeckSuccessMessage('');
			setDeckErrors([]);
			setInvalidCards(new Set<string>());
			setStrictBuilder(false);
			setDraggableStartOffset({ x: 0, y: 0 });
			setVelocity(0);
			cancelAutoscroll();
		});
	};

	const cancelAutoscroll = () => {
		if (autoScrollId() !== undefined) {
			cancelAnimationFrame(autoScrollId()!);
			setAutoScrollId(undefined);
		}
	};

	onCleanup(() => {
		document.body.style.overflow = '';
		cancelAutoscroll();
	});

	const incDeck = (id: number) => setDeck(produce((deck) => {
		if (!(id in deck)) {
			deck[id] = 0;
		}

		deck[id]++;
	}));

	const decDeck = (id: number) => setDeck(produce((deck) => {
		if (!(id in deck)) {
			return;
		}

		if (deck[id] <= 1) {
			delete deck[id];
			return;
		}

		deck[id]--;
	}));

	const addCategory = (id: string, name: string, type: CategoryType, order: number = -1, init: boolean = false) => {
		order = order < 0 ? Object.keys(categories).length : order;
		if (!init) {
			order -= 2;
			setCategories(produce((categories) => {
				categories[specialCategoryIds.EXTRA_DECK_ID].order++;
				categories[specialCategoryIds.SIDE_DECK_ID].order++;
			}));
		} else {
			if (type === CategoryType.DECK_MASTER) {
				setSpecialCategoryIds('DECK_MASTER_ID', id);
			} else if (type === CategoryType.EXTRA) {
				setSpecialCategoryIds('EXTRA_DECK_ID', id);
			} else if (type === CategoryType.SIDE) {
				setSpecialCategoryIds('SIDE_DECK_ID', id);
			}
		}

		setCategories(id, {
			id: id,
			name,
			type,
			order: order,
			cards: [],
		});
	};

	const addCard = (catId: string, searchCard: SearchCard) => {
		const cardType: CardType = convertStringToEnum(searchCard.type, CardType);
		const deckType: DeckType = convertStringToEnum(searchCard.deckType, DeckType);
		const card: Card = { uid: uuid(), ...searchCard, type: cardType, deckType };
		setCategories(catId, 'cards', cards => [...cards, card]);
		incDeck(searchCard.id);
	};

	createEffect(on(() => props.deckId, async () => {
		batch(async () => {
			resetState();
			setDeckId(props.deckId);

			if (!props.deckId || !appState.auth.token) {
				addCategory(uuid(), 'Deck Master', CategoryType.DECK_MASTER, -1, true);
				addCategory(uuid(), 'Main Deck', CategoryType.MAIN, -1, true);
				addCategory(uuid(), 'Extra Deck', CategoryType.EXTRA, -1, true);
				addCategory(uuid(), 'Side Deck', CategoryType.SIDE, -1, true);
				return;
			}

			try {
				const res = await request(`/decks/${props.deckId}`);

				const response = await res.json();
				if (!response.success) {
					throw new Error((response.errors as string[]).join(', '));
				}

				const deck: Deck = response.data;
				setDeckName(deck.name);
				setCanEdit(!props.readonly ? deck.canEdit : false);

				deck.categories.forEach((category) => {
					addCategory(category.id, category.name, category.type, category.order, true);
					category.cards.forEach(card => addCard(category.id, card));
				});

				revalidateDeck();
			} catch (error) {
				console.error('Error fetching deck:', error);
			}
		});
	}));

	const validateDeckAdd = (card: Card, category: Category) => {
		if (strictBuilder()) {
			const extraDeckCount = categories[specialCategoryIds.EXTRA_DECK_ID].cards.length;
			const sideDeckCount = categories[specialCategoryIds.SIDE_DECK_ID].cards.length;
			if (category.type === CategoryType.EXTRA && extraDeckCount >= EXTRA_DECK_LIMIT) {
				return false;
			} else if (category.type === CategoryType.SIDE && sideDeckCount >= SIDE_DECK_LIMIT) {
				return false;
			} else if ((category.type === CategoryType.DECK_MASTER || category.type === CategoryType.MAIN) && mainDeckCount(categories) >= MAIN_DECK_LIMIT) {
				return false;
			}
		}

		if (card.deckType === DeckType.EXTRA && category.type === CategoryType.MAIN) {
			return false;
		}

		if (card.deckType === DeckType.NORMAL && category.type === CategoryType.EXTRA) {
			return false;
		}

		if (card.type !== CardType.MONSTER && (category.type === CategoryType.DECK_MASTER || category.type === CategoryType.EXTRA)) {
			return false;
		}

		if (category.type === CategoryType.DECK_MASTER && card.deckType === DeckType.NORMAL && (card.level == null || card.level < DECK_MASTER_MINIMUM_LEVEL)) {
			return false;
		}

		if (strictBuilder() && card.legendary) {
			const fullDeck = Object.values(categories).map(cat => cat.cards).flat() as Card[];
			if (fullDeck.some(c => c.legendary && c.type === card.type)) {
				return false;
			}
		}

		if (deck[card.id] && deck[card.id] >= card.limit) {
			return false;
		}

		return true;
	};

	const validateDeckMove = (card: Card, source: Category, destination: Category) => {
		if (source.type === CategoryType.SEARCH || source.id === destination.id) {
			return true;
		}

		if (strictBuilder()) {
			const extraDeckCount = categories[specialCategoryIds.EXTRA_DECK_ID].cards.length;
			const sideDeckCount = categories[specialCategoryIds.SIDE_DECK_ID].cards.length;
			if (destination.type === CategoryType.EXTRA && source.type !== CategoryType.EXTRA && extraDeckCount >= EXTRA_DECK_LIMIT) {
				return false;
			} else if (destination.type === CategoryType.SIDE && source.type !== CategoryType.SIDE && sideDeckCount >= SIDE_DECK_LIMIT) {
				return false;
			} else if (
				(destination.type === CategoryType.DECK_MASTER || destination.type === CategoryType.MAIN)
				&& (source.type !== CategoryType.DECK_MASTER && source.type !== CategoryType.MAIN)
				&& mainDeckCount(categories) >= MAIN_DECK_LIMIT
			) {
				return false;
			}
		}

		if (card.deckType === DeckType.EXTRA && destination.type === CategoryType.MAIN) {
			return false;
		}

		if (card.deckType === DeckType.NORMAL && destination.type === CategoryType.EXTRA) {
			return false;
		}

		if (card.type !== CardType.MONSTER && (destination.type === CategoryType.DECK_MASTER || destination.type === CategoryType.EXTRA)) {
			return false;
		}

		if (destination.type === CategoryType.DECK_MASTER && card.deckType === DeckType.NORMAL && (card.level == null || card.level < DECK_MASTER_MINIMUM_LEVEL)) {
			return false;
		}

		return true;
	};

	const revalidateDeck = () => {
		const cards = new Set<string>();
		const legendaryCards = new Set<string>();
		const deckMaster = categories[specialCategoryIds.DECK_MASTER_ID].cards[0] ?? null;

		if (deckMaster) {
			if (deckMaster.type !== CardType.MONSTER) {
				cards.add(deckMaster.uid);
			} else if (deckMaster.deckType === DeckType.NORMAL && (deckMaster.level == null || deckMaster.level < DECK_MASTER_MINIMUM_LEVEL)) {
				cards.add(deckMaster.uid);
			}
		}

		const legendaries = new Map<CardType, Card>();
		for (const catId in categories) {
			const category = categories[catId];
			if (category.type === CategoryType.SEARCH || category.type === CategoryType.DECK_MASTER) {
				continue;
			}

			for (const card of category.cards) {
				if (card.tags.length > 0 && deckMaster && deckMaster.tags.length > 0) {
					const matchingTags = arrayIntersectById(deckMaster.tags, card.tags);
					if (matchingTags.length <= 0) {
						cards.add(card.uid);
					}
				}

				if (card.legendary) {
					if (legendaries.has(card.type)) {
						legendaryCards.add(card.uid);
						legendaryCards.add(legendaries.get(card.type)!.uid);
					} else {
						legendaries.set(card.type, card);
					}
				}
			}
		}

		setInvalidCards(cards);
		setInvalidLegendaries(legendaryCards);
	};

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
			if (draggable.data.category.type !== CategoryType.MAIN) {
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
		const source = srcCatId === SEARCH_CATEGORY_ID ? searchCategory : categories[srcCatId];
		const destCatId = droppableIsCategory ? droppable.id as string : droppable.data.category as string;
		const destination = destCatId === SEARCH_CATEGORY_ID ? searchCategory : categories[destCatId];

		if (!validateDeckMove(draggable.data.card, source, destination)) {
			return;
		}

		if (source.type === CategoryType.DECK_MASTER || destination.type === CategoryType.DECK_MASTER || destination.type === CategoryType.SEARCH) {
			setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
			if (destination.type === CategoryType.SEARCH) {
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

			const card = srcCards[cardIdx];

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
					destCards.splice(destCards.findIndex(c => c.uid === droppable.id), 0, card);
				}
			}
		}));
	};

	const finalizeMove = (draggable: Draggable, droppable: Droppable | null | undefined) => {
		try {
			const oldSearchCardPreview = JSON.parse(JSON.stringify(unwrap(searchCardPreview)));
			setSearchCardPreview({ card: undefined, idx: undefined, category: undefined });
			if (!draggable || !droppable) {
				return;
			}

			const draggableIsCategory = isSortableCategory(draggable);
			const droppableIsCategory = isSortableCategory(droppable);

			if (draggableIsCategory) {
				return;
			}

			let srcCatId = draggable.data.category as string;
			const destCatId = droppableIsCategory ? droppable.id as string : droppable.data.category as string;
			const cardId = draggable.id;
			const cardObj: Card = (srcCatId === SEARCH_CATEGORY_ID ? JSON.parse(JSON.stringify(draggable.data.card)) : draggable.data.card) as Card;

			if (srcCatId === SEARCH_CATEGORY_ID) {
				if (destCatId === SEARCH_CATEGORY_ID) {
					setCategories(produce((cats) => {
						const arr = cats[srcCatId]?.cards;
						const idx = arr?.findIndex(c => c.uid === cardId) ?? -1;
						if (idx !== -1) {
							arr!.splice(idx, 1);
						}
					}));

					return;
				}

				if (!validateDeckAdd(cardObj, categories[destCatId])) {
					return;
				}

				cardObj.uid = uuid();
				incDeck(cardObj.id);
				setCategories(produce((cats) => {
					if (cats[destCatId]?.type === CategoryType.DECK_MASTER) {
						if ((cats[destCatId]?.cards ?? []).length > 0) {
							decDeck(cats[destCatId].cards[0].id);
						}

						cats[destCatId].cards = [cardObj];
						return;
					}

					if (cats[destCatId]) {
						cats[destCatId].cards.splice(oldSearchCardPreview.idx ?? cats[destCatId].cards.length, 0, cardObj);
					}
				}));

				return;
			}

			if (categories[srcCatId]?.type === CategoryType.DECK_MASTER) {
				return;
			}

			if (destCatId === SEARCH_CATEGORY_ID) {
				if (srcCatId !== SEARCH_CATEGORY_ID) {
					setCategories(produce((cats) => {
						const arr = cats[srcCatId]?.cards;
						const idx = arr?.findIndex(c => c.uid === cardId) ?? -1;
						if (idx !== -1) {
							arr!.splice(idx, 1);
						}
					}));

					decDeck(draggable.data.card.id);
				}

				return;
			}

			const source = categories[srcCatId];
			const destination = categories[destCatId];
			if (!validateDeckMove(draggable.data.card, source, destination)) {
				return;
			}

			if (destination.type === CategoryType.DECK_MASTER) {
				setCategories(produce((cats) => {
					const previousDm = cats[specialCategoryIds.DECK_MASTER_ID].cards.length > 0 ? cats[specialCategoryIds.DECK_MASTER_ID].cards[0] : null;
					const originalSrcCatId = srcCatId;
					if (previousDm) {
						// Ensure the previous DM doesn't end up somewhere they shouldn't.
						if (previousDm.deckType === DeckType.EXTRA && source.type !== CategoryType.EXTRA && source.type !== CategoryType.SIDE) {
							if (cats[specialCategoryIds.EXTRA_DECK_ID].cards.length < EXTRA_DECK_LIMIT) {
								srcCatId = specialCategoryIds.EXTRA_DECK_ID;
							} else if (cats[specialCategoryIds.SIDE_DECK_ID].cards.length < SIDE_DECK_LIMIT) {
								srcCatId = specialCategoryIds.SIDE_DECK_ID;
							} else {
								return;
							}
						} else if (previousDm.deckType === DeckType.NORMAL && source.type !== CategoryType.MAIN) {
							if (mainDeckCount(cats) < MAIN_DECK_LIMIT) {
								srcCatId = Object.keys(categories).filter(catId => categories[catId].type === CategoryType.MAIN)[0] ?? '';
								if (srcCatId.length < 1) {
									return;
								}
							} else {
								return;
							}
						}
					}

					cats[specialCategoryIds.DECK_MASTER_ID].cards.splice(0, 1, cardObj);

					const srcCards = cats[srcCatId]?.cards ?? [];
					const removalIdx = cats[originalSrcCatId]?.cards.findIndex(c => c.uid === cardId) ?? -1;
					if (removalIdx !== -1) {
						if (originalSrcCatId !== srcCatId) {
							cats[originalSrcCatId]?.cards.splice(removalIdx, 1);
							if (previousDm) {
								srcCards.push(previousDm);
							}
						} else {
							srcCards.splice(removalIdx, 1);
							if (previousDm) {
								srcCards.push(previousDm);
							}
						}
					}
				}));

				return;
			}

			setCategories(produce((cats) => {
				if (srcCatId === destCatId) {
					return;
				}

				const srcCards = srcCatId === SEARCH_CATEGORY_ID ? searchResults.cards : cats[srcCatId]?.cards;
				const idx = srcCards?.findIndex(c => c.uid === cardId) ?? -1;
				if (idx !== -1) {
					srcCards!.splice(idx, 1);
				}

				const destCards = cats[destCatId]?.cards;
				if (!destCards) {
					return;
				}

				if (!destCards.some(c => c.uid === cardId)) {
					destCards.push(cardObj);
				}
			}));
		} finally {
			cancelAutoscroll();
			document.body.style.overflow = '';
			setDraggableStartOffset({ x: 0, y: 0 });
			revalidateDeck();
		}
	};

	const handleDragStart: DragEventHandler = () => {
		document.body.style.overflow = 'hidden';

		setDraggableStartOffset({
			x: window.scrollX,
			y: window.scrollY,
		});
	};

	createEffect(on(velocity, (v) => {
		if (v === 0) {
			cancelAutoscroll();
			return;
		}

		if (autoScrollId() !== undefined) {
			cancelAnimationFrame(autoScrollId()!);
		}

		const scroll = () => {
			window.scrollBy(0, v);
			setAutoScrollId(requestAnimationFrame(scroll));
		};

		setAutoScrollId(requestAnimationFrame(scroll));
	}));

	const handleDragMove = (draggable: Draggable) => {
		const y = draggable.transformed.center.y;
		const speed = MAX_PIXEL_SCROLL - MIN_PIXEL_SCROLL;

		if (y > window.innerHeight - SCROLL_ZONE) {
			const multiplier = (y - (window.innerHeight - SCROLL_ZONE)) / SCROLL_ZONE;
			setVelocity((speed * multiplier) + MIN_PIXEL_SCROLL);
		} else if (draggable.transformed.center.y < SCROLL_ZONE) {
			const multiplier = (SCROLL_ZONE - y) / SCROLL_ZONE;
			setVelocity(-1 * Math.abs((speed * multiplier) + MIN_PIXEL_SCROLL));
		} else {
			setVelocity(0);
		}
	};

	const handleDragOver: DragEventHandler = ({ draggable, droppable }) => previewMove(draggable, droppable);

	const handleDragEnd: DragEventHandler = ({ draggable, droppable }) => finalizeMove(draggable, droppable);

	const scrollAwareDraggable = (draggable: Draggable): Draggable => {
		if (draggableStartOffset().y === 0 || window.scrollY === 0) {
			return draggable;
		}

		const dragClone = JSON.parse(JSON.stringify(unwrap(draggable)));
		dragClone.transformed = {
			...dragClone.transformed,
			center: {
				x: draggable.transformed.center.x + (window.scrollX - draggableStartOffset().x),
				y: draggable.transformed.center.y + (window.scrollY - draggableStartOffset().y),
			},
		};

		return dragClone;
	};

	const closestEntity: CollisionDetector = (draggable, droppables, context) => {
		const inside = (pt: Point, rect: Rectangle) =>
			(pt.x >= rect.left && pt.x <= rect.right && pt.y >= rect.top && pt.y <= rect.bottom);

		handleDragMove(draggable);
		const isDragCategory = isSortableCategory(draggable);
		const draggableScrollAware = scrollAwareDraggable(draggable);
		const point = draggableScrollAware.transformed.center;
		let containing = droppables.filter(d => inside(point, d.layout));

		if (isDragCategory) {
			const categories = droppables.filter(c => c.data.category?.type === CategoryType.MAIN && isSortableCategory(c));
			containing = categories.filter(d => inside(point, d.layout));
		}

		let target: Droppable | null = null;

		if (containing.length > 0) {
			const entityHit = containing.find(d => isSortableCategory(d) === isDragCategory);
			target = entityHit ?? containing[0];
		} else {
			const closestCat = closestCenter(draggableScrollAware, droppables.filter(c => c.data.category?.type === CategoryType.MAIN && isSortableCategory(c)), context);
			if (closestCat) {
				if (isDragCategory) {
					target = closestCat;
				} else {
					const closestCard = closestCenter(draggableScrollAware, droppables.filter(d => !isSortableCategory(d) && d.data.category === closestCat.id), context);
					target = closestCard ?? closestCat;
				}
			}
		}

		return target;
	};

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();

		if (processing()) {
			return;
		}

		setProcessing(true);
		const searchTerm = search().trim();
		if (searchTerm.length < 1) {
			setProcessing(false);
			return;
		}

		const dm = !excludeDM() && categories[specialCategoryIds.DECK_MASTER_ID]?.cards?.length > 0 ? categories[specialCategoryIds.DECK_MASTER_ID].cards[0].id : 0;
		try {
			const searchParams = new URLSearchParams({
				term: searchTerm,
			});

			if (dm > 0) {
				searchParams.set('dm', `${dm}`);
			}

			if (excludeMonsters()) {
				searchParams.set('exclude_monsters', '1');
			}

			if (excludeSpells()) {
				searchParams.set('exclude_spells', '1');
			}

			if (excludeTraps()) {
				searchParams.set('exclude_traps', '1');
			}

			const res = await request('/search?' + searchParams.toString());

			const response = await res.json();
			if (response.success) {
				setSearchResults({ cards: response.data.map((card: SearchCard) => ({
					...card,
					uid: uuid(),
					type: convertStringToEnum(card.type, CardType),
					deckType: convertStringToEnum(card.deckType, DeckType),
				})), errors: [] });
				setSearchResultsPagination(response);
				setProcessing(false);
			} else {
				setSearchResults({ cards: [], errors: (Object.values(response.errors) as string[][]).flat() });
				setSearchResultsPagination({ success: false });
				setProcessing(false);
			}
		} catch (error) {
			console.error(error);
			setSearchResults({ cards: [], errors: ['An unknown error occurred.'] });
			setSearchResultsPagination({ success: false });
			setProcessing(false);
		}
	};

	const updateSearchResults = (newData: ApiResponse<Card[]>) => {
		if (!newData.success) {
			return;
		}

		setSearchResultsPagination(newData);
		setSearchResults({ cards: newData.data!.map((card: SearchCard) => ({
			...card,
			uid: uuid(),
			type: convertStringToEnum(card.type, CardType),
			deckType: convertStringToEnum(card.deckType, DeckType),
		})), errors: [] });
	};

	const submitNewCategory = (e: SubmitEvent) => {
		e.preventDefault();

		const name = newCategory().trim();
		if (name.length < 1) {
			return;
		}

		addCategory(uuid(), name, CategoryType.MAIN);
		setNewCategory('');
	};

	const getDeckForTransport = () => {
		const deck: TransportCategory[] = [];
		for (const catId in categories) {
			const category = categories[catId];
			deck.push({
				id: category.id,
				name: category.name,
				type: category.type,
				order: category.order,
				cards: category.cards.map(card => ({ id: card.id, alternate: card.alternate?.id ?? null })),
			});
		}

		return deck;
	};

	const submitDeck = async (e: SubmitEvent) => {
		e.preventDefault();

		setDeckNameError('');
		if (!appState.auth.token) {
			setDeckErrors(['Unauthenticated user. Please log in to save your deck.']);
			return;
		}

		if (deckName().trim().length < 1) {
			setDeckNameError('Deck name cannot be empty.');
			return;
		}

		const method = deckId() ? 'PUT' : 'POST';
		const url = `/decks` + (deckId() ? `/${deckId()}` : '');

		try {
			const res = await request(url, {
				method: method,
				body: JSON.stringify({
					name: deckName().trim(),
					categories: getDeckForTransport(),
				}),
			});

			const response = await res.json();
			if (!response.success) {
				setDeckErrors((Object.values(response.errors) as string[][]).flat());
				return;
			}

			if (method === 'POST') {
				setDeckId(Number(response.data));
			}

			setDeckSuccessMessage('Your deck has been saved!');
			setTimeout(() => setDeckSuccessMessage(''), 3000);
		} catch (error) {
			console.error('Error saving deck:', error);
			setDeckErrors(['An error occurred while saving the deck. Please try again later.']);
		}
	};

	const validateDeck = async () => {
		setDeckErrors([]);

		try {
			const res = await request('/decks/validate', {
				method: 'PUT',
				body: JSON.stringify({ categories: getDeckForTransport() }),
			});

			const response = await res.json();
			if (!response.success) {
				setDeckErrors((Object.values(response.errors) as string[][]).flat());
				return;
			}

			setDeckSuccessMessage('Your deck is format legal!');
			setTimeout(() => setDeckSuccessMessage(''), 3000);
		} catch (error) {
			console.error('Error validating deck:', error);
			setDeckErrors(['An error occurred while validating this deck. Please try again later.']);
		}
	};

	return (
		<SpecialCategoryIdsContext.Provider value={{ specialCategoryIds, setSpecialCategoryIds }}>
			<Show
				when={canEdit() && !!appState.auth.token}
				fallback={(
					<h1 class="mx-6 mb-2 mt-6 md:mx-12 md:my-6 text-3xl font-bold mb-4 text-start">
						<div class="mb-2">{appState.auth.token !== null ? deckName() : 'Deck Builder'}</div>
						<Separator />
					</h1>
				)}
			>
				<div class="mx-6 mb-2 mt-6 md:mx-12 md:my-6 px-6 py-8 bg-gray-900 rounded-md">
					<Show when={deckSuccessMessage().length > 0}>
						<Alert class="alert alert-success mb-4 text-start">
							<div><strong class="font-bold">Success!</strong></div>
							<div>{deckSuccessMessage()}</div>
						</Alert>
					</Show>
					<ValidationErrors message="Deck Invalid!" errors={deckErrors} close={setDeckErrors} class="text-start" />
					<div class="flex flex-col md:flex-row w-full items-start">
						<form class="flex-auto flex flex-row" onSubmit={submitDeck}>
							<div class="flex-auto flex flex-col">
								<Label for="deck_name" class="leading-7 text-sm text-gray-100 self-start" value="Deck Name" />
								<Input
									type="text"
									name="deck_name"
									class="mt-1 block w-full"
									value={deckName()}
									errors={deckNameError}
									handleChange={e => setDeckName(e.currentTarget.value)}
									darkBg
								/>
							</div>
							<div class="flex flex-col">
								<div class="h-[29px]"></div>
								<Button class="mr-4 ml-4 mt-1 h-[40px]" type="submit">
									Save Deck
								</Button>
							</div>
						</form>
						<form class="flex-auto flex flex-row" onSubmit={submitNewCategory}>
							<div class="flex-auto flex flex-col">
								<Label for="new_category" class="leading-7 text-sm text-gray-100 self-start" value="New Category" />
								<Input
									type="text"
									name="new_category"
									class="mt-1 block w-full"
									value={newCategory()}
									handleChange={e => setNewCategory(e.currentTarget.value)}
									darkBg
								/>
							</div>
							<div class="flex flex-col">
								<div class="h-[29px]"></div>
								<Button class="ml-4 mt-1 h-[40px]" type="submit">
									Add Category
								</Button>
							</div>
						</form>
					</div>
				</div>
			</Show>
			<DragDropProvider collisionDetector={closestEntity} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
				<DragDropSensors />
				<div class="mx-6 mb-6 md:mx-12 md:mb-12 px-6 py-12 flex flex-col-reverse md:flex-row items-start bg-gray-900 rounded-md">
					<SortableProvider ids={categoryItemIds()}>
						<div class={`grid grid-rows-1 gap-2 w-full my-2 mx-0 md:mx-2 md:my-0 ${canEdit() ? 'md:w-2/3' : 'md:w-full'}`}>
							<For each={categoryItems()}>
								{category => (
									<CategoryComponent
										category={category}
										searchCardPreview={searchCardPreview}
										categories={categories}
										setCategories={setCategories}
										decDeck={decDeck}
										invalidCards={invalidCards}
										invalidLegendaries={invalidLegendaries}
										hideCard={hideCard}
										canEdit={canEdit}
									/>
								)}
							</For>
						</div>
						<Show when={canEdit()}>
							<div class="h-full bg-gray-700 bg-opacity-40 p-4 my-2 mx-0 md:mx-2 md:my-0 rounded-lg text-center relative w-full md:w-1/3">
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
										<div class="flex flex-col">
											<div class="h-[1px]"></div>
											<Button class="ml-4 mt-1" processing={processing}>
												Search
											</Button>
										</div>
										<div class="flex flex-col">
											<div class="h-[1px]"></div>
											<Button class="ml-4 mt-1" type="button" onClick={validateDeck} processing={processing}>
												Validate
											</Button>
										</div>
									</div>
								</form>
								<div class="py-2 w-full">
									<div class="flex flex-col md:flex-row justify-start">
										<Switch
											class="switch mt-2 md:mt-0"
											checked={excludeDM()}
											onChange={checked => setExcludeDM(checked)}
										>
											<Switch.Label class="switch__label">Exclude Deck Master</Switch.Label>
											<Switch.Input class="switch__input" />
											<Switch.Control class="switch__control">
												<Switch.Thumb class="switch__thumb" />
											</Switch.Control>
										</Switch>
										<Switch
											class="switch ml-0 mt-2 md:ml-4 md:mt-0"
											checked={excludeMonsters()}
											onChange={checked => setExcludeMonsters(checked)}
										>
											<Switch.Label class="switch__label">Exclude Monsters</Switch.Label>
											<Switch.Input class="switch__input" />
											<Switch.Control class="switch__control">
												<Switch.Thumb class="switch__thumb" />
											</Switch.Control>
										</Switch>
										<Switch
											class="switch ml-0 mt-2 md:ml-4 md:mt-0"
											checked={excludeSpells()}
											onChange={checked => setExcludeSpells(checked)}
										>
											<Switch.Label class="switch__label">Exclude Spells</Switch.Label>
											<Switch.Input class="switch__input" />
											<Switch.Control class="switch__control">
												<Switch.Thumb class="switch__thumb" />
											</Switch.Control>
										</Switch>
										<Switch
											class="switch ml-0 mt-2 md:ml-4 md:mt-0"
											checked={excludeTraps()}
											onChange={checked => setExcludeTraps(checked)}
										>
											<Switch.Label class="switch__label">Exclude Traps</Switch.Label>
											<Switch.Input class="switch__input" />
											<Switch.Control class="switch__control">
												<Switch.Thumb class="switch__thumb" />
											</Switch.Control>
										</Switch>
									</div>
								</div>
								<CategoryComponent
									category={{
										id: searchCategory.id,
										name: '',
										type: CategoryType.SEARCH,
										order: -1,
										cards: searchResults.cards,
									}}
									categories={categories}
									setCategories={setCategories}
									decDeck={decDeck}
									canEdit={canEdit}
									isSearch
								/>
								<Show when={!processing() && (!!searchResultsPagination().meta && searchResultsPagination().meta!.last_page > 1)}>
									<div class="mt-4">
										<Pagination data={searchResultsPagination()} updateData={updateSearchResults} />
									</div>
								</Show>
							</div>
						</Show>
					</SortableProvider>
				</div>
				<DragOverlay class="z-100">
					{(draggable) => {
						if (!draggable || !draggable.data) {
							return null;
						}

						const entity = draggable.data;
						return isSortableCategory(draggable)
							? (
									<CategoryComponent
										category={entity.category}
										categories={categories}
										setCategories={setCategories}
										decDeck={decDeck}
										invalidCards={invalidCards}
										invalidLegendaries={invalidLegendaries}
										canEdit={canEdit}
										isPreview
									/>
								)
							: (
									<CardComponent
										card={entity.card}
										category={entity.category}
										canEdit={canEdit}
										isPreview
									/>
								);
					}}
				</DragOverlay>
			</DragDropProvider>
		</SpecialCategoryIdsContext.Provider>
	);
};

export default DeckBuilder;
