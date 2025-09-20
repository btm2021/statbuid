/* Auto-arrangement helpers for distributing nodes */
import ctx from './state.js';
import { clampWithMargin } from './utils.js';
import { getLogicalCanvasSize, getNodeLogicalSize } from './nodes.js';

export function autoArrangeNodes() {
    if (!ctx.nodes.length) return;
    ctx.closeActivePopup?.();

    const levels = computeTopologicalLevels();
    const maxLevel = Math.max(...levels.values(), 0);
    const columns = Array.from({ length: maxLevel + 1 }, () => []);

    ctx.nodes.forEach((node) => {
        const level = levels.get(node.id) ?? 0;
        columns[level] = columns[level] || [];
        columns[level].push(node);
    });

    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize();
    const paddingX = 60;
    const paddingY = 48;
    const availableWidth = Math.max(logicalWidth - paddingX * 2, 120);
    const availableHeight = Math.max(logicalHeight - paddingY * 2, 120);
    const columnCount = columns.filter((col) => col && col.length).length;
    const columnSpacing = columnCount > 1 ? availableWidth / (columnCount - 1) : 0;

    let columnIndex = 0;
    columns.forEach((column) => {
        if (!column || !column.length) return;
        const baseX = columnCount > 1 ? paddingX + columnIndex * columnSpacing : logicalWidth / 2;
        const spacingY = column.length > 1 ? availableHeight / (column.length - 1) : 0;

        column.forEach((node, idx) => {
            const nodeSize = getNodeLogicalSize(node);
            const desiredY = column.length > 1 ? paddingY + spacingY * idx : logicalHeight / 2;
            const desiredX = baseX;

            const nextX = clampWithMargin(desiredX - nodeSize.width / 2, 0, logicalWidth - nodeSize.width, ctx.config.workspaceMargin);
            const nextY = clampWithMargin(desiredY - nodeSize.height / 2, 0, logicalHeight - nodeSize.height, ctx.config.workspaceMargin);

            node.x = nextX;
            node.y = nextY;
            node.el.style.left = `${nextX}px`;
            node.el.style.top = `${nextY}px`;
        });

        columnIndex += 1;
    });

    ctx.renderConnections?.();
    ctx.saveState?.();
    ctx.refreshAnalysisSummary?.();
}

function computeTopologicalLevels() {
    const indegree = new Map();
    const adjacency = new Map();
    const levels = new Map();

    ctx.nodes.forEach((node) => {
        indegree.set(node.id, 0);
        adjacency.set(node.id, []);
        levels.set(node.id, 0);
    });

    ctx.connections.forEach((conn) => {
        if (!adjacency.has(conn.sourceId) || !indegree.has(conn.targetId)) return;
        adjacency.get(conn.sourceId).push(conn.targetId);
        indegree.set(conn.targetId, (indegree.get(conn.targetId) || 0) + 1);
    });

    const queue = [];
    indegree.forEach((deg, id) => {
        if (deg === 0) {
            queue.push(id);
            levels.set(id, 0);
        }
    });

    const visited = new Set();
    while (queue.length) {
        const current = queue.shift();
        visited.add(current);
        const currentLevel = levels.get(current) ?? 0;
        const neighbors = adjacency.get(current) || [];

        neighbors.forEach((neighbor) => {
            const nextLevel = Math.max(levels.get(neighbor) ?? 0, currentLevel + 1);
            levels.set(neighbor, nextLevel);
            indegree.set(neighbor, (indegree.get(neighbor) || 0) - 1);
            if ((indegree.get(neighbor) || 0) === 0 && !visited.has(neighbor)) {
                queue.push(neighbor);
            }
        });
    }

    const remaining = ctx.nodes.filter((node) => !visited.has(node.id));
    if (remaining.length) {
        const fallbackLevel = Math.max(...levels.values(), 0) + 1;
        remaining.forEach((node) => levels.set(node.id, fallbackLevel));
    }

    return levels;
}