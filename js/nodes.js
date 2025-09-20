// Node creation and management
window.App.createNode = function(x, y, data) {
    const node = {
        id: this.nextNodeId++,
        x: x,
        y: y,
        type: data.type,
        category: data.category,
        text: data.text,
        shape: 'rectangle', // default shape
        comment: '',
        backgroundColor: 'white',
        textColor: 'black',
        inputs: [{ id: 'in1', connected: false }],
        outputs: [{ id: 'out1', connected: false }]
    };
    
    this.nodes.push(node);
    this.renderNode(node);
    this.saveToLocalStorage();
    return node;
};

window.App.renderNode = function(node) {
    const nodeGroup = this.mainGroup.append('g')
        .attr('class', 'node-group')
        .attr('data-node-id', node.id)
        .attr('transform', `translate(${node.x}, ${node.y})`);
    
    // Create shape based on node.shape
    this.createNodeShape(nodeGroup, node);
    
    // Add text
    nodeGroup.append('text')
        .attr('class', 'node-text')
        .attr('y', 0)
        .attr('fill', node.textColor || 'black')
        .text(node.text);
    
    // Add comment if exists
    if (node.comment) {
        this.addCommentToNode(nodeGroup, node);
    }
    
    // Add connection points
    this.createConnectionPoints(nodeGroup, node);
    
    // Setup drag behavior
    this.setupNodeDrag(nodeGroup, node);
    
    // Setup context menu
    nodeGroup.on('contextmenu', (event) => {
        event.preventDefault();
        this.showContextMenu(event, node);
    });
};

window.App.createNodeShape = function(group, node) {
    const width = 80;
    const height = 40;
    
    switch (node.shape) {
        case 'rectangle':
            group.append('rect')
                .attr('class', 'node-shape node-rectangle')
                .attr('x', -width/2)
                .attr('y', -height/2)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', node.backgroundColor || 'white');
            break;
            
        case 'diamond':
            group.append('polygon')
                .attr('class', 'node-shape node-diamond')
                .attr('points', `0,-${height/2} ${width/2},0 0,${height/2} -${width/2},0`)
                .attr('fill', node.backgroundColor || 'white');
            break;
            
        case 'circle':
            group.append('circle')
                .attr('class', 'node-shape node-circle')
                .attr('r', Math.max(width, height) / 2)
                .attr('fill', node.backgroundColor || 'white');
            break;
    }
};

window.App.createConnectionPoints = function(group, node) {
    // Input point (left)
    group.append('circle')
        .attr('class', 'connection-point input-point')
        .attr('cx', -40)
        .attr('cy', 0)
        .attr('r', 4)
        .on('click', (event) => {
            event.stopPropagation();
            if (this.connectionMode && this.connectionStart) {
                this.completeConnection(node);
            }
        });
    
    // Output point (right)  
    group.append('circle')
        .attr('class', 'connection-point output-point')
        .attr('cx', 40)
        .attr('cy', 0)
        .attr('r', 4)
        .on('click', (event) => {
            event.stopPropagation();
            if (!this.connectionMode) {
                this.startConnection(event, node, 'output');
            }
        });
};

window.App.setupNodeDrag = function(group, node) {
    const drag = d3.drag()
        .on('start', (event) => {
            this.selectedNode = node;
            group.select('.node-shape').classed('selected', true);
        })
        .on('drag', (event) => {
            node.x += event.dx / this.zoom;
            node.y += event.dy / this.zoom;
            group.attr('transform', `translate(${node.x}, ${node.y})`);
            this.updateConnections(node);
        })
        .on('end', () => {
            group.select('.node-shape').classed('selected', false);
            this.saveToLocalStorage();
        });
    
    group.call(drag);
};

window.App.updateConnections = function(node) {
    // Update any connections involving this node
    this.connections.forEach(conn => {
        if (conn.from.nodeId === node.id || conn.to.nodeId === node.id) {
            this.renderConnection(conn);
        }
    });
};

window.App.addCommentToNode = function(nodeGroup, node) {
    const comment = node.comment;
    if (!comment) return;
    
    // Calculate text dimensions
    const maxWidth = 120;
    const lineHeight = 12;
    const padding = 4;
    
    // Split text into lines
    const words = comment.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (testLine.length * 5.5 > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    
    // Calculate background dimensions
    const bgWidth = Math.min(maxWidth + padding * 2, Math.max(...lines.map(line => line.length * 5.5)) + padding * 2);
    const bgHeight = lines.length * lineHeight + padding * 2;
    
    // Add background rectangle
    nodeGroup.append('rect')
        .attr('class', 'comment-background')
        .attr('x', -bgWidth / 2)
        .attr('y', 30)
        .attr('width', bgWidth)
        .attr('height', bgHeight);
    
    // Add text lines
    lines.forEach((line, index) => {
        nodeGroup.append('text')
            .attr('class', 'node-comment')
            .attr('y', 40 + index * lineHeight)
            .attr('fill', node.textColor || '#666')
            .text(line);
    });
};