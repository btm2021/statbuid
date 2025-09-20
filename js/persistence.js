/* Local storage persistence for the diagram state */
import ctx from './state.js';
import { clamp } from './utils.js';
import { createNode } from './nodes.js';
import { updateViewTransform } from './view.js';

export function saveState() {
    if (ctx.isRestoringState) return;
    const snapshot = {
        nodes: ctx.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            x: node.x,
            y: node.y,
            shape: node.shape,
            background: node.background,
            textColor: node.textColor,
            comment: node.comment,
        })),
        connections: ctx.connections.map((conn) => ({
            id: conn.id,
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            label: conn.label,
            color: conn.color,
            style: conn.style,
        })),
        viewScale: ctx.viewScale,
        pan: { x: ctx.pan.x, y: ctx.pan.y },
    };

    try {
        localStorage.setItem(ctx.config.stateStorageKey, JSON.stringify(snapshot));
    } catch (error) {
        console.error('Unable to save state:', error);
    }
}

export function loadState() {
    const raw = localStorage.getItem(ctx.config.stateStorageKey);
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        if (!state || !Array.isArray(state.nodes) || !Array.isArray(state.connections)) return;
        ctx.isRestoringState = true;

        ctx.viewScale = clamp(state.viewScale ?? 1, ctx.config.gridMin, ctx.config.gridMax);
        ctx.pan.x = state.pan?.x ?? 0;
        ctx.pan.y = state.pan?.y ?? 0;
        updateViewTransform();

        state.nodes.forEach((storedNode) => {
            createNode(storedNode.type, storedNode.x, storedNode.y, storedNode);
        });

        state.connections.forEach((storedConn) => {
            const numeric = parseInt(storedConn.id.split('-')[1], 10);
            if (!Number.isNaN(numeric)) {
                ctx.connectionCounter = Math.max(ctx.connectionCounter, numeric + 1);
            }
            ctx.connections.push({
                id: storedConn.id,
                sourceId: storedConn.sourceId,
                targetId: storedConn.targetId,
                label: storedConn.label || '',
                color: storedConn.color || ctx.config.defaultLineColor,
                style: storedConn.style || 'solid',
            });
        });

        ctx.renderConnections?.();
        ctx.isRestoringState = false;
    } catch (error) {
        console.error('Unable to restore state:', error);
        ctx.isRestoringState = false;
    }
}

ctx.saveState = saveState;
ctx.loadState = loadState;