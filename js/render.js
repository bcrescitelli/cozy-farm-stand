import { state, uiState } from './state.js';
import { CW, CH, LEFT_PANEL_W, SAFE_L, RIGHT_PANEL_W, SAFE_R, VIEW_W, TOTAL_GRID_W, GRID_H, TILE_SIZE, OFFSET_X, OFFSET_Y, WORLD_H, WORLD_W, DAY_LENGTH, P, TEXT_W, TEXT_Y, TEXT_C, TEXT_G, TEXT_R, TEXT_K, CROP_DATA, DECOR_DATA, SYSTEM_ITEMS, SHOP_ITEMS, RECIPES, MAIL_LETTERS, CHAR_OPTS } from './constants.js';
import { getSprite } from './sprites.js';
import { getLevel, getBasePrice, isFruit, isFlower, spawnParticles, processNewDay } from './logic.js';
import { audio } from './audio.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

function drawWoodPanel(x, y, w, h, isPressed = false) {
    ctx.fillStyle = isPressed ? '#6e452f' : '#b07b54'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isPressed ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'; ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h);
    ctx.fillStyle = isPressed ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + h - 4, w, 4); ctx.fillRect(x + w - 4, y, 4, h);
    ctx.strokeStyle = '#4a2c19'; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
}

function drawJamLabel(x, y, scale) {
    let painted = false; for(let c of state.jamDesign) if (c) painted = true;
    if(!painted) return; ctx.save(); ctx.translate(x + 5*scale, y + 6*scale); let lScale = scale * (6/5);
    for(let r=0; r<5; r++) { for(let c=0; c<5; c++) { let col = state.jamDesign[r*5+c]; if(col) { ctx.fillStyle=col; ctx.fillRect(c*lScale, r*lScale, lScale, lScale); } } } ctx.restore();
}

function drawModalBase(title, height=550) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, CH);
    const mw = 650, mh = height; const mx = (CW - mw)/2, my = (CH-mh)/2;
    drawWoodPanel(mx, my, mw, mh); drawWoodPanel(mx, my, mw, 60);
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.fillText(title, CW/2, my + 40);
    drawWoodPanel(mx + mw - 50, my + 10, 40, 40); ctx.fillStyle = TEXT_R; ctx.fillText("X", mx + mw - 30, my + 38);
    uiState.buttons.push({ x: mx + mw - 50, y: my + 10, w: 40, h: 40, onClick: () => { state.uiMode = 'normal'; } });
    return { mx, my, mw, mh };
}

function drawLevelUpModal() {
    const { mx, my, mw, mh } = drawModalBase("LEVEL UP!", 550);
    ctx.fillStyle = TEXT_Y; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.fillText(`You reached Farm Level ${state.notifiedLevel}!`, mx+mw/2, my + 100);
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 18px monospace'; ctx.fillText("New items available in the shop:", mx+mw/2, my+150);
    const clipY = my+170; const clipH = mh - 260; ctx.save(); ctx.beginPath(); ctx.rect(mx, clipY, mw, clipH); ctx.clip(); ctx.translate(0, -state.modalScroll);
    let cy = clipY + 20; ctx.fillStyle = TEXT_C; ctx.font = 'bold 16px monospace';
    for (let i=0; i<state.levelUpUnlocks.length; i++) {
        let u = state.levelUpUnlocks[i];
        if (u.id) {
            let sId = u.id.startsWith('seed_') ? 'mature_' + u.id.replace('seed_','') : u.id;
            let iconName = sId; if (iconName === 'cherry_tree') iconName = 'icon_cherry_tree'; if (iconName === 'peach_tree') iconName = 'icon_peach_tree'; if (iconName === 'pine_tree') iconName = 'icon_pine_tree'; if (iconName === 'arch') iconName = 'icon_arch'; if (iconName === 'greenhouse') iconName = 'icon_greenhouse'; if (sId === 'mature_rare') iconName = 'mature_rare';
            let spr = getSprite(iconName, 2); if(!spr && sId.startsWith('fence')) spr = getSprite(sId+'_post', 2);
            if(spr) { let drawY = cy - 15; if(spr.height > 32) drawY -= (spr.height - 32); if (iconName === 'mature_rare') drawY += 16; ctx.drawImage(spr, mx + mw/2 - 100, drawY); }
            ctx.textAlign = 'left'; ctx.fillStyle=TEXT_C; ctx.fillText(u.name || u, mx + mw/2 - 60, cy); cy += 40;
        }
    }
    ctx.restore(); let maxScroll = Math.max(0, (cy - clipY) - clipH + 20); if (state.modalScroll > maxScroll) state.modalScroll = maxScroll;
    drawWoodPanel(mx+mw/2-75, my + mh - 70, 150, 50); ctx.fillStyle = TEXT_G; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText("AWESOME", mx+mw/2, my + mh - 38);
    uiState.buttons.push({ x: mx + mw/2 - 75, y: my + mh - 70, w: 150, h: 50, onClick: () => { state.uiMode = 'normal'; } });
}

function drawStandModal() {
    const { mx, my, mw } = drawModalBase("FARM STAND");
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText("Sell stacks! If price is too high, neighbors won't buy.", mx+mw/2, my + 90);
    let sx = mx + 40; const sy = my+120;
    for (let i=0; i<3; i++) {
        const slot = state.standSlots[i]; drawWoodPanel(sx, sy, 170, 240);
        if (!slot.item || slot.qty <= 0) {
            ctx.fillStyle = TEXT_K; ctx.fillText("Empty Slot", sx+85, sy + 100); drawWoodPanel(sx + 35, sy + 180, 100, 40); ctx.fillStyle = TEXT_G; ctx.fillText("+ ADD", sx + 85, sy + 205);
            uiState.buttons.push({ x: sx + 35, y: sy + 180, w: 100, h: 40, onClick: () => { uiState.slotSelecting = i; state.uiMode = 'stand_select'; state.modalScroll = 0;} });
        } else {
            let iconName = slot.item; if(slot.item === 'jam') iconName = 'jar'; if (CROP_DATA[slot.item]) iconName = slot.item === 'rare' ? 'mature_rare' : 'mature_'+slot.item;
            const spr = getSprite(iconName, 4); if (spr) { let sDrawX = sx+53; let sDrawY = sy+20; if (iconName === 'mature_rare') { sDrawX-=20; sDrawY+=20; } ctx.drawImage(spr, sDrawX, sDrawY); }
            if(slot.item==='jam') drawJamLabel(sx+53, sy+20, 4);
            let name = RECIPES.find(r=>r.id===slot.item)?.name || CROP_DATA[slot.item]?.name || slot.item.charAt(0).toUpperCase() + slot.item.slice(1);
            if(slot.item==='mushroom_brown') name = "Brown Mush"; if(slot.item==='mushroom_glow') name="Glow Mush";
            ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace'; ctx.fillText(name, sx + 85, sy + 100);
            ctx.font = 'bold 14px monospace'; ctx.fillStyle = TEXT_C; ctx.fillText(`Stack: ${slot.qty}`, sx + 85, sy + 120);
            ctx.fillStyle = TEXT_Y; ctx.font = 'bold 24px monospace'; ctx.fillText(`$${slot.price}`, sx+85, sy + 165);
            drawWoodPanel(sx + 20, sy + 140, 30, 30); ctx.fillStyle = TEXT_W; ctx.fillText("-", sx + 35, sy + 162); uiState.buttons.push({ x: sx+20, y: sy+140, w: 30, h: 30, onClick: () => { if(slot.price > 1) slot.price--; } });
            drawWoodPanel(sx + 120, sy + 140, 30, 30); ctx.fillStyle = TEXT_W; ctx.fillText("+", sx + 135, sy + 162); uiState.buttons.push({ x: sx+120, y: sy+140, w: 30, h: 30, onClick: () => { slot.price++; } });
            drawWoodPanel(sx + 35, sy + 190, 100, 35); ctx.fillStyle = TEXT_R; ctx.font = 'bold 14px monospace'; ctx.fillText("REMOVE", sx + 85, sy + 212);
            uiState.buttons.push({ x: sx + 35, y: sy + 190, w: 100, h: 35, onClick: () => { state.inventory[slot.item] = (state.inventory[slot.item]||0)+slot.qty; slot.item = null; slot.qty = 0; } });
        } sx += 190;
    }
}

