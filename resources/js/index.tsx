/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, RouteSectionProps } from '@solidjs/router';
import App from './App';

import 'solid-devtools';
import '../css/app.css';
import routes from './routes';

const app = document.getElementById('app');

const setApp = (props: RouteSectionProps<unknown>) => {
	return (
		<App>
			{props.children}
		</App>
	);
};

if (import.meta.env.DEV && !(app instanceof HTMLElement)) {
	throw new Error(
		'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
	);
}

render(() => (
	<Router root={props => setApp(props)}>
		{routes}
	</Router>
), app!);