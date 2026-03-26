import { state, uiState } from './state.js';
import { CROP_DATA, DECOR_DATA, SHOP_ITEMS, RECIPES, SYSTEM_ITEMS, DAY_LENGTH, TOTAL_GRID_W, VIEW_W, GRID_H, OFFSET_X, OFFSET_Y, TILE_SIZE, CW, CH, P, TEXT_W, TEXT_Y, MAIL_LETTERS } from './constants.js';
import { audio } from './audio.js';

export function getLevel(exp) {
    if (exp >= 1000) return 5; if (exp >= 500) return 4;
    if (exp >= 200) return 3; if (exp >= 50) return 2; return 1;
}

export function getUnlocks(lvl) {
    let unl = [];
    for(let id in CROP_DATA) if (CROP_DATA[id].minLevel === lvl) unl.push({name: CROP_DATA[id].name, id: 'seed_'+id});
    for(let id in DECOR_DATA) if (DECOR_DATA[id].minLevel === lvl) unl.push({name: DECOR_DATA[id].name, id: id.startsWith('fence') ? id+'_post': id});
    for(let id in SHOP_ITEMS) if (SHOP_ITEMS[id].minLevel === lvl) unl.push({name: SHOP_ITEMS[id].name, id: id});
    return unl;
}

export function getBasePrice(itemId) {
    if (itemId === 'jam') return 60; if (itemId === 'bouquet') return 250;
    if (itemId === 'mushroom_brown') return 30; if (itemId === 'mushroom_glow') return 120;
    if (itemId === 'cherry' || itemId === 'peach') return 25;
    if (CROP_DATA[itemId]) return CROP_DATA[itemId].price;
    const rec = RECIPES.find(r => r.id === itemId); if (rec) return rec.price;
    if (SHOP_ITEMS[itemId] && SHOP_ITEMS[itemId].type === 'item') return Math.floor(SHOP_ITEMS[itemId].cost/2);
    return 0;
}

export const isFlower = (id) => ['tulip', 'rose', 'sunflower'].includes(id);
export const isFruit = (id) => ['blueberry', 'strawberry', 'tomato', 'cherry', 'pepper', 'eggplant', 'pumpkin', 'melon', 'peach'].includes(id);

export function spawnParticles(tx, ty, color, count = 10, isScreen = false) {
    const px = isScreen ? tx : OFFSET_X + tx * TILE_SIZE + TILE_SIZE/2 - state.cameraX;
    const py = isScreen ? ty : OFFSET_Y + ty * TILE_SIZE + TILE_SIZE/2;
    for (let i = 0; i < count; i++) {
        state.particles.push({ 
            x: px, y: py, worldX: isScreen ? px + state.cameraX : tx * TILE_SIZE + TILE_SIZE/2, 
            vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 1) * 100 - 50, 
            life: 1.0, color: color, isScreen 
        });
    }
}

export function checkLevelUp() {
    let lvl = getLevel(state.exp);
    if (lvl > state.notifiedLevel) {
        state.notifiedLevel = lvl; state.levelUpUnlocks = getUnlocks(lvl);
        state.uiMode = 'levelup_modal'; state.modalScroll = 0;
    }
}

export function processNewDay() {
    state.day++; state.energy = 100; state.dayTime = 0;
    state.fireflies = []; state.butterflies = []; state.mushroomSpawnedThisNight = false;
    if (state.readMailCount < state.day && state.readMailCount < MAIL_LETTERS.length) { state.readMailCount++; }
    if (state.day % 4 === 1 && state.day > 1) state.season = (state.season + 1) % 4;
    state.weather = Math.random() < 0.25 && state.season !== 3 ? 'raining' : 'sunny';
    let allGrids = [state.grid, state.ghGrid];

    for(let g of allGrids) {
        let isGh = g === state.ghGrid; let w = isGh ? VIEW_W : TOTAL_GRID_W;
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < w; x++) {
                const cell = g[y][x];
                if (cell.forage !== 'hay') cell.forage = null; // Do not clear hay!
                if (cell.obj && cell.obj.id === 'cherry_tree' && Math.random() < 0.2) cell.forage = 'cherry';
                if (cell.obj && cell.obj.id === 'peach_tree' && Math.random() < 0.2) cell.forage = 'peach';

                if (cell.crop && cell.crop.progress < 100) {
                    const cData = CROP_DATA[cell.crop.type]; let speed = cell.watered > 0 ? 1.0 : 0.1;
                    if (cell.fertilized) speed *= 1.5; if (isGh) speed *= 1.5;
                    cell.crop.progress += (100 / cData.time) * speed * (DAY_LENGTH * 0.4); 
                    if (cell.crop.progress > 100) cell.crop.progress = 100;
                }

                if (state.season === 3 && !isGh) { cell.crop = null; cell.watered = 0; } 
                else {
                    if (state.weather === 'raining' && !isGh) cell.watered = 1;
                    else if (cell.watered > 0) cell.watered--;
                    if (cell.obj && cell.obj.id === 'sprinkler') {
                        const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
                        for(let d of dirs) {
                            let nx = x+d[0], ny = y+d[1];
                            if(nx >= 0 && nx < w && ny >= 0 && ny < GRID_H && g[ny][nx].state === 'tilled') { g[ny][nx].watered = 1; }
                        }
                    }
                }
            }
        }
    }
}

