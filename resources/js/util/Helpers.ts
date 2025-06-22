import { Location, useLocation } from '@solidjs/router';

const locationIs = (path: string) => {
	const pathParts = path.split('.');

	const location: Location<unknown> = useLocation();
	const locations: string[] = location.pathname.split('/');
	if (locations.length <= 1) {
		return path === '';
	}

	if (pathParts.length !== (locations.length - 1)) {
		return false;
	}

	for (let i = 0; i < pathParts.length; i++) {
		if ((i + 1) >= locations.length) {
			return false;
		}

		if (pathParts[i] !== locations[(i + 1)]) {
			return false;
		}
	}

	return true;
};

export { locationIs };
