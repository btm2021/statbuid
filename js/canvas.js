import * as dom from './dom.js';
import { getState } from './state.js';

const GRID_SIZE = 20;

/**
 * Applies the current view transform (pan and zoom) to the canvas containers.
 */
export function updateCanvasTransform() {
    const { view } = getState();
    const transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
    dom.canvasBlocksContainer.style.transform = transform;
    dom.connectionsSvg.style.transform = transform;
}

/**
 * Draws the grid on the background canvas.
 */
export function drawGrid() {
    const { view } = getState();
    const ctx = dom.gridCanvas.getContext('2d');
    const { width, height } = dom.gridCanvas.getBoundingClientRect();
    dom.gridCanvas.width = width;
    dom.gridCanvas.height = height;

    ctx.clearRect(0, 0, width, height);
    
    const scaledGridSize = GRID_SIZE * view.zoom;
    const offsetX = view.panX % scaledGridSize;
    const offsetY = view.panY % scaledGridSize;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < width; x += scaledGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = offsetY; y < height; y += scaledGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

/**
 * Converts screen coordinates (e.g., from a mouse event) to canvas space coordinates.
 * @param {number} screenX - The clientX from the event.
 * @param {number} screenY - The clientY from the event.
 * @returns {{x: number, y: number}} The coordinates in the canvas's own space.
 */
export function getCanvasCoordinates(screenX, screenY) {
    const { view } = getState();
    const canvasRect = dom.mainContent.getBoundingClientRect();
    const x = (screenX - canvasRect.left - view.panX) / view.zoom;
    const y = (screenY - canvasRect.top - view.panY) / view.zoom;
    return { x, y };
}

/**
 * Snaps a coordinate to the nearest grid intersection.
 * @param {number} value - The coordinate value (x or y).
 * @returns {number} The snapped coordinate value.
 */
export function snapToGrid(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
