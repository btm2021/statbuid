import * as dom from './dom.js';
import { getState } from './state.js';
import { drawGrid, getCanvasCoordinates, updateCanvasTransform } from './canvas.js';

/**
 * Renders the entire application UI based on the current state.
 */
export function render() {
    const state = getState();
    
    updateCanvasTransform();
    drawGrid();

    renderSidebarBlockList(state.availableBlocks);
    renderCanvasBlocks(state.blocks, state.selectedItem);
    
    // Defer connection rendering to ensure blocks are in the DOM and measurable
    requestAnimationFrame(() => {
        renderConnections(state.connections, state.blocks, state.selectedItem);
    });
}

/**
 * Renders the list of draggable blocks in the sidebar.
 * @param {string[]} availableBlocks - Array of block names.
 */
function renderSidebarBlockList(availableBlocks) {
    dom.blocksList.innerHTML = ''; // Clear existing list
    availableBlocks.forEach(blockName => {
        const blockEl = document.createElement('div');
        blockEl.className = 'draggable-block';
        blockEl.textContent = blockName;
        blockEl.setAttribute('draggable', 'true');
        blockEl.dataset.blockName = blockName;
        dom.blocksList.appendChild(blockEl);
    });
}

/**
 * Renders the blocks on the main canvas.
 * @param {object[]} blocks - Array of block objects in the state.
 * @param {object} selectedItem - The currently selected item.
 */
function renderCanvasBlocks(blocks, selectedItem) {
    dom.canvasBlocksContainer.innerHTML = ''; // Clear existing blocks
    blocks.forEach(block => {
        const blockEl = document.createElement('div');
        blockEl.className = 'block';
        blockEl.id = block.id;
        blockEl.style.left = `${block.x}px`;
        blockEl.style.top = `${block.y}px`;
        blockEl.textContent = block.name;

        if (selectedItem && selectedItem.type === 'block' && selectedItem.id === block.id) {
            blockEl.classList.add('selected');
        }

        const inputDot = document.createElement('div');
        inputDot.className = 'connector-dot input';
        inputDot.dataset.blockId = block.id;
        inputDot.dataset.connectorType = 'input';

        const outputDot = document.createElement('div');
        outputDot.className = 'connector-dot output';
        outputDot.dataset.blockId = block.id;
        outputDot.dataset.connectorType = 'output';

        blockEl.appendChild(inputDot);
        blockEl.appendChild(outputDot);
        dom.canvasBlocksContainer.appendChild(blockEl);
    });
}

/**
 * Renders the connections (lines and labels) on the SVG layer.
 */
function renderConnections(connections, blocks, selectedItem) {
    dom.connectionsSvg.innerHTML = '';
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    connections.forEach(conn => {
        const fromBlock = blockMap.get(conn.from);
        const toBlock = blockMap.get(conn.to);
        if (!fromBlock || !toBlock) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.connectionId = conn.id;
        dom.connectionsSvg.appendChild(g);

        const { pathD, arrowPoints, labelPos, angle } = calculateConnectionPath(fromBlock, toBlock);
        
        if (!pathD) return; // Skip if path can't be calculated

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('class', 'connection-path');
        
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', arrowPoints);
        arrow.setAttribute('class', 'connection-arrow');

        if (selectedItem && selectedItem.type === 'connection' && selectedItem.id === conn.id) {
            path.classList.add('selected');
        }
        
        g.appendChild(path);
        g.appendChild(arrow);

        const flowPath = path.cloneNode();
        flowPath.setAttribute('class', 'connection-flow');
        g.appendChild(flowPath);

        if (conn.label) {
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            
            labelText.setAttribute('class', 'connection-label');
            labelText.textContent = conn.label;
            labelGroup.appendChild(labelText);
            g.appendChild(labelGroup);
            
            const textBBox = labelText.getBBox();
            const padding = 4;
            
            const labelBadge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            labelBadge.setAttribute('x', textBBox.x - padding);
            labelBadge.setAttribute('y', textBBox.y - padding);
            labelBadge.setAttribute('width', textBBox.width + (padding * 2));
            labelBadge.setAttribute('height', textBBox.height + (padding * 2));
            labelBadge.setAttribute('rx', 3);
            labelBadge.setAttribute('class', 'connection-label-badge');
            
            labelGroup.insertBefore(labelBadge, labelText);

            let angleDeg = angle * (180 / Math.PI);
            if (Math.abs(angleDeg) > 90) {
                angleDeg -= 180;
            }
            
            labelGroup.setAttribute('transform', `translate(${labelPos.x}, ${labelPos.y}) rotate(${angleDeg})`);
        }
    });
}

/**
 * Calculates the SVG path data for a connection between two blocks.
 */
function calculateConnectionPath(fromBlock, toBlock) {
    const fromEl = document.getElementById(fromBlock.id);
    const toEl = document.getElementById(toBlock.id);
    if (!fromEl || !toEl) return { pathD: null };

    const outputDot = fromEl.querySelector('.connector-dot.output');
    const inputDot = toEl.querySelector('.connector-dot.input');
    if (!outputDot || !inputDot) return { pathD: null };

    const outputRect = outputDot.getBoundingClientRect();
    const inputRect = inputDot.getBoundingClientRect();

    const startView = { x: outputRect.left + outputRect.width / 2, y: outputRect.top + outputRect.height / 2 };
    const endView = { x: inputRect.left + inputRect.width / 2, y: inputRect.top + inputRect.height / 2 };

    const startWorld = getCanvasCoordinates(startView.x, startView.y);
    const endWorld = getCanvasCoordinates(endView.x, endView.y);

    const { x: startX, y: startY } = startWorld;
    const { x: endX, y: endY } = endWorld;

    const dx = endX - startX;
    const handleOffset = Math.max(50, Math.abs(dx) * 0.5);

    const pathD = `M ${startX},${startY} C ${startX + handleOffset},${startY} ${endX - handleOffset},${endY} ${endX},${endY}`;
    
    const angle = Math.atan2(endY - startY, endX - startX);
    
    const arrowSize = 6;
    const p1x = endX - arrowSize * Math.cos(angle - Math.PI / 6);
    const p1y = endY - arrowSize * Math.sin(angle - Math.PI / 6);
    const p2x = endX - arrowSize * Math.cos(angle + Math.PI / 6);
    const p2y = endY - arrowSize * Math.sin(angle + Math.PI / 6);
    const arrowPoints = `${endX},${endY} ${p1x},${p1y} ${p2x},${p2y}`;

    const labelPos = {
        x: (startX + endX) / 2,
        y: (startY + endY) / 2,
    };

    return { pathD, arrowPoints, labelPos, angle };
}

/**
 * Draws the temporary line while creating a new connection.
 */
export function drawDrawingLine(startPos, endPos) {
    const existingLine = dom.connectionsSvg.getElementById('drawing-line');
    if (existingLine) existingLine.remove();

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = 'drawing-line';
    path.setAttribute('d', `M ${startPos.x},${startPos.y} L ${endPos.x},${endPos.y}`);
    path.setAttribute('stroke', '#777');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '4,4');
    dom.connectionsSvg.appendChild(path);
}

/**
 * Removes the temporary drawing line.
 */
export function clearDrawingLine() {
    const existingLine = dom.connectionsSvg.getElementById('drawing-line');
    if (existingLine) existingLine.remove();
}