function drawStandSelectModal() {
    const { mx, my, mw, mh } = drawModalBase("SELECT ITEM TO SELL"); let listY = my + 80; let itemsInInv = 0;
    uiState.buttons.pop(); drawWoodPanel(mx + mw - 50, my + 10, 40, 40); ctx.fillStyle = TEXT_R; ctx.fillText("X", mx + mw - 30, my + 38); uiState.buttons.push({ x: mx + mw - 50, y: my + 10, w: 40, h: 40, onClick: () => { state.uiMode = 'stand'; } });
    const clipY = my + 80; const clipH = mh - 100; ctx.save(); ctx.beginPath(); ctx.rect(mx, clipY, mw, clipH); ctx.clip(); ctx.translate(0, -state.modalScroll);
    for (const [item, count] of Object.entries(state.inventory)) {
        if (count > 0 && getBasePrice(item) > 0 && item !== 'deed' && !item.startsWith('seed_')) {
            drawWoodPanel(mx + 50, listY, 550, 60);
            let iconName = item; if(item === 'mushroom_brown' || item === 'mushroom_glow') iconName = item; if(item === 'jam') iconName = 'jar'; if (CROP_DATA[item]) iconName = item === 'rare' ? 'mature_rare' : 'mature_'+item;
            const spr = getSprite(iconName, 2); if(spr) { let sDrawX = mx+60; let sDrawY = listY+14; if (iconName === 'mature_rare') { sDrawX-=10; sDrawY+=5; } ctx.drawImage(spr, sDrawX, sDrawY); }
            if(item==='jam') drawJamLabel(mx+60, listY+14, 2);
            ctx.fillStyle = TEXT_W; ctx.textAlign='left'; ctx.font='bold 16px monospace';
            let name = RECIPES.find(r=>r.id===item)?.name || CROP_DATA[item]?.name || item.charAt(0).toUpperCase() + item.slice(1);
            if (item==='mushroom_brown') name = "Brown Mush"; if(item==='mushroom_glow') name="Glow Mush";
            let val = getBasePrice(item); ctx.fillText(`${name} (Base: $${val})`, mx + 110, listY + 35); ctx.fillStyle = TEXT_Y; ctx.fillText(`Stack: ${count}`, mx + 380, listY + 35);
            drawWoodPanel(mx + 480, listY + 10, 100, 40); ctx.fillStyle = TEXT_G; ctx.textAlign='center'; ctx.fillText("ADD ALL", mx + 530, listY + 35);
            uiState.buttons.push({ x: mx+480, y: listY+10 - state.modalScroll, w: 100, h: 40, onClick: () => { if (state.mouseY > clipY) { state.inventory[item] = 0; state.standSlots[uiState.slotSelecting] = { item: item, price: val, qty: count }; state.uiMode = 'stand'; } } });
            listY += 70; itemsInInv++;
        }
    }
    ctx.restore(); let maxScroll = Math.max(0, (listY - clipY) - clipH + 20); if (state.modalScroll > maxScroll) state.modalScroll = maxScroll;
    if(itemsInInv===0) { ctx.fillStyle=TEXT_K; ctx.textAlign='center'; ctx.fillText("No sellable items in inventory.", mx+mw/2, my+150); }
}

function drawBookModal() {
    const { mx, my, mw, mh } = drawModalBase("WORKSHOP & KITCHEN"); let listY = my+80;
    const clipY = my+80; const clipH = mh - 100; ctx.save(); ctx.beginPath(); ctx.rect(mx, clipY, mw, clipH); ctx.clip(); ctx.translate(0, -state.modalScroll);

    if (state.kitchenUpgrades['jar']) {
        drawWoodPanel(mx + 30, listY, mw - 60, 80); const spr = getSprite('jar', 3); if (spr) ctx.drawImage(spr, mx + 40, listY + 16);
        ctx.fillStyle = TEXT_Y; ctx.textAlign = 'left'; ctx.font = 'bold 20px monospace'; ctx.fillText("Preserves Jar", mx + 100, listY + 30);
        let fruitCount = 0; for(let k in state.inventory) if (isFruit(k)) fruitCount += state.inventory[k];
        ctx.fillStyle = fruitCount>0 ? TEXT_G : TEXT_R; ctx.font = 'bold 12px monospace'; ctx.fillText(`Req: 1 Any Fruit (You have ${fruitCount})`, mx + 100, listY + 52);
        drawWoodPanel(mx + mw - 120, listY + 10, 80, 30, fruitCount===0); ctx.fillStyle = fruitCount>0 ? TEXT_W : '#9c8a81'; ctx.textAlign='center'; ctx.font='bold 14px monospace'; ctx.fillText("MAKE JAM", mx + mw - 80, listY + 30);
        if (fruitCount>0) uiState.buttons.push({ x: mx + mw - 120, y: listY + 10 - state.modalScroll, w: 80, h: 30, onClick: () => { if (state.mouseY > clipY) { for(let k in state.inventory) if (isFruit(k) && state.inventory[k]>0) { state.inventory[k]--; break; } state.inventory['jam'] = (state.inventory['jam']||0)+1; spawnParticles(CW/2, CH/2, P['p'], 20, true); } }});
        drawWoodPanel(mx + mw - 120, listY + 45, 80, 25); ctx.fillStyle = TEXT_C; ctx.fillText("LABEL", mx + mw - 80, listY + 62); uiState.buttons.push({ x: mx + mw - 120, y: listY + 45 - state.modalScroll, w: 80, h: 25, onClick: () => { if (state.mouseY > clipY) state.uiMode='jam_design'; }}); listY += 95;
    }

    if (state.kitchenUpgrades['florist_table']) {
        drawWoodPanel(mx + 30, listY, mw - 60, 80); const spr = getSprite('florist_table', 3); if(spr) ctx.drawImage(spr, mx + 40, listY + 16);
        ctx.fillStyle = P['F']; ctx.textAlign = 'left'; ctx.font = 'bold 20px monospace'; ctx.fillText("Florist Table", mx + 100, listY + 30);
        let flCount = 0; for(let k in state.inventory) if (isFlower(k)) flCount += state.inventory[k];
        ctx.fillStyle = flCount>=3 ? TEXT_G : TEXT_R; ctx.font = 'bold 12px monospace'; ctx.fillText(`Req: 3 Any Flowers (You have ${flCount})`, mx + 100, listY + 52);
        drawWoodPanel(mx + mw - 120, listY + 20, 80, 40, flCount<3); ctx.fillStyle = flCount>=3 ? TEXT_W : '#9c8a81'; ctx.textAlign='center'; ctx.font='bold 14px monospace'; ctx.fillText("BOUQUET", mx + mw - 80, listY + 45);
        if (flCount>=3) uiState.buttons.push({x: mx + mw - 120, y: listY + 20 - state.modalScroll, w: 80, h: 40, onClick: () => { if (state.mouseY > clipY) { let toRemove = 3; for(let k in state.inventory) { if (isFlower(k)) { while(state.inventory[k]>0 && toRemove>0){state.inventory[k]--; toRemove--;} } } state.inventory['bouquet'] = (state.inventory['bouquet']||0)+1; spawnParticles(CW/2, CH/2, P['F'], 20, true); } }}); listY += 95;
    }

    ctx.fillStyle = TEXT_K; ctx.textAlign='center'; ctx.font='bold 18px monospace'; ctx.fillText("- RECIPES -", mx+mw/2, listY+20); listY += 40;

    for (const rec of RECIPES) {
        if (getLevel(state.exp) < rec.minLevel) continue;
        drawWoodPanel(mx + 30, listY, mw - 60, 80); const spr = getSprite(rec.icon, 3); if (spr) ctx.drawImage(spr, mx + 40, listY + 16);
        ctx.fillStyle = TEXT_W; ctx.textAlign = 'left'; ctx.font = 'bold 20px monospace'; ctx.fillText(rec.name, mx + 100, listY + 30);
        ctx.font = 'bold 12px monospace'; let reqText = ""; let canCraft = true;
        for (const [ing, count] of Object.entries(rec.ingredients)) { let n = ing.charAt(0).toUpperCase() + ing.slice(1); if (n==='Mushroom_glow') n="Glow Mush"; reqText += `${count}x ${n} `; if ((state.inventory[ing] || 0) < count) canCraft = false; }
        ctx.fillStyle = canCraft ? TEXT_G : TEXT_R; ctx.fillText(reqText, mx + 100, listY + 52); ctx.font = 'bold 14px monospace'; ctx.fillStyle = TEXT_C; ctx.fillText(`+${rec.energy} Energy`, mx + 400, listY + 30); ctx.fillStyle = TEXT_Y; ctx.fillText(`Price: $${rec.price}`, mx + 400, listY + 52);
        drawWoodPanel(mx + mw - 120, listY + 20, 80, 40, !canCraft); ctx.fillStyle = canCraft ? TEXT_W : '#9c8a81'; ctx.textAlign='center'; ctx.font='bold 16px monospace'; ctx.fillText("COOK", mx + mw - 80, listY + 45);
        if (canCraft) { uiState.buttons.push({x: mx + mw - 120, y: listY + 20 - state.modalScroll, w: 80, h: 40, onClick: () => { if (state.mouseY > clipY) { for (const [ing, count] of Object.entries(rec.ingredients)) state.inventory[ing] -= count; state.inventory[rec.id] = (state.inventory[rec.id] || 0) + rec.yield; spawnParticles(CW/2, CH/2, TEXT_W, 20, true); } } }); } listY += 95;
    }
    ctx.restore(); let maxScroll = Math.max(0, (listY - clipY) - clipH + 20); if (state.modalScroll > maxScroll) state.modalScroll = maxScroll;
}

