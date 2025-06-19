/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, RouteSectionProps, Router } from "@solidjs/router";

import 'solid-devtools';
import '../css/app.css';

import App from './App';
import Home from './pages/Home';

const app = document.getElementById('app');

if (import.meta.env.DEV && !(app instanceof HTMLElement)) {
	throw new Error(
		'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
	);
}

const setApp = (props: RouteSectionProps<unknown>) => {
	return (
		<App auth={{ user: null }}>
			{props.children}
		</App>
	);
};

render(() => (
	<Router root={props => setApp(props)}>
		<Route path="/" component={() => <Home />} />
	</Router>
), app!);