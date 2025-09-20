/* Canvas interaction and keyboard shortcuts */
import ctx from './state.js';
import { clampWithMargin } from './utils.js';
import { getCanvasCoordinates } from './geometry.js';
import { getLogicalCanvasSize, getNodeLogicalSize } from './nodes.js';
import { updateViewTransform } from './view.js';

export function handleCanvasMouseDown(event) {
    if (event.button !== 0) return;
    if (event.target.closest('.floating-popup')) return;
    if (event.target.closest('.node')) return;
    ctx.closeActivePopup?.();
    ctx.clearSelection?.();
    startPan(event);
}

function startPan(event) {
    ctx.isPanning = true;
    ctx.pointerStart.x = event.clientX;
    ctx.pointerStart.y = event.clientY;
    ctx.panStart.x = ctx.pan.x;
    ctx.panStart.y = ctx.pan.y;
    ctx.dom.canvas?.classList.add('panning');
}

export function handleGlobalMouseMove(event) {
    if (ctx.isPanning) {
        const dx = event.clientX - ctx.pointerStart.x;
        const dy = event.clientY - ctx.pointerStart.y;
        ctx.pan.x = ctx.panStart.x + dx;
        ctx.pan.y = ctx.panStart.y + dy;
        updateViewTransform();
    }

    if (ctx.draggingNode) {
        const pointer = getCanvasCoordinates(event);
        const nodeRect = getNodeLogicalSize(ctx.draggingNode);
        const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize();

        let nextX = pointer.x - ctx.dragOffset.x;
        let nextY = pointer.y - ctx.dragOffset.y;

        nextX = clampWithMargin(nextX, 0, logicalWidth - nodeRect.width, ctx.config.workspaceMargin);
        nextY = clampWithMargin(nextY, 0, logicalHeight - nodeRect.height, ctx.config.workspaceMargin);

        ctx.draggingNode.x = nextX;
        ctx.draggingNode.y = nextY;
        ctx.draggingNode.el.style.left = `${nextX}px`;
        ctx.draggingNode.el.style.top = `${nextY}px`;
        ctx.dragMoved = true;
        ctx.renderConnections?.();
    }

    if (ctx.connectingState) {
        ctx.updateTemporaryPath?.(event);
    }
}

export function handleGlobalMouseUp() {
    if (ctx.isPanning) {
        ctx.isPanning = false;
        ctx.dom.canvas?.classList.remove('panning');
        ctx.saveState?.();
    }

    if (ctx.draggingNode) {
        ctx.draggingNode.el.classList.remove('dragging');
        if (ctx.dragMoved) {
            ctx.renderConnections?.();
            ctx.saveState?.();
            ctx.refreshAnalysisSummary?.();
        }
        ctx.draggingNode = null;
        ctx.dragMoved = false;
    }

    if (ctx.connectingState) {
        cancelConnection();
    }
}

export function handleGlobalKeyDown(event) {
    if (event.key === 'Escape') {
        ctx.closeActivePopup?.();
        ctx.clearSelection?.();
        cancelConnection();
        return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
        if (ctx.selectedNodeId) {
            ctx.deleteNode?.(ctx.selectedNodeId);
            return;
        }
        if (ctx.selectedConnectionId) {
            ctx.deleteConnection?.(ctx.selectedConnectionId);
        }
    }
}

function cancelConnection() {
    ctx.cancelConnection?.();
}