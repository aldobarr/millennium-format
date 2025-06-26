export const DeckBuilderTypes = {
	CATEGORY: 'category',
	CARD: 'card',
};

export const DECK_MASTER_ID = 'deck-master';
export const EXTRA_DECK_ID = 'extra-deck';
export const SIDE_DECK_ID = 'side-deck';
export const SEARCH_CATEGORY_ID = 'search';

export const DECK_MASTER_MINIMUM_LEVEL = 5;
export const MAIN_DECK_LIMIT = 60;
export const EXTRA_DECK_LIMIT = 15;
export const SIDE_DECK_LIMIT = 15;

export const isSpecialCategory = (id: string) => {
	return [DECK_MASTER_ID, EXTRA_DECK_ID, SIDE_DECK_ID, SEARCH_CATEGORY_ID].includes(id);
};
