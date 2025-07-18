import Tab from './Tab';

export default interface Page {
	id: number;
	name: string;
	slug: string;
	order: number;
	header: string | null;
	footer: string | null;
	isHome: boolean;
	tabs: Tab[];
	createdAt: string;
	updatedAt: string;
}
