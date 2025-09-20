// Main application state - Load this first
window.App = {
    nodes: [],
    connections: [],
    selectedNode: null,
    draggedNode: null,
    connectionMode: false,
    connectionStart: null,
    nextNodeId: 1,
    
    // Canvas state
    zoom: 1,
    panX: 0,
    panY: 0,
    
    // Initialize application
    init() {
        console.log('Initializing Trading Strategy Visualization...');
        this.setupCanvas();
        this.setupSidebar();
        this.setupContextMenu();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        console.log('Trading Strategy Visualization initialized');
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Handle canvas clicks to clear selection
        this.canvas.on('click', (event) => {
            if (this.connectionMode) {
                this.cancelConnection();
            }
        });
    },
    
    // Cancel connection
    cancelConnection() {
        console.log('Cancelling connection');
        this.connectionMode = false;
        this.connectionStart = null;
        
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
        
        if (this.connectionCleanup) {
            this.connectionCleanup();
            this.connectionCleanup = null;
        }
    },
    
    // Save to localStorage
    saveToLocalStorage() {
        const data = {
            nodes: this.nodes,
            connections: this.connections,
            nextNodeId: this.nextNodeId,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
        localStorage.setItem('tradingStrategy', JSON.stringify(data));
    },
    
    // Load from localStorage
    loadFromLocalStorage() {
        const saved = localStorage.getItem('tradingStrategy');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.nodes = data.nodes || [];
                this.connections = data.connections || [];
                this.nextNodeId = data.nextNodeId || 1;
                
                // Restore canvas state
                if (data.zoom && data.panX !== undefined && data.panY !== undefined) {
                    this.zoom = data.zoom;
                    this.panX = data.panX;
                    this.panY = data.panY;
                    
                    // Apply zoom/pan to canvas
                    const transform = d3.zoomIdentity.translate(this.panX, this.panY).scale(this.zoom);
                    this.canvas.call(d3.zoom().transform, transform);
                }
                
                // Re-render all nodes and connections
                this.nodes.forEach(node => this.renderNode(node));
                this.connections.forEach(conn => this.renderConnection(conn));
                
                console.log('Loaded from localStorage:', this.nodes.length, 'nodes,', this.connections.length, 'connections');
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});