// Deterministic procedural city data. Pure JS, no three.js dependency.

export const CHUNK_SIZE = 80;
export const VIEW_RADIUS = 2; // chunks in each direction (~ 200m)

function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function rng(seedArr) {
  let i = 0;
  return () => hash2(seedArr[0] * 91 + i++, seedArr[1] * 137 + i * 7);
}

export function chunkKey(cx, cz) {
  return cx + ":" + cz;
}

export const BUILDING_PALETTES = [
  { body: '#1e3a8a', trim: '#38bdf8', windows: '#7dd3fc', name: 'Cyber Blue Glass', style: 'glass' },
  { body: '#831843', trim: '#f43f5e', windows: '#fbcfe8', name: 'Neon Magenta Tower', style: 'neon' },
  { body: '#334155', trim: '#94a3b8', windows: '#fef08a', name: 'Brutalist Concrete', style: 'concrete' },
  { body: '#065f46', trim: '#34d399', windows: '#a7f3d0', name: 'Emerald High-Rise', style: 'glass' },
  { body: '#7c2d12', trim: '#fb923c', windows: '#fef3c7', name: 'Terracotta Brick Shop', style: 'brick' },
  { body: '#0f172a', trim: '#38bdf8', windows: '#fde047', name: 'Obsidian Modern', style: 'glass' },
  { body: '#312e81', trim: '#818cf8', windows: '#c7d2fe', name: 'Electric Indigo', style: 'neon' },
  { body: '#475569', trim: '#cbd5e1', windows: '#fef08a', name: 'Art-Deco Stone', style: 'stone' },
  { body: '#b91c1c', trim: '#f87171', windows: '#fef08a', name: 'Crimson Graphic', style: 'neon' },
  { body: '#1e293b', trim: '#60a5fa', windows: '#bae6fd', name: 'Azure Financial', style: 'glass' }
];

export const MODULAR_BUILDING_TYPES = [
  'BUNGALOW_PARAPET',
  'GABLE_SLOPED_COTTAGE',
  'L_SHAPED_TOWNHOUSE',
  'STEPPED_AWNING_TOWNHOUSE',
  'HERITAGE_BALCONY_GABLE',
  'STEPPED_OPEN_TERRACE',
  'FLARED_CORNICE_SHOP',
  'ANGLED_CHAMFER_SHOP',
  'LONG_STRIP_SHOP',
  'CORNER_TWO_STORY_SHOP',
  'HIP_ROOF_RESIDENCE',
  'VAULTED_BARREL_ROOF',
];

// Preset dimensions and heights for the 12 modular models
export const MODULAR_BUILDING_CONFIGS = {
  BUNGALOW_PARAPET: { w: 12, d: 8, h: 5.2 },
  GABLE_SLOPED_COTTAGE: { w: 7.5, d: 8.5, h: 6.2 },
  L_SHAPED_TOWNHOUSE: { w: 9.5, d: 10, h: 8.6 },
  STEPPED_AWNING_TOWNHOUSE: { w: 7.5, d: 11, h: 9.2 },
  HERITAGE_BALCONY_GABLE: { w: 8.5, d: 9.5, h: 10.4 },
  STEPPED_OPEN_TERRACE: { w: 8.5, d: 12, h: 8.8 },
  FLARED_CORNICE_SHOP: { w: 8.5, d: 8.5, h: 8.5 },
  ANGLED_CHAMFER_SHOP: { w: 9.2, d: 9.2, h: 5.8 },
  LONG_STRIP_SHOP: { w: 16.5, d: 7.5, h: 4.8 },
  CORNER_TWO_STORY_SHOP: { w: 9.2, d: 9.2, h: 8.8 },
  HIP_ROOF_RESIDENCE: { w: 8.5, d: 8.5, h: 9.2 },
  VAULTED_BARREL_ROOF: { w: 8.5, d: 10, h: 6.6 },
};

export const DISTRICT_TYPE = {
  HERITAGE_COLONY: 'heritage_colony',
  METROPOLIS_FINANCIAL: 'metropolis_financial',
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  MIXED_USE: 'mixed_use',
  LANDMARK: 'landmark',
  PARK: 'park',
};

export const ICONIC_SKYSCRAPER_TYPES = [
  'ONE_WORLD_TRADE',
  'CHRYSLER_BUILDING',
  'EMPIRE_STATE_BUILDING',
  'FLATIRON_BUILDING',
  'CRAIN_DIAMOND',
  'METLIFE_PAN_AM',
  'HEARST_DIAGRID',
  'MET_LIFE_CLOCK_TOWER',
  'CITIGROUP_CENTER',
  'ROCKEFELLER_SLAB',
  'ONE_VANDERBILT',
  'HELMSLEY_PYRAMID',
];