export function executeAction(act) {
    if (act.type === 'walk') return;
    let currentGrid = state.map === 'main' ? state.grid : state.ghGrid; let limitW = state.map === 'main' ? TOTAL_GRID_W : VIEW_W;
    const cell = currentGrid[act.ty][act.tx];
    
    if (act.type === 'stand') { state.uiMode = 'stand'; return; }
    if (act.type === 'mailbox') { state.uiMode = 'mail_modal'; state.activeMailIndex = null; state.openedMailCount = state.readMailCount; return; }
    
    if (act.type === 'forage' && cell.forage) {
        state.inventory[cell.forage] = (state.inventory[cell.forage]||0)+1; cell.forage = null; spawnParticles(act.tx, act.ty, P['M'], 10); audio.playTool('till'); return;
    }
    if (state.energy < 2 && ['till', 'water', 'pickaxe'].includes(act.type)) return;

    if (act.type === 'till') {
        if (cell.state === 'grass' && !cell.obj && !cell.path && !cell.inGreenhouse) { cell.state = 'tilled'; state.energy -= 2; spawnParticles(act.tx, act.ty, P['D'], 5); audio.playTool('till'); } 
        else if (cell.state === 'tilled' && !cell.crop) { cell.state = 'grass'; cell.fertilized = false; cell.watered = 0; spawnParticles(act.tx, act.ty, P['g'], 5); audio.playTool('till'); }
    } else if (act.type === 'pickaxe') {
        if (cell.obj) {
            audio.playTool('pickaxe');
            if (cell.obj.id === 'greenhouse' || cell.obj.id === 'greenhouse_part') {
                let origin = cell.obj.originX !== undefined ? {x: cell.obj.originX, y: cell.obj.originY} : cell.greenhouseOrigin;
                if (origin) {
                    state.inventory['greenhouse'] = (state.inventory['greenhouse']||0) + 1;
                    for (let y = 0; y < GRID_H; y++) {
                        for (let x = 0; x < limitW; x++) {
                            let c = currentGrid[y][x];
                            if (c.greenhouseOrigin && c.greenhouseOrigin.x === origin.x && c.greenhouseOrigin.y === origin.y) {
                                c.inGreenhouse = false; c.greenhouseOrigin = null; if (c.obj && (c.obj.id === 'greenhouse' || c.obj.id === 'greenhouse_part')) c.obj = null;
                            }
                        }
                    }
                    for(let y=0; y<GRID_H; y++) {
                        for(let x=0; x<VIEW_W; x++) {
                            state.ghGrid[y][x] = { state: 'tilled', watered: 0, crop: null, obj: null, path: null, forage: null, inGreenhouse: false, greenhouseOrigin: null };
                            if(x===0 || x===VIEW_W-1 || y===0 || y===GRID_H-1) { state.ghGrid[y][x].obj = { id: 'path_stone' }; if(y===GRID_H-1 && x===Math.floor(VIEW_W/2)) state.ghGrid[y][x].obj = null; }
                        }
                    }
                    spawnParticles(act.tx, act.ty, P['b'], 10); state.energy -= 1;
                }
            } else if (cell.obj.id === 'arch' || cell.obj.id === 'arch_part') {
                let ox = cell.obj.originX !== undefined ? cell.obj.originX : act.tx; let oy = cell.obj.originY !== undefined ? cell.obj.originY : act.ty;
                state.inventory['arch'] = (state.inventory['arch']||0) + 1;
                if (currentGrid[oy][ox-1]) currentGrid[oy][ox-1].obj = null; if (currentGrid[oy][ox]) currentGrid[oy][ox].obj = null; if (currentGrid[oy][ox+1]) currentGrid[oy][ox+1].obj = null;
                spawnParticles(ox, oy, P['k'], 10); state.energy -= 1;
            } else if (cell.obj.id !== 'stand' && cell.obj.id !== 'mailbox') {
                state.inventory[cell.obj.id] = (state.inventory[cell.obj.id]||0) + 1; cell.obj = null; spawnParticles(act.tx, act.ty, P['k'], 5); state.energy -= 1;
            }
        } else if (cell.path) {
            state.inventory[cell.path] = (state.inventory[cell.path]||0) + 1; cell.path = null; spawnParticles(act.tx, act.ty, P['x'], 5); state.energy -= 1; audio.playTool('pickaxe');
        } else if (cell.crop) { cell.crop = null; spawnParticles(act.tx, act.ty, P['g'], 5); state.energy -= 1; audio.playTool('pickaxe'); }
    } else if (act.type === 'backpack') {
        if (act.data === 'fertilizer' && cell.state === 'tilled' && !cell.fertilized) {
            if (state.inventory['fertilizer'] > 0) { cell.fertilized = true; state.inventory['fertilizer']--; spawnParticles(act.tx, act.ty, TEXT_Y, 5); }
        } else if (act.data === 'hay' && cell.state === 'grass' && !cell.forage) {
            if (state.inventory['hay'] > 0) { cell.forage = 'hay'; state.inventory['hay']--; spawnParticles(act.tx, act.ty, TEXT_Y, 5); }
        } else if (act.data === 'greenhouse' && !cell.obj && !cell.crop && act.tx < limitW - 2 && act.ty < GRID_H - 2 && state.map === 'main') {
            let canPlace = true;
            for(let dy=0;dy<3;dy++) { for(let dx=0;dx<3;dx++) { let target = currentGrid[act.ty+dy] && currentGrid[act.ty+dy][act.tx+dx]; if(!target || target.obj || target.inGreenhouse) canPlace = false; } }
            if (canPlace && state.inventory['greenhouse'] > 0) {
                state.inventory['greenhouse']--;
                for(let dy=0;dy<3;dy++) {
                    for(let dx=0;dx<3;dx++) {
                        let target = currentGrid[act.ty+dy][act.tx+dx]; target.inGreenhouse = true; target.greenhouseOrigin = {x: act.tx, y: act.ty};
                        if (dx===0 || dy===0 || dx===2 || (dy===2 && dx!==1)) { target.obj = { id: 'greenhouse_part', originX: act.tx, originY: act.ty }; }
                    }
                }
                currentGrid[act.ty][act.tx].obj = { id: 'greenhouse', originX: act.tx, originY: act.ty }; spawnParticles(act.tx+1, act.ty+1, P['b'], 20); audio.playTool('till');
            }
        } else if (act.data === 'arch' && !cell.obj && !cell.crop && act.tx > 0 && act.tx < limitW - 1) {
            if (state.inventory['arch'] > 0) {
                let left = currentGrid[act.ty][act.tx-1]; let right = currentGrid[act.ty][act.tx+1];
                if (!left.obj && !right.obj && !left.crop && !right.crop) {
                    left.obj = { id: 'arch_part', originX: act.tx, originY: act.ty }; right.obj = { id: 'arch_part', originX: act.tx, originY: act.ty }; cell.obj = { id: 'arch', originX: act.tx, originY: act.ty };
                    state.inventory['arch']--; spawnParticles(act.tx, act.ty, P['k'], 10); audio.playTool('till');
                }
            }
        } else if ((DECOR_DATA[act.data] || SYSTEM_ITEMS[act.data] || SHOP_ITEMS[act.data]?.type==='machine' || SHOP_ITEMS[act.data]?.type==='building') && !cell.obj && !cell.crop) {
            if (state.inventory[act.data] > 0) {
                let isPath = act.data.startsWith('path') || act.data === 'water_pond';
                if(isPath && !cell.path) { cell.path = act.data; state.inventory[act.data]--; spawnParticles(act.tx, act.ty, P['k'], 5); audio.playTool('till'); }
                else if (!isPath && !cell.inGreenhouse) { cell.obj = { id: act.data }; state.inventory[act.data]--; spawnParticles(act.tx, act.ty, P['k'], 5); audio.playTool('till'); }
            }
        } else if (CROP_DATA[act.data.replace('seed_','')] && cell.state === 'tilled' && !cell.crop && !cell.obj) {
            if (state.inventory[act.data] > 0) {
                let col = null; let baseType = act.data.replace('seed_','');
                if (CROP_DATA[baseType].type === 'flower') col = ['#ff82ce', '#ffffff', '#ffed75'][Math.floor(Math.random()*3)]; else col = CROP_DATA[baseType].color;
                cell.crop = { type: baseType, progress: 0, color: col }; state.inventory[act.data]--; state.energy -= 1; audio.playTool('till');
            }
        }
    } else if (act.type === 'shop') {
        if (act.data === 'chicken') {
            let hasCoop = false; for(let r of currentGrid) for(let c of r) if(c.obj?.id === 'coop') hasCoop = true;
            if (hasCoop && state.money >= 200) { state.money -= 200; state.chickens.push({x: act.tx, y: act.ty, state: 'idle', timer: 2, fed: false}); audio.playCoin(); }
        }
    } else if (act.type === 'water' && cell.state === 'tilled') {
        cell.watered++; state.energy -= 1; spawnParticles(act.tx, act.ty, P['b'], 5); audio.playTool('water');
    } else if (act.type === 'harvest' && cell.crop && cell.crop.progress >= 100) {
        let yieldAmt = cell.fertilized ? 2 : 1; state.inventory[cell.crop.type] = (state.inventory[cell.crop.type] || 0) + yieldAmt; state.exp += CROP_DATA[cell.crop.type].exp; checkLevelUp();
        spawnParticles(act.tx, act.ty, CROP_DATA[cell.crop.type].color, 15); cell.crop = null; cell.watered = 0; cell.fertilized = false; audio.playTool('till');
    }
}

