import { Component, Show } from "solid-js";
import Spinner from "./Spinner";
import Table from "./Table";

const BaseLoadingResource: Component<{resource: string}> = (props) => {
	return (
		<div class="flex flex-row w-full justify-center opacity-50">
			<div><strong>Loading {props.resource}...</strong></div>
			<Spinner />
		</div>
	);
};

const ShowLoadingResource: Component<{resource: string, inTable?: boolean}> = (props) => {
	return (
		<Show when={props.inTable} fallback={<BaseLoadingResource resource={props.resource} />}>
			<Table.Row>
				<Table.Column colSpan="100%" align="center">
					<BaseLoadingResource resource={props.resource} />
				</Table.Column>
			</Table.Row>
		</Show>

	);
};

export default ShowLoadingResource;