/* Shared application state for the decision flow builder */
const ctx = {
    dom: {
        canvas: null,
        canvasContent: null,
        toolbox: null,
        autoArrangeButton: null,
        tabButtons: [],
        tabPanels: [],
        gridZoomInBtn: null,
        gridZoomOutBtn: null,
        gridScaleLabel: null,
        analysisTotalNodes: null,
        analysisStartNodes: null,
        analysisTotalConnections: null,
        svg: null,
        defs: null,
    },
    config: {
        stateStorageKey: 'nodeDiagramState',
        gridBase: 32,
        gridMin: 0.4,
        gridMax: 2.5,
        defaultLineColor: '#2563eb',
        defaultNodeBackground: '#f8fafc',
        defaultNodeTextColor: '#0f172a',
        defaultShape: 'rectangle',
        workspaceMargin: 400,
        lineStyles: {
            solid: '',
            dashed: '12 8',
            dotted: '2 8',
        },
        presetColors: ['#000000', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#0ea5e9'],
    },
    viewScale: 1,
    pan: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    pointerStart: { x: 0, y: 0 },
    isPanning: false,
    nodeCounter: 1,
    connectionCounter: 1,
    nodes: [],
    nodeLookup: new Map(),
    connections: [],
    draggingNode: null,
    dragMoved: false,
    dragOffset: { x: 0, y: 0 },
    connectingState: null,
    tempPath: null,
    activePopup: null,
    isRestoringState: false,
    selectedNodeId: null,
    selectedConnectionId: null,
};

export default ctx;

if (typeof window !== 'undefined') {
    window.DecisionFlowContext = ctx;
}