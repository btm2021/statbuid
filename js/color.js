/* Color normalization helpers for keeping palette consistent */
export function normalizeColor(color) {
    if (!color) return color;
    const probe = document.createElement('span');
    probe.style.display = 'none';
    probe.style.color = color;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const rgbMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!rgbMatch) return color;
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`.toLowerCase();
}

export function toColorInputValue(color) {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color.toLowerCase();
    return normalizeColor(color);
}