function drawJamDesignModal() {
    const { mx, my, mw, mh } = drawModalBase("BRAND YOUR JAM", 550);
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText("Draw a pixel logo for your jam jars!", mx+mw/2, my+85);
    const gridX = mx+75; const gridY = my+110; ctx.fillStyle = '#8b9bb4'; ctx.fillRect(gridX - 5, gridY - 5, 260, 260); 
    for(let r=0; r<5; r++) { for(let c=0; c<5; c++) { ctx.fillStyle = state.jamDesign[r*5+c] || '#ffffff'; ctx.fillRect(gridX + c*50, gridY + r*50, 48, 48); } }
    const cols = [P['r'], P['o'], P['y'], P['g'], P['b'], P['p'], P['w'], P['1']]; let px = gridX + 300; let py = gridY;
    for(let c of cols) { drawWoodPanel(px, py, 40, 40, state.activePalette===c); if (state.activePalette===c) { ctx.strokeStyle = TEXT_G; ctx.strokeRect(px, py, 40, 40); } ctx.fillStyle = c; ctx.fillRect(px+5, py+5, 30, 30); uiState.buttons.push({x: px, y: py, w: 40, h: 40, onClick: () => state.activePalette = c}); py += 50; if(py > gridY + 150) { py = gridY; px+=50; } }
    drawWoodPanel(px, py, 90, 40, state.activePalette===null); ctx.fillStyle=TEXT_W; ctx.textAlign='center'; ctx.font='bold 14px monospace'; ctx.fillText("ERASER", px+45, py+25); uiState.buttons.push({x: px, y: py, w: 90, h: 40, onClick: () => state.activePalette = null});
    drawWoodPanel(mx + mw/2 - 100, my + mh - 70, 200, 50); ctx.fillStyle = TEXT_G; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText("SAVE DESIGN", mx + mw/2, my + mh - 38); uiState.buttons.push({ x: mx + mw/2 - 100, y: my + mh - 70, w: 200, h: 50, onClick: () => { state.uiMode = 'normal'; spawnParticles(CW/2, CH/2, P['y'], 20, true); } });
}

function drawMailModal() {
    const { mx, my, mw, mh } = drawModalBase("TOWN MAILBOX", 550);
    if (state.activeMailIndex !== null) {
        ctx.fillStyle = TEXT_Y; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.fillText(`Letter - Day ${state.activeMailIndex+1}`, mx+mw/2, my+100);
        ctx.fillStyle = TEXT_W; ctx.font = '18px monospace'; ctx.textAlign = 'left'; let words = MAIL_LETTERS[state.activeMailIndex].split(" "); let line = ""; let lY=my+150;
        for(let w of words) { if(ctx.measureText(line + w + " ").width > mw - 100) { ctx.fillText(line, mx+50, lY); lY+=30; line=w+" "; } else line += w + " "; } ctx.fillText(line, mx+50, lY);
        drawWoodPanel(mx + mw/2 - 75, my + mh - 70, 150, 50); ctx.fillStyle = TEXT_W; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText("BACK", mx + mw/2, my + mh - 38); uiState.buttons.push({ x: mx + mw/2 - 75, y: my + mh - 70, w: 150, h: 50, onClick: () => { state.activeMailIndex = null; } }); return;
    }
    let listY = my + 90;
    if (state.readMailCount === 0) { ctx.fillStyle = TEXT_K; ctx.textAlign = 'center'; ctx.fillText("No mail yet. Check back tomorrow!", mx+mw/2, listY+50); return; }
    for(let i=state.readMailCount-1; i>=0; i--) {
        drawWoodPanel(mx + 40, listY, mw - 80, 60); let isNew = i >= state.openedMailCount;
        ctx.fillStyle = isNew ? TEXT_G : TEXT_Y; ctx.textAlign = 'left'; ctx.font = 'bold 16px monospace'; ctx.fillText(isNew ? `[NEW] Day ${i+1}` : `Day ${i+1}`, mx+60, listY + 25);
        ctx.fillStyle = TEXT_W; ctx.font = '14px monospace'; let text = MAIL_LETTERS[i]; if (ctx.measureText(text).width > mw - 150) text = text.substring(0, 45) + "..."; ctx.fillText(text, mx + 60, listY + 45);
        uiState.buttons.push({ x: mx+40, y: listY, w: mw-80, h: 60, onClick: () => { state.activeMailIndex = i; if (i >= state.openedMailCount) state.openedMailCount = i+1; } }); listY += 75;
    }
}

function drawCharSelect() {
    uiState.buttons = []; ctx.fillStyle = '#8bcc66'; ctx.fillRect(0,0,CW,CH); 
    drawWoodPanel(CW/2 - 300, 30, 600, 80); ctx.fillStyle = TEXT_W; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center'; ctx.fillText("COZY FARM STAND", CW/2, 80);
    const fSpr = getSprite('farmer', 8, state.charColors); if (fSpr) ctx.drawImage(fSpr, CW/2 - 64, 130);
    ctx.font = 'bold 20px monospace'; let sy = 280;
    const parts = [ {key: 'skin', label: 'Skin Color'}, {key: 'hair', label: 'Hair Color'}, {key: 'shirt', label: 'Shirt Color'}, {key: 'pants', label: 'Pants Color'} ];
    for (let p of parts) {
        drawWoodPanel(CW/2 - 160, sy, 150, 40); ctx.fillStyle = TEXT_W; ctx.textAlign = 'center'; ctx.fillText(p.label, CW/2 - 85, sy + 25);
        drawWoodPanel(CW/2 + 10, sy, 40, 40); ctx.fillStyle=TEXT_W; ctx.fillText("<", CW/2 + 30, sy+26);
        uiState.buttons.push({ x: CW/2+10, y:sy, w:40, h:40, onClick: () => { let arr = CHAR_OPTS[p.key]; let idx = arr.indexOf(state.charColors[p.key]); idx = (idx - 1 + arr.length) % arr.length; state.charColors[p.key] = arr[idx]; }});
        drawWoodPanel(CW/2 + 60, sy, 40, 40); ctx.fillStyle = state.charColors[p.key]; ctx.fillRect(CW/2 + 65, sy + 5, 30, 30); ctx.strokeStyle = TEXT_W; ctx.strokeRect(CW/2 + 65, sy + 5, 30, 30);
        drawWoodPanel(CW/2 + 110, sy, 40, 40); ctx.fillStyle=TEXT_W; ctx.fillText(">", CW/2 + 130, sy+26);
        uiState.buttons.push({ x: CW/2+110, y:sy, w:40, h:40, onClick: () => { let arr = CHAR_OPTS[p.key]; let idx = arr.indexOf(state.charColors[p.key]); idx = (idx + 1) % arr.length; state.charColors[p.key] = arr[idx]; }}); sy += 50;
    }
    drawWoodPanel(CW/2 - 100, CH - 100, 200, 60); ctx.fillStyle = TEXT_G; ctx.textAlign='center'; ctx.font = 'bold 24px monospace'; ctx.fillText("START FARM", CW/2, CH - 62);
    uiState.buttons.push({ x: CW/2-100, y: CH-100, w: 200, h: 60, onClick: () => { state.uiMode = 'normal'; audio.init(); } });
}

