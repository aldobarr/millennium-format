import Authentication from "./Authentication";

export default interface AppState {
	auth: Authentication;
	validatingEmail?: string;
}