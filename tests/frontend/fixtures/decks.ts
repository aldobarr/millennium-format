import type Card from '../../../resources/js/interfaces/Card';
import type Deck from '../../../resources/js/interfaces/Deck';
import CategoryType from '../../../resources/js/enums/CategoryType';
import CardType from '../../../resources/js/enums/CardType';
import DeckType from '../../../resources/js/enums/DeckType';

const image = 'data:image/svg+xml,' + encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="144" height="210"><rect width="144" height="210" fill="#556080"/></svg>',
);

export function card(id: number): Card {
	const name = 'Card-' + id;
	return {
		uid: 'copy-' + id,
		id, name, image,
		description: name,
		type: CardType.MONSTER,
		deckType: DeckType.NORMAL,
		level: 4,
		limit: 3,
		legendary: false,
		isErrata: false,
		tags: [],
		alternates: [],
	};
}

export function deck(main = [card(1), card(2), card(3), card(4)]): Deck {
	return {
		id: 42, name: 'Interaction fixture', isValid: false, canEdit: true,
		categories: [
			{ id: 'master', name: 'Deck Master', type: CategoryType.DECK_MASTER, order: 0, cards: [] },
			{ id: 'category-1', name: 'Category-1', type: CategoryType.MAIN, order: 1, cards: main },
			{ id: 'category-2', name: 'Category-2', type: CategoryType.MAIN, order: 2, cards: [card(5), card(6)] },
			{ id: 'extra', name: 'Extra Deck', type: CategoryType.EXTRA, order: 3, cards: [] },
			{ id: 'side', name: 'Side Deck', type: CategoryType.SIDE, order: 4, cards: [] },
		],
	};
}
