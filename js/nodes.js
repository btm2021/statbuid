/* Node creation, styling, and lifecycle management */
import ctx from './state.js';
import { clampWithMargin } from './utils.js';
import { getCanvasCoordinates } from './geometry.js';
import { selectNode, clearSelection } from './selection.js';

export function createNode(label, pointerX, pointerY, options = {}) {
    const nodeId = options.id || `node-${ctx.nodeCounter++}`;
    if (options.id) {
        const numeric = parseInt(options.id.split('-')[1], 10);
        if (!Number.isNaN(numeric)) {
            ctx.nodeCounter = Math.max(ctx.nodeCounter, numeric + 1);
        }
    }

    const { canvasContent } = ctx.dom;
    if (!canvasContent) {
        throw new Error('Canvas content element not found');
    }

    const nodeElement = document.createElement('div');
    nodeElement.className = 'node';
    nodeElement.dataset.id = nodeId;
    nodeElement.dataset.shape = options.shape || ctx.config.defaultShape;

    const inputConnector = document.createElement('div');
    inputConnector.className = 'connector input';
    inputConnector.title = 'Input';

    const outputConnector = document.createElement('div');
    outputConnector.className = 'connector output';
    outputConnector.title = 'Output';

    const inputLabel = document.createElement('span');
    inputLabel.className = 'connector-label input';
    inputLabel.textContent = 'IN';

    const outputLabel = document.createElement('span');
    outputLabel.className = 'connector-label output';
    outputLabel.textContent = 'OUT';

    const body = document.createElement('div');
    body.className = 'node-body';

    const title = document.createElement('h3');
    title.className = 'node-title';
    title.textContent = label;

    const comment = document.createElement('p');
    comment.className = 'node-comment';
    comment.textContent = options.comment || '';
    comment.hidden = !comment.textContent;

    body.appendChild(title);
    body.appendChild(comment);
    nodeElement.appendChild(inputConnector);
    nodeElement.appendChild(outputConnector);
    nodeElement.appendChild(inputLabel);
    nodeElement.appendChild(outputLabel);
    nodeElement.appendChild(body);
    canvasContent.appendChild(nodeElement);

    const logicalSize = getLogicalCanvasSize();
    const initialWidth = nodeElement.offsetWidth;
    const initialHeight = nodeElement.offsetHeight;

    const baseX = options.x !== undefined ? options.x : pointerX - initialWidth / 2;
    const baseY = options.y !== undefined ? options.y : pointerY - initialHeight / 2;

    const targetX = options.x !== undefined
        ? baseX
        : clampWithMargin(baseX, 0, logicalSize.width - initialWidth, ctx.config.workspaceMargin);
    const targetY = options.y !== undefined
        ? baseY
        : clampWithMargin(baseY, 0, logicalSize.height - initialHeight, ctx.config.workspaceMargin);

    nodeElement.style.left = `${targetX}px`;
    nodeElement.style.top = `${targetY}px`;

    const nodeData = {
        id: nodeId,
        type: label,
        x: targetX,
        y: targetY,
        shape: options.shape || ctx.config.defaultShape,
        background: options.background || ctx.config.defaultNodeBackground,
        textColor: options.textColor || ctx.config.defaultNodeTextColor,
        comment: options.comment || '',
        el: nodeElement,
        bodyEl: body,
        titleEl: title,
        commentEl: comment,
        inputEl: inputConnector,
        outputEl: outputConnector,
        inputLabelEl: inputLabel,
        outputLabelEl: outputLabel,
    };

    applyNodeVisuals(nodeData);

    ctx.nodes.push(nodeData);
    ctx.nodeLookup.set(nodeId, nodeData);

    nodeElement.addEventListener('mousedown', (event) => handleNodeMouseDown(event, nodeData));
    nodeElement.addEventListener('contextmenu', (event) => handleNodeContextMenu(event, nodeData));
    inputConnector.addEventListener('click', (event) => ctx.handleInputClick?.(event, nodeData));
    outputConnector.addEventListener('click', (event) => ctx.handleOutputClick?.(event, nodeData));
    inputConnector.addEventListener('contextmenu', (event) => event.preventDefault());
    outputConnector.addEventListener('contextmenu', (event) => event.preventDefault());

    return nodeData;
}

