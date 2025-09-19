import * as dom from './dom.js';
import { getState, updateState } from './state.js';
import { render, drawDrawingLine, clearDrawingLine } from './ui.js';
import { getCanvasCoordinates, snapToGrid } from './canvas.js';
import * as actions from './actions.js';
import { saveState } from './data.js';

let isPanning = false;
let isDraggingBlock = false;
let isSpacePressed = false;
let dragStartPos = { x: 0, y: 0 };
let activeBlockId = null;
let blockStartPos = { x: 0, y: 0 };

/**
 * Adds all the necessary event listeners for the application.
 */
export function addEventListeners() {
    // Sidebar listeners
    dom.addBlockForm.addEventListener('submit', handleAddBlock);
    dom.blocksList.addEventListener('dragstart', handleSidebarDragStart);
    dom.saveButton.addEventListener('click', handleSave);
    dom.clearButton.addEventListener('click', handleClear);

    // Main content (canvas) listeners
    dom.mainContent.addEventListener('mousedown', handleMouseDown);
    dom.mainContent.addEventListener('mousemove', handleMouseMove);
    dom.mainContent.addEventListener('mouseup', handleMouseUp);
    dom.mainContent.addEventListener('mouseleave', handleMouseLeave);
    dom.mainContent.addEventListener('wheel', handleWheel, { passive: false });
    dom.mainContent.addEventListener('dragover', e => e.preventDefault());
    dom.mainContent.addEventListener('drop', handleDrop);
    dom.mainContent.addEventListener('dblclick', handleDoubleClick);
    dom.mainContent.addEventListener('contextmenu', e => e.preventDefault());

    // Global listeners for keyboard state
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', () => render());
}

// --- Handler Functions ---

function handleKeyDown(e) {
    if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        e.preventDefault();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT') return;
        actions.deleteSelection();
        saveState();
        render();
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space') {
        isSpacePressed = false;
    }
}

function handleMouseDown(e) {
    const state = getState();
    const target = e.target;

    // Panning: Space + Left-click OR Middle-click
    if ((isSpacePressed && e.button === 0) || e.button === 1) {
        isPanning = true;
        dragStartPos = { x: e.clientX, y: e.clientY };
        dom.mainContent.style.cursor = 'grabbing';
        e.preventDefault();
        return;
    }

    // Left mouse button actions
    if (e.button === 0) {
        // Drag on background (canvas or svg container) to pan
        if (target === dom.mainContent || target === dom.gridCanvas || target === dom.connectionsSvg) {
            isPanning = true;
            dragStartPos = { x: e.clientX, y: e.clientY };
            actions.deselectAll();
            render();
            return;
        }

        // Drag a block
        if (target.classList.contains('block')) {
            isDraggingBlock = true;
            activeBlockId = target.id;
            const block = state.blocks.find(b => b.id === activeBlockId);
            
            dragStartPos = { x: e.clientX, y: e.clientY };
            blockStartPos = { x: block.x, y: block.y };
            
            actions.selectItem(activeBlockId, 'block');
            render();
            e.stopPropagation();
            return;
        }

        // Start a connection
        if (target.classList.contains('connector-dot') && target.dataset.connectorType === 'output') {
            const blockId = target.dataset.blockId;
            const dotRect = target.getBoundingClientRect();
            const startView = { x: dotRect.left + dotRect.width / 2, y: dotRect.top + dotRect.height / 2 };
            const startPos = getCanvasCoordinates(startView.x, startView.y);
            
            updateState('drawingLine', { from: blockId, startPos });
            e.stopPropagation();
            return;
        }

        // Select a connection
        const connectionGroup = target.closest('[data-connection-id]');
        if (connectionGroup) {
            actions.selectItem(connectionGroup.dataset.connectionId, 'connection');
            render();
            // e.stopPropagation(); // Removed this line
        }
    }
}

