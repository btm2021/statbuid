/* Coordinate helpers for translating pointer positions */
import ctx from './state.js';

export function getCanvasCoordinates(event) {
    const { canvas } = ctx.dom;
    if (!canvas) {
        return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left - ctx.pan.x) / ctx.viewScale,
        y: (event.clientY - rect.top - ctx.pan.y) / ctx.viewScale,
    };
}

export function getConnectorCenter(element) {
    const { canvas } = ctx.dom;
    if (!canvas) {
        return { x: 0, y: 0 };
    }
    const connectorRect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const xScreen = connectorRect.left - canvasRect.left + connectorRect.width / 2;
    const yScreen = connectorRect.top - canvasRect.top + connectorRect.height / 2;
    return {
        x: (xScreen - ctx.pan.x) / ctx.viewScale,
        y: (yScreen - ctx.pan.y) / ctx.viewScale,
    };
}

ctx.getCanvasCoordinates = getCanvasCoordinates;