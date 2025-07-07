import Category from './Category';
import User from './User';

export default interface Deck {
	id: number;
	name: string;
	user?: User;
	notes?: string;
	isValid: boolean;
	categories: Category[];
	canEdit: boolean;
}
