import { DECK_MASTER_ID } from '../components/DeckBuilder';
import Categories from '../interfaces/Categories';
import DeckCount from '../interfaces/DeckCount';

export const DeckBuilderTypes = {
	CATEGORY: 'category',
	CARD: 'card',
};

export function initialCategories(categories: Categories) {
	const deck_master = {
		id: DECK_MASTER_ID,
		name: 'Deck Master',
		is_dm: true,
		order: 1,
		cards: [],
	};

	let min_order = 1;
	let has_dm = false;
	for (const category_id in categories) {
		const category = categories[category_id];
		if (category.is_dm) {
			has_dm = true;
		}

		if (category.order <= min_order && !category.is_dm) {
			min_order = category.order - 1;
		}
	}

	if (!has_dm) {
		deck_master.order = min_order;
		categories[DECK_MASTER_ID] = deck_master;
	}

	return categories;
}

export function initialOrder(categories: Categories) {
	const order = Object.keys(categories);
	return order.sort((a, b) => (categories[a].order - categories[b].order));
}

export function initialDeck(categories: Categories) {
	const deck: DeckCount = {};
	const category_keys = Object.keys(categories);
	for (const key of category_keys) {
		const cards = categories[key].cards;
		for (const card of cards) {
			if (!deck[card.id]) {
				deck[card.id] = 0;
			}

			deck[card.id]++;
		}
	}

	return deck;
}
