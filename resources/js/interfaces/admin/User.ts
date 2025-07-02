export default interface User {
	id: number;
	name: string;
	email: string;
	decks_count: number;
	is_admin: boolean;
	created_at: string;
}