function drawLeftToolbar(tooltips) {
    ctx.fillStyle = '#4a2c19'; ctx.fillRect(0, 0, LEFT_PANEL_W + SAFE_L, CH); ctx.fillStyle = '#8b593e'; ctx.fillRect(2 + SAFE_L, 2, LEFT_PANEL_W-4, CH-4);
    ctx.fillStyle = '#4a2c19'; ctx.fillRect(10 + SAFE_L, 10, 160, 20); ctx.fillStyle = state.energy > 30 ? TEXT_G : TEXT_R; ctx.fillRect(12 + SAFE_L, 12, (state.energy/100)*156, 16);
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 12px monospace'; ctx.textAlign='center'; ctx.fillText(`ENERGY ${state.energy}/100`, 90 + SAFE_L, 24);
    ctx.fillStyle = '#4a2c19'; ctx.fillRect(10 + SAFE_L, 35, 160, 20); ctx.fillStyle = TEXT_Y; ctx.fillRect(12 + SAFE_L, 37, (state.dayTime/DAY_LENGTH)*156, 16);
    ctx.fillStyle = TEXT_W; ctx.fillText(`DAY TIME`, 90 + SAFE_L, 49);

    const lvl = getLevel(state.exp); const nextLvlReq = lvl < 5 ? (lvl === 1 ? 50 : lvl === 2 ? 200 : lvl === 3 ? 500 : 1000) : state.exp;
    const prevReq = lvl === 1 ? 0 : (lvl === 2 ? 50 : lvl === 3 ? 200 : lvl === 4 ? 500 : 1000); const prog = lvl < 5 ? (state.exp - prevReq) / (nextLvlReq - prevReq) : 1;
    ctx.fillStyle = '#4a2c19'; ctx.fillRect(10 + SAFE_L, 60, 160, 20); ctx.fillStyle = TEXT_C; ctx.fillRect(12 + SAFE_L, 62, prog*156, 16); ctx.fillStyle = TEXT_W; ctx.fillText(`LEVEL ${lvl}`, 90 + SAFE_L, 74);

    const tools = [ { id: 'till', icon: 'hoe', label: 'Till' }, { id: 'water', icon: 'watercan', label: 'Water' }, { id: 'backpack', icon: 'backpack', label: 'Backpack' }, { id: 'pickaxe', icon: 'pickaxe', label: 'Demolish' }, { id: 'shop', icon: 'shop', label: 'Shop' }, { id: 'book', icon: 'book', label: 'Kitchen' } ];
    let ty = 90;
    for (const t of tools) {
        const isSel = state.selectedTool === t.id && state.uiMode === 'normal'; drawWoodPanel(10 + SAFE_L, ty, 160, 55, isSel);
        if(isSel) { ctx.strokeStyle = TEXT_G; ctx.strokeRect(10 + SAFE_L, ty, 160, 55); }
        const spr = getSprite(t.icon, 2); if(spr) ctx.drawImage(spr, 20 + SAFE_L, ty + 12);
        ctx.fillStyle = isSel ? TEXT_G : TEXT_W; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'left'; ctx.fillText(t.label, 65 + SAFE_L, ty + 33);
        if (state.uiMode === 'normal') { uiState.buttons.push({ x: 10 + SAFE_L, y: ty, w: 160, h: 55, onClick: () => { if(t.id === 'book') { state.uiMode = 'book'; state.modalScroll = 0; } else { state.selectedTool = t.id; state.farmer.queue = []; if (t.id === 'shop' || t.id === 'backpack') { state.activeTab = 'seeds'; state.rightPanelScroll = 0; } } }}); }
        ty += 65;
    }

    if (state.map === 'main') {
        if (state.hasDeed) { let isEast = state.cameraTargetX > 0; drawWoodPanel(10 + SAFE_L, CH - 110, 160, 40, false); ctx.fillStyle = TEXT_Y; ctx.textAlign='center'; ctx.font = 'bold 16px monospace'; ctx.fillText(isEast ? "< GO WEST" : "GO EAST >", 90 + SAFE_L, CH - 85); if (state.uiMode === 'normal') uiState.buttons.push({ x: 10 + SAFE_L, y: CH-110, w: 160, h: 40, onClick: () => { state.cameraTargetX = isEast ? 0 : VIEW_W * TILE_SIZE; state.farmer.queue = []; }}); }
    } else {
        drawWoodPanel(10 + SAFE_L, CH - 110, 160, 40, false); ctx.fillStyle = TEXT_Y; ctx.textAlign='center'; ctx.font = 'bold 16px monospace'; ctx.fillText("< EXIT", 90 + SAFE_L, CH - 85); if (state.uiMode === 'normal') uiState.buttons.push({ x: 10 + SAFE_L, y: CH-110, w: 160, h: 40, onClick: () => { state.farmer.queue.push({ type: 'walk', tx: Math.floor(VIEW_W/2), ty: GRID_H-1, data: null }); }});
    }

    const canSleep = state.dayTime > DAY_LENGTH * 0.5; drawWoodPanel(10 + SAFE_L, CH - 60, 160, 50, !canSleep);
    ctx.fillStyle = canSleep ? TEXT_W : '#b07b54'; ctx.textAlign='center'; ctx.fillText(canSleep ? "SLEEP" : "NOT TIRED", 90 + SAFE_L, CH - 28);
    if (state.uiMode === 'normal') uiState.buttons.push({ x: 10 + SAFE_L, y: CH-60, w: 160, h: 50, onClick: () => { if (canSleep && state.transitionTimer<=0) { state.transitionTimer = 2.0; processNewDay(); } }});
}

