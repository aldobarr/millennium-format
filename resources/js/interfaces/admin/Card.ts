import Category from './Category';
import Tag from './Tag';

export default interface Card {
	id: number;
	name: string;
	description: string;
	image: string;
	deck_type: string;
	limit: number;
	created_at: string;
	category: Category;
	tags: Tag[];
}
