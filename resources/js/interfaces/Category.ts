import Card from './Card';

export default interface Category {
	id: string;
	name: string;
	is_dm: boolean;
	order: number;
	cards: Card[];
}
