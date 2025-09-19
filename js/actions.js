import { getState, updateState, generateId } from './state.js';
import { snapToGrid } from './canvas.js';
import * as dom from './dom.js';

/**
 * Creates a new block on the canvas.
 * @param {string} name - The name of the block.
 * @param {number} x - The initial x-coordinate.
 * @param {number} y - The initial y-coordinate.
 */
export function createBlock(name, x, y) {
    const state = getState();
    const newBlock = {
        id: generateId(),
        name,
        x: snapToGrid(x),
        y: snapToGrid(y),
    };
    state.blocks.push(newBlock);
    dom.logToConsole(`Block '${name}' created.`);
}

/**
 * Adds a new block type to the available list in the sidebar.
 * @param {string} name - The name of the new block type.
 */
export function addAvailableBlock(name) {
    const state = getState();
    if (!state.availableBlocks.includes(name)) {
        state.availableBlocks.push(name);
        dom.logToConsole(`New block type '${name}' added to the list.`);
    }
}

/**
 * Updates the position of a block.
 * @param {string} id - The ID of the block to move.
 * @param {number} x - The new x-coordinate.
 * @param {number} y - The new y-coordinate.
 * @param {boolean} shouldSnap - Whether to snap the final position to the grid.
 */
export function updateBlockPosition(id, x, y, shouldSnap = false) {
    const block = getState().blocks.find(b => b.id === id);
    if (block) {
        block.x = shouldSnap ? snapToGrid(x) : x;
        block.y = shouldSnap ? snapToGrid(y) : y;
    }
}

/**
 * Creates a connection between two blocks.
 * @param {string} fromId - The ID of the source block.
 * @param {string} toId - The ID of the target block.
 */
export function createConnection(fromId, toId) {
    const state = getState();
    // Prevent duplicate connections
    const exists = state.connections.some(c => c.from === fromId && c.to === toId);
    if (exists) return;

    const newConnection = {
        id: generateId(),
        from: fromId,
        to: toId,
        label: ''
    };
    state.connections.push(newConnection);
    const fromName = state.blocks.find(b => b.id === fromId).name;
    const toName = state.blocks.find(b => b.id === toId).name;
    dom.logToConsole(`Connected '${fromName}' to '${toName}'.`);
}

/**
 * Sets the label for a connection.
 * @param {string} id - The ID of the connection.
 * @param {string} label - The new label text.
 */
export function setConnectionLabel(id, label) {
    const connection = getState().connections.find(c => c.id === id);
    if (connection) {
        connection.label = label;
        dom.logToConsole(`Set label for connection to '${label}'.`);
    }
}

/**
 * Selects an item (block or connection).
 * @param {string} id - The ID of the item to select.
 * @param {'block' | 'connection'} type - The type of item.
 */
export function selectItem(id, type) {
    updateState('selectedItem', { id, type });
}

/**
 * Deselects any currently selected item.
 */
export function deselectAll() {
    updateState('selectedItem', null);
}

/**
 * Deletes the currently selected item.
 */
export function deleteSelection() {
    const state = getState();
    const { selectedItem } = state;

    if (!selectedItem) return;

    if (selectedItem.type === 'block') {
        // Find and delete the block
        const blockIndex = state.blocks.findIndex(b => b.id === selectedItem.id);
        if (blockIndex > -1) {
            const blockName = state.blocks[blockIndex].name;
            state.blocks.splice(blockIndex, 1);
            dom.logToConsole(`Block '${blockName}' deleted.`);
        }

        // Find and delete all connections attached to this block
        state.connections = state.connections.filter(c => c.from !== selectedItem.id && c.to !== selectedItem.id);
    }

    if (selectedItem.type === 'connection') {
        const connIndex = state.connections.findIndex(c => c.id === selectedItem.id);
        if (connIndex > -1) {
            state.connections.splice(connIndex, 1);
            dom.logToConsole(`Connection deleted.`);
        }
    }

    deselectAll();
}

/**
 * Clears the entire diagram.
 */
export function clearAll() {
    const state = getState();
    state.blocks = [];
    state.connections = [];
    state.selectedItem = null;
    // Keep available blocks, but clear the canvas
    dom.logToConsole("Diagram cleared.");
}
