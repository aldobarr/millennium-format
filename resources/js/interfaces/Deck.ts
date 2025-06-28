import Category from './Category';

export default interface Deck {
	name: string;
	notes?: string;
	categories: Category[];
}
