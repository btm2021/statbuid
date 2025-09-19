// --- DOM Element References ---

// Main containers
export const appContainer = document.querySelector('.app-container');
export const sidebar = document.querySelector('.sidebar');
export const mainContent = document.querySelector('.main-content');
export const bottomPanel = document.getElementById('bottom-panel');

// Sidebar
export const addBlockForm = document.getElementById('add-block-form');
export const newBlockNameInput = document.getElementById('new-block-name');
export const blocksList = document.getElementById('blocks-list');
export const saveButton = document.getElementById('save-button');
export const clearButton = document.getElementById('clear-button');

// Canvas
export const gridCanvas = document.getElementById('grid-canvas');
export const connectionsSvg = document.getElementById('connections-svg');
export const canvasBlocksContainer = document.getElementById('canvas-blocks');

// Bottom Panel
export const panelResizer = document.getElementById('panel-resizer');
export const panelTabs = document.querySelector('.panel-tabs');
export const consoleContent = document.getElementById('console-content');
export const propertiesContent = document.getElementById('properties-content');

/**
 * Appends a new log message to the console panel.
 * @param {string} message - The message to log.
 */
export function logToConsole(message) {
    const logEntry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    consoleContent.appendChild(logEntry);
    // Auto-scroll to the bottom
    consoleContent.scrollTop = consoleContent.scrollHeight;
}
