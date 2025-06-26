import CardType from '../enums/CardType';
import DeckType from '../enums/DeckType';

export default interface Card {
	uid: string;
	id: number;
	name: string;
	type: CardType;
	deckType: DeckType;
	level: number | null;
	image: string;
	limit: number;
	legendary: boolean;
}
