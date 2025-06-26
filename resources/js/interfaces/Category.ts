import Card from './Card';

export default interface Category {
	id: string;
	name: string;
	order: number;
	cards: Card[];
}
