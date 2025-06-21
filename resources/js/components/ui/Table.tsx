import { Component, For, Show } from "solid-js";

const Table: Component<{children?: any, class?: string}> = (props) => {
	return (
		<div class={`overflow-x-auto border border-gray-600 rounded ${props.class ?? ''}`}>
			<table class="table-auto min-w-full">
				{ props.children }
			</table>
		</div>
	);
}

const TableHead: Component<{children?: any, class?: string}> = (props) => {
	return (
		<thead class={`bg-gray-750 ${props.class ?? ''}`}>
			<tr>
				{props.children}
			</tr>
		</thead>
	);
}

const TableBody: Component<{children?: any, class?: string}> = (props) => {
	return (
		<tbody class={props.class}>
			{props.children}
		</tbody>
	);
}

const TableRow: Component<{children?: any}> = (props) => {
	return (
		<tr class="bg-gray-700 transition duration-300 ease-in-out hover:bg-gray-600">
			{props.children}
		</tr>
	);
}

const TableColumn: Component<{
	children?: any,
	colSpan?: number | "100%", align?: "center" | "left" | "right",
	width?: string,
	header?: boolean
}> = (props) => {
	return (
		<Show when={props.header} fallback={(
			<td
				colSpan={props.colSpan ? props.colSpan : 1}
				class={`text-sm text-gray-100 font-light px-6 py-4 whitespace-nowrap text-${props.align ?? 'left'} ${props.width ?? ''}`}
			>
				{props.children}
			</td>
		)}>
			<th
				scope="col"
				colSpan={props.colSpan ? props.colSpan : 1}
				class={`text-sm font-medium text-gray-100 px-6 py-4 text-${props.align ?? 'left'} ${props.width ?? ''}`}
			></th>
		</Show>
	);
}

const TableFoot: Component<{children?: any, class?: string}> = (props) => {
	return (
		<tfoot class={`bg-gray-750 ${props.class ?? ''}`}>
			<Show when={Array.isArray(props.children)} fallback={props.children}>
				<For each={props.children}>
					{(row) => (
						<tr>
							<For each={row}>
								{(col) => (
									<td
										colSpan={col.colSpan ? col.colSpan : 1}
										class={`text-sm font-medium text-gray-100 px-6 py-4 ${col.align ? col.align : 'text-left'} ${col.width ? col.width : ''}`}
									>
									{col.value}
								</td>
								)}
							</For>
						</tr>
					)}
				</For>
			</Show>
		</tfoot>
	);
}

export default Object.assign(Table, {
	Head: TableHead,
	Body: TableBody,
	Foot: TableFoot,
	Row: TableRow,
	Column: TableColumn
});