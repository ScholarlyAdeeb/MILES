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

// Rich multi-scale building generation per chunk (Low-rise shops, mid-rises, high-rises & supertall towers)
export function buildingsForChunk(cx, cz) {
  const rand = rng([cx, cz]);
  const out = [];

  // Special spawn skyscraper for chunk (0, 0)
  if (cx === 0 && cz === 0) {
    out.push({
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
    });
  }

  // Determine chunk layout archetype (e.g. Supertall District, Mixed Commercial, Mid-rise Neighborhood)
  const chunkTypeRoll = rand();

  if (chunkTypeRoll < 0.25) {
    // ARCHETYPE A: 1 Supertall Landmark Tower (140-210m) + 2 Low-rise Shops (14-22m) + 1 Mid-rise (40-65m)
    const superX = cx * CHUNK_SIZE + (rand() > 0.5 ? 16 : -16);
    const superZ = cz * CHUNK_SIZE + (rand() > 0.5 ? 16 : -16);

    if (!(cx === 0 && cz === 0 && Math.hypot(superX, superZ) < 22)) {
      out.push({
        x: superX,
        z: superZ,
        w: 28 + rand() * 8,
        d: 28 + rand() * 8,
        h: 135 + rand() * 85, // 135m - 220m Supertall
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: true,
        hasWaterTower: false,
        hasHvac: true,
        hasHelipad: rand() > 0.4,
        hasNeonCrown: true,
        sizeCategory: 'supertall'
      });
    }

    // Mid-rise block
    const midX = cx * CHUNK_SIZE + (superX > cx * CHUNK_SIZE ? -18 : 18);
    const midZ = cz * CHUNK_SIZE + (superZ > cz * CHUNK_SIZE ? 18 : -18);
    if (!(cx === 0 && cz === 0 && Math.hypot(midX, midZ) < 22)) {
      out.push({
        x: midX,
        z: midZ,
        w: 20 + rand() * 6,
        d: 20 + rand() * 6,
        h: 42 + rand() * 25, // 42m - 67m Mid-rise
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.6,
        hasWaterTower: rand() > 0.4,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.5,
        sizeCategory: 'mid'
      });
    }

    // 2 Low-rise street commercial buildings / shops
    const lowSpots = [
      [cx * CHUNK_SIZE + (superX > cx * CHUNK_SIZE ? -20 : 20), cz * CHUNK_SIZE + (superZ > cz * CHUNK_SIZE ? -20 : 20)],
      [cx * CHUNK_SIZE + (superX > cx * CHUNK_SIZE ? 20 : -20), cz * CHUNK_SIZE + (superZ > cz * CHUNK_SIZE ? -20 : 20)]
    ];
    lowSpots.forEach(([lx, lz]) => {
      if (cx === 0 && cz === 0 && Math.hypot(lx, lz) < 22) return;
      out.push({
        x: lx + (rand() - 0.5) * 4,
        z: lz + (rand() - 0.5) * 4,
        w: 14 + rand() * 5,
        d: 14 + rand() * 5,
        h: 14 + rand() * 12, // 14m - 26m Low-rise shop
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: false,
        hasWaterTower: rand() > 0.5,
        hasHvac: rand() > 0.4,
        hasHelipad: false,
        hasNeonCrown: false,
        sizeCategory: 'low'
      });
    });

  } else if (chunkTypeRoll < 0.65) {
    // ARCHETYPE B: Diverse Mix - 1 High-Rise (75-120m), 2 Mid-Rises (35-60m), 2 Low-Rises (12-22m)
    // High-Rise in one corner
    const highX = cx * CHUNK_SIZE - 18;
    const highZ = cz * CHUNK_SIZE - 18;
    if (!(cx === 0 && cz === 0 && Math.hypot(highX, highZ) < 22)) {
      out.push({
        x: highX,
        z: highZ,
        w: 22 + rand() * 8,
        d: 22 + rand() * 8,
        h: 75 + rand() * 45, // 75m - 120m High-Rise
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.4,
        hasWaterTower: rand() > 0.6,
        hasHvac: true,
        hasHelipad: rand() > 0.5,
        hasNeonCrown: rand() > 0.3,
        sizeCategory: 'high'
      });
    }

    // Mid-Rise 1
    const mid1X = cx * CHUNK_SIZE + 18;
    const mid1Z = cz * CHUNK_SIZE - 18;
    if (!(cx === 0 && cz === 0 && Math.hypot(mid1X, mid1Z) < 22)) {
      out.push({
        x: mid1X,
        z: mid1Z,
        w: 18 + rand() * 6,
        d: 18 + rand() * 6,
        h: 38 + rand() * 24, // 38m - 62m Mid-Rise
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: rand() > 0.6,
        hasWaterTower: true,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.5,
        sizeCategory: 'mid'
      });
    }

    // Mid-Rise 2
    const mid2X = cx * CHUNK_SIZE - 18;
    const mid2Z = cz * CHUNK_SIZE + 18;
    if (!(cx === 0 && cz === 0 && Math.hypot(mid2X, mid2Z) < 22)) {
      out.push({
        x: mid2X,
        z: mid2Z,
        w: 18 + rand() * 6,
        d: 18 + rand() * 6,
        h: 32 + rand() * 20, // 32m - 52m Mid-Rise
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: false,
        hasWaterTower: rand() > 0.5,
        hasHvac: true,
        hasHelipad: false,
        hasNeonCrown: rand() > 0.6,
        sizeCategory: 'mid'
      });
    }

    // Low-Rise Shop in fourth corner
    const lowX = cx * CHUNK_SIZE + 18;
    const lowZ = cz * CHUNK_SIZE + 18;
    if (!(cx === 0 && cz === 0 && Math.hypot(lowX, lowZ) < 22)) {
      out.push({
        x: lowX,
        z: lowZ,
        w: 15 + rand() * 5,
        d: 15 + rand() * 5,
        h: 12 + rand() * 14, // 12m - 26m Low-Rise Shop
        colorIndex: Math.floor(rand() * BUILDING_PALETTES.length),
        hasAntenna: false,
        hasWaterTower: rand() > 0.4,
        hasHvac: rand() > 0.5,
        hasHelipad: false,
        hasNeonCrown: false,
        sizeCategory: 'low'
      });
    }

  } else {
    // ARCHETYPE C: 4 Structured Quad Buildings with varying heights (20m, 45m, 85m, 110m)
    const positions = [
      [-18, -18],
      [18, -18],
      [-18, 18],
      [18, 18]
    ];

    const baseHeights = [
      16 + rand() * 14,  // Low shop (16-30m)
      36 + rand() * 20,  // Mid office (36-56m)
      65 + rand() * 30,  // High-rise (65-95m)
      95 + rand() * 40   // Skyscraper (95-135m)
    ];

    positions.forEach(([ox, oz], idx) => {
      const bx = cx * CHUNK_SIZE + ox + (rand() - 0.5) * 3;
      const bz = cz * CHUNK_SIZE + oz + (rand() - 0.5) * 3;
      if (cx === 0 && cz === 0 && Math.hypot(bx, bz) < 22) return;

      const h = baseHeights[idx];
      const w = 15 + rand() * (h > 60 ? 12 : 6);
      const d = 15 + rand() * (h > 60 ? 12 : 6);
      const colorIndex = Math.floor(rand() * BUILDING_PALETTES.length);

      out.push({
        x: bx,
        z: bz,
        w,
        d,
        h,
        colorIndex,
        hasAntenna: h > 50 && rand() > 0.4,
        hasWaterTower: rand() > 0.5,
        hasHvac: rand() > 0.3,
        hasHelipad: h > 70 && rand() > 0.5,
        hasNeonCrown: h > 40 && rand() > 0.4,
        sizeCategory: h < 30 ? 'low' : h < 65 ? 'mid' : 'high'
      });
    });
  }

  return out;
}

