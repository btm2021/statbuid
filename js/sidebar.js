// Sidebar functionality
window.App.setupSidebar = function() {
    const blockItems = document.querySelectorAll('.block-item');
    
    blockItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: item.dataset.type,
                category: item.dataset.category,
                text: item.textContent
            }));
        });
        
        item.draggable = true;
    });
};

// Handle drop on canvas
window.App.handleCanvasDrop = function(e) {
    e.preventDefault();
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const rect = this.canvas.node().getBoundingClientRect();
        
        // Convert screen coordinates to canvas coordinates
        const x = (e.clientX - rect.left - this.panX) / this.zoom;
        const y = (e.clientY - rect.top - this.panY) / this.zoom;
        
        this.createNode(x, y, data);
    } catch (error) {
        console.error('Error handling drop:', error);
    }
};