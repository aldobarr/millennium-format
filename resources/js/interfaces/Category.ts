import CategoryType from '../enums/CategoryType';
import Card from './Card';

export default interface Category {
	id: string;
	name: string;
	type: CategoryType;
	order: number;
	cards: Card[];
}
