import Category from './Category';

export default interface Deck {
	id: number;
	name: string;
	notes?: string;
	categories: Category[];
}
