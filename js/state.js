import { TOTAL_GRID_W, VIEW_W, GRID_H, P } from './constants.js';

export function createGrid(w = TOTAL_GRID_W) {
    let g = [];
    for (let y = 0; y < GRID_H; y++) {
        let row = []; 
        for (let x = 0; x < w; x++) row.push({ state: 'grass', watered: 0, crop: null, obj: null, path: null, forage: null, inGreenhouse: false, greenhouseOrigin: null });
        g.push(row);
    }
    return g;
}

export const state = {
    uiMode: 'char_select', map: 'main', 
    charColors: { skin: '#f2c49b', hair: '#221c35', shirt: '#5fb1cc', pants: '#ad6c43' },
    jamDesign: Array(25).fill(null), grid: createGrid(TOTAL_GRID_W), ghGrid: createGrid(VIEW_W),
    cameraX: 0, cameraTargetX: 0, hasDeed: false, readMailCount: 1, openedMailCount: 0, activeMailIndex: null,
    mushroomSpawnedThisNight: false, farmer: { x: 4, y: 4, state: 'idle', facing: 'right', animTimer: 0, queue: []},
    chickens: [], dayTime: 0, day: 1, season: 0, weather: 'sunny',
    money: 100, energy: 100, exp: 0, notifiedLevel: 1, levelUpUnlocks: [],
    kitchenUpgrades: { jar: false, florist_table: false }, inventory: { seed_blueberry: 5, deed: 0 },
    standSlots: [ { item: null, price: 0, qty: 0 }, { item: null, price: 0, qty: 0 }, { item: null, price: 0, qty: 0}],
    customers: [], fireflies: [], butterflies: [],
    selectedTool: 'till', selectedItem: null, activeTab: 'seeds', activePalette: P['w'],
    transitionTimer: 0, rightPanelScroll: 0, modalScroll: 0, particles: [], mouseX: 0, mouseY: 0
};

state.grid[6][1].obj = { id: 'stand', type: 'system' }; 
state.grid[6][2].obj = { id: 'mailbox', type: 'system' };

for(let y=0; y<GRID_H; y++) {
    for(let x=0; x<VIEW_W; x++) {
        state.ghGrid[y][x].state = 'tilled';
        if(x===0 || x===VIEW_W-1 || y===0 || y===GRID_H-1) {
            state.ghGrid[y][x].obj = { id: 'path_stone' };
            if(y===GRID_H-1 && x===Math.floor(VIEW_W/2)) state.ghGrid[y][x].obj = null; 
        }
    }
}

// Shared UI interaction state
export const uiState = {
    buttons: [],
    slotSelecting: -1,
    isTouch: false,
    touchStartY: 0
};
