import Card from "./Card";

export default interface SearchCardPreview {
	card: Card | undefined,
	idx: number | undefined,
	category: string | undefined
}