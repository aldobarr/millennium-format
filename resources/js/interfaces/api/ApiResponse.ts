import PaginationLinks from './pagination/PaginationLinks';
import PaginationMeta from './pagination/PaginationMeta';

export default interface ApiResponse<T> {
	success: boolean;
	data?: T;
	errors?: Record<string, string[]> | string[] | string;
	links?: PaginationLinks;
	meta?: PaginationMeta;
}
