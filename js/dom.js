/* Query and cache DOM nodes used across the app */
import ctx from './state.js';

export function cacheDom() {
    ctx.dom.canvas = document.getElementById('canvas');
    ctx.dom.canvasContent = document.getElementById('canvasContent');
    ctx.dom.toolbox = document.querySelector('.toolbox');
    ctx.dom.autoArrangeButton = document.getElementById('autoArrange');
    ctx.dom.tabButtons = Array.from(document.querySelectorAll('.tab-button'));
    ctx.dom.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
    ctx.dom.gridZoomInBtn = document.getElementById('gridZoomIn');
    ctx.dom.gridZoomOutBtn = document.getElementById('gridZoomOut');
    ctx.dom.gridScaleLabel = document.getElementById('gridScaleLabel');
    ctx.dom.analysisTotalNodes = document.getElementById('analysisTotalNodes');
    ctx.dom.analysisStartNodes = document.getElementById('analysisStartNodes');
    ctx.dom.analysisTotalConnections = document.getElementById('analysisTotalConnections');
    ctx.dom.svg = d3.select('#connection-layer');
    const existingDefs = ctx.dom.svg.select('defs');
    ctx.dom.defs = existingDefs.empty() ? ctx.dom.svg.append('defs') : existingDefs;
}

export function ensureDomReady() {
    if (!ctx.dom.canvas) {
        throw new Error('Canvas element is missing from the DOM');
    }
}