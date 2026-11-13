import { Id, useDragDropContext } from '@thisbeyond/solid-dnd';
import { onCleanup, onMount } from 'solid-js';

// Keep the existing pickup gestures from solid-dnd's pointer sensor.
const ACTIVATION_DELAY = 250;
const ACTIVATION_DISTANCE = 10;

interface DragDropSensorsProps {
	onPositionChange: (position: { x: number; y: number }) => void;
}

export default function DragDropSensors(props: DragDropSensorsProps) {
	const [state, { addSensor, removeSensor, sensorStart, sensorMove, sensorEnd, dragStart, dragEnd }] = useDragDropContext()!;
	const sensorId = 'deck-pointer';
	let pointerId: number | undefined;
	let draggableId: Id | undefined;
	let activationTimer: number | undefined;
	let origin = { x: 0, y: 0 };

	const isActive = () => state.active.sensorId === sensorId;
	const clearSelection = () => window.getSelection()?.removeAllRanges();

	const clearActivationTimer = () => {
		if (activationTimer !== undefined) {
			window.clearTimeout(activationTimer);
		}

		activationTimer = undefined;
	};

	const detach = () => {
		clearActivationTimer();
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', end);
		document.removeEventListener('pointercancel', end);
		document.removeEventListener('selectionchange', clearSelection);
		pointerId = undefined;
		draggableId = undefined;
	};

	const finish = () => {
		const active = isActive();
		detach();
		if (active) {
			// Both release and interruption must reach the existing drag-end
			// cleanup, which removes the preview and stops automatic scrolling.
			try {
				dragEnd();
			} finally {
				sensorEnd();
			}
		}
	};

	const activate = () => {
		clearActivationTimer();
		if (draggableId === undefined || state.active.sensor) {
			return;
		}

		props.onPositionChange(origin);
		sensorStart(sensorId, origin);
		dragStart(draggableId);
		clearSelection();
		document.addEventListener('selectionchange', clearSelection);
	};

	function move(event: PointerEvent) {
		if (event.pointerId !== pointerId) {
			return;
		}

		const point = { x: event.clientX, y: event.clientY };
		if (!isActive() && Math.hypot(point.x - origin.x, point.y - origin.y) > ACTIVATION_DISTANCE) {
			activate();
		}

		if (isActive()) {
			event.preventDefault();
			props.onPositionChange(point);
			sensorMove(point);
		}
	}

	function end(event: PointerEvent) {
		if (event.pointerId !== pointerId) {
			return;
		}

		if (isActive()) {
			event.preventDefault();
		}

		finish();
	}

	const begin = (event: PointerEvent, id: Id) => {
		if (event.button !== 0 || pointerId !== undefined || state.active.sensor) {
			return;
		}

		pointerId = event.pointerId;
		draggableId = id;
		origin = { x: event.clientX, y: event.clientY };
		document.addEventListener('pointermove', move);
		document.addEventListener('pointerup', end);
		document.addEventListener('pointercancel', end);
		activationTimer = window.setTimeout(activate, ACTIVATION_DELAY);
	};

	onMount(() => addSensor({ id: sensorId, activators: { pointerdown: begin } }));
	onCleanup(() => {
		finish();
		removeSensor(sensorId);
	});

	return null;
}
