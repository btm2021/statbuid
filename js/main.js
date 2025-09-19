import * as dom from './dom.js';
import { initState, loadState, saveState } from './data.js';
import { addEventListeners } from './handlers.js';
import { render } from './ui.js';

function main() {
    // Load initial state from localStorage or set defaults
    const initialState = loadState();
    initState(initialState);

    // Set up all event listeners
    addEventListeners();

    // Initial render of the application
    render();

    // Log initial status
    console.log("Application initialized.");
    if (initialState.blocks.length > 0 || initialState.connections.length > 0) {
        dom.logToConsole("Loaded saved state from localStorage.");
    } else {
        dom.logToConsole("Started with a blank canvas.");
    }
}

// Run the app
main();
