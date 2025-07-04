import { Location, useLocation, useParams } from '@solidjs/router';
import ApiResponse from '../interfaces/api/ApiResponse';

function arrayIntersectById<T extends { id: number }>(haystack: T[], needles: T[]): T[] {
	const needleIds = new Set(needles.map(obj => obj.id));
	return haystack.filter(obj => needleIds.has(obj.id));
}

const locationIs = (path: string) => {
	const params = useParams();
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

		if (pathParts[i].startsWith(':') && params[pathParts[i].substring(1)] === undefined) {
			return false;
		} else if (!pathParts[i].startsWith(':') && pathParts[i] !== locations[(i + 1)]) {
			return false;
		}
	}

	return true;
};

function getPageQuery<T>(api: ApiResponse<T>) {
	if (!api.links || !api.meta) {
		return '';
	}

	const parts = api.links.first.split('?');
	if (parts.length <= 1) {
		return '';
	}

	const params = new URLSearchParams(parts[1]);
	const filteredParams = Object.fromEntries(params.entries().filter(val => val[0] !== 'page'));
	if (api.meta.current_page > 1) {
		filteredParams.page = `${api.meta.current_page}`;
	}

	return '?' + (new URLSearchParams(filteredParams)).toString();
}

export { arrayIntersectById, getPageQuery, locationIs };
