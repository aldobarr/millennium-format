import Categories from "../interfaces/Categories";
import DeckCount from "../interfaces/DeckCount";

export const DeckBuilderTypes = {
	CATEGORY: 'category',
	CARD: 'card'
};

export function initialCategories(categories: Categories) {
	const deck_master = {
		id: 'deck-master',
		name: 'Deck Master',
		is_dm: true,
		order: 1,
		cards: []
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
		categories['deck-master'] = deck_master;
	}

	return categories;
}

export function initialOrder(categories: Categories) {
	const order = Object.keys(categories);
	return order.sort((a, b) => (categories[a].order - categories[b].order));
}

export function initialDeck(categories: Categories) {
	const temp = {
		'spells': {
			id: 'spells',
			name: 'Spells',
			is_dm: false,
			order: 3,
			cards: [
				{ id: 4, name: 'Dark Magic Attack', image: 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png'},
				{ id: 5, name: 'Dark Magic Curtain', image: 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png'},
				{ id: 6, name: 'Veil of Darkness', image: 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png'},
				{ id: 7, name: 'Dark Magic Attack', image: 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png'},
				{ id: 8, name: 'Dark Magic Curtain', image: 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png'},
				{ id: 9, name: 'Veil of Darkness', image: 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png'},
				{ id: 10, name: 'Dark Magic Attack', image: 'https://ms.yugipedia.com//thumb/c/cd/DarkMagicAttack-SS01-EN-C-1E.png/300px-DarkMagicAttack-SS01-EN-C-1E.png'},
				{ id: 11, name: 'Dark Magic Curtain', image: 'https://ms.yugipedia.com//thumb/d/d6/DarkMagicCurtain-SBCB-EN-C-1E.png/300px-DarkMagicCurtain-SBCB-EN-C-1E.png'},
				{ id: 12, name: 'Veil of Darkness', image: 'https://ms.yugipedia.com//thumb/1/14/VeilofDarkness-SS05-EN-C-1E.png/300px-VeilofDarkness-SS05-EN-C-1E.png'}
			]
		}
	};

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