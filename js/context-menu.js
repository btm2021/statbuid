// Context menu functionality
window.App.setupContextMenu = function() {
    const contextMenu = document.getElementById('contextMenu');
    
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
    
    // Handle menu item clicks
    contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const shape = e.target.dataset.shape;
        
        if (shape && this.selectedNode) {
            this.changeNodeShape(this.selectedNode, shape);
        } else if (action === 'background' && this.selectedNode) {
            this.changeNodeBackground(this.selectedNode);
        } else if (action === 'textcolor' && this.selectedNode) {
            this.changeNodeTextColor(this.selectedNode);
        } else if (action === 'comment' && this.selectedNode) {
            this.addNodeComment(this.selectedNode);
        } else if (action === 'delete' && this.selectedNode) {
            this.deleteNode(this.selectedNode);
        }
        
        contextMenu.style.display = 'none';
    });
};

window.App.showContextMenu = function(event, node) {
    const contextMenu = document.getElementById('contextMenu');
    this.selectedNode = node;
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
};

window.App.changeNodeShape = function(node, shape) {
    node.shape = shape;
    
    // Re-render the node
    const nodeGroup = this.mainGroup.select(`[data-node-id="${node.id}"]`);
    nodeGroup.select('.node-shape').remove();
    this.createNodeShape(nodeGroup, node);
    this.saveToLocalStorage();
};

window.App.changeNodeBackground = function(node) {
    const color = prompt('Enter background color (e.g., white, #ff0000, red):', node.backgroundColor || 'white');
    if (color !== null) {
        node.backgroundColor = color;
        
        // Update the node display
        const nodeGroup = this.mainGroup.select(`[data-node-id="${node.id}"]`);
        nodeGroup.select('.node-shape').attr('fill', color);
        this.saveToLocalStorage();
    }
};

window.App.changeNodeTextColor = function(node) {
    const color = prompt('Enter text color (e.g., black, #000000, blue):', node.textColor || 'black');
    if (color !== null) {
        node.textColor = color;
        
        // Update the node display
        const nodeGroup = this.mainGroup.select(`[data-node-id="${node.id}"]`);
        nodeGroup.selectAll('.node-text, .node-comment').attr('fill', color);
        this.saveToLocalStorage();
    }
};

window.App.addNodeComment = function(node) {
    const comment = prompt('Enter comment:', node.comment || '');
    if (comment !== null) {
        node.comment = comment;
        
        // Update the node display
        const nodeGroup = this.mainGroup.select(`[data-node-id="${node.id}"]`);
        nodeGroup.selectAll('.node-comment, .comment-background').remove();
        
        if (comment) {
            this.addCommentToNode(nodeGroup, node);
        }
        this.saveToLocalStorage();
    }
};

window.App.deleteNode = function(node) {
    // Remove connections
    this.connections = this.connections.filter(conn => {
        if (conn.from.nodeId === node.id || conn.to.nodeId === node.id) {
            this.mainGroup.select(`#${conn.id}`).remove();
            return false;
        }
        return true;
    });
    
    // Remove node from array
    this.nodes = this.nodes.filter(n => n.id !== node.id);
    
    // Remove node from DOM
    this.mainGroup.select(`[data-node-id="${node.id}"]`).remove();
    
    this.selectedNode = null;
    this.saveToLocalStorage();
};