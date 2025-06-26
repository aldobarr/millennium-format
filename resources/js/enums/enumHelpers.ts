type EnumLike = Record<string, string | number>;

export function convertStringToDeckType<E extends EnumLike>(value: string, enumType: E) {
	if (!(Object.values(enumType) as Array<string>).includes(value)) {
		throw new Error(`Invalid value: ${value} for enum type: ${JSON.stringify(enumType)}`);
	}

	return (value as E[keyof E]);
}
