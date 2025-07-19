import Authentication from './Authentication';
import NavItem from './NavItem';

export default interface AppState {
	nav: NavItem[];
	auth: Authentication;
	validatingEmail?: string;
}
