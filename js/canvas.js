// Canvas setup and management
window.App.setupCanvas = function() {
    this.canvas = d3.select('#canvas');
    
    // Create main group for zoom/pan
    this.mainGroup = this.canvas.append('g').attr('class', 'main-group');
    
    // Create grid pattern
    this.createGrid();
    
    // Create arrow marker for connections
    this.createArrowMarker();
    
    // Setup zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            this.zoom = event.transform.k;
            this.panX = event.transform.x;
            this.panY = event.transform.y;
            this.mainGroup.attr('transform', event.transform);
        });
    
    this.canvas.call(zoom);
    
    // Setup drag and drop
    this.canvas.node().addEventListener('dragover', (e) => e.preventDefault());
    this.canvas.node().addEventListener('drop', (e) => this.handleCanvasDrop(e));
};

window.App.createGrid = function() {
    const defs = this.canvas.append('defs');
    
    const pattern = defs.append('pattern')
        .attr('id', 'grid')
        .attr('width', 20)
        .attr('height', 20)
        .attr('patternUnits', 'userSpaceOnUse');
    
    pattern.append('path')
        .attr('d', 'M 20 0 L 0 0 0 20')
        .attr('class', 'grid-pattern');
    
    this.mainGroup.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'url(#grid)');
};

window.App.createArrowMarker = function() {
    const defs = this.canvas.select('defs');
    
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#666');
};