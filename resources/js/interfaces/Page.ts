import Tab from './Tab';

export default interface Page {
	id: number;
	name: string;
	slug: string;
	parent?: Page;
	order: number;
	header: string | null;
	footer: string | null;
	isHome: boolean;
	isPlaceholder: boolean;
	isVisible: boolean;
	children?: Page[];
	tabs?: Tab[];
	createdAt: string;
	updatedAt: string;
}
