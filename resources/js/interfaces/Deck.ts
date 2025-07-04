import Category from './Category';

export default interface Deck {
	id: number;
	name: string;
	notes?: string;
	isValid: boolean;
	categories: Category[];
	canEdit: boolean;
}
