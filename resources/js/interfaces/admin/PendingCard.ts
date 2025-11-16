import Tag from './Tag';

export default interface PendingCard {
	id: number;
	name: string;
	type: string;
	description: string;
	image: string;
	limit: number;
	legendary: boolean;
	isErrata: boolean;
	createdAt: string;
	tags: Tag[];
}
