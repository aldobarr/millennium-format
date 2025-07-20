const decodeContent = (content: string | null) => {
	const contentString = content ?? '';
	if (contentString.length === 0) {
		return contentString;
	}

	const encoded = atob(contentString).split('|');
	const buffer = new Uint8Array(encoded.length);
	for (let i = 0; i < buffer.length; i++) {
		buffer[i] = parseInt(encoded[i], 10);
	}

	return new TextDecoder('utf-8').decode(buffer);
};

const encodeContent = (content: string | null) => {
	if (content === null || content.length === 0) {
		return null;
	}

	const buffer = Array.from(new TextEncoder().encode(content));
	return btoa(buffer.join('|'));
};

export { decodeContent, encodeContent };
