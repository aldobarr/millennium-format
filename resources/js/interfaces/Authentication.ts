import User from "./User";

export default interface Authentication {
	token: string | null;
	user: User | null;
}