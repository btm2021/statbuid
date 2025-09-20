/* Lightweight analytics displayed in the dock */
import ctx from './state.js';

export function refreshAnalysisSummary() {
    const { analysisTotalNodes, analysisTotalConnections, analysisStartNodes } = ctx.dom;
    if (!analysisTotalNodes || !analysisTotalConnections || !analysisStartNodes) return;
    analysisTotalNodes.textContent = ctx.nodes.length;
    analysisTotalConnections.textContent = ctx.connections.length;
    const indegree = new Map();
    ctx.nodes.forEach((node) => indegree.set(node.id, 0));
    ctx.connections.forEach((conn) => {
        indegree.set(conn.targetId, (indegree.get(conn.targetId) || 0) + 1);
    });
    const startNodes = Array.from(indegree.values()).filter((deg) => deg === 0).length;
    analysisStartNodes.textContent = startNodes;
}

ctx.refreshAnalysisSummary = refreshAnalysisSummary;
