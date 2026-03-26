export const CW = 1280; export const CH = 640; export const TILE_SIZE = 64;
export const TOTAL_GRID_W = 18; export const VIEW_W = 10; export const GRID_H = 8;
export const WORLD_W = TOTAL_GRID_W * TILE_SIZE; export const WORLD_H = GRID_H * TILE_SIZE;
export const LEFT_PANEL_W = 180; export const RIGHT_PANEL_W = 340;
export const SAFE_L = 50; export const SAFE_R = 50;
export const OFFSET_X = (LEFT_PANEL_W + SAFE_L) + ((CW - (LEFT_PANEL_W + SAFE_L) - (RIGHT_PANEL_W + SAFE_R)) - (VIEW_W * TILE_SIZE)) / 2;
export const OFFSET_Y = (CH - WORLD_H) / 2 + 10;
export const DAY_LENGTH = 240;

export const P = {
    '0': 'transparent', '1': '#221c35', 'w': '#ffffff', 'g': '#74c95b',
    'G': '#40a03b', 'd': '#d89f67', 'D': '#ad6c43', 'b': '#5fb1cc',
    'B': '#2d6f98', 'r': '#e64539', 'o': '#e8873a', 'y': '#f7d354',
    's': '#f2c49b', 'c': '#82a33f', 'p': '#9b4f91', 'k': '#8b9bb4',
    'R': '#bf504d', 'W': '#8b593e', 'l': '#b8825c', 'C': '#614639',
    'f': '#d9d3c5', 'E': '#f4e8c1', 'v': '#6a4087', 'M': '#6be3ba',
    'T': '#cf3e3e', 'P': '#d4c7a5', 'e': '#593970', 'm': '#8cde66',
    'S': '#f0c62e', 'A': '#f5f0e1', 'Q': '#8bbd68', 'q': '#cc2929',
    'x': '#5c5c5c', 'z': '#d4b78c', 'U': '#d9a066', 'F': '#ff99b0', 
    'h': '#e8c170', 'I': '#6e452f', ' ': '#ffffff' 
};

export const TEXT_W = '#ffffff'; export const TEXT_Y = '#ffed75'; export const TEXT_C = '#9ce6ff';
export const TEXT_G = '#a8e693'; export const TEXT_R = '#ff8f8f'; export const TEXT_K = '#5c483a';

export const CROP_DATA = {
    blueberry: { name: 'Blueberry', type: 'bush', color: 'b', time: DAY_LENGTH * 2, seedPrice: 5, price: 10, exp: 10, minLevel: 1 },
    tulip: { name: 'Tulip', type: 'flower', color: 'F', time: DAY_LENGTH * 3, seedPrice: 8, price: 18, exp: 15, minLevel: 1},
    radish: { name: 'Radish', type: 'root', color: 'A', time: DAY_LENGTH * 3, seedPrice: 10, price: 18, exp: 15, minLevel: 2 },
    strawberry: { name: 'Strawberry', type: 'bush', color: 'r', time: DAY_LENGTH * 4, seedPrice: 10, price: 25, exp: 20, minLevel: 1 },
    tomato: { name: 'Tomato', type: 'bush', color: 'T', time: DAY_LENGTH * 4, seedPrice: 8, price: 15, exp: 15, minLevel: 1 },
    carrot: { name: 'Carrot', type: 'root', color: 'o', time: DAY_LENGTH * 4, seedPrice: 12, price: 22, exp: 18, minLevel: 2 },
    potato: { name: 'Potato', type: 'root', color: 'P', time: DAY_LENGTH * 5, seedPrice: 10, price: 20, exp: 18, minLevel: 2 },
    garlic: { name: 'Garlic', type: 'root', color: 'w', time: DAY_LENGTH * 5, seedPrice: 15, price: 35, exp: 25, minLevel: 2 },
    pepper: { name: 'Pepper', type: 'bush', color: 'q', time: DAY_LENGTH * 5, seedPrice: 15, price: 30, exp: 25, minLevel: 3},
    rose: { name: 'Rose', type: 'flower', color: 'R', time: DAY_LENGTH * 5, seedPrice: 20, price: 45, exp: 30, minLevel: 3 },
    corn: { name: 'Corn', type: 'stalk', color: 'y', time: DAY_LENGTH * 6, seedPrice: 20, price: 40, exp: 35, minLevel: 3},
    cabbage: { name: 'Cabbage', type: 'root', color: 'Q', time: DAY_LENGTH * 6, seedPrice: 20, price: 45, exp: 38, minLevel: 4 },
    sunflower: { name: 'Sunflower', type: 'flower', color: 'S', time: DAY_LENGTH * 6, seedPrice: 25, price: 50, exp: 40, minLevel: 4 },
    eggplant: { name: 'Eggplant', type: 'bush', color: 'e', time: DAY_LENGTH * 7, seedPrice: 25, price: 55, exp: 45, minLevel: 4 },
    melon: { name: 'Melon', type: 'vine', color: 'm', time: DAY_LENGTH * 7, seedPrice: 45, price: 95, exp: 75, minLevel: 5 },
    leek: { name: 'Leek', type: 'stalk', color: 'g', time: DAY_LENGTH * 7, seedPrice: 30, price: 65, exp: 55, minLevel: 5 },
    pumpkin: { name: 'Pumpkin', type: 'vine', color: 'o', time: DAY_LENGTH * 8, seedPrice: 50, price: 100, exp: 80, minLevel: 5 },
    rare: { name: 'Rare Seed', type: 'vine', color: 'v', time: DAY_LENGTH * 8, seedPrice: 250, price: 800, exp: 200, minLevel: 5 }
};

