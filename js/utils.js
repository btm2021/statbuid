/* Generic math helpers shared across modules */
export function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

export function clampWithMargin(value, min, max, margin) {
    const lowerBound = Math.min(min, max) - margin;
    const upperBound = Math.max(min, max) + margin;
    return Math.min(Math.max(value, lowerBound), upperBound);
}

export function cubicBezierPoint(p0, p1, p2, p3, t) {
    const oneMinusT = 1 - t;
    const oneMinusTSquared = oneMinusT * oneMinusT;
    const tSquared = t * t;
    return (
        oneMinusT * oneMinusTSquared * p0 +
        3 * oneMinusTSquared * t * p1 +
        3 * oneMinusT * tSquared * p2 +
        t * tSquared * p3
    );
}