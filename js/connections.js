/* Connection creation, rendering, and lifecycle */
import ctx from './state.js';
import { getConnectorCenter } from './geometry.js';
import { cubicBezierPoint } from './utils.js';
import { selectConnection, registerSelectionRenderer } from './selection.js';

export function handleOutputClick(event, nodeData) {
    event.stopPropagation();
    ctx.selectNode?.(nodeData.id);
    const startPoint = getConnectorCenter(event.currentTarget);
    startConnection(nodeData, startPoint);
}

export function handleInputClick(event, nodeData) {
    event.stopPropagation();
    if (!ctx.connectingState) {
        ctx.selectNode?.(nodeData.id);
        return;
    }
    if (ctx.connectingState.sourceId === nodeData.id) {
        cancelConnection();
        return;
    }

    const duplicate = ctx.connections.find(
        (conn) => conn.sourceId === ctx.connectingState.sourceId && conn.targetId === nodeData.id
    );
    if (duplicate) {
        cancelConnection();
        return;
    }

    finalizeConnection(nodeData.id);
}

function startConnection(sourceNode, startPoint) {
    cleanupTemporaryPath();

    ctx.connectingState = {
        sourceId: sourceNode.id,
        start: startPoint,
    };

    ctx.tempPath = ctx.dom.svg
        .append('path')
        .attr('class', 'connection-path temp')
        .attr('d', buildConnectionCurve(startPoint, startPoint).path);

    setTimeout(() => {
        document.addEventListener('click', handleGlobalClickDuringConnection, true);
    }, 0);
}

function handleGlobalClickDuringConnection(event) {
    if (!ctx.connectingState) return;
    const classList = event.target.classList || new DOMTokenList();
    if (classList.contains('connector')) return;
    cancelConnection();
}

export function updateTemporaryPath(event) {
    if (!ctx.tempPath || !ctx.connectingState) return;
    const pointer = ctx.getCanvasCoordinates?.(event);
    if (!pointer) return;
    const { path } = buildConnectionCurve(ctx.connectingState.start, pointer);
    ctx.tempPath.attr('d', path);
}

export function cancelConnection() {
    cleanupTemporaryPath();
    ctx.connectingState = null;
}

function cleanupTemporaryPath() {
    if (ctx.tempPath) {
        ctx.tempPath.remove();
        ctx.tempPath = null;
    }
    document.removeEventListener('click', handleGlobalClickDuringConnection, true);
}

function finalizeConnection(targetId) {
    const connectionId = `conn-${ctx.connectionCounter++}`;
    const connection = {
        id: connectionId,
        sourceId: ctx.connectingState.sourceId,
        targetId,
        label: '',
        color: ctx.config.defaultLineColor,
        style: 'solid',
    };

    ctx.connections.push(connection);
    cancelConnection();
    renderConnections();
    ctx.saveState?.();
    ctx.refreshAnalysisSummary?.();
    selectConnection(connection.id);
}

export function deleteConnection(connectionId) {
    const index = ctx.connections.findIndex((conn) => conn.id === connectionId);
    if (index === -1) return;
    ctx.connections.splice(index, 1);
    ctx.dom.svg?.select(`#arrow-${connectionId}`).remove();
    ctx.clearSelection?.();
    renderConnections();
    ctx.saveState?.();
    ctx.refreshAnalysisSummary?.();
}

export function renderConnections() {
    const { svg, defs } = ctx.dom;
    if (!svg || !defs) return;

    const selection = svg.selectAll('.connection').data(ctx.connections, (d) => d.id);

    selection
        .exit()
        .each(function (d) {
            svg.select(`#arrow-${d.id}`).remove();
        })
        .remove();

    const entered = selection
        .enter()
        .append('g')
        .attr('class', 'connection')
        .each(function (d) {
            const group = d3.select(this);
            group.append('path').attr('class', 'connection-path');
            group.append('text').attr('class', 'connection-label').attr('text-anchor', 'middle');

            group.on('contextmenu', (event, datum) => {
                event.preventDefault();
                selectConnection(datum.id);
                ctx.openConnectionEditor?.(datum, { x: event.clientX, y: event.clientY });
            });

            group.on('click', (event, datum) => {
                event.stopPropagation();
                selectConnection(datum.id);
            });
        });

    const merged = entered.merge(selection);

    merged.each(function (d) {
        const source = ctx.nodeLookup.get(d.sourceId);
        const target = ctx.nodeLookup.get(d.targetId);
        if (!source || !target) return;

        const startPoint = getConnectorCenter(source.outputEl);
        const endPoint = getConnectorCenter(target.inputEl);
        const curve = buildConnectionCurve(startPoint, endPoint);

        ensureArrowMarker(d.color, d.id);

        const group = d3.select(this);
        group
            .select('path')
            .attr('d', curve.path)
            .attr('stroke', d.color)
            .attr('stroke-dasharray', ctx.config.lineStyles[d.style] || '')
            .attr('marker-end', `url(#arrow-${d.id})`);

        group
            .select('text')
            .text(d.label || '')
            .attr('x', curve.labelPoint.x)
            .attr('y', curve.labelPoint.y - 8)
            .attr('fill', d.color);

        group.classed('selected', d.id === ctx.selectedConnectionId);
    });
}

function ensureArrowMarker(color, id) {
    const { svg, defs } = ctx.dom;
    if (!svg || !defs) return;
    let marker = svg.select(`#arrow-${id}`);
    if (marker.empty()) {
        marker = defs
            .append('marker')
            .attr('id', `arrow-${id}`)
            .attr('viewBox', '0 0 12 12')
            .attr('refX', 11)
            .attr('refY', 6)
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('orient', 'auto');

        marker.append('path').attr('d', 'M0,0 L12,6 L0,12 Z');
    }

    marker.select('path').attr('fill', color);
}

function buildConnectionCurve(start, end) {
    const dx = end.x - start.x;
    const offset = Math.max(Math.abs(dx) * 0.45, 48);
    const control1 = { x: start.x + offset, y: start.y };
    const control2 = { x: end.x - offset, y: end.y };

    const path = `M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`;
    const labelPoint = {
        x: cubicBezierPoint(start.x, control1.x, control2.x, end.x, 0.5),
        y: cubicBezierPoint(start.y, control1.y, control2.y, end.y, 0.5),
    };

    return { path, labelPoint };
}

// expose helpers so other modules can trigger updates
ctx.handleOutputClick = handleOutputClick;
ctx.handleInputClick = handleInputClick;
ctx.renderConnections = renderConnections;
ctx.deleteConnection = deleteConnection;
ctx.buildConnectionCurve = buildConnectionCurve;
registerSelectionRenderer(renderConnections);
ctx.updateTemporaryPath = updateTemporaryPath;
ctx.cancelConnection = cancelConnection;
