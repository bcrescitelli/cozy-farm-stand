import { state, uiState } from './state.js';
import { canvas, updateDraw } from './render.js';
import { update } from './logic.js';
import { audio } from './audio.js';
import { CW, CH, RIGHT_PANEL_W, SAFE_R, TILE_SIZE, OFFSET_X, OFFSET_Y, TOTAL_GRID_W, VIEW_W, GRID_H } from './constants.js';

function updateMousePos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect(); const scale = Math.min(rect.width / CW, rect.height / CH);
    const drawnW = CW * scale; const drawnH = CH * scale;
    const offsetX = (rect.width - drawnW) / 2; const offsetY = (rect.height - drawnH) / 2;
    state.mouseX = (clientX - rect.left - offsetX) / scale; state.mouseY = (clientY - rect.top - offsetY) / scale;
}

canvas.addEventListener('mousemove', (e) => {
    updateMousePos(e.clientX, e.clientY);
    if (state.uiMode === 'jam_design' && e.buttons === 1) {
        const mw = 400; const mh = 500; const mx = (CW - mw)/2; const my = (CH - mh)/2; const gridX = mx + 75; const gridY = my + 100;
        if (state.mouseX >= gridX && state.mouseX < gridX + 250 && state.mouseY >= gridY && state.mouseY < gridY + 250) {
            let cx = Math.floor((state.mouseX - gridX) / 50); let cy = Math.floor((state.mouseY - gridY) / 50);
            state.jamDesign[cy * 5 + cx] = state.activePalette; audio.playUI();
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    if (state.uiMode === 'normal' && state.mouseX > CW - RIGHT_PANEL_W - SAFE_R) {
        state.rightPanelScroll += e.deltaY; if (state.rightPanelScroll < 0) state.rightPanelScroll = 0;
    } else if (state.uiMode.includes('modal') || state.uiMode === 'book' || state.uiMode === 'stand_select') {
        state.modalScroll += e.deltaY; if (state.modalScroll < 0) state.modalScroll = 0;
    }
});

canvas.addEventListener('touchstart', (e) => {
    uiState.isTouch = true;
    if(!audio.playing) audio.init();
    uiState.touchStartY = e.touches[0].clientY; updateMousePos(e.touches[0].clientX, e.touches[0].clientY); handleInput();
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    let dy = uiState.touchStartY - e.touches[0].clientY;
    if (state.uiMode === 'normal' && state.mouseX > CW - RIGHT_PANEL_W - SAFE_R) {
        state.rightPanelScroll += dy * 1.5; if (state.rightPanelScroll < 0) state.rightPanelScroll = 0; e.preventDefault();
    } else if (state.uiMode.includes('modal') || state.uiMode === 'book' || state.uiMode === 'stand_select') {
        state.modalScroll += dy * 1.5; if (state.modalScroll < 0) state.modalScroll = 0; e.preventDefault();
    }
    uiState.touchStartY = e.touches[0].clientY; updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: false});

canvas.addEventListener('mousedown', (e) => { 
    if (uiState.isTouch) return;
    if(!audio.playing) audio.init(); 
    updateMousePos(e.clientX, e.clientY);
    handleInput(); 
});

function handleInput() {
    if (state.transitionTimer > 0) return;
    if (state.uiMode !== 'normal') {
        let clickedBtn = false;
        for (const b of uiState.buttons) {
            if (state.mouseX >= b.x && state.mouseX <= b.x + b.w && state.mouseY >= b.y && state.mouseY <= b.y + b.h) {
                audio.playUI(); b.onClick(); clickedBtn = true; break;
            }
        }
        if (state.uiMode === 'jam_design') {
            const mw = 400; const mh = 500; const mx = (CW - mw)/2; const my = (CH - mh)/2; const gridX = mx + 75; const gridY = my + 100;
            if (state.mouseX >= gridX && state.mouseX < gridX + 250 && state.mouseY >= gridY && state.mouseY < gridY + 250) {
                let cx = Math.floor((state.mouseX - gridX) / 50); let cy = Math.floor((state.mouseY - gridY) / 50);
                state.jamDesign[cy * 5 + cx] = state.activePalette; clickedBtn = true; audio.playUI();
            }
        }
        if(!clickedBtn && (state.uiMode === 'levelup_modal' || state.uiMode === 'stand' || state.uiMode === 'book' || state.uiMode === 'stand_select' || state.uiMode === 'mail_modal' || state.uiMode === 'jam_design')) {
            const mw = 650; const mh = 550; const mx = (CW - mw)/2; const my = (CH - mh)/2;
            if (state.mouseX < mx || state.mouseX > mx+mw || state.mouseY < my || state.mouseY > my+mh) {
                audio.playUI(); if (state.uiMode === 'mail_modal' && state.activeMailIndex !== null) state.activeMailIndex = null; else state.uiMode = 'normal';
            }
        }
        return;
    }

    for (let i = uiState.buttons.length - 1; i >= 0; i--) {
        const b = uiState.buttons[i];
        if (state.mouseX >= b.x && state.mouseX <= b.x + b.w && state.mouseY >= b.y && state.mouseY <= b.y + b.h) { audio.playUI(); b.onClick(); return; }
    }

    let currentGrid = state.map === 'main' ? state.grid : state.ghGrid;
    let limitW = state.map === 'main' ? TOTAL_GRID_W : VIEW_W;
    const tx = Math.floor((state.mouseX - OFFSET_X + state.cameraX) / TILE_SIZE);
    const ty = Math.floor((state.mouseY - OFFSET_Y) / TILE_SIZE);

    if (tx >= 0 && tx < limitW && ty >= 0 && ty < GRID_H) {
        const cell = currentGrid[ty][tx];
        let action = state.selectedTool;
        if (state.selectedTool !== 'pickaxe') {
            if (cell.obj && cell.obj.id === 'stand') action = 'stand';
            else if (cell.obj && cell.obj.id === 'mailbox') action = 'mailbox';
            else if (cell.forage) action = 'forage';
            else if (cell.crop && cell.crop.progress >= 100) action = 'harvest';
        }
        if(action) state.farmer.queue.push({ type: action, tx, ty, data: state.selectedItem });
    }
}

let previousTime = performance.now();
function gameLoop() {
    const now = performance.now();
    const dt = Math.min((now - previousTime) / 1000, 0.1);
    previousTime = now;

    if (state.uiMode !== 'char_select' && state.transitionTimer <= 0) {
        update(dt);
    }
    
    updateDraw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
