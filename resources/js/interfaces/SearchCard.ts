import Card from './Card';

export default interface SearchCard extends Omit<Card, 'uid' | 'type' | 'deckType'> {
	type: string;
	deckType: string;
}
