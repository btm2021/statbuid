/* Floating popup editors for nodes and connections */
import ctx from './state.js';
import { normalizeColor, toColorInputValue } from './color.js';
import { clamp } from './utils.js';
import { applyNodeVisuals } from './nodes.js';

export function openConnectionEditor(connection, pointer) {
    closeActivePopup();

    const popup = document.createElement('form');
    popup.className = 'floating-popup';
    popup.innerHTML = `
        <h4>Tùy ch?nh k?t n?i</h4>
        <label class="popup-field">
            <span>Ki?u du?ng</span>
            <select name="style">
                <option value="solid">Li?n</option>
                <option value="dashed">G?ch d?t</option>
                <option value="dotted">Ch?m</option>
            </select>
        </label>
        <label class="popup-field">
            <span>Màu</span>
            <div class="color-swatches" data-field="color"></div>
            <input type="hidden" name="color" />
        </label>
        <label class="popup-field">
            <span>Nhãn</span>
            <input type="text" name="label" placeholder="Nh?p nhãn" />
        </label>
        <div class="popup-actions">
            <button type="submit">Luu</button>
            <button type="button" data-action="close">Ðóng</button>
        </div>
    `;

    placePopup(popup, pointer);

    popup.querySelector('[name="style"]').value = connection.style;
    setupColorPicker(popup, 'color', connection.color || ctx.config.defaultLineColor);
    popup.querySelector('[name="label"]').value = connection.label || '';

    const submitHandler = (event) => {
        event.preventDefault();
        const formData = new FormData(popup);
        connection.style = formData.get('style') || 'solid';
        connection.color = normalizeColor(formData.get('color') || ctx.config.defaultLineColor);
        connection.label = (formData.get('label') || '').toString().trim();
        ctx.renderConnections?.();
        ctx.saveState?.();
        ctx.refreshAnalysisSummary?.();
        closeActivePopup();
    };

    const closeHandler = () => {
        closeActivePopup();
    };

    popup.addEventListener('submit', submitHandler);
    popup.querySelector('[data-action="close"]').addEventListener('click', closeHandler);

    setActivePopup({ element: popup, closeHandler });
}

export function openNodeEditor(node, pointer) {
    closeActivePopup();

    const popup = document.createElement('form');
    popup.className = 'floating-popup';
    popup.innerHTML = `
        <h4>Tùy ch?nh node</h4>
        <label class="popup-field">
            <span>Hình d?ng</span>
            <select name="shape">
                <option value="rectangle">Ch? nh?t</option>
                <option value="diamond">Hình thoi</option>
                <option value="circle">Hình tròn</option>
                <option value="triangle">Hình tam giác</option>
                <option value="parallelogram">Hình bình hành</option>
            </select>
        </label>
        <label class="popup-field">
            <span>Màu n?n</span>
            <div class="color-swatches" data-field="background"></div>
            <input type="hidden" name="background" />
        </label>
        <label class="popup-field">
            <span>Màu ch?</span>
            <div class="color-swatches" data-field="textColor"></div>
            <input type="hidden" name="textColor" />
        </label>
        <label class="popup-field">
            <span>Ghi chú</span>
            <textarea name="comment" rows="2" placeholder="Thêm ghi chú"></textarea>
        </label>
        <div class="popup-actions">
            <button type="submit">Luu</button>
            <button type="button" data-action="close">Ðóng</button>
        </div>
    `;

    placePopup(popup, pointer);

    popup.querySelector('[name="shape"]').value = node.shape;
    setupColorPicker(popup, 'background', node.background);
    setupColorPicker(popup, 'textColor', node.textColor);
    popup.querySelector('[name="comment"]').value = node.comment;

    const submitHandler = (event) => {
        event.preventDefault();
        const formData = new FormData(popup);
        node.shape = formData.get('shape') || ctx.config.defaultShape;
        node.background = normalizeColor(formData.get('background') || ctx.config.defaultNodeBackground);
        node.textColor = normalizeColor(formData.get('textColor') || ctx.config.defaultNodeTextColor);
        node.comment = (formData.get('comment') || '').toString().trim();
        applyNodeVisuals(node);
        ctx.renderConnections?.();
        ctx.saveState?.();
        ctx.refreshAnalysisSummary?.();
        closeActivePopup();
    };

    const closeHandler = () => {
        closeActivePopup();
    };

    popup.addEventListener('submit', submitHandler);
    popup.querySelector('[data-action="close"]').addEventListener('click', closeHandler);

    setActivePopup({ element: popup, closeHandler });
}

function placePopup(popup, pointer) {
    const { canvas } = ctx.dom;
    if (!canvas) return;

    popup.style.position = 'absolute';
    popup.style.opacity = '0';
    popup.style.zIndex = '20';
    canvas.appendChild(popup);

    popup.addEventListener('mousedown', (event) => event.stopPropagation());
    popup.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });

    const canvasRect = canvas.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const targetX = clamp(pointer.x - canvasRect.left - popupRect.width / 2, 8, canvasRect.width - popupRect.width - 8);
    const targetY = clamp(pointer.y - canvasRect.top - popupRect.height - 12, 8, canvasRect.height - popupRect.height - 8);

    popup.style.left = `${targetX}px`;
    popup.style.top = `${targetY}px`;
    popup.style.opacity = '1';
}

function setActivePopup(popup) {
    ctx.activePopup = popup;
    setTimeout(() => {
        document.addEventListener('mousedown', handlePopupOutsideClick, true);
    }, 0);
}

function handlePopupOutsideClick(event) {
    if (!ctx.activePopup || !ctx.activePopup.element) return;
    if (ctx.activePopup.element.contains(event.target)) return;
    closeActivePopup();
}

export function closeActivePopup() {
    if (!ctx.activePopup) return;
    if (ctx.activePopup.element) {
        ctx.activePopup.element.remove();
    }
    document.removeEventListener('mousedown', handlePopupOutsideClick, true);
    ctx.activePopup = null;
}

function setupColorPicker(popup, fieldName, initialColor) {
    const container = popup.querySelector(`.color-swatches[data-field="${fieldName}"]`);
    const hiddenInput = popup.querySelector(`input[name="${fieldName}"]`);
    if (!container || !hiddenInput) return;

    container.innerHTML = '';
    let selected = normalizeColor(initialColor);
    if (!selected) {
        selected = toColorInputValue(ctx.config.presetColors[0]).toLowerCase();
    }

    const palette = [...ctx.config.presetColors];
    if (selected && !palette.some((color) => normalizeColor(color) === selected)) {
        palette.unshift(selected);
    }

    hiddenInput.value = selected;
    container.addEventListener('click', (event) => event.stopPropagation());

    palette.forEach((color) => {
        const normalized = normalizeColor(color);
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        if (normalized === selected) {
            swatch.classList.add('selected');
        }
        swatch.addEventListener('click', () => {
            selected = normalized;
            hiddenInput.value = selected;
            container.querySelectorAll('.color-swatch').forEach((node) => {
                node.classList.toggle('selected', node === swatch);
            });
        });
        container.appendChild(swatch);
    });
}

ctx.openNodeEditor = openNodeEditor;
ctx.openConnectionEditor = openConnectionEditor;
ctx.closeActivePopup = closeActivePopup;