export const ICONIC_SKYSCRAPER_CONFIGS = {
  ONE_WORLD_TRADE: { w: 32, d: 32, h: 180 },
  CHRYSLER_BUILDING: { w: 30, d: 30, h: 165 },
  EMPIRE_STATE_BUILDING: { w: 34, d: 34, h: 190 },
  FLATIRON_BUILDING: { w: 18, d: 32, h: 75 },
  CRAIN_DIAMOND: { w: 28, d: 28, h: 145 },
  METLIFE_PAN_AM: { w: 36, d: 24, h: 135 },
  HEARST_DIAGRID: { w: 26, d: 26, h: 130 },
  MET_LIFE_CLOCK_TOWER: { w: 20, d: 20, h: 140 },
  CITIGROUP_CENTER: { w: 28, d: 28, h: 150 },
  ROCKEFELLER_SLAB: { w: 34, d: 18, h: 155 },
  ONE_VANDERBILT: { w: 28, d: 28, h: 170 },
  HELMSLEY_PYRAMID: { w: 26, d: 26, h: 135 },
};

function chunkDistrictType(cx, cz) {
  if (cx === 0 && cz === 0) return DISTRICT_TYPE.LANDMARK;
  // Specific dedicated Heritage Colony neighbor chunks
  if ((cx === -1 && cz === 0) || (cx === 0 && cz === -1) || (cx === -1 && cz === -1)) {
    return DISTRICT_TYPE.HERITAGE_COLONY;
  }
  // Dedicated Financial Skyscraper District neighbor chunks
  if ((cx === 1 && cz === 0) || (cx === 0 && cz === 1) || (cx === 1 && cz === 1)) {
    return DISTRICT_TYPE.METROPOLIS_FINANCIAL;
  }

  const typeRoll = hash2(cx * 997, cz * 1009);
  if (typeRoll < 0.2) return DISTRICT_TYPE.HERITAGE_COLONY;
  if (typeRoll < 0.4) return DISTRICT_TYPE.METROPOLIS_FINANCIAL;
  if (typeRoll < 0.52) return DISTRICT_TYPE.LANDMARK;
  if (typeRoll < 0.64) return DISTRICT_TYPE.PARK;
  if (typeRoll < 0.82) return DISTRICT_TYPE.RESIDENTIAL;
  return DISTRICT_TYPE.COMMERCIAL;
}

// Generate pre-computed roof anchors on building creation for fast O(1) lookups
function precomputeBuildingAnchors(b) {
  const hw = b.w / 2;
  const hd = b.d / 2;
  return [
    [b.x - hw, b.z - hd, b.h],
    [b.x + hw, b.z - hd, b.h],
    [b.x - hw, b.z + hd, b.h],
    [b.x + hw, b.z + hd, b.h],
    [b.x, b.z - hd, b.h],
    [b.x, b.z + hd, b.h],
    [b.x - hw, b.z, b.h],
    [b.x + hw, b.z, b.h],
    [b.x, b.z, b.h + (b.hasAntenna ? 4 : 0)], // center peak / antenna
  ];
}

