// --- Centralized Application State ---

let state = {};

/**
 * Initializes or re-initializes the application state.
 * @param {object} initialState - The state object to start with.
 */
export function initState(initialState) {
    Object.assign(state, initialState);
}

/**
 * Returns the entire current state object.
 * @returns {object} The current state.
 */
export function getState() {
    return state;
}

/**
 * Updates a specific property in the state.
 * This is a simple way to ensure any state change can be tracked if needed.
 * @param {string} key - The top-level state key.
 * @param {*} value - The new value for the key.
 */
export function updateState(key, value) {
    if (state.hasOwnProperty(key)) {
        state[key] = value;
    } else {
        console.error(`Attempted to update non-existent state key: ${key}`);
    }
}

/**
 * Generates a unique ID.
 * @returns {string} A unique identifier string.
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