export const DECOR_DATA = {
    path_stone: { name: 'Stone Path', cost: 10, minLevel: 1 },
    path_wood: { name: 'Wood Path', cost: 15, minLevel: 1 },
    path_gravel: { name: 'Gravel Path', cost: 5, minLevel: 1 },
    fence_wood: { name: 'Wood Fence', cost: 15, minLevel: 1 },
    fence_rope: { name: 'Rope Fence', cost: 10, minLevel: 1 },
    path_brick: { name: 'Brick Path', cost: 20, minLevel: 2 },
    path_sand: { name: 'Sand Path', cost: 10, minLevel: 2 },
    fence_picket: { name: 'Picket Fence', cost: 20, minLevel: 2 },
    bench: { name: 'Wood Bench', cost: 80, minLevel: 2 },
    potted: { name: 'Potted Plant', cost: 100, minLevel: 2 },
    water_pond: { name: 'Water Pond', cost: 50, minLevel: 2 },
    path_water: { name: 'Waterway', cost: 30, minLevel: 2 },
    pine_tree: { name: 'Pine Tree', cost: 150, minLevel: 2 },
    birdbath: { name: 'Birdbath', cost: 150, minLevel: 3},
    lantern: { name: 'Lantern', cost: 200, minLevel: 3 },
    cherry_tree: { name: 'Cherry Tree', cost: 300, minLevel: 3},
    peach_tree: { name: 'Peach Tree', cost: 300, minLevel: 3},
    gnome: { name: 'Garden Gnome', cost: 250, minLevel: 4 },
    balloons: { name: 'Balloons', cost: 100, minLevel: 4 },
    arch: { name: 'Floral Arch', cost: 350, minLevel: 4 },
    fountain: { name: 'Fountain', cost: 500, minLevel: 5 },
    well: { name: 'Stone Well', cost: 600, minLevel: 5 }
};

export const SYSTEM_ITEMS = { stand: { name: 'Farm Stand' }, mailbox: { name: 'Mailbox' } };

export const SHOP_ITEMS = {
    deed: { name: 'East Farm Deed', cost: 50, minLevel: 1, type: 'item', desc: 'Expand farm area!' },
    hay: { name: 'Hay', cost: 5, minLevel: 1, type: 'item', desc: 'Feed Chickens' },
    fertilizer: { name: 'Fertilizer', cost: 15, minLevel: 1, type: 'item', desc: '+Yield & +Speed' },
    flour: { name: 'Flour', cost: 5, minLevel: 1, type: 'item' },
    butter: { name: 'Butter', cost: 5, minLevel: 1, type: 'item' },
    egg: { name: 'Egg', cost: 50, minLevel: 1, type: 'item' },
    coop: { name: 'Chicken Coop', cost: 1000, minLevel: 2, type: 'building', desc: 'House for chickens' },
    chicken: { name: 'Chicken', cost: 200, minLevel: 2, type: 'animal', desc: 'Lays eggs if fed' },
    jar: { name: 'Preserves Jar', cost: 150, minLevel: 2, type: 'kitchen_upgrade', desc: 'Unlocks Kitchen Jam Maker' },
    florist_table: { name: 'Florist Table', cost: 400, minLevel: 3, type: 'kitchen_upgrade', desc: 'Unlocks Kitchen Bouquet Maker' },
    sprinkler: { name: 'Sprinkler', cost: 300, minLevel: 3, type: 'machine', desc: 'Waters 3x3 Area' },
    greenhouse: { name: 'Greenhouse', cost: 2000, minLevel: 5, type: 'building', desc: 'Walk inside to farm!' }
};

