import React, { useMemo } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL SHARED TEXTURES FOR SKYSCRAPERS
// ─────────────────────────────────────────────────────────────────────────────

function createModernGlassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(4, 4, 56, 56);
  ctx.fillRect(68, 4, 56, 56);
  ctx.fillRect(4, 68, 56, 56);
  ctx.fillRect(68, 68, 56, 56);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 124);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 12);
  return texture;
}

function createLimestoneArtDecoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 128, 128);

  // Vertical window slits
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(12, 10, 20, 108);
  ctx.fillRect(44, 10, 20, 108);
  ctx.fillRect(76, 10, 20, 108);
  ctx.fillRect(108, 10, 12, 108);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 10);
  return texture;
}

function createDiagridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(8, 8, 112, 112);

  // Diagonal steel cross braces
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(128, 128);
  ctx.moveTo(128, 0);
  ctx.lineTo(0, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 12);
  return texture;
}

function createClockFaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#78350f';
  ctx.stroke();

  // Clock ticks
  ctx.fillStyle = '#1e293b';
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x = 128 + Math.sin(angle) * 96;
    const y = 128 - Math.cos(angle) * 96;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clock hands (10:10)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 - 48, 128 - 48); // hour
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + 64, 128 - 64); // minute
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ONE WORLD TRADE CENTER (Freedom Tower)
// Chamfered octagonal tapering glass skyscraper with parapet ring & communication needle
// ─────────────────────────────────────────────────────────────────────────────
export function OneWorldTradeCenter({ height = 180, width = 32, depth = 32, glassMat, frameMat, spireMat }) {
  const baseH = height * 0.12;
  const towerH = height * 0.76;
  const parapetH = height * 0.04;
  const spireH = height * 0.28;

  return (
    <group>
      {/* Plinth / Podium Base (Square fortified granite base) */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={frameMat}>
        <boxGeometry args={[width, baseH, depth]} />
      </mesh>
      {/* Chamfered Octagonal Main Tower Body (Transitions from square to octagon) */}
      <mesh position={[0, baseH + towerH / 2, 0]} rotation={[0, Math.PI / 8, 0]} castShadow receiveShadow material={glassMat}>
        <cylinderGeometry args={[width * 0.36, width * 0.52, towerH, 8]} />
      </mesh>
      {/* Corner Chamfer Glass Edges */}
      <mesh position={[0, baseH + towerH / 2, 0]} castShadow material={frameMat}>
        <boxGeometry args={[width * 0.65, towerH, width * 0.65]} />
      </mesh>
      {/* Circular Rooftop Observation Ring / Parapet */}
      <mesh position={[0, baseH + towerH + parapetH / 2, 0]} castShadow material={frameMat}>
        <cylinderGeometry args={[width * 0.35, width * 0.37, parapetH, 16]} />
      </mesh>
      {/* Communication Ring Spire Base */}
      <mesh position={[0, baseH + towerH + parapetH + 3, 0]} castShadow material={spireMat}>
        <cylinderGeometry args={[width * 0.22, width * 0.25, 6, 16]} />
      </mesh>
      {/* Communication Spire Needle Antenna */}
      <mesh position={[0, baseH + towerH + parapetH + spireH / 2 + 6, 0]} castShadow material={spireMat}>
        <cylinderGeometry args={[0.35, 1.8, spireH, 8]} />
      </mesh>
      {/* Spire Beacon Light Tip */}
      <mesh position={[0, baseH + towerH + parapetH + spireH + 6, 0]} material={spireMat}>
        <sphereGeometry args={[0.8, 8, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHRYSLER BUILDING
// Art Deco masterpiece with sunburst terraced arches & stainless steel needle
// ─────────────────────────────────────────────────────────────────────────────
export function ChryslerBuilding({ height = 165, width = 30, depth = 30, stoneMat, metalMat, spireMat }) {
  const baseH = height * 0.35;
  const midH = height * 0.32;
  const towerH = height * 0.16;
  const crownH = height * 0.17;
  const spireH = height * 0.22;

  return (
    <group>
      {/* Base Tower Section with Ground Setbacks */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width, baseH, depth]} />
      </mesh>
      {/* First Setback Tier */}
      <mesh position={[0, baseH + midH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.78, midH, depth * 0.78]} />
      </mesh>
      {/* 4 Corner Gargoyle Eagles at Tier 1 */}
      {[
        [-width * 0.38, depth * 0.38],
        [width * 0.38, depth * 0.38],
        [-width * 0.38, -depth * 0.38],
        [width * 0.38, -depth * 0.38],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, baseH + 1.2, pz]} castShadow material={metalMat}>
          <boxGeometry args={[2.4, 2.2, 2.4]} />
        </mesh>
      ))}
      {/* Upper Shaft Tower */}
      <mesh position={[0, baseH + midH + towerH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.6, towerH, depth * 0.6]} />
      </mesh>
      {/* 6 Terraced Art Deco Sunburst Arches (The Iconic Crown) */}
      {[0.54, 0.46, 0.38, 0.3, 0.22, 0.14].map((scale, i) => (
        <group key={i} position={[0, baseH + midH + towerH + i * (crownH / 6) + 1.5, 0]}>
          <mesh castShadow material={metalMat}>
            <cylinderGeometry args={[width * scale * 0.8, width * scale, crownH / 6 + 0.5, 16]} />
          </mesh>
        </group>
      ))}
      {/* Stainless Steel Needle Spire */}
      <mesh position={[0, baseH + midH + towerH + crownH + spireH / 2, 0]} castShadow material={spireMat}>
        <cylinderGeometry args={[0.2, 1.2, spireH, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMPIRE STATE BUILDING
// Iconic stepped Art Deco skyscraper with multiple setbacks & observation mast
// ─────────────────────────────────────────────────────────────────────────────
export function EmpireStateBuilding({ height = 190, width = 34, depth = 34, stoneMat, metalMat, spireMat }) {
  const baseH = height * 0.15;
  const tier1H = height * 0.28;
  const tier2H = height * 0.25;
  const tier3H = height * 0.16;
  const mastH = height * 0.12;
  const spireH = height * 0.18;

  return (
    <group>
      {/* Base Podium Section */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width, baseH, depth]} />
      </mesh>
      {/* Main Lower Shaft (Tier 1 Setback) */}
      <mesh position={[0, baseH + tier1H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.82, tier1H, depth * 0.82]} />
      </mesh>
      {/* Mid Shaft (Tier 2 Setback) */}
      <mesh position={[0, baseH + tier1H + tier2H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.65, tier2H, depth * 0.65]} />
      </mesh>
      {/* Upper Shaft (Tier 3 Setback - 86th Floor Observation Deck) */}
      <mesh position={[0, baseH + tier1H + tier2H + tier3H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.48, tier3H, depth * 0.48]} />
      </mesh>
      {/* 86th Floor Outdoor Promenade Balcony */}
      <mesh position={[0, baseH + tier1H + tier2H + tier3H, 0]} castShadow material={metalMat}>
        <boxGeometry args={[width * 0.52, 1.2, depth * 0.52]} />
      </mesh>
      {/* 102nd Floor Mooring Mast Tower */}
      <mesh position={[0, baseH + tier1H + tier2H + tier3H + mastH / 2, 0]} castShadow material={metalMat}>
        <cylinderGeometry args={[width * 0.18, width * 0.28, mastH, 12]} />
      </mesh>
      {/* Broadcast Antenna Needle Spire */}
      <mesh position={[0, baseH + tier1H + tier2H + tier3H + mastH + spireH / 2, 0]} castShadow material={spireMat}>
        <cylinderGeometry args={[0.3, 1.4, spireH, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FLATIRON BUILDING
// Triangular wedge shape with rusticated stone base & rounded prow
// ─────────────────────────────────────────────────────────────────────────────
export function FlatironBuilding({ height = 75, width = 16, depth = 32, stoneMat, trimMat }) {
  // Triangular wedge shape
  const wedgeShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, depth / 2); // rounded prow point
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(-width / 2, -depth / 2);
    shape.closePath();
    return shape;
  }, [width, depth]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.8,
    bevelSegments: 3,
  }), [height]);

  return (
    <group>
      {/* Extruded Triangular Wedge Tower */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow material={stoneMat}>
        <extrudeGeometry args={[wedgeShape, extrudeSettings]} />
      </mesh>
      {/* Rusticated Base Cornice Belt */}
      <mesh position={[0, 10, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow material={trimMat}>
        <extrudeGeometry args={[wedgeShape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4 }]} />
      </mesh>
      {/* Mid-Tower Decorative Cornice */}
      <mesh position={[0, 42, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow material={trimMat}>
        <extrudeGeometry args={[wedgeShape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4 }]} />
      </mesh>
      {/* Rooftop Classical Cornice Crown & Balustrade */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow material={trimMat}>
        <extrudeGeometry args={[wedgeShape, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8 }]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CRAIN COMMUNICATIONS / SMURFIT DIAMOND TOWER
// Tower with 45-degree sliced diamond roof crown & diamond mullions
// ─────────────────────────────────────────────────────────────────────────────
export function CrainDiamondTower({ height = 145, width = 28, depth = 28, glassMat, frameMat }) {
  const shaftH = height * 0.72;
  const crownH = height * 0.28;

  return (
    <group>
      {/* Main Rectangular Tower Shaft */}
      <mesh position={[0, shaftH / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width, shaftH, depth]} />
      </mesh>
      {/* White Corner Vertical Accent Columns */}
      {[-width / 2, width / 2].map((px, i) =>
        [-depth / 2, depth / 2].map((pz, j) => (
          <mesh key={`${i}-${j}`} position={[px, shaftH / 2, pz]} castShadow material={frameMat}>
            <boxGeometry args={[1.2, shaftH, 1.2]} />
          </mesh>
        ))
      )}
      {/* 45-Degree Sliced Diamond Roof Crown */}
      <group position={[0, shaftH, 0]}>
        <mesh position={[0, crownH / 2, 0]} rotation={[0.42, 0, 0]} castShadow receiveShadow material={glassMat}>
          <boxGeometry args={[width * 0.98, crownH * 1.3, depth * 0.7]} />
        </mesh>
        {/* Diamond Crown Perimeter Frame */}
        <mesh position={[0, crownH / 2, 0]} rotation={[0.42, 0, 0]} castShadow material={frameMat}>
          <boxGeometry args={[width * 1.02, crownH * 1.32, 1.5]} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. METLIFE BUILDING (Pan Am Octagonal Tower)
// Massive octagonal faceted skyscraper slab with mid-level cantilevers
// ─────────────────────────────────────────────────────────────────────────────
export function MetLifePanAmTower({ height = 135, width = 36, depth = 24, glassMat, concreteMat, trimMat }) {
  const baseH = height * 0.15;
  const lowerH = height * 0.42;
  const upperH = height * 0.38;

  return (
    <group>
      {/* Broad Podium Base */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={concreteMat}>
        <boxGeometry args={[width * 1.15, baseH, depth * 1.25]} />
      </mesh>
      {/* Lower Octagonal Chamfered Slab */}
      <mesh position={[0, baseH + lowerH / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width, lowerH, depth]} />
      </mesh>
      {/* 4 Corner Chamfer Panels */}
      {[-width / 2, width / 2].map((px, i) => (
        <mesh key={i} position={[px, baseH + lowerH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={concreteMat}>
          <boxGeometry args={[depth * 0.4, lowerH, 1.5]} />
        </mesh>
      ))}
      {/* Heavy Cantilevered Mid-Mechanical Band */}
      <mesh position={[0, baseH + lowerH + 1.5, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width * 1.05, 3.2, depth * 1.05]} />
      </mesh>
      {/* Upper Octagonal Slab */}
      <mesh position={[0, baseH + lowerH + 3.2 + upperH / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width * 0.94, upperH, depth * 0.94]} />
      </mesh>
      {/* Rooftop Heavy Cantilevered Roof Parapet Slab & Helipad Frame */}
      <mesh position={[0, height - 1.5, 0]} castShadow material={concreteMat}>
        <boxGeometry args={[width * 1.06, 3.0, depth * 1.06]} />
      </mesh>
      {/* MetLife Logo Sign Bulkhead Band */}
      <mesh position={[0, height + 1.5, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width * 0.6, 2.2, depth * 0.5]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. HEARST TOWER (Diagrid Structural Cage)
// Classical stone base with shimmering triangular diagrid lattice facade
// ─────────────────────────────────────────────────────────────────────────────
export function HearstDiagridTower({ height = 130, width = 26, depth = 26, diagridMat, stoneMat, trimMat }) {
  const baseH = height * 0.22;
  const towerH = height * 0.78;

  return (
    <group>
      {/* 1920s Landmark Classical Stone Base with Fluted Columns */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 1.15, baseH, depth * 1.15]} />
      </mesh>
      {/* Stone Cornice Belt */}
      <mesh position={[0, baseH, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width * 1.22, 1.8, depth * 1.22]} />
      </mesh>
      {/* Shimmering Steel Diagrid Skyscraper Shaft */}
      <mesh position={[0, baseH + towerH / 2, 0]} castShadow receiveShadow material={diagridMat}>
        <boxGeometry args={[width, towerH, depth]} />
      </mesh>
      {/* Corner Inverted Chamfer Notches (Birdsmouth corners) */}
      {[-width / 2, width / 2].map((px, i) =>
        [-depth / 2, depth / 2].map((pz, j) => (
          <mesh key={`${i}-${j}`} position={[px, baseH + towerH / 2, pz]} rotation={[0, Math.PI / 4, 0]} castShadow material={trimMat}>
            <boxGeometry args={[2.5, towerH, 2.5]} />
          </mesh>
        ))
      )}
      {/* Rooftop Parapet Ring */}
      <mesh position={[0, height + 0.8, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 1.8, depth + 0.6]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. METROPOLITAN LIFE CLOCK TOWER
// Italianate campanile clock tower with 4 clock dials, pyramid roof & gold cupola
// ─────────────────────────────────────────────────────────────────────────────
export function MetLifeClockTower({ height = 140, width = 20, depth = 20, stoneMat, roofMat, clockMat, goldMat }) {
  const shaftH = height * 0.68;
  const clockH = height * 0.12;
  const belfryH = height * 0.08;
  const pyramidH = height * 0.12;

  return (
    <group>
      {/* Main Limestone Campanile Shaft */}
      <mesh position={[0, shaftH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width, shaftH, depth]} />
      </mesh>
      {/* Clock Chamber Section */}
      <mesh position={[0, shaftH + clockH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 1.05, clockH, depth * 1.05]} />
      </mesh>
      {/* 4 Illuminated Clock Dials (North, South, East, West) */}
      <mesh position={[0, shaftH + clockH / 2, depth * 0.525 + 0.1]} material={clockMat}>
        <circleGeometry args={[width * 0.34, 24]} />
      </mesh>
      <mesh position={[0, shaftH + clockH / 2, -depth * 0.525 - 0.1]} rotation={[0, Math.PI, 0]} material={clockMat}>
        <circleGeometry args={[width * 0.34, 24]} />
      </mesh>
      <mesh position={[width * 0.525 + 0.1, shaftH + clockH / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={clockMat}>
        <circleGeometry args={[width * 0.34, 24]} />
      </mesh>
      <mesh position={[-width * 0.525 - 0.1, shaftH + clockH / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockMat}>
        <circleGeometry args={[width * 0.34, 24]} />
      </mesh>
      {/* Arched Belfry Colonade Chamber */}
      <mesh position={[0, shaftH + clockH + belfryH / 2, 0]} castShadow material={stoneMat}>
        <boxGeometry args={[width * 0.88, belfryH, depth * 0.88]} />
      </mesh>
      {/* Pyramidal Copper Roof */}
      <mesh position={[0, shaftH + clockH + belfryH + pyramidH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={roofMat}>
        <coneGeometry args={[width * 0.65, pyramidH, 4]} />
      </mesh>
      {/* Golden Lantern Cupola Spire */}
      <mesh position={[0, shaftH + clockH + belfryH + pyramidH + 2.5, 0]} castShadow material={goldMat}>
        <cylinderGeometry args={[1.2, 1.8, 5, 8]} />
      </mesh>
      <mesh position={[0, shaftH + clockH + belfryH + pyramidH + 6.5, 0]} castShadow material={goldMat}>
        <sphereGeometry args={[1.4, 8, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. CITIGROUP CENTER (Slanted Wedge Roof on Stilt Columns)
// 45-degree slanted roof crown atop 9-story cantilevered stilt base
// ─────────────────────────────────────────────────────────────────────────────
export function CitigroupCenter({ height = 150, width = 28, depth = 28, whiteMat, glassMat }) {
  const stiltH = height * 0.14;
  const shaftH = height * 0.62;
  const crownH = height * 0.24;

  return (
    <group>
      {/* 4 Massive Center-Stilt Base Columns (Cantilevered corner design) */}
      {[
        [0, depth / 2 - 2],
        [0, -depth / 2 + 2],
        [width / 2 - 2, 0],
        [-width / 2 + 2, 0],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, stiltH / 2, pz]} castShadow material={whiteMat}>
          <boxGeometry args={[6, stiltH, 6]} />
        </mesh>
      ))}
      {/* Recessed Glass Core at Ground */}
      <mesh position={[0, stiltH / 2, 0]} material={glassMat}>
        <boxGeometry args={[width * 0.45, stiltH, depth * 0.45]} />
      </mesh>
      {/* Main Tower Box Shaft (Sleek horizontal ribbon facade) */}
      <mesh position={[0, stiltH + shaftH / 2, 0]} castShadow receiveShadow material={whiteMat}>
        <boxGeometry args={[width, shaftH, depth]} />
      </mesh>
      {/* Signature 45-Degree Slanted Triangular Wedge Roof Crown */}
      <group position={[0, stiltH + shaftH, 0]}>
        <mesh position={[0, crownH / 2, 0]} rotation={[0.48, 0, 0]} castShadow receiveShadow material={whiteMat}>
          <boxGeometry args={[width * 0.98, crownH * 1.38, depth * 0.75]} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. 30 ROCKEFELLER PLAZA (GE Building / Art Deco Stepped Slab)
// Cascading rhythmic vertical setbacks with slender profile
// ─────────────────────────────────────────────────────────────────────────────
export function RockefellerSlabTower({ height = 155, width = 34, depth = 18, stoneMat, trimMat }) {
  const tier1H = height * 0.35;
  const tier2H = height * 0.28;
  const tier3H = height * 0.22;
  const tier4H = height * 0.15;

  return (
    <group>
      {/* Base Slab */}
      <mesh position={[0, tier1H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width, tier1H, depth]} />
      </mesh>
      {/* Setback 1 */}
      <mesh position={[0, tier1H + tier2H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.82, tier2H, depth * 0.9]} />
      </mesh>
      {/* Setback 2 */}
      <mesh position={[0, tier1H + tier2H + tier3H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.64, tier3H, depth * 0.82]} />
      </mesh>
      {/* Setback 3 (Top Observation Deck "Top of the Rock") */}
      <mesh position={[0, tier1H + tier2H + tier3H + tier4H / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.46, tier4H, depth * 0.72]} />
      </mesh>
      {/* Rooftop Parapet & Central Pylon */}
      <mesh position={[0, height + 1.5, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width * 0.32, 3, depth * 0.5]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. ONE VANDERBILT / MODERN CRYSTALLINE SPIRE TOWER
// Multi-tier angled modern glass setbacks with illuminated spire
// ─────────────────────────────────────────────────────────────────────────────
export function OneVanderbiltTower({ height = 170, width = 28, depth = 28, glassMat, metalMat, spireMat }) {
  const tier1H = height * 0.42;
  const tier2H = height * 0.28;
  const tier3H = height * 0.2;
  const crownH = height * 0.1;
  const spireH = height * 0.24;

  return (
    <group>
      {/* Tier 1 Lower Glass Volume */}
      <mesh position={[0, tier1H / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width, tier1H, depth]} />
      </mesh>
      {/* Tier 2 Angled Setback */}
      <mesh position={[0, tier1H + tier2H / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width * 0.8, tier2H, depth * 0.8]} />
      </mesh>
      {/* Tier 3 Angled Setback */}
      <mesh position={[0, tier1H + tier2H + tier3H / 2, 0]} castShadow receiveShadow material={glassMat}>
        <boxGeometry args={[width * 0.6, tier3H, depth * 0.6]} />
      </mesh>
      {/* Crown Sloped Blade Parapet */}
      <mesh position={[0, tier1H + tier2H + tier3H + crownH / 2, 0]} rotation={[0.2, 0, 0]} castShadow material={metalMat}>
        <boxGeometry args={[width * 0.42, crownH, depth * 0.42]} />
      </mesh>
      {/* Tapering Spire Antenna */}
      <mesh position={[0, height + spireH / 2, 0]} castShadow material={spireMat}>
        <cylinderGeometry args={[0.25, 1.2, spireH, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. HELMSLEY BUILDING (Gothic / Beaux-Arts Green Pyramid Tower)
// Terraced classical tower with copper green pyramid roof and gilded cupola
// ─────────────────────────────────────────────────────────────────────────────
export function HelmsleyPyramidTower({ height = 135, width = 26, depth = 26, stoneMat, roofMat, goldMat }) {
  const baseH = height * 0.4;
  const midH = height * 0.32;
  const topH = height * 0.16;
  const roofH = height * 0.12;

  return (
    <group>
      {/* Base Podium & Main Shaft */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width, baseH, depth]} />
      </mesh>
      {/* Mid Tower Setback */}
      <mesh position={[0, baseH + midH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.78, midH, depth * 0.78]} />
      </mesh>
      {/* Upper Tower Setback */}
      <mesh position={[0, baseH + midH + topH / 2, 0]} castShadow receiveShadow material={stoneMat}>
        <boxGeometry args={[width * 0.58, topH, depth * 0.58]} />
      </mesh>
      {/* Green Copper Steep Pyramid Roof */}
      <mesh position={[0, baseH + midH + topH + roofH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={roofMat}>
        <coneGeometry args={[width * 0.48, roofH, 4]} />
      </mesh>
      {/* Gilded Golden Cupola Spire */}
      <mesh position={[0, baseH + midH + topH + roofH + 2.5, 0]} castShadow material={goldMat}>
        <cylinderGeometry args={[1.0, 1.5, 5, 8]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ICONIC SKYSCRAPER COMPONENT DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

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

export function IconicSkyscraper({
  type = 'ONE_WORLD_TRADE',
  x = 0,
  y = 0,
  z = 0,
  rotation = 0,
  w = 30,
  d = 30,
  h = 160,
  day = true
}) {
  const glassTexture = useMemo(() => createModernGlassTexture(), []);
  const limestoneTexture = useMemo(() => createLimestoneArtDecoTexture(), []);
  const diagridTexture = useMemo(() => createDiagridTexture(), []);
  const clockTexture = useMemo(() => createClockFaceTexture(), []);

  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    map: glassTexture,
    roughness: 0.2,
    metalness: 0.85
  }), [glassTexture]);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.5,
    metalness: 0.5
  }), []);

  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    map: limestoneTexture,
    roughness: 0.8,
    metalness: 0.1
  }), [limestoneTexture]);

  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.6,
    metalness: 0.3
  }), []);

  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.3,
    metalness: 0.95
  }), []);

  const spireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.2,
    metalness: 0.95
  }), []);

  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.85,
    metalness: 0.1
  }), []);

  const diagridMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    map: diagridTexture,
    roughness: 0.3,
    metalness: 0.8
  }), [diagridTexture]);

  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#22c55e', // Oxidized green copper
    roughness: 0.6,
    metalness: 0.3
  }), []);

  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#eab308', // Gilded Gold
    roughness: 0.3,
    metalness: 0.9
  }), []);

  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.4,
    metalness: 0.4
  }), []);

  const clockMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: clockTexture,
  }), [clockTexture]);

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      {type === 'ONE_WORLD_TRADE' && (
        <OneWorldTradeCenter height={h} width={w} depth={d} glassMat={glassMat} frameMat={frameMat} spireMat={spireMat} />
      )}
      {type === 'CHRYSLER_BUILDING' && (
        <ChryslerBuilding height={h} width={w} depth={d} stoneMat={stoneMat} metalMat={metalMat} spireMat={spireMat} />
      )}
      {type === 'EMPIRE_STATE_BUILDING' && (
        <EmpireStateBuilding height={h} width={w} depth={d} stoneMat={stoneMat} metalMat={metalMat} spireMat={spireMat} />
      )}
      {type === 'FLATIRON_BUILDING' && (
        <FlatironBuilding height={h} width={w} depth={d} stoneMat={stoneMat} trimMat={trimMat} />
      )}
      {type === 'CRAIN_DIAMOND' && (
        <CrainDiamondTower height={h} width={w} depth={d} glassMat={glassMat} frameMat={frameMat} />
      )}
      {type === 'METLIFE_PAN_AM' && (
        <MetLifePanAmTower height={h} width={w} depth={d} glassMat={glassMat} concreteMat={concreteMat} trimMat={trimMat} />
      )}
      {type === 'HEARST_DIAGRID' && (
        <HearstDiagridTower height={h} width={w} depth={d} diagridMat={diagridMat} stoneMat={stoneMat} trimMat={trimMat} />
      )}
      {type === 'MET_LIFE_CLOCK_TOWER' && (
        <MetLifeClockTower height={h} width={w} depth={d} stoneMat={stoneMat} roofMat={roofMat} clockMat={clockMat} goldMat={goldMat} />
      )}
      {type === 'CITIGROUP_CENTER' && (
        <CitigroupCenter height={h} width={w} depth={d} whiteMat={whiteMat} glassMat={glassMat} />
      )}
      {type === 'ROCKEFELLER_SLAB' && (
        <RockefellerSlabTower height={h} width={w} depth={d} stoneMat={stoneMat} trimMat={trimMat} />
      )}
      {type === 'ONE_VANDERBILT' && (
        <OneVanderbiltTower height={h} width={w} depth={d} glassMat={glassMat} metalMat={metalMat} spireMat={spireMat} />
      )}
      {type === 'HELMSLEY_PYRAMID' && (
        <HelmsleyPyramidTower height={h} width={w} depth={d} stoneMat={stoneMat} roofMat={roofMat} goldMat={goldMat} />
      )}
    </group>
  );
}

export default IconicSkyscraper;
