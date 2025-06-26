import Tag from './Tag';

export default interface Card {
	id: number;
	name: string;
	type: string;
	description: string;
	image: string;
	limit: number;
	legendary: boolean;
	created_at: string;
	tags: Tag[];
}