export const RECIPES = [
    { id: 'scone', name: 'BB Scone', icon: 'scone', ingredients: { blueberry: 2, flour: 1, butter: 1}, yield: 1, energy: 40, price: 40, minLevel: 1},
    { id: 'omelette', name: 'Omelette', icon: 'tart', ingredients: { egg: 2, butter: 1}, yield: 1, energy: 50, price: 110, minLevel: 2 },
    { id: 'tart', name: 'Berry Tart', icon: 'tart', ingredients: { strawberry: 2, flour: 1, egg: 1}, yield: 1, energy: 70, price: 75, minLevel: 2},
    { id: 'pie', name: 'Cherry Pie', icon: 'scone', ingredients: { cherry: 2, flour: 2, butter: 1 }, yield: 1, energy: 100, price: 150, minLevel: 3 },
    { id: 'stew', name: 'Veggie Stew', icon: 'stew', ingredients: { tomato: 2, potato: 1, corn: 1}, yield: 1, energy: 100, price: 140, minLevel: 3},
    { id: 'soup', name: 'Glow Soup', icon: 'soup', ingredients: { mushroom_glow: 1, butter: 1}, yield: 1, energy: 100, price: 200, minLevel: 5 },
    { id: 'roasted_veggies', name: 'Roasted Veg', icon: 'stew', ingredients: { radish: 1, carrot: 1, leek: 1}, yield: 1, energy: 110, price: 160, minLevel: 5},
    { id: 'stuffed_eggplant', name: 'Stuffed Eggplant', icon: 'tart', ingredients: { eggplant: 2, garlic: 1, tomato: 1}, yield: 1, energy: 120, price: 180, minLevel: 4},
    { id: 'pumpkin_pie', name: 'Pumpkin Pie', icon: 'tart', ingredients: { pumpkin: 1, flour: 2, butter: 1}, yield: 1, energy: 150, price: 250, minLevel: 5},
    { id: 'melon_sorbet', name: 'Melon Sorbet', icon: 'scone', ingredients: { melon: 2 }, yield: 1, energy: 90, price: 200, minLevel: 5},
    { id: 'spicy_poppers', name: 'Spicy Poppers', icon: 'scone', ingredients: { pepper: 2, butter: 1}, yield: 1, energy: 80, price: 100, minLevel: 3},
    { id: 'cabbage_roll', name: 'Cabbage Roll', icon: 'stew', ingredients: { cabbage: 2, tomato: 1}, yield: 1, energy: 95, price: 130, minLevel: 4},
    { id: 'peach_cobbler', name: 'Peach Cobbler', icon: 'tart', ingredients: { peach: 2, flour: 1, butter: 1}, yield: 1, energy: 100, price: 160, minLevel: 3},
    { id: 'floral_tea', name: 'Floral Tea', icon: 'soup', ingredients: { tulip: 1, rose: 1, sunflower: 1}, yield: 1, energy: 85, price: 170, minLevel: 4}
];

export const MAIL_LETTERS = [
    "Welcome to Peaches, your family's old farm stand! It's seen better days, but with some hard work, you can bring it back to life. Plant crops, sell them to the locals, and expand your farm. We're rooting for you! - Mayor",
    "Tip: Use the Demolish (Pickaxe) tool to remove paths, objects, or your greenhouse!",
    "Tip: Crops grow faster if you water them. They grow SUPER fast while you sleep!",
    "Tip: Buy the Preserves Jar from the shop to unlock Jam Making in your kitchen! - Local Artist",
    "Did you know? Chickens will lay eggs much faster if you place Hay on the ground for them to eat!"
];

export const CHAR_OPTS = {
    skin: ['#f2c49b', '#d89f67', '#ad6c43', '#3b2027'], hair: ['#221c35', '#ad6c43', '#f7d354', '#e64539', '#ffffff'],
    shirt: ['#5fb1cc', '#e64539', '#74c95b', '#f7d354', '#9b4f91'], pants: ['#2d6f98', '#ad6c43', '#5c5c5c', '#221c35']
};
