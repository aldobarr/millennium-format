import Category from './Category';

export default interface TransportCategory extends Omit<Category, 'cards'> {
	cards: { id: number; alternate: number | null }[];
}
