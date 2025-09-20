/* Application bootstrap: wire up DOM and event handlers */
import ctx from './state.js';
import { cacheDom, ensureDomReady } from './dom.js';
import { syncSvgSize, updateViewTransform, handleCanvasWheel, handleResize, adjustGridScale } from './view.js';
import { handleCanvasMouseDown, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalKeyDown } from './interaction.js';
import { handleDragStart } from './toolbox.js';
import { handleDropOnCanvas } from './nodes.js';
import { autoArrangeNodes } from './arrange.js';
import { refreshAnalysisSummary } from './analysis.js';
import { saveState, loadState } from './persistence.js';
import './connections.js';
import './popups.js';
import './selection.js';
import './geometry.js';

function activateTab(tabName) {
    ctx.dom.tabButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    ctx.dom.tabPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
}

function initialiseApp() {
    cacheDom();
    ensureDomReady();
    syncSvgSize();
    updateViewTransform();

    window.addEventListener('resize', handleResize);

    if (ctx.dom.toolbox) {
        ctx.dom.toolbox.addEventListener('dragstart', handleDragStart);
    }

    const { canvas } = ctx.dom;
    if (canvas) {
        canvas.addEventListener('dragover', (event) => event.preventDefault());
        canvas.addEventListener('drop', handleDropOnCanvas);
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        canvas.addEventListener(
            'wheel',
            (event) => {
                const changed = handleCanvasWheel(event);
                if (changed) {
                    saveState();
                }
            },
            { passive: false }
        );
        canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('click', (event) => {
        if (!canvas || canvas.contains(event.target)) return;
        ctx.clearSelection?.();
        ctx.closeActivePopup?.();
    });

    if (ctx.dom.autoArrangeButton) {
        ctx.dom.autoArrangeButton.addEventListener('click', autoArrangeNodes);
    }

    ctx.dom.tabButtons.forEach((button) => {
        button.addEventListener('click', () => activateTab(button.dataset.tab));
    });

    if (ctx.dom.gridZoomInBtn) {
        ctx.dom.gridZoomInBtn.addEventListener('click', () => {
            if (adjustGridScale(1.2)) {
                saveState();
            }
        });
    }

    if (ctx.dom.gridZoomOutBtn) {
        ctx.dom.gridZoomOutBtn.addEventListener('click', () => {
            if (adjustGridScale(1 / 1.2)) {
                saveState();
            }
        });
    }

    loadState();
    refreshAnalysisSummary();
    ctx.renderConnections?.();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseApp);
} else {
    initialiseApp();
}
