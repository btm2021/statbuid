/* Drag helpers for the toolbox palette */
export function handleDragStart(event) {
    const blockType = event.target.dataset.type;
    if (!blockType) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', blockType);
}