export function getLogicalCanvasSize() {
    const { canvas } = ctx.dom;
    if (!canvas) {
        return { width: 0, height: 0 };
    }
    return {
        width: canvas.clientWidth / ctx.viewScale,
        height: canvas.clientHeight / ctx.viewScale,
    };
}

export function getNodeLogicalSize(node) {
    return {
        width: node.el.offsetWidth,
        height: node.el.offsetHeight,
    };
}

export function handleNodeMouseDown(event, node) {
    if (event.button !== 0) return;
    if (event.target.classList.contains('connector')) return;
    event.preventDefault();
    ctx.closeActivePopup?.();
    selectNode(node.id);

    const pointer = getCanvasCoordinates(event);
    ctx.draggingNode = node;
    ctx.dragMoved = false;
    ctx.dragOffset.x = pointer.x - node.x;
    ctx.dragOffset.y = pointer.y - node.y;
    node.el.classList.add('dragging');
}

export function handleNodeContextMenu(event, node) {
    event.preventDefault();
    selectNode(node.id);
    ctx.openNodeEditor?.(node, { x: event.clientX, y: event.clientY });
}

export function handleDropOnCanvas(event) {
    event.preventDefault();
    const type = event.dataTransfer.getData('text/plain');
    if (!type) return;
    const pointer = getCanvasCoordinates(event);
    createNode(type, pointer.x, pointer.y);
    ctx.saveState?.();
    ctx.refreshAnalysisSummary?.();
}

export function applyNodeVisuals(node) {
    const centerX = node.x + node.el.offsetWidth / 2;
    const centerY = node.y + node.el.offsetHeight / 2;
    const logicalSize = getLogicalCanvasSize();

    node.el.dataset.shape = node.shape;
    node.el.style.backgroundColor = node.background;
    node.el.style.color = node.textColor;
    node.bodyEl.style.color = node.textColor;
    node.titleEl.style.color = node.textColor;
    node.commentEl.style.color = node.textColor;
    node.commentEl.textContent = node.comment;
    node.bodyEl.style.backgroundColor = node.background;
    node.inputLabelEl.style.color = node.textColor;
    node.outputLabelEl.style.color = node.textColor;
    node.inputLabelEl.style.backgroundColor = node.background;
    node.outputLabelEl.style.backgroundColor = node.background;
    node.commentEl.hidden = !node.comment;

    void node.el.offsetWidth;
    const width = node.el.offsetWidth;
    const height = node.el.offsetHeight;

    const nextX = clampWithMargin(centerX - width / 2, 0, logicalSize.width - width, ctx.config.workspaceMargin);
    const nextY = clampWithMargin(centerY - height / 2, 0, logicalSize.height - height, ctx.config.workspaceMargin);

    node.x = nextX;
    node.y = nextY;
    node.el.style.left = `${nextX}px`;
    node.el.style.top = `${nextY}px`;
}

export function deleteNode(nodeId) {
    const node = ctx.nodeLookup.get(nodeId);
    if (!node) return;

    node.el.remove();
    ctx.nodeLookup.delete(nodeId);
    const index = ctx.nodes.findIndex((item) => item.id === nodeId);
    if (index !== -1) {
        ctx.nodes.splice(index, 1);
    }

    for (let i = ctx.connections.length - 1; i >= 0; i -= 1) {
        const conn = ctx.connections[i];
        if (conn.sourceId === nodeId || conn.targetId === nodeId) {
            ctx.connections.splice(i, 1);
            ctx.dom.svg?.select(`#arrow-${conn.id}`).remove();
        }
    }

    clearSelection();
    ctx.renderConnections?.();
    ctx.saveState?.();
    ctx.refreshAnalysisSummary?.();
}

ctx.createNode = createNode;
ctx.deleteNode = deleteNode;
ctx.handleDropOnCanvas = handleDropOnCanvas;
