export default interface NavItem {
	name: string;
	slug: string;
	children?: NavItem[];
}