function handleMouseMove(e) {
    const state = getState();
    const { view, drawingLine } = state;

    if (isPanning) {
        dom.mainContent.style.cursor = 'grabbing';
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;
        view.panX += dx;
        view.panY += dy;
        dragStartPos = { x: e.clientX, y: e.clientY };
        render();
        return;
    }

    if (isDraggingBlock) {
        const dx = (e.clientX - dragStartPos.x) / view.zoom;
        const dy = (e.clientY - dragStartPos.y) / view.zoom;
        actions.updateBlockPosition(activeBlockId, blockStartPos.x + dx, blockStartPos.y + dy, false);
        render();
        return;
    }

    if (drawingLine) {
        const endPos = getCanvasCoordinates(e.clientX, e.clientY);
        drawDrawingLine(drawingLine.startPos, endPos);
        return;
    }
}

function handleMouseUp(e) {
    const state = getState();
    const { drawingLine } = state;

    if (isPanning) {
        isPanning = false;
        dom.mainContent.style.cursor = 'grab';
    }

    if (isDraggingBlock) {
        isDraggingBlock = false;
        activeBlockId = null;
        const block = state.blocks.find(b => b.id === activeBlockId);
        if (block) {
            actions.updateBlockPosition(block.id, block.x, block.y, true); // Snap to grid
            saveState();
        }
    }

    if (drawingLine) {
        const target = e.target;
        if (target.classList.contains('connector-dot') && target.dataset.connectorType === 'input') {
            const toBlockId = target.dataset.blockId;
            if (drawingLine.from !== toBlockId) {
                const typeInput = prompt("Enter connection type (e.g., 'if', 'else', 'wait', 'when') or leave blank for default:");
                let type = 'default';
                if (typeInput) {
                    const lowerType = typeInput.toLowerCase();
                    if (['if', 'else', 'wait', 'when'].includes(lowerType)) {
                        type = lowerType;
                    }
                }
                actions.createConnection(drawingLine.from, toBlockId, type);
            }
        }
        updateState('drawingLine', null);
        clearDrawingLine();
        saveState();
        render();
    }
}

function handleMouseLeave(e) {
    if (isPanning || isDraggingBlock || getState().drawingLine) {
        handleMouseUp(e);
    }
}

function handleWheel(e) {
    e.preventDefault();
    const state = getState();
    const { view } = state;
    const rect = dom.mainContent.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const oldZoom = view.zoom;
    const newZoom = e.deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor;
    
    view.zoom = Math.max(0.2, Math.min(newZoom, 3));

    view.panX = mouseX - (mouseX - view.panX) * (view.zoom / oldZoom);
    view.panY = mouseY - (mouseY - view.panY) * (view.zoom / oldZoom);

    render();
    saveState();
}

function handleAddBlock(e) {
    e.preventDefault();
    const newName = dom.newBlockNameInput.value.trim();
    if (newName) {
        actions.addAvailableBlock(newName);
        dom.newBlockNameInput.value = '';
        saveState();
        render();
    }
}

function handleSidebarDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.blockName);
}

function handleDrop(e) {
    e.preventDefault();
    const blockName = e.dataTransfer.getData('text/plain');
    if (blockName) {
        const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
        actions.createBlock(blockName, x, y);
        saveState();
        render();
    }
}

function handleDoubleClick(e) {
    const connectionGroup = e.target.closest('[data-connection-id]');
    if (connectionGroup) {
        const connectionId = connectionGroup.dataset.connectionId;
        const oldLabel = getState().connections.find(c => c.id === connectionId)?.label || '';
        const newLabel = prompt("Enter connection label:", oldLabel);
        if (newLabel !== null) {
            actions.setConnectionLabel(connectionId, newLabel);
            saveState();
            render();
        }
    }
}

function handleSave() {
    saveState();
    dom.logToConsole("Diagram saved manually.");
}

function handleClear() {
    if (confirm("Are you sure you want to clear the entire diagram? This cannot be undone.")) {
        actions.clearAll();
        saveState();
        render();
    }
}

function handlePanelResize(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = dom.bottomPanel.offsetHeight;

    function onMouseMove(e) {
        const newHeight = startHeight - (e.clientY - startY);
        const maxHeight = window.innerHeight - 100;
        const minHeight = 50;
        if (newHeight > minHeight && newHeight < maxHeight) {
            dom.appContainer.style.gridTemplateRows = `1fr ${newHeight}px`;
        }
    }

    function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function handleTabClick(e) {
    if (e.target.classList.contains('tab-button')) {
        const tabName = e.target.dataset.tab;
        
        dom.panelTabs.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-content`).classList.add('active');
    }
}
