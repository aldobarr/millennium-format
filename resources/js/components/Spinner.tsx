import { Component } from "solid-js";

const Spinner: Component<{width?: string, height?: string}> = ({ width = 'w-5', height = 'h-5' }) => {
	return (
		<svg class={`animate-spin -mr-1 ml-3 ${width} ${height} text-white`} viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	);
}

export default Spinner;