// Rich multi-scale building generation per chunk
export function buildingsForChunk(cx, cz) {
  const rand = rng([cx, cz]);
  const out = [];

  // Special spawn skyscraper for chunk (0, 0)
  if (cx === 0 && cz === 0) {
    const spawnB = {
      x: 0,
      z: 0,
      w: 26,
      d: 26,
      h: 46, // Spawn rooftop at Y=46
      colorIndex: 0,
      hasAntenna: true,
      hasWaterTower: true,
      hasHvac: true,
      hasHelipad: true,
      hasNeonCrown: true,
      sizeCategory: 'mid'
    };
    spawnB.anchors = precomputeBuildingAnchors(spawnB);
    out.push(spawnB);
  }

  const district = chunkDistrictType(cx, cz);

  if (district === DISTRICT_TYPE.PARK) {
    // Open plaza / park chunk with low street pavilions
    if (!(cx === 0 && cz === 0)) {
      const b = {
        x: cx * CHUNK_SIZE + (rand() - 0.5) * 16,
        z: cz * CHUNK_SIZE + (rand() - 0.5) * 16,
        w: 12 + rand() * 4,
        d: 12 + rand() * 4,
        h: 8 + rand() * 6,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: false,
        hasWaterTower: false,
        hasHvac: false,
        hasHelipad: false,
        hasNeonCrown: false,
        sizeCategory: 'low'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }
  } else if (district === DISTRICT_TYPE.LANDMARK) {
    // 1 Supertall Iconic Tower (140-220m) + 2 Low-rise Shops
    const superX = cx * CHUNK_SIZE + (rand() > 0.5 ? 14 : -14);
    const superZ = cz * CHUNK_SIZE + (rand() > 0.5 ? 14 : -14);

    if (!(cx === 0 && cz === 0 && Math.hypot(superX, superZ) < 22)) {
      const b = {
        x: superX,
        z: superZ,
        w: 28 + rand() * 8,
        d: 28 + rand() * 8,
        h: 140 + rand() * 80,
        colorIndex: 0,
        hasAntenna: true,
        hasWaterTower: false,
        hasHvac: true,
        hasHelipad: rand() > 0.4,
        hasNeonCrown: true,
        sizeCategory: 'supertall'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }

    const lowX = cx * CHUNK_SIZE + (superX > cx * CHUNK_SIZE ? -18 : 18);
    const lowZ = cz * CHUNK_SIZE + (superZ > cz * CHUNK_SIZE ? 18 : -18);
    if (!(cx === 0 && cz === 0 && Math.hypot(lowX, lowZ) < 22)) {
      const b = {
        x: lowX,
        z: lowZ,
        w: 16 + rand() * 5,
        d: 16 + rand() * 5,
        h: 14 + rand() * 12,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: false,
        hasWaterTower: rand() > 0.5,
        hasHvac: rand() > 0.4,
        hasHelipad: false,
        hasNeonCrown: false,
        sizeCategory: 'low'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }
  } else if (district === DISTRICT_TYPE.RESIDENTIAL) {
    // 3-4 Mid-rises & walkups (22-45m)
    const spots = [
      [cx * CHUNK_SIZE - 16, cz * CHUNK_SIZE - 16],
      [cx * CHUNK_SIZE + 16, cz * CHUNK_SIZE - 16],
      [cx * CHUNK_SIZE - 16, cz * CHUNK_SIZE + 16],
    ];
    spots.forEach(([bx, bz]) => {
      if (cx === 0 && cz === 0 && Math.hypot(bx, bz) < 22) return;
      const b = {
        x: bx + (rand() - 0.5) * 4,
        z: bz + (rand() - 0.5) * 4,
        w: 18 + rand() * 5,
        d: 18 + rand() * 5,
        h: 22 + rand() * 24,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.6,
        hasWaterTower: rand() > 0.4,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.6,
        sizeCategory: 'mid'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    });
  } else if (district === DISTRICT_TYPE.COMMERCIAL) {
    // 2 High-rise office towers (60-110m) + 1 low shop
    const tX = cx * CHUNK_SIZE - 16;
    const tZ = cz * CHUNK_SIZE - 16;
    if (!(cx === 0 && cz === 0 && Math.hypot(tX, tZ) < 22)) {
      const b = {
        x: tX,
        z: tZ,
        w: 22 + rand() * 6,
        d: 22 + rand() * 6,
        h: 65 + rand() * 45,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.4,
        hasWaterTower: false,
        hasHvac: true,
        hasHelipad: rand() > 0.5,
        hasNeonCrown: true,
        sizeCategory: 'high'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }
    const tX2 = cx * CHUNK_SIZE + 16;
    const tZ2 = cz * CHUNK_SIZE + 16;
    if (!(cx === 0 && cz === 0 && Math.hypot(tX2, tZ2) < 22)) {
      const b = {
        x: tX2,
        z: tZ2,
        w: 20 + rand() * 6,
        d: 20 + rand() * 6,
        h: 50 + rand() * 40,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.5,
        hasWaterTower: true,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.5,
        sizeCategory: 'high'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }
  } else {
    // MIXED_USE: 1 High-rise, 1 Mid-rise, 2 Low shops
    const highX = cx * CHUNK_SIZE - 16;
    const highZ = cz * CHUNK_SIZE - 16;
    if (!(cx === 0 && cz === 0 && Math.hypot(highX, highZ) < 22)) {
      const b = {
        x: highX,
        z: highZ,
        w: 22 + rand() * 6,
        d: 22 + rand() * 6,
        h: 70 + rand() * 45,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.4,
        hasWaterTower: false,
        hasHvac: true,
        hasHelipad: rand() > 0.6,
        hasNeonCrown: true,
        sizeCategory: 'high'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }

    const midX = cx * CHUNK_SIZE + 16;
    const midZ = cz * CHUNK_SIZE + 16;
    if (!(cx === 0 && cz === 0 && Math.hypot(midX, midZ) < 22)) {
      const b = {
        x: midX,
        z: midZ,
        w: 18 + rand() * 5,
        d: 18 + rand() * 5,
        h: 35 + rand() * 25,
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.5,
        hasWaterTower: true,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.5,
        sizeCategory: 'mid'
      };
      b.anchors = precomputeBuildingAnchors(b);
      out.push(b);
    }
  }

  return out;
}

// Procedural Modular Vernacular Building generation per chunk matching reference models
export function modularBuildingsForChunk(cx, cz) {
  const rand = rng([cx * 733 + 19, cz * 919 + 43]);
  const out = [];

  // Special handcrafted town layout for Spawn Chunk (0, 0)
  if (cx === 0 && cz === 0) {
    const spawnTown = [
      { type: 'BUNGALOW_PARAPET', x: -28, z: 22, rotation: 0, colorIndex: 0 },
      { type: 'HERITAGE_BALCONY_GABLE', x: 26, z: 22, rotation: 0, colorIndex: 1 },
      { type: 'STEPPED_AWNING_TOWNHOUSE', x: -26, z: -24, rotation: Math.PI, colorIndex: 2 },
      { type: 'STEPPED_OPEN_TERRACE', x: 28, z: -24, rotation: Math.PI, colorIndex: 3 },
      { type: 'FLARED_CORNICE_SHOP', x: -30, z: 0, rotation: Math.PI / 2, colorIndex: 4 },
      { type: 'ANGLED_CHAMFER_SHOP', x: 30, z: 0, rotation: -Math.PI / 2, colorIndex: 5 },
      { type: 'LONG_STRIP_SHOP', x: 0, z: -32, rotation: Math.PI, colorIndex: 0 },
      { type: 'GABLE_SLOPED_COTTAGE', x: 0, z: 32, rotation: 0, colorIndex: 1 },
      { type: 'CORNER_TWO_STORY_SHOP', x: -18, z: 32, rotation: 0, colorIndex: 2 },
      { type: 'HIP_ROOF_RESIDENCE', x: 18, z: 32, rotation: 0, colorIndex: 3 },
      { type: 'VAULTED_BARREL_ROOF', x: -18, z: -32, rotation: Math.PI, colorIndex: 4 },
      { type: 'L_SHAPED_TOWNHOUSE', x: 18, z: -32, rotation: Math.PI, colorIndex: 5 },
    ];

    for (const b of spawnTown) {
      const cfg = MODULAR_BUILDING_CONFIGS[b.type] || { w: 9, d: 9, h: 6 };
      const mb = {
        x: b.x,
        z: b.z,
        w: cfg.w,
        d: cfg.d,
        h: cfg.h,
        rotation: b.rotation,
        type: b.type,
        colorIndex: b.colorIndex,
        isModular: true,
        sizeCategory: 'modular'
      };
      mb.anchors = precomputeBuildingAnchors(mb);
      out.push(mb);
    }
    return out;
  }

  // General Procedural Placement for Other Chunks
  const district = chunkDistrictType(cx, cz);
  const count = district === DISTRICT_TYPE.RESIDENTIAL ? 7 : (district === DISTRICT_TYPE.PARK ? 4 : 5);

  const candidateSlots = [
    { x: -28, z: -28, rot: 0 },
    { x: 0, z: -28, rot: 0 },
    { x: 28, z: -28, rot: 0 },
    { x: -28, z: 0, rot: Math.PI / 2 },
    { x: 28, z: 0, rot: -Math.PI / 2 },
    { x: -28, z: 28, rot: Math.PI },
    { x: 0, z: 28, rot: Math.PI },
    { x: 28, z: 28, rot: Math.PI },
  ];

  // Shuffle slots
  for (let i = candidateSlots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidateSlots[i], candidateSlots[j]] = [candidateSlots[j], candidateSlots[i]];
  }

  const selectedSlots = candidateSlots.slice(0, count);

  for (let i = 0; i < selectedSlots.length; i++) {
    const slot = selectedSlots[i];
    const typeIdx = Math.floor(rand() * MODULAR_BUILDING_TYPES.length);
    const type = MODULAR_BUILDING_TYPES[typeIdx];
    const cfg = MODULAR_BUILDING_CONFIGS[type] || { w: 9, d: 9, h: 6 };
    const colorIdx = Math.floor(rand() * 6);

    const mb = {
      x: cx * CHUNK_SIZE + slot.x + (rand() - 0.5) * 3,
      z: cz * CHUNK_SIZE + slot.z + (rand() - 0.5) * 3,
      w: cfg.w,
      d: cfg.d,
      h: cfg.h,
      rotation: slot.rot + (rand() > 0.8 ? (Math.PI / 2) : 0),
      type,
      colorIndex: colorIdx,
      isModular: true,
      sizeCategory: 'modular'
    };
    mb.anchors = precomputeBuildingAnchors(mb);
    out.push(mb);
  }

  return out;
}

export function lampsForChunk(cx, cz) {
  const rand = rng([cx + 7777, cz - 3333]);
  const out = [];
  for (let k = 0; k < 2; k++) {
    const x = cx * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.7;
    const z = cz * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.7;
    out.push({ x, z, r: rand() * Math.PI * 2 });
  }
  return out;
}

export function hoardingsForChunk(cx, cz) {
  const rand = rng([cx - 991, cz + 553]);
  const out = [];
  const n = rand() < 0.6 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const x = cx * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.7;
    const z = cz * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.7;
    out.push({
      x,
      z,
      r: Math.floor(rand() * 4) * (Math.PI / 2),
      tint: rand(),
      y: 18 + Math.floor(rand() * 3) * 14
    });
  }
  return out;
}

// LRU Chunk Cache with max 64 chunks and timestamp tracking
const chunkCache = new Map();
const chunkAccessTime = new Map();
const MAX_CACHE_SIZE = 64;

export function getChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  let c = chunkCache.get(key);
  if (!c) {
    c = {
      cx,
      cz,
      buildings: buildingsForChunk(cx, cz),
      modularBuildings: modularBuildingsForChunk(cx, cz),
      lamps: lampsForChunk(cx, cz),
      hoardings: hoardingsForChunk(cx, cz),
    };
    chunkCache.set(key, c);
  }
  chunkAccessTime.set(key, performance.now());

  // Evict oldest if cache exceeds MAX_CACHE_SIZE
  if (chunkCache.size > MAX_CACHE_SIZE) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [k, t] of chunkAccessTime.entries()) {
      if (t < oldestTime) {
        oldestTime = t;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      chunkCache.delete(oldestKey);
      chunkAccessTime.delete(oldestKey);
    }
  }

  return c;
}

export function chunkCoordsAround(x, z, radius = VIEW_RADIUS) {
  const cx = Math.round(x / CHUNK_SIZE);
  const cz = Math.round(z / CHUNK_SIZE);
  const list = [];
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) list.push([cx + i, cz + j]);
  }
  return list;
}

export function buildingsNear(x, z, radius = 1) {
  const out = [];
  for (const [cx, cz] of chunkCoordsAround(x, z, radius)) {
    const c = getChunk(cx, cz);
    for (const b of c.buildings) out.push(b);
    if (c.modularBuildings) {
      for (const mb of c.modularBuildings) out.push(mb);
    }
  }
  return out;
}

export function modularBuildingsNear(x, z, radius = 1) {
  const out = [];
  for (const [cx, cz] of chunkCoordsAround(x, z, radius)) {
    const c = getChunk(cx, cz);
    if (c.modularBuildings) {
      for (const mb of c.modularBuildings) out.push(mb);
    }
  }
  return out;
}

// ---- Collision / query helpers (AABB based "raycasting") ----

export function insideXZ(b, x, z, pad = 0) {
  return (
    x >= b.x - b.w / 2 - pad &&
    x <= b.x + b.w / 2 + pad &&
    z >= b.z - b.d / 2 - pad &&
    z <= b.z + b.d / 2 + pad
  );
}

export function solidAt(x, y, z, pad = 0) {
  const list = buildingsNear(x, z, 1);
  for (const b of list) {
    if (y < b.h && insideXZ(b, x, z, pad)) return b;
  }
  return null;
}

// Highest support surface under a point (0 = street level).
export function groundHeightAt(x, z, maxY) {
  let best = 0;
  for (const b of buildingsNear(x, z, 1)) {
    if (insideXZ(b, x, z, 0.35) && b.h <= maxY + 1.2 && b.h > best) best = b.h;
  }
  return best;
}

// Nearest grapple anchor using pre-computed building corners
export function findAnchor(px, py, pz, dirX, dirZ, maxDist = 45) {
  let best = null;
  let bestScore = -Infinity;
  for (const b of buildingsNear(px, pz, 2)) {
    const anchors = b.anchors || precomputeBuildingAnchors(b);
    for (const [ax, az, ay] of anchors) {
      const dx = ax - px;
      const dz = az - pz;
      const dy = ay - py;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > maxDist || dist < 6) continue;
      if (dy < 2) continue; // anchors must be above the player
      const len = Math.hypot(dx, dz) || 1;
      const facing = (dx / len) * dirX + (dz / len) * dirZ;
      if (facing < 0.1) continue;
      const score = facing * 2.5 - dist / maxDist;
      if (score > bestScore) {
        bestScore = score;
        best = [ax, ay, az];
      }
    }
  }
  return best;
}