export function update(dt) {
    const now = performance.now();
    state.cameraX += (state.cameraTargetX - state.cameraX) * 10 * dt;
    if (state.inventory['deed'] > 0) { state.inventory['deed'] = 0; state.hasDeed = true; }

    state.dayTime += dt;
    if (state.dayTime >= DAY_LENGTH) { state.transitionTimer = 2.0; processNewDay(); }

    if (state.map === 'main' && (state.weather === 'raining' || state.season === 3 || state.season === 2)) {
        if (Math.random() < (state.weather === 'raining' ? 0.5 : 0.1)) {
            let color = P['b']; if (state.season === 3) color = TEXT_W; if (state.season === 2 && state.weather !== 'raining') color = P['o'];
            spawnParticles(Math.random() * CW, 10, color, 1, true);
        }
    }

    if (state.map === 'main' && state.dayTime > DAY_LENGTH * 0.70 && state.season !== 3 && state.weather !== 'raining') {
        if (Math.random() < 0.05 && state.fireflies.length < 20) {
            state.fireflies.push({worldX: Math.random() * WORLD_W, y: Math.random() * WORLD_H + OFFSET_Y, life: 15, offset: Math.random() * 100});
        }
    }
    for(let i = state.fireflies.length - 1; i >= 0; i--) {
        let f = state.fireflies[i]; f.worldX += Math.sin(now/1000 + f.offset) * 30 * dt; f.y -= 10 * dt; f.life -= dt;
        if (f.life <= 0) state.fireflies.splice(i, 1);
    }

    let flowers = [];
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < TOTAL_GRID_W; x++) {
            if (state.grid[y][x].crop && CROP_DATA[state.grid[y][x].crop.type].type === 'flower' && state.grid[y][x].crop.progress >= 100) flowers.push({x,y});
        }
    }
    if (state.map === 'main' && flowers.length > 0 && state.dayTime > DAY_LENGTH * 0.1 && state.dayTime < DAY_LENGTH * 0.6 && state.weather === 'sunny') {
        if (Math.random() < 0.02 && state.butterflies.length < 5) {
            let colors = [TEXT_W, TEXT_Y, P['F']]; let fl = flowers[Math.floor(Math.random() * flowers.length)];
            state.butterflies.push({ cx: fl.x * TILE_SIZE + 32, cy: OFFSET_Y + fl.y * TILE_SIZE + 32, worldX: fl.x * TILE_SIZE + 32, y: OFFSET_Y + fl.y * TILE_SIZE + 32, life: 20, c: colors[Math.floor(Math.random() * colors.length)] });
        }
    }
    for(let i = state.butterflies.length - 1; i >= 0; i--) {
        let b = state.butterflies[i]; b.worldX = b.cx + Math.cos(b.life) * 30; b.y = b.cy + Math.sin(b.life * 1.5) * 30; b.life -= dt; if(b.life <= 0) state.butterflies.splice(i, 1);
    }

    for (let i = state.chickens.length - 1; i >= 0; i--) {
        let c = state.chickens[i]; c.timer -= dt;
        if (c.timer <= 0) {
            c.state = Math.random() < 0.5 ? 'idle' : 'wander';
            if(c.state === 'wander') {
                c.targetX = c.x + (Math.random() - 0.5) * 15; c.targetY = c.y + (Math.random() - 0.5) * 15;
                c.targetX = Math.max(0, Math.min(TOTAL_GRID_W - 1, c.targetX)); c.targetY = Math.max(0, Math.min(GRID_H - 1, c.targetY));
            }
            c.timer = 2 + Math.random() * 3;
            
            if(c.fed && c.state === 'idle') {
                let gx = Math.floor(c.x); let gy = Math.floor(c.y);
                if(gx >= 0 && gx < TOTAL_GRID_W && gy >= 0 && gy < GRID_H) {
                    let cell = state.grid[gy][gx];
                    if(!cell.forage && !cell.obj && cell.state === 'grass') { cell.forage = 'egg'; c.fed = false; spawnParticles(gx, gy, TEXT_W, 5); }
                }
            }
        }
        if (c.state === 'wander') {
            let dx = c.targetX - c.x; let dy = c.targetY - c.y; let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.1) { c.x += (dx/dist) * 1 * dt; c.y += (dy/dist) * 1 * dt; c.facing = dx > 0 ? 'right' : 'left'; } else c.state = 'idle';
        }
        let gridX = Math.floor(c.x); let gridY = Math.floor(c.y);
        if(gridX >= 0 && gridX < TOTAL_GRID_W && gridY >= 0 && gridY < GRID_H) {
            let cell = state.grid[gridY][gridX];
            if(cell.path === 'water_pond' || cell.path === 'path_water') c.inWater = true; else c.inWater = false;
            if (cell.forage === 'hay' && c.state === 'idle') { cell.forage = null; c.fed = true; spawnParticles(gridX, gridY, P['y'], 5); }
        }
    }

    if (state.map === 'main' && state.dayTime > DAY_LENGTH * 0.8 && !state.mushroomSpawnedThisNight && getLevel(state.exp) >= 3) {
        let rx = Math.floor(Math.random() * TOTAL_GRID_W); let ry = Math.floor(Math.random() * GRID_H); let cell = state.grid[ry][rx];
        if (cell.state === 'grass' && !cell.obj && !cell.crop && !cell.forage) { cell.forage = (getLevel(state.exp) >= 5 && Math.random() < 0.1) ? 'mushroom_glow' : 'mushroom_brown'; state.mushroomSpawnedThisNight = true; }
    }

    let standPos = null;
    for(let y = 0; y < GRID_H; y++) for(let x = 0; x < TOTAL_GRID_W; x++) if (state.grid[y][x].obj?.id === 'stand') standPos = {x,y};

    let activeItems = state.standSlots.filter(s => s.item !== null && s.qty > 0).length;
    let maxCust = Math.random() < 0.8 ? 1 : 2; 
    if (standPos && activeItems > 0 && Math.random() < 0.015 && state.customers.length < maxCust && state.dayTime > 15 && state.dayTime < DAY_LENGTH - 15) {
        let models = ['customer1', 'customer2', 'customer3']; let picked = models[Math.floor(Math.random() * models.length)];
        state.customers.push({ worldX: -50, y: OFFSET_Y + standPos.y * TILE_SIZE, state: 'walking_in', wait: 0, decided: false, emoji: "", model: picked });
    }

    for (let i = state.customers.length - 1; i >= 0; i--) {
        let c = state.customers[i];
        if (c.state === 'walking_in') {
            c.worldX += 60 * dt; if (c.worldX >= standPos.x * TILE_SIZE) { c.state = 'buying'; c.wait = 2.5; }
        } else if (c.state === 'buying') {
            c.wait -= dt;
            if (c.wait <= 1.5 && !c.decided) {
                c.decided = true;
                let filledSlots = state.standSlots.filter(s => s.item && s.qty > 0);
                if (filledSlots.length > 0) {
                    let slot = filledSlots[Math.floor(Math.random() * filledSlots.length)];
                    let baseVal = getBasePrice(slot.item); let ratio = slot.price / baseVal; let chance = 1.0;
                    if (ratio > 1.0) chance = 1.0 - ((ratio - 1.0) * 1.5);
                    chance = Math.max(0.05, chance); if (Math.random() < 0.10 && ratio <= 2.5) chance = 1.0; if (ratio >= 3.0) chance = 0.0;
                    if (Math.random() < chance) {
                        state.money += slot.price; audio.playCoin(); spawnParticles(c.worldX, c.y, TEXT_Y, 10, false);
                        slot.qty--; if (slot.qty <= 0) slot.item = null; c.emoji = '💰';
                    } else c.emoji = '❌';
                } else c.emoji = '❓';
            }
            if (c.wait <= 0) c.state = 'walking_out';
        } else if (c.state === 'walking_out') { c.worldX -= 60 * dt; if (c.worldX < -100) state.customers.splice(i, 1); }
    }

    let allGrids = [state.grid, state.ghGrid];
    for(let g of allGrids) {
        let isGh = g === state.ghGrid; let w = isGh ? VIEW_W : TOTAL_GRID_W;
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < w; x++) {
                const cell = g[y][x];
                if (cell.crop && cell.crop.progress < 100) {
                    if (state.season === 3 && !isGh) {} else {
                        const cData = CROP_DATA[cell.crop.type]; let speed = cell.watered > 0 ? 1.0 : 0.1;
                        if(cell.fertilized) speed *= 1.5; if (isGh) speed *= 1.5;
                        cell.crop.progress += (100 / cData.time) * speed * dt;
                        if (cell.crop.progress > 100) cell.crop.progress = 100;
                    }
                }
            }
        }
    }

    const f = state.farmer;
    if (f.queue.length > 0) {
        const act = f.queue[0]; const dx = act.tx - f.x; const dy = act.ty - f.y; const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.1) {
            f.x = act.tx; f.y = act.ty;
            if (state.map === 'main') {
                let cell = state.grid[act.ty][act.tx];
                if (cell.inGreenhouse && cell.greenhouseOrigin && cell.greenhouseOrigin.x + 1 === act.tx && cell.greenhouseOrigin.y + 2 === act.ty) {
                    state.map = 'greenhouse'; state.cameraX = 0; state.cameraTargetX = 0; f.x = Math.floor(VIEW_W/2); f.y = GRID_H - 2; f.queue = [];
                } else executeAction(act);
            } else if (state.map === 'greenhouse') {
                if (act.tx === Math.floor(VIEW_W/2) && act.ty === GRID_H - 1) {
                    state.map = 'main'; state.cameraX = 0; state.cameraTargetX = 0; let target = {x: 4, y: 4};
                    for(let y=0; y<GRID_H; y++) for(let x=0; x<TOTAL_GRID_W; x++) { if(state.grid[y][x].obj?.id === 'greenhouse') { target = {x: x+1, y: y+3}; break; } }
                    f.x = target.x; f.y = target.y; f.queue = [];
                } else executeAction(act);
            }
            if(f.queue.length > 0) { f.queue.shift(); f.state = 'action'; f.animTimer = 0.3; }
        } else {
            f.state = 'walking'; f.x += (dx/dist) * 5 * dt; f.y += (dy/dist) * 5 * dt; f.animTimer += dt;
            if (Math.abs(dx) > Math.abs(dy)) f.facing = dx > 0 ? 'right' : 'left';
        }
    } else {
        if (f.state === 'action') { f.animTimer -= dt; if (f.animTimer <= 0) f.state = 'idle'; } else { f.state = 'idle'; f.animTimer += dt; }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i]; p.worldX += p.vx * dt; p.y += p.vy * dt;
        if (p.color !== TEXT_W && p.color !== P['b'] && p.color !== P['0']) p.vy += 300 * dt;
        p.life -= dt * (p.color === TEXT_W ? 0.5 : 1.5); if (p.life <= 0 || p.y > CH) state.particles.splice(i, 1);
    }
}
