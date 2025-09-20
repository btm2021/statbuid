/* Zooming and canvas view helpers */
import ctx from './state.js';
import { clamp } from './utils.js';
import { renderConnections } from './connections.js';

export function syncSvgSize() {
    const { canvas, svg } = ctx.dom;
    if (!canvas || !svg) return;
    svg.attr('width', canvas.clientWidth);
    svg.attr('height', canvas.clientHeight);
}

export function updateScaleAroundCenter(nextScale, originX, originY) {
    const pointer = {
        x: (originX - ctx.pan.x) / ctx.viewScale,
        y: (originY - ctx.pan.y) / ctx.viewScale,
    };
    ctx.viewScale = nextScale;
    ctx.pan.x = originX - pointer.x * ctx.viewScale;
    ctx.pan.y = originY - pointer.y * ctx.viewScale;
    updateViewTransform();
}

export function updateViewTransform() {
    const { canvas, canvasContent, gridScaleLabel } = ctx.dom;
    if (!canvas || !canvasContent) return;

    const panX = ctx.pan.x;
    const panY = ctx.pan.y;
    const backgroundX = Math.round(panX);
    const backgroundY = Math.round(panY);

    canvasContent.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${ctx.viewScale})`;
    canvas.style.setProperty('--grid-size', `${ctx.config.gridBase * ctx.viewScale}px`);
    canvas.style.backgroundPosition = `${backgroundX}px ${backgroundY}px`;

    if (gridScaleLabel) {
        gridScaleLabel.textContent = `${Math.round(ctx.viewScale * 100)}%`;
    }

    renderConnections();
}
export function adjustGridScale(multiplier) {
    const nextScale = clamp(ctx.viewScale * multiplier, ctx.config.gridMin, ctx.config.gridMax);
    if (Math.abs(nextScale - ctx.viewScale) < 0.001) {
        return false;
    }
    const { canvas } = ctx.dom;
    if (!canvas) return false;
    updateScaleAroundCenter(nextScale, canvas.clientWidth / 2, canvas.clientHeight / 2);
    return true;
}

export function handleCanvasWheel(event) {
    event.preventDefault();
    const { canvas } = ctx.dom;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const originX = event.clientX - rect.left;
    const originY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    const nextScale = clamp(ctx.viewScale * factor, ctx.config.gridMin, ctx.config.gridMax);
    if (Math.abs(nextScale - ctx.viewScale) < 0.001) {
        return false;
    }
    updateScaleAroundCenter(nextScale, originX, originY);
    return true;
}

export function handleResize() {
    syncSvgSize();
    renderConnections();
}

