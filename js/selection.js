/* Selection helpers for highlighting nodes and connections */
import ctx from './state.js';

let renderCallback = () => {};

export function registerSelectionRenderer(callback) {
    renderCallback = callback;
}

export function selectNode(nodeId) {
    if (ctx.selectedNodeId === nodeId) return;
    if (ctx.selectedNodeId) {
        const previous = ctx.nodeLookup.get(ctx.selectedNodeId);
        if (previous) {
            previous.el.classList.remove('selected');
        }
    }
    ctx.selectedNodeId = nodeId;
    ctx.selectedConnectionId = null;
    if (ctx.selectedNodeId) {
        const node = ctx.nodeLookup.get(ctx.selectedNodeId);
        if (node) {
            node.el.classList.add('selected');
        }
    }
    renderCallback();
}

export function selectConnection(connectionId) {
    if (ctx.selectedConnectionId === connectionId) return;
    ctx.selectedConnectionId = connectionId;
    if (ctx.selectedNodeId) {
        const node = ctx.nodeLookup.get(ctx.selectedNodeId);
        if (node) {
            node.el.classList.remove('selected');
        }
        ctx.selectedNodeId = null;
    }
    renderCallback();
}

export function clearSelection() {
    if (ctx.selectedNodeId) {
        const node = ctx.nodeLookup.get(ctx.selectedNodeId);
        if (node) {
            node.el.classList.remove('selected');
        }
        ctx.selectedNodeId = null;
    }
    if (ctx.selectedConnectionId) {
        ctx.selectedConnectionId = null;
        renderCallback();
    }
}

ctx.selectNode = selectNode;
ctx.selectConnection = selectConnection;
ctx.clearSelection = clearSelection;