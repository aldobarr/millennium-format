export default interface NavItem {
	name: string;
	slug: string;
	isPlaceholder: boolean;
	children?: NavItem[];
}