// Cone-cast along camera look vector using pre-computed building anchors
export function findAnchorLook(px, py, pz, dx, dy, dz, maxDist = 50) {
  const len = Math.hypot(dx, dy, dz) || 1;
  const lx = dx / len;
  const ly = dy / len;
  const lz = dz / len;
  let best = null;
  let bestScore = -Infinity;
  for (const b of buildingsNear(px, pz, 2)) {
    const anchors = b.anchors || precomputeBuildingAnchors(b);
    for (const [ax, az, ay] of anchors) {
      const vx = ax - px;
      const vy = ay - py;
      const vz = az - pz;
      const dist = Math.hypot(vx, vy, vz);
      if (dist > maxDist || dist < 5) continue;
      if (vy < 2.0) continue; // anchor must be above the player
      const dot = (vx * lx + vy * ly + vz * lz) / dist;
      if (dot < 0.68) continue; // cone coverage
      const score = dot * 3.5 - dist / maxDist;
      if (score > bestScore) {
        bestScore = score;
        best = [ax, ay, az];
      }
    }
  }
  return best;
}

// Top surface height of the solid occupying (x,z) below/around y, else null.
export function ledgeTopAt(x, y, z, pad = 0) {
  let best = null;
  for (const b of buildingsNear(x, z, 1)) {
    if (!insideXZ(b, x, z, pad)) continue;
    if (b.h > y && (best === null || b.h < best)) best = b.h;
    else if (b.h <= y && (best === null || b.h > best)) best = Math.max(best ?? 0, b.h);
  }
  return best;
}

