import { DateTime } from 'luxon';

export function formatDateFromUTC(date: string, format: string | null = null) {
	if (format == null) {
		format = 'MMM d, y h:mm a';
	}

	return DateTime.fromISO(date, { zone: 'UTC' })
		.setZone(DateTime.local().zone)
		.toFormat(format);
}