export function lampsForChunk(cx, cz) {
  const rand = rng([cx + 7777, cz - 3333]);
  const out = [];
  for (let k = 0; k < 4; k++) {
    const x = cx * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.8;
    const z = cz * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.8;
    out.push({ x, z, r: rand() * Math.PI * 2 });
  }
  return out;
}

export function hoardingsForChunk(cx, cz) {
  const rand = rng([cx - 991, cz + 553]);
  const out = [];
  const n = rand() < 0.7 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const x = cx * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.75;
    const z = cz * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.75;
    out.push({
      x,
      z,
      r: Math.floor(rand() * 4) * (Math.PI / 2),
      tint: rand(),
      y: 18 + Math.floor(rand() * 4) * 14
    });
  }
  return out;
}

const chunkCache = new Map();

export function getChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  let c = chunkCache.get(key);
  if (!c) {
    c = {
      cx,
      cz,
      buildings: buildingsForChunk(cx, cz),
      lamps: lampsForChunk(cx, cz),
      hoardings: hoardingsForChunk(cx, cz),
    };
    chunkCache.set(key, c);
    if (chunkCache.size > 300) chunkCache.delete(chunkCache.keys().next().value);
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

// Nearest grapple anchor: rooftop corners within range, biased toward facing dir.
export function findAnchor(px, py, pz, dirX, dirZ, maxDist = 45) {
  let best = null;
  let bestScore = -Infinity;
  for (const b of buildingsNear(px, pz, 2)) {
    const hw = b.w / 2;
    const hd = b.d / 2;
    const corners = [
      [b.x - hw, b.z - hd],
      [b.x + hw, b.z - hd],
      [b.x - hw, b.z + hd],
      [b.x + hw, b.z + hd],
      [b.x, b.z],
    ];
    for (const [ax, az] of corners) {
      const ay = b.h;
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

// Cone-cast along the camera look vector for a rooftop edge anchor (max 50m).
export function findAnchorLook(px, py, pz, dx, dy, dz, maxDist = 50) {
  const len = Math.hypot(dx, dy, dz) || 1;
  const lx = dx / len;
  const ly = dy / len;
  const lz = dz / len;
  let best = null;
  let bestScore = -Infinity;
  for (const b of buildingsNear(px, pz, 2)) {
    const hw = b.w / 2;
    const hd = b.d / 2;
    const corners = [
      [b.x - hw, b.z - hd],
      [b.x + hw, b.z - hd],
      [b.x - hw, b.z + hd],
      [b.x + hw, b.z + hd],
      [b.x, b.z - hd],
      [b.x, b.z + hd],
      [b.x - hw, b.z],
      [b.x + hw, b.z],
      [b.x, b.z], // center rooftop antenna anchor
    ];
    for (const [ax, az] of corners) {
      const ay = b.h;
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
