import Authentication from "./Authentication";

export default interface AppRoot {
	children?: any;
	auth: Authentication;
}