function drawRightPanel(tooltips) {
    const rx = CW - RIGHT_PANEL_W - SAFE_R; 
    ctx.fillStyle = '#4a2c19'; ctx.fillRect(rx, 0, RIGHT_PANEL_W + SAFE_R, CH); ctx.fillStyle = '#8b593e'; ctx.fillRect(rx + 2, 2, RIGHT_PANEL_W-4 + SAFE_R, CH-4);
    drawWoodPanel(rx + 10, 10, RIGHT_PANEL_W-20, 80); ctx.fillStyle = TEXT_Y; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.fillText(`$${state.money}`, rx + RIGHT_PANEL_W/2, 40);
    ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace';
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter']; let clockHour = Math.floor((state.dayTime/DAY_LENGTH)*16 + 6); let ampm = clockHour >= 12 && clockHour < 24 ? "PM" : "AM";
    if(clockHour > 12) clockHour -= 12; if(clockHour === 0) clockHour = 12;
    ctx.fillText(`Day ${state.day} - ${seasons[state.season]}`, rx + RIGHT_PANEL_W/2, 65); ctx.fillStyle = TEXT_C; ctx.fillText(`${clockHour}:00 ${ampm} - ${state.weather}`, rx + RIGHT_PANEL_W/2, 82);

    if (state.selectedTool === 'shop' || state.selectedTool === 'backpack') {
        const isShop = state.selectedTool === 'shop'; ctx.font = 'bold 14px monospace'; const tabs = ['seeds', 'decor', 'goods']; let tx = rx + 10; let tabW = (RIGHT_PANEL_W - 20) / 3;
        for (let tab of tabs) { const isActive = state.activeTab === tab; drawWoodPanel(tx, 100, tabW, 30, isActive); ctx.fillStyle = isActive ? TEXT_Y : TEXT_W; ctx.fillText(tab.toUpperCase(), tx + tabW/2, 120); if (state.uiMode === 'normal') uiState.buttons.push({ x: tx, y: 100, w: tabW, h: 30, onClick: () => { state.activeTab = tab; state.rightPanelScroll = 0; } }); tx += tabW; }
        const clipY = 140; const clipH = CH - 150; ctx.save(); ctx.beginPath(); ctx.rect(rx, clipY, RIGHT_PANEL_W + SAFE_R, clipH); ctx.clip(); ctx.translate(0, -state.rightPanelScroll);
        let cy = clipY + 10; const lvl = getLevel(state.exp);

        if (state.activeTab === 'seeds') {
            for (const [baseId, cData] of Object.entries(CROP_DATA)) {
                let id = 'seed_' + baseId; if (!isShop && (state.inventory[id] || 0) === 0) continue; if (isShop && lvl < cData.minLevel) continue;
                const isSel = state.selectedItem === id && !isShop; drawWoodPanel(rx + 10, cy, RIGHT_PANEL_W-20, 65, isSel); if(isSel) { ctx.strokeStyle = TEXT_G; ctx.strokeRect(rx+10, cy, RIGHT_PANEL_W-20, 65); }
                const spr = getSprite(id, 2); if(spr) ctx.drawImage(spr, rx+20, cy + 16);
                ctx.textAlign = 'left'; ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace'; ctx.fillText(cData.name + " Seed", rx+65, cy+30);
                const count = state.inventory[id] || 0; ctx.fillStyle = count > 0 ? TEXT_Y : TEXT_C; ctx.fillText(`Owned: ${count}`, rx+65, cy+50);
                if (isShop) {
                    drawWoodPanel(rx + RIGHT_PANEL_W-80, cy + 12, 60, 40, false); ctx.fillStyle = TEXT_W; ctx.textAlign = 'center'; ctx.fillText(`$${cData.seedPrice}`, rx + RIGHT_PANEL_W-50, cy + 38);
                    if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-80, y: cy+12 - state.rightPanelScroll, w: 60, h: 40, onClick: () => { if (state.money >= cData.seedPrice && state.mouseY > clipY) { state.money -= cData.seedPrice; state.inventory[id] = (state.inventory[id]||0)+1; } } });
                }
                if (count > 0 && state.uiMode === 'normal') { uiState.buttons.push({ x: rx+10, y: cy - state.rightPanelScroll, w: isShop ? RIGHT_PANEL_W-100 : RIGHT_PANEL_W-20, h: 65, onClick: () => { if(state.mouseY > clipY) { state.selectedItem = id; state.selectedTool = 'backpack'; } }}); }
                if (state.uiMode === 'normal' && state.mouseX >= rx+10 && state.mouseX <= rx+RIGHT_PANEL_W-20 && state.mouseY >= (cy-state.rightPanelScroll) && state.mouseY <= (cy+65-state.rightPanelScroll) && state.mouseY > clipY) { tooltips.push({ text: `Grows in ${Math.floor(cData.time / DAY_LENGTH)} Days`, x: state.mouseX, y: state.mouseY }); } cy += 75;
            }
        } else if (state.activeTab === 'decor') {
            let combinedDecor = { ...DECOR_DATA, ...SYSTEM_ITEMS };
            for (const [id, bData] of Object.entries(combinedDecor)) {
                if (!isShop && (state.inventory[id] || 0) === 0) continue; if (isShop && (lvl < bData.minLevel || !DECOR_DATA[id])) continue;
                const isSel = state.selectedItem === id && !isShop; drawWoodPanel(rx + 10, cy, RIGHT_PANEL_W-20, 65, isSel); if(isSel) { ctx.strokeStyle = TEXT_G; ctx.strokeRect(rx+10, cy, RIGHT_PANEL_W-20, 65); }
                let drawId = id; if(id.startsWith('fence')) drawId += '_post';
                let iconName = drawId; if (iconName === 'cherry_tree') iconName = 'icon_cherry_tree'; if (iconName === 'peach_tree') iconName = 'icon_peach_tree'; if (iconName === 'pine_tree') iconName = 'icon_pine_tree'; if (iconName === 'arch') iconName = 'icon_arch'; if (iconName === 'greenhouse') iconName = 'icon_greenhouse';
                const spr = getSprite(iconName, 2); if(spr) { let drawY = cy + (65 - spr.height) / 2; ctx.drawImage(spr, rx+20, drawY); }
                ctx.textAlign = 'left'; ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace'; ctx.fillText(bData.name, rx+65, cy+30);
                const count = state.inventory[id] || 0; ctx.fillStyle = count > 0 ? TEXT_Y : TEXT_W; ctx.fillText(`Owned: ${count}`, rx+65, cy+50);
                if (isShop) {
                    drawWoodPanel(rx + RIGHT_PANEL_W-80, cy + 12, 60, 40, false); ctx.fillStyle = TEXT_W; ctx.textAlign = 'center'; ctx.fillText(`$${bData.cost}`, rx + RIGHT_PANEL_W-50, cy + 38);
                    if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-80, y: cy+12 - state.rightPanelScroll, w: 60, h: 40, onClick: () => { if (state.money >= bData.cost && state.mouseY > clipY) { state.money -= bData.cost; state.inventory[id] = (state.inventory[id]||0)+1; } }});
                }
                if (count > 0 && state.uiMode === 'normal') { uiState.buttons.push({ x: rx+10, y: cy - state.rightPanelScroll, w: isShop ? RIGHT_PANEL_W-100 : RIGHT_PANEL_W-20, h: 65, onClick: () => { if(state.mouseY > clipY) { state.selectedItem = id; state.selectedTool = 'backpack'; } }}); } cy += 75;
            }
        } else {
            let sourceDict = isShop ? SHOP_ITEMS : state.inventory;
            if(!isShop) { for (let cropId in CROP_DATA) if (state.inventory[cropId] > 0) sourceDict[cropId] = state.inventory[cropId]; if (state.inventory['cherry'] > 0) sourceDict['cherry'] = state.inventory['cherry']; if (state.inventory['peach'] > 0) sourceDict['peach'] = state.inventory['peach']; }
            for (const [id, data] of Object.entries(sourceDict)) {
                if (!isShop && (data === 0 || id.startsWith('seed_') || DECOR_DATA[id] || SYSTEM_ITEMS[id])) continue;
                let bData = isShop ? data : null; if (isShop && lvl < bData.minLevel) continue; if (isShop && id === 'deed' && state.hasDeed) continue; if (isShop && bData.type === 'kitchen_upgrade' && state.kitchenUpgrades[id]) continue;
                let isSel = state.selectedItem === id && !isShop; drawWoodPanel(rx + 10, cy, RIGHT_PANEL_W-20, 65, isSel); if(isSel) { ctx.strokeStyle = TEXT_G; ctx.strokeRect(rx+10, cy, RIGHT_PANEL_W-20, 65); }
                let iconName = id; if(id === 'mushroom_brown' || id === 'mushroom_glow') iconName = id; if(id === 'jam') iconName = 'jar'; if(CROP_DATA[id]) iconName = 'mature_'+id; if(id === 'rare') iconName = 'mature_rare';
                if (iconName === 'cherry_tree') iconName = 'icon_cherry_tree'; if (iconName === 'peach_tree') iconName = 'icon_peach_tree'; if (iconName === 'pine_tree') iconName = 'icon_pine_tree'; if (iconName === 'arch') iconName = 'icon_arch'; if (iconName === 'greenhouse') iconName = 'icon_greenhouse';
                const spr = getSprite(iconName, 2); if (spr) { let drawY = cy + (65 - spr.height) / 2; ctx.drawImage(spr, rx+20, drawY); }
                if(id === 'jam') drawJamLabel(rx+20, cy + 16, 2);
                ctx.textAlign = 'left'; ctx.fillStyle = TEXT_W; ctx.font = 'bold 16px monospace';
                let name = isShop ? bData.name : (RECIPES.find(r=>r.id===id)?.name || CROP_DATA[id]?.name || id.charAt(0).toUpperCase() + id.slice(1));
                if(id==='mushroom_brown') name = 'Brown Mush'; if(id==='mushroom_glow') name = 'Glow Mush'; ctx.fillText(name, rx+65, cy+30);
                const count = state.inventory[id] || 0; if (!isShop || bData.type !== 'kitchen_upgrade') { ctx.fillStyle = count > 0 ? TEXT_Y : TEXT_W; ctx.fillText(`Owned: ${count}`, rx+65, cy + 50); }
                if (isShop) {
                    if (id === 'chicken') {
                        let hasCoop = state.grid.some(row => row.some(cell => cell.obj?.id === 'coop'));
                        if (!hasCoop) { drawWoodPanel(rx + RIGHT_PANEL_W-85, cy + 12, 70, 40, false); ctx.fillStyle = TEXT_R; ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace'; ctx.fillText(`NEED COOP`, rx + RIGHT_PANEL_W-50, cy + 38); } 
                        else {
                            drawWoodPanel(rx + RIGHT_PANEL_W-80, cy + 12, 60, 40, false); ctx.fillStyle = TEXT_W; ctx.textAlign = 'center'; ctx.fillText(`$${bData.cost}`, rx + RIGHT_PANEL_W-50, cy + 38);
                            if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-80, y: cy+12 - state.rightPanelScroll, w: 60, h: 40, onClick: () => { if (state.money >= bData.cost && state.mouseY > clipY) { state.money -= bData.cost; state.chickens.push({x: 4, y: 4, state: 'idle', timer: 2, fed: false}); } }});
                        }
                    } else {
                        drawWoodPanel(rx + RIGHT_PANEL_W-80, cy + 12, 60, 40, false); ctx.fillStyle = TEXT_W; ctx.textAlign = 'center'; ctx.fillText(`$${bData.cost}`, rx + RIGHT_PANEL_W-50, cy + 38);
                        if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-80, y: cy+12 - state.rightPanelScroll, w: 60, h: 40, onClick: () => { if (state.money >= bData.cost && state.mouseY > clipY) { state.money -= bData.cost; if(bData.type === 'kitchen_upgrade') state.kitchenUpgrades[id] = true; else state.inventory[id] = (state.inventory[id]||0)+1; } }});
                    }
                    if (bData.desc && state.mouseX >= rx+10 && state.mouseX <= rx+RIGHT_PANEL_W-20 && state.mouseY >= (cy-state.rightPanelScroll) && state.mouseY <= (cy+65-state.rightPanelScroll) && state.mouseY > clipY) { tooltips.push({ text: bData.desc, x: state.mouseX, y: state.mouseY }); }
                } else {
                    if (RECIPES.find(r=>r.id===id) || id.startsWith('mushroom') || id === 'peach' || id === 'cherry') {
                        drawWoodPanel(rx + RIGHT_PANEL_W-80, cy + 12, 60, 40); ctx.fillStyle=TEXT_G; ctx.textAlign='center'; ctx.fillText("EAT", rx+RIGHT_PANEL_W-50, cy+38);
                        if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-80, y: cy+12 - state.rightPanelScroll, w: 60, h: 40, onClick: () => { if (state.mouseY > clipY) { state.inventory[id]--; let eVal = id === 'mushroom_brown' ? 30 : (id === 'mushroom_glow' ? 80 : (id === 'peach' || id === 'cherry' ? 20 : RECIPES.find(r=>r.id===id).energy)); state.energy = Math.min(100, state.energy + eVal); spawnParticles(OFFSET_X+state.farmer.x*TILE_SIZE-state.cameraX, OFFSET_Y+state.farmer.y*TILE_SIZE, TEXT_G, 10, true); } }});
                    } else if (id === 'jam') {
                        drawWoodPanel(rx + RIGHT_PANEL_W-110, cy + 12, 90, 40); ctx.fillStyle=TEXT_C; ctx.textAlign='center'; ctx.font='bold 14px monospace'; ctx.fillText("DESIGN", rx+RIGHT_PANEL_W-65, cy+38);
                        if (state.uiMode === 'normal') uiState.buttons.push({ x: rx+RIGHT_PANEL_W-110, y: cy+12 - state.rightPanelScroll, w: 90, h: 40, onClick: () => { if (state.mouseY > clipY) state.uiMode = 'jam_design'; }});
                    } else if (count > 0 && state.uiMode === 'normal' && !CROP_DATA[id] && id !== 'bouquet') {
                        uiState.buttons.push({ x: rx+10, y: cy - state.rightPanelScroll, w: RIGHT_PANEL_W-100, h: 65, onClick: () => { if(state.mouseY > clipY) { state.selectedItem = id; state.selectedTool = 'backpack'; } }});
                    }
                }
                cy += 75;
            }
        }
        ctx.restore(); let maxScroll = Math.max(0, (cy - clipY) - clipH + 20); if (state.rightPanelScroll > maxScroll) state.rightPanelScroll = maxScroll;
    } else {
        ctx.fillStyle = '#b07b54'; ctx.textAlign = 'center'; ctx.font = 'bold 18px monospace'; ctx.fillText("Select Shop or", rx + RIGHT_PANEL_W/2, CH/2); ctx.fillText("Backpack on Left", rx + RIGHT_PANEL_W/2, CH/2+25);
    }
}