// Raycast search for ledge perimeters or rooftop beams for Zip-to-Point (F / Middle Mouse)
export function findZipPointTarget(px, py, pz, dx, dy, dz, maxDist = 75) {
  const len = Math.hypot(dx, dy, dz) || 1;
  const lx = dx / len;
  const ly = dy / len;
  const lz = dz / len;
  let best = null;
  let bestScore = -Infinity;

  for (const b of buildingsNear(px, pz, 2)) {
    const anchors = b.anchors || precomputeBuildingAnchors(b);
    for (const [ax, az, ay] of anchors) {
      const vx = ax - px;
      const vy = (ay + 0.3) - py;
      const vz = az - pz;
      const dist = Math.hypot(vx, vy, vz);
      if (dist > maxDist || dist < 4) continue;
      // Allow zipping both up to ledges and across to rooftop edges
      const dot = (vx * lx + vy * ly + vz * lz) / dist;
      if (dot < 0.72) continue; // within aim cone
      const score = dot * 4.0 - (dist / maxDist) * 1.2;
      if (score > bestScore) {
        bestScore = score;
        best = [ax, ay + 0.35, az];
      }
    }
  }
  return best;
}

// Parkour vault check for waist-high obstacles in front of player
export function checkVaultObstacle(px, py, pz, dirX, dirZ, forwardDist = 1.1) {
  const checkX = px + dirX * forwardDist;
  const checkZ = pz + dirZ * forwardDist;
  const solid = solidAt(checkX, py + 0.6, checkZ, 0.15);
  if (solid) {
    const obstacleHeight = solid.h;
    const heightDiff = obstacleHeight - py;
    // Waist-high / knee-high obstacle (0.3m to 1.45m)
    if (heightDiff >= 0.3 && heightDiff <= 1.45) {
      // Check landing clearance on top / past obstacle
      const landX = px + dirX * (forwardDist + 1.2);
      const landZ = pz + dirZ * (forwardDist + 1.2);
      return {
        vaultHeight: obstacleHeight,
        targetPos: [landX, obstacleHeight + 0.05, landZ],
        obstacleX: solid.x,
        obstacleZ: solid.z
      };
    }
  }
  return null;
}

