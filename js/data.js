import { getState, initState as setInitialState } from './state.js';
import * as dom from './dom.js';

const LOCAL_STORAGE_KEY = 'strategyBuilderState';

/**
 * The default state for a new application instance.
 */
const defaultState = {
    blocks: [],
    connections: [],
    availableBlocks: ['RSI', 'EMA', 'MACD', 'Price'],
    view: {
        panX: 0,
        panY: 0,
        zoom: 1,
    },
    selectedItem: null,
    drawingLine: null,
};

/**
 * Initializes the state, used by main.js at startup.
 * @param {object} initialState - The state to initialize with.
 */
export function initState(initialState) {
    setInitialState(initialState);
}

/**
 * Saves the current application state to localStorage.
 */
export function saveState() {
    try {
        const stateToSave = getState();
        // Don't save transient states like 'drawingLine'
        const serializableState = { ...stateToSave, drawingLine: null };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableState));
    } catch (error) {
        console.error("Could not save state to localStorage:", error);
        dom.logToConsole("Error: Could not save state.");
    }
}

/**
 * Loads the application state from localStorage.
 * @returns {object} The loaded state or the default state.
 */
export function loadState() {
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState === null) {
            return JSON.parse(JSON.stringify(defaultState)); // Return a deep copy
        }
        const parsedState = JSON.parse(savedState);
        // Ensure all keys from default state are present
        return { ...defaultState, ...parsedState, view: {...defaultState.view, ...parsedState.view} };
    } catch (error) {
        console.error("Could not load state from localStorage:", error);
        dom.logToConsole("Error: Could not load saved state. Starting fresh.");
        return JSON.parse(JSON.stringify(defaultState)); // Return a deep copy
    }
}