export function updateDraw() {
    uiState.buttons = []; let tooltips = [];
    if (state.uiMode === 'char_select') { drawCharSelect(); return; }

    let currentGrid = state.map === 'main' ? state.grid : state.ghGrid;
    let limitW = state.map === 'main' ? TOTAL_GRID_W : VIEW_W;

    if (state.map === 'main') {
        if (state.season === 0) ctx.fillStyle = P['g']; else if (state.season === 1) ctx.fillStyle = '#8bcc66';
        else if (state.season === 2) ctx.fillStyle = '#c49a4f'; else ctx.fillStyle = '#dbe6e6';
    } else { ctx.fillStyle = '#111'; }
    ctx.fillRect(LEFT_PANEL_W + SAFE_L, 0, CW - (LEFT_PANEL_W + SAFE_L) - (RIGHT_PANEL_W + SAFE_R), CH);

    if (state.map === 'main') {
        ctx.fillStyle = state.season === 3 ? '#a39c98' : P['d']; ctx.fillRect(OFFSET_X - 8, OFFSET_Y - 8, VIEW_W * TILE_SIZE + 16, WORLD_H + 16);
        ctx.fillStyle = state.season === 3 ? '#7a7370' : P['D']; ctx.fillRect(OFFSET_X - 8, OFFSET_Y - 8 + WORLD_H + 16, VIEW_W * TILE_SIZE + 16, 8);
    } else {
        ctx.fillStyle = '#4a2c19'; ctx.fillRect(OFFSET_X - 16, OFFSET_Y - 16, VIEW_W * TILE_SIZE + 32, WORLD_H + 32);
    }

    const shadowOffset = Math.cos((state.dayTime / DAY_LENGTH) * Math.PI) * 15;

    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < limitW; x++) {
            const cell = currentGrid[y][x]; const px = OFFSET_X + x * TILE_SIZE - state.cameraX; const py = OFFSET_Y + y * TILE_SIZE;
            if (px < OFFSET_X - TILE_SIZE || px > OFFSET_X + VIEW_W * TILE_SIZE) continue;

            if (cell.state === 'grass') {
                ctx.fillStyle = state.season === 3 && state.map === 'main' ? '#dbe6e6' : P['g'];
                if (state.season === 2 && state.map === 'main') ctx.fillStyle = '#c49a4f'; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = state.season === 3 && state.map === 'main' ? '#a8c0c0' : P['G'];
                if (state.season === 2 && state.map === 'main') ctx.fillStyle = '#a67d38'; ctx.fillRect(px + 12, py + 12, 4, 4); ctx.fillRect(px + 44, py + 36, 4, 4);
            } else if (cell.state === 'tilled') {
                ctx.fillStyle = cell.watered > 0 ? P['D'] : P['d']; ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = cell.watered > 0 ? P['1'] : P['D']; ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                if (cell.fertilized) { ctx.fillStyle = TEXT_Y; ctx.fillRect(px+12, py+12, 4, 4); ctx.fillRect(px+40, py+40, 4, 4); }
            }

            if (cell.path) { const spr = getSprite(cell.path, 4); if (spr) ctx.drawImage(spr, px, py); }
            if (cell.inGreenhouse && cell.obj?.id !== 'greenhouse') { ctx.fillStyle = 'rgba(150, 200, 255, 0.15)'; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE); }

            let noShadowObjs = ['fountain', 'bench', 'water_pond', 'greenhouse', 'greenhouse_part', 'arch', 'arch_part', 'path_stone', 'path_wood', 'path_brick', 'path_sand', 'path_gravel', 'path_water', 'fence_wood', 'fence_picket', 'fence_rope'];
            let isFlatObj = cell.obj && noShadowObjs.some(prefix => cell.obj.id.startsWith(prefix));
            let isFlatForage = cell.forage === 'hay' || cell.forage === 'egg';

            if (cell.crop || (cell.obj && !isFlatObj) || (cell.forage && !isFlatForage)) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(px + 32 + shadowOffset, py + 52, 16, 6, 0, 0, Math.PI*2); ctx.fill();
            }
        }
    }

    let renderList = [];
    let fx = OFFSET_X + state.farmer.x * TILE_SIZE - state.cameraX; let fy = OFFSET_Y + state.farmer.y * TILE_SIZE;
    renderList.push({ type: 'farmer', y: fy, px: fx, py: fy });

    if (state.map === 'main') {
        for (let c of state.chickens) {
            let cx = OFFSET_X + c.x * TILE_SIZE - state.cameraX; let cy = OFFSET_Y + c.y * TILE_SIZE;
            if(cx > OFFSET_X - TILE_SIZE && cx < OFFSET_X + VIEW_W * TILE_SIZE) { renderList.push({ type: 'chicken', y: cy, px: cx, py: cy, ref: c }); }
        }
        for (const c of state.customers) {
            let drawX = OFFSET_X + c.worldX - state.cameraX;
            if(drawX > OFFSET_X - TILE_SIZE && drawX < OFFSET_X + VIEW_W * TILE_SIZE) { renderList.push({ type: 'customer', y: c.y, px: drawX, py: c.y, ref: c }); }
        }
    }

    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < limitW; x++) {
            const cell = currentGrid[y][x]; const px = OFFSET_X + x * TILE_SIZE - state.cameraX; const py = OFFSET_Y + y * TILE_SIZE;
            if (px < OFFSET_X - TILE_SIZE || px > OFFSET_X + VIEW_W * TILE_SIZE) continue;

            if (cell.forage) renderList.push({ type: 'forage', y: py, px, py, ref: cell.forage });
            if (cell.crop) { let sortY = py; if (CROP_DATA[cell.crop.type].type === 'rare' && cell.crop.progress >= 100) sortY += TILE_SIZE; renderList.push({ type: 'crop', y: sortY, px, py, ref: cell.crop }); }
            if (cell.obj && !cell.obj.id.startsWith('greenhouse_part') && !cell.obj.id.startsWith('arch_part')) {
                let sortY = py; if (cell.obj.id === 'greenhouse') sortY += 2 * TILE_SIZE; if (cell.obj.id === 'fountain') sortY += TILE_SIZE;
                renderList.push({ type: 'obj', y: sortY, px, py, ref: cell.obj, gridX: x, gridY: y });
            }
            if (cell.inGreenhouse && cell.greenhouseOrigin && cell.greenhouseOrigin.x + 1 === x && cell.greenhouseOrigin.y + 2 === y && state.uiMode === 'normal') {
                if (state.mouseX >= px && state.mouseX < px+TILE_SIZE && state.mouseY >= py && state.mouseY < py+TILE_SIZE) { tooltips.push({ text: "Walk into Door to Enter", x: state.mouseX, y: state.mouseY }); }
            }
        }
    }

    renderList.sort((a,b) => a.y - b.y);

    let fGridX = Math.floor(state.farmer.x); let fGridY = Math.floor(state.farmer.y); let farmerGH = null;
    if (state.grid[fGridY] && state.grid[fGridY][fGridX]) { farmerGH = state.grid[fGridY][fGridX].inGreenhouse ? state.grid[fGridY][fGridX].greenhouseOrigin : null; }

    for (let item of renderList) {
        let { px, py} = item; ctx.globalAlpha = 1.0;
        if (item.type === 'forage') {
            const spr = getSprite(item.ref, 4); if(spr) ctx.drawImage(spr, px, py);
        } else if (item.type === 'crop') {
            let sName = 'sprout'; let cType = item.ref.type; let cGroup = CROP_DATA[cType].type;
            if (item.ref.progress >= 30 && item.ref.progress < 100) sName = cGroup + '_foliage'; else if (item.ref.progress >= 100) sName = cGroup === 'rare' ? 'mature_rare' : 'mature_' + cType;
            const spr = getSprite(sName, 4, null, item.ref.color);
            if(spr) { let drawX = px; let drawY = py; if (cGroup === 'rare' && item.ref.progress >= 100) { drawX -= TILE_SIZE/2; drawY -= TILE_SIZE; if (fy < py + 20 && fy > drawY && fx + 40 > drawX && fx + 24 < drawX + spr.width) ctx.globalAlpha = 0.4; } ctx.drawImage(spr, drawX, drawY); }
            ctx.globalAlpha = 1.0;
            if (item.ref.progress >= 100 && Math.floor(performance.now()/200 + px) % 4 === 0) { ctx.fillStyle='white'; ctx.fillRect(px+8, py+8, 4, 4); }
            if (state.mouseX >= px && state.mouseX < px+TILE_SIZE && state.mouseY >= py && state.mouseY < py+TILE_SIZE && state.uiMode === 'normal') {
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(px + 4, py - 12, TILE_SIZE - 8, 8);
                ctx.fillStyle = item.ref.progress >= 100 ? TEXT_Y : TEXT_G; ctx.fillRect(px + 5, py - 11, (TILE_SIZE - 10) * (item.ref.progress/100), 6);
                tooltips.push({ text: `${CROP_DATA[cType].name} (${Math.floor(item.ref.progress)}%)`, x: state.mouseX, y: state.mouseY });
            }
        } else if (item.type === 'obj') {
            let sName = item.ref.id;
            if (sName.startsWith('fence')) {
                const bld = sName; const pSpr = getSprite(bld+'_post', 4); if(pSpr) ctx.drawImage(pSpr, px, py);
                if (item.gridX>0 && currentGrid[item.gridY][item.gridX-1].obj?.id === bld) { const s = getSprite(bld+'_h', 4); if(s) ctx.drawImage(s, px-32, py); }
                if (item.gridX<limitW-1 && currentGrid[item.gridY][item.gridX+1].obj?.id === bld) { const s = getSprite(bld+'_h',4); if(s) ctx.drawImage(s, px+32, py); }
                if (item.gridY>0 && currentGrid[item.gridY-1][item.gridX].obj?.id === bld) { const s = getSprite(bld+'_v', 4); if(s) ctx.drawImage(s, px, py-32); }
                if (item.gridY<GRID_H-1 && currentGrid[item.gridY+1][item.gridX].obj?.id === bld) { const s = getSprite(bld+'_v', 4); if(s) ctx.drawImage(s, px, py+32); }
            } else {
                const spr = getSprite(sName, 4);
                if(spr) {
                    let drawX = px; let drawY = py; 
                    if (sName === 'greenhouse') { drawY = py; if (farmerGH && farmerGH.x === item.ref.originX && farmerGH.y === item.ref.originY) { ctx.globalAlpha = 0.2; } } 
                    else if (sName === 'arch') { drawX -= TILE_SIZE; if(spr.height > TILE_SIZE) drawY -= (spr.height - TILE_SIZE); } 
                    else if (sName === 'fountain') { drawX -= TILE_SIZE/2; drawY -= TILE_SIZE; } 
                    else { if(spr.height > TILE_SIZE) drawY -= (spr.height - TILE_SIZE); }

                    let isTallObj = ['cherry_tree', 'peach_tree', 'pine_tree', 'coop', 'arch', 'fountain'].includes(sName);
                    if (isTallObj) { if (fy < py + 20 && fy > drawY && fx + 40 > drawX && fx + 24 < drawX + spr.width) { ctx.globalAlpha = 0.4; } }
                    ctx.drawImage(spr, drawX, drawY);
                }
                ctx.globalAlpha = 1.0;
                if (sName === 'mailbox' && state.readMailCount > state.openedMailCount) {
                    ctx.fillStyle = TEXT_R; ctx.beginPath(); ctx.arc(px + 45, py + 15, 8, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = TEXT_W; ctx.font = 'bold 12px monospace'; ctx.textAlign='center'; ctx.fillText("!", px+45, py + 19);
                }
                if (state.mouseX >= px && state.mouseX < px+TILE_SIZE && state.mouseY >= py && state.mouseY < py+TILE_SIZE && state.uiMode === 'normal') {
                    if (item.ref.id === 'stand') tooltips.push({ text: "Farm Stand", x: state.mouseX, y: state.mouseY });
                    else if (item.ref.id === 'mailbox') tooltips.push({ text: "Mailbox", x: state.mouseX, y: state.mouseY });
                }
            }
        } else if (item.type === 'farmer') {
            let drawY = py - 12; if (state.farmer.state === 'walking' || state.farmer.state === 'action') drawY += Math.sin(state.farmer.animTimer * 15) * 4;
            const fspr = getSprite('farmer', 4, state.charColors);
            if (fspr) {
                ctx.save(); if (state.farmer.facing === 'left') { ctx.translate (px + 64, drawY); ctx.scale(-1, 1); ctx.drawImage(fspr, 0, 0); } else ctx.drawImage(fspr, px, drawY); ctx.restore();
            }
        } else if (item.type === 'chicken') {
            let drawY = py; if (item.ref.state === 'wander') drawY += Math.sin(performance.now()/100) * 4; if (item.ref.inWater) drawY += 10;
            const fspr = getSprite('chicken', 4);
            if (fspr) { ctx.save(); if (item.ref.facing === 'left') { ctx.translate (px + 64, drawY); ctx.scale(-1, 1); ctx.drawImage(fspr, 0, 0); } else ctx.drawImage(fspr, px, drawY); ctx.restore(); }
        } else if (item.type === 'customer') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px + 32 + shadowOffset, py + 58, 14, 6, 0, 0, Math.PI*2); ctx.fill();
            ctx.save(); if (item.ref.state === 'walking_out') { ctx.translate(px+64, py); ctx.scale(-1, 1); } else ctx.translate(px, py);
            const spr = getSprite(item.ref.model || 'customer1', 4); if(spr) ctx.drawImage(spr, 0, Math.sin(performance.now()/100) * 4);
            if (item.ref.emoji) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(32, -15, 20, 15, 0, 0, Math.PI*2); ctx.fill(); ctx.font = '20px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=P['1']; ctx.fillText(item.ref.emoji, 32, -8); }
            ctx.restore();
        }
    }

    ctx.globalAlpha = 1.0;
    if (state.map === 'main' && state.weather === 'raining') {
        ctx.strokeStyle = 'rgba(120, 180, 255, 0.4)'; ctx.lineWidth = 1; ctx.beginPath();
        for(let i=0; i<150; i++) { let rx = Math.random() * CW; let ry = Math.random() * CH; ctx.moveTo(rx, ry); ctx.lineTo(rx - 15, ry + 30); ctx.stroke(); }
    }

    for (const p of state.particles) {
        let drawX = p.isScreen ? p.x : OFFSET_X + p.worldX - state.cameraX; ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life); ctx.fillRect(drawX, p.y, 6, 6);
    }

    if (state.map === 'main') {
        for (const b of state.butterflies) { let drawX = OFFSET_X + b.worldX - state.cameraX; ctx.fillStyle = b.c; ctx.globalAlpha = Math.max(0, b.life/20); ctx.fillRect(drawX, b.y + Math.sin(performance.now()/50)*3, 4, 4); }
        for (const f of state.fireflies) { let drawX = OFFSET_X + f.worldX - state.cameraX; ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = TEXT_Y; ctx.fillStyle = TEXT_Y; ctx.globalAlpha = Math.max(0, f.life/15); ctx.beginPath(); ctx.arc(drawX, f.y, 4, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
    }
    ctx.globalAlpha = 1.0;

    if (state.map === 'main') {
        if (state.weather === 'raining') {
            ctx.fillStyle = 'rgba(20, 30, 60, 0.2)'; ctx.fillRect(LEFT_PANEL_W + SAFE_L, 0, CW - (LEFT_PANEL_W + SAFE_L) - (RIGHT_PANEL_W + SAFE_R), CH);
        } else if (state.dayTime > DAY_LENGTH*0.7) {
            ctx.globalCompositeOperation = 'multiply'; let alpha = 0;
            if (state.dayTime < DAY_LENGTH * 0.85) { alpha = (state.dayTime - DAY_LENGTH*0.7) / (DAY_LENGTH*0.15); ctx.fillStyle = `rgba(240, 150, 100, ${alpha * 0.4})`; } 
            else { alpha = Math.min(1.0, (state.dayTime - DAY_LENGTH*0.85) / (DAY_LENGTH*0.15)); ctx.fillStyle = `rgba(50, 60, 140, ${0.4 + alpha * 0.6})`; }
            ctx.fillRect(LEFT_PANEL_W + SAFE_L, 0, CW - (LEFT_PANEL_W + SAFE_L) - (RIGHT_PANEL_W + SAFE_R), CH); ctx.globalCompositeOperation = 'source-over';
            
            ctx.globalCompositeOperation = 'lighter';
            for(let y=0; y<GRID_H; y++) {
                for(let x=0; x<limitW; x++) {
                    if (currentGrid[y][x].obj?.id === 'lantern') {
                        let drawX = OFFSET_X + x * TILE_SIZE - state.cameraX + TILE_SIZE/2; let drawY = OFFSET_Y + y * TILE_SIZE + TILE_SIZE/2;
                        let grad = ctx.createRadialGradient(drawX, drawY, 10, drawX, drawY, 180); grad.addColorStop(0, 'rgba(255, 230, 150, 0.4)'); grad.addColorStop(1, 'rgba(255, 230, 150, 0)');
                        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(drawX, drawY, 180, 0, Math.PI*2); ctx.fill();
                    }
                }
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    drawLeftToolbar(tooltips); drawRightPanel(tooltips);

    if (state.uiMode === 'stand') drawStandModal(tooltips);
    else if (state.uiMode === 'stand_select') drawStandSelectModal();
    else if (state.uiMode === 'book') drawBookModal();
    else if (state.uiMode === 'levelup_modal') drawLevelUpModal();
    else if (state.uiMode === 'jam_design') drawJamDesignModal();
    else if (state.uiMode === 'mail_modal') drawMailModal();

    for (const tip of tooltips) {
        ctx.font = 'bold 14px monospace'; const tw = ctx.measureText(tip.text).width + 20;
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(tip.x + 15, tip.y + 15, tw, 30);
        ctx.fillStyle = TEXT_W; ctx.textAlign = 'left'; ctx.fillText(tip.text, tip.x + 25, tip.y + 35);
    }

    if (state.transitionTimer > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, state.transitionTimer)})`; ctx.fillRect(0, 0, CW, CH);
        if (state.transitionTimer > 0.5) { ctx.fillStyle = TEXT_W; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center'; ctx.fillText("Zzz...", CW/2, CH/2); }
    }
}
