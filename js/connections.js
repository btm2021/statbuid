// Connection management
window.App.startConnection = function(event, node, type) {
    console.log('Starting connection from node:', node.id);
    this.connectionMode = true;
    this.connectionStart = { node, type };
    
    // Create temporary connection line
    this.tempConnection = this.mainGroup.append('line')
        .attr('class', 'temp-connection')
        .attr('x1', node.x + 40)
        .attr('y1', node.y)
        .attr('x2', node.x + 40)
        .attr('y2', node.y);
    
    // Track mouse movement
    const mousemove = (event) => {
        const rect = this.canvas.node().getBoundingClientRect();
        const x = (event.clientX - rect.left - this.panX) / this.zoom;
        const y = (event.clientY - rect.top - this.panY) / this.zoom;
        
        this.tempConnection
            .attr('x2', x)
            .attr('y2', y);
    };
    
    document.addEventListener('mousemove', mousemove);
    
    // Remove mousemove listener when connection is completed or cancelled
    const cleanup = () => {
        document.removeEventListener('mousemove', mousemove);
    };
    
    // Store cleanup function for later use
    this.connectionCleanup = cleanup;
    
    event.stopPropagation();
};

window.App.createConnection = function(fromNode, toNode) {
    const connection = {
        id: `conn_${fromNode.id}_${toNode.id}`,
        from: { nodeId: fromNode.id, point: 'output' },
        to: { nodeId: toNode.id, point: 'input' }
    };
    
    this.connections.push(connection);
    this.renderConnection(connection);
    this.saveToLocalStorage();
    return connection;
};

window.App.renderConnection = function(connection) {
    // Remove existing connection line
    this.mainGroup.select(`#${connection.id}`).remove();
    
    const fromNode = this.nodes.find(n => n.id === connection.from.nodeId);
    const toNode = this.nodes.find(n => n.id === connection.to.nodeId);
    
    if (!fromNode || !toNode) return;
    
    this.mainGroup.append('line')
        .attr('id', connection.id)
        .attr('class', 'connection-line')
        .attr('x1', fromNode.x + 40)
        .attr('y1', fromNode.y)
        .attr('x2', toNode.x - 40)
        .attr('y2', toNode.y);
};

// Handle connection completion
window.App.completeConnection = function(targetNode) {
    console.log('Completing connection to node:', targetNode.id);
    
    if (!this.connectionMode || !this.connectionStart) {
        console.log('No connection in progress');
        return;
    }
    
    if (this.connectionStart.node.id !== targetNode.id) {
        console.log('Creating connection from', this.connectionStart.node.id, 'to', targetNode.id);
        this.createConnection(this.connectionStart.node, targetNode);
    }
    
    // Cleanup
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
};