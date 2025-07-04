export default interface User {
	id: number;
	name: string;
	email: string;
	decks_count: number;
	isAdmin: boolean;
	created_at: string;
}
