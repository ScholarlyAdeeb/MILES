import React, { useMemo } from 'react';
import * as THREE from 'three';

// Procedural corrugated roof texture for pitched awnings and gable roofs
function createCorrugatedRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b85d43';
  ctx.fillRect(0, 0, 256, 256);

  // Vertical ridges
  const ridges = 16;
  const step = 256 / ridges;
  for (let i = 0; i < ridges; i++) {
    const x = i * step;
    ctx.fillStyle = '#d97757';
    ctx.fillRect(x, 0, step * 0.5, 256);
    ctx.fillStyle = '#8c3d27';
    ctx.fillRect(x + step * 0.5, 0, step * 0.5, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Procedural multi-pane window texture
function createWindowPaneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 128, 128);

  // Glass panes
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(6, 6, 52, 52);
  ctx.fillRect(70, 6, 52, 52);
  ctx.fillRect(6, 70, 52, 52);
  ctx.fillRect(70, 70, 52, 52);

  // Mullion grid lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 120);
  ctx.beginPath();
  ctx.moveTo(64, 4);
  ctx.lineTo(64, 124);
  ctx.moveTo(4, 64);
  ctx.lineTo(124, 64);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULAR BUILDING ARCHITECTURAL SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Standard Window with Chhajja (Sunshade Hood) and Molded Sill
export function FramedWindow({ position, rotation = [0, 0, 0], scale = [1, 1, 1], hasChhajja = true, material, trimMaterial, darkMaterial }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Outer Window Frame Molding */}
      <mesh position={[0, 0, 0.05]} castShadow receiveShadow material={trimMaterial}>
        <boxGeometry args={[1.4, 1.5, 0.16]} />
      </mesh>
      {/* Recessed Glass / Dark Interior */}
      <mesh position={[0, 0, 0.09]} material={darkMaterial}>
        <boxGeometry args={[1.1, 1.2, 0.05]} />
      </mesh>
      {/* Center Mullion Grid */}
      <mesh position={[0, 0, 0.12]} material={trimMaterial}>
        <boxGeometry args={[0.08, 1.18, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.12]} material={trimMaterial}>
        <boxGeometry args={[1.08, 0.08, 0.04]} />
      </mesh>
      {/* Bottom Sill */}
      <mesh position={[0, -0.82, 0.14]} castShadow material={trimMaterial}>
        <boxGeometry args={[1.6, 0.15, 0.28]} />
      </mesh>
      {/* Top Sunshade Chhajja Hood (Sloped Eave) */}
      {hasChhajja && (
        <mesh position={[0, 0.84, 0.22]} rotation={[0.22, 0, 0]} castShadow material={trimMaterial}>
          <boxGeometry args={[1.7, 0.12, 0.42]} />
        </mesh>
      )}
    </group>
  );
}

// Recessed Entrance Doorway with Overhead Canopy
export function EntranceDoorway({ position, rotation = [0, 0, 0], scale = [1, 1, 1], width = 1.6, height = 2.4, material, trimMaterial, darkMaterial }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Door Frame Architrave */}
      <mesh position={[0, height / 2, 0.06]} castShadow material={trimMaterial}>
        <boxGeometry args={[width + 0.35, height + 0.2, 0.16]} />
      </mesh>
      {/* Recessed Door Panel */}
      <mesh position={[0, height / 2, 0.02]} material={darkMaterial}>
        <boxGeometry args={[width, height, 0.1]} />
      </mesh>
      {/* Door Leaf Inset Panels */}
      <mesh position={[-width * 0.22, height * 0.5, 0.08]} material={trimMaterial}>
        <boxGeometry args={[width * 0.35, height * 0.75, 0.04]} />
      </mesh>
      <mesh position={[width * 0.22, height * 0.5, 0.08]} material={trimMaterial}>
        <boxGeometry args={[width * 0.35, height * 0.75, 0.04]} />
      </mesh>
      {/* Doorstep / Threshold */}
      <mesh position={[0, 0.08, 0.2]} castShadow material={trimMaterial}>
        <boxGeometry args={[width + 0.5, 0.16, 0.36]} />
      </mesh>
      {/* Over-Door Lintel Canopy Chhajja */}
      <mesh position={[0, height + 0.15, 0.25]} rotation={[0.2, 0, 0]} castShadow material={trimMaterial}>
        <boxGeometry args={[width + 0.6, 0.14, 0.48]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12 DISTINCT MODULAR BUILDING TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Model: BUNGALOW_PARAPET (Top-Left in Image 1)
 * Single-story bungalow with corner roof pillar blocks, raised plinth, 
 * multiple front chhajjas, and flat rooftop.
 */
export function BungalowParapetBuilding({ width = 12, depth = 8, height = 4.8, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Raised Plinth Foundation Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.8, 0.5, depth + 0.8]} />
      </mesh>
      {/* Main Building Body */}
      <mesh position={[0, height / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, height - 0.5, depth]} />
      </mesh>
      {/* Continuous Mid-Band Cornice */}
      <mesh position={[0, height, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.3, depth + 0.6]} />
      </mesh>
      {/* Flat Rooftop Parapet Perimeter Wall */}
      <mesh position={[0, height + 0.45, hd - 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width, 0.6, 0.24]} />
      </mesh>
      <mesh position={[0, height + 0.45, -hd + 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width, 0.6, 0.24]} />
      </mesh>
      <mesh position={[-hw + 0.1, height + 0.45, 0]} castShadow material={bodyMat}>
        <boxGeometry args={[0.24, 0.6, depth]} />
      </mesh>
      <mesh position={[hw - 0.1, height + 0.45, 0]} castShadow material={bodyMat}>
        <boxGeometry args={[0.24, 0.6, depth]} />
      </mesh>
      {/* 4 Corner & Perimeter Roof Pillar Blocks (Decorative Crenels) */}
      {[
        [-hw + 0.1, hd - 0.1],
        [hw - 0.1, hd - 0.1],
        [-hw + 0.1, -hd + 0.1],
        [hw - 0.1, -hd + 0.1],
        [-hw * 0.33, hd - 0.1],
        [hw * 0.33, hd - 0.1],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, height + 0.85, pz]} castShadow material={trimMat}>
          <boxGeometry args={[0.5, 0.45, 0.5]} />
        </mesh>
      ))}
      {/* Front Entrance Door */}
      <EntranceDoorway
        position={[0, 0.5, hd + 0.02]}
        width={1.6}
        height={2.5}
        material={bodyMat}
        trimMaterial={trimMat}
        darkMaterial={darkMat}
      />
      {/* Front Windows with Chhajjas */}
      <FramedWindow position={[-3.6, 2.3, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-1.8, 2.3, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[1.8, 2.3, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[3.6, 2.3, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.3, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 2. Model: GABLE_SLOPED_COTTAGE (Top 2nd in Image 1)
 * 1-story cottage with sloped triangular gable roof, overhanging eaves,
 * framed window with sill, entry door with awning hood.
 */
export function GableSlopedCottage({ width = 7, depth = 8, height = 6.2, bodyMat, trimMat, darkMat, roofMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const wallH = 3.6;
  const roofPeakH = height - wallH;

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.4, depth + 0.6]} />
      </mesh>
      {/* Main Rectangular Wall Body */}
      <mesh position={[0, wallH / 2 + 0.4, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, wallH, depth]} />
      </mesh>
      {/* Triangular Gable Ends (Front & Back) */}
      <mesh position={[0, wallH + 0.4 + roofPeakH / 2, hd - 0.01]} rotation={[0, 0, Math.PI / 4]} castShadow material={bodyMat}>
        <boxGeometry args={[roofPeakH * 1.414, roofPeakH * 1.414, 0.2]} />
      </mesh>
      <mesh position={[0, wallH + 0.4 + roofPeakH / 2, -hd + 0.01]} rotation={[0, 0, Math.PI / 4]} castShadow material={bodyMat}>
        <boxGeometry args={[roofPeakH * 1.414, roofPeakH * 1.414, 0.2]} />
      </mesh>
      {/* Sloped Pitched Roof Panels (Left & Right Overhang) */}
      <mesh
        position={[-hw * 0.52, wallH + 0.4 + roofPeakH * 0.52, 0]}
        rotation={[0, 0, Math.atan2(roofPeakH, hw)]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <boxGeometry args={[Math.hypot(hw, roofPeakH) + 0.8, 0.22, depth + 1.2]} />
      </mesh>
      <mesh
        position={[hw * 0.52, wallH + 0.4 + roofPeakH * 0.52, 0]}
        rotation={[0, 0, -Math.atan2(roofPeakH, hw)]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <boxGeometry args={[Math.hypot(hw, roofPeakH) + 0.8, 0.22, depth + 1.2]} />
      </mesh>
      {/* Roof Ridge Beam Cap */}
      <mesh position={[0, wallH + 0.4 + roofPeakH + 0.1, 0]} castShadow material={trimMat}>
        <boxGeometry args={[0.32, 0.2, depth + 1.25]} />
      </mesh>
      {/* Front Door with Canopy */}
      <EntranceDoorway position={[-1.4, 0.4, hd + 0.02]} width={1.4} height={2.3} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Front Window */}
      <FramedWindow position={[1.6, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 3. Model: L_SHAPED_TOWNHOUSE (Top 3rd in Image 1)
 * 2-story stepped/L-shape block with parapet roof, chhajja window hoods,
 * dual facade depths.
 */
export function LShapedTownhouse({ width = 9, depth = 10, height = 8.5, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Foundation Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main Main Body (Left Block - 2 Stories) */}
      <mesh position={[-width * 0.22, height / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width * 0.55, height - 0.5, depth]} />
      </mesh>
      {/* Recessed Right Block (2 Stories) */}
      <mesh position={[width * 0.26, height / 2 + 0.25, -depth * 0.12]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width * 0.48, height - 0.5, depth * 0.76]} />
      </mesh>
      {/* Mid-Floor Divider Cornice Band */}
      <mesh position={[0, height * 0.5, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.4, 0.25, depth + 0.4]} />
      </mesh>
      {/* Top Roof Cornice Crown */}
      <mesh position={[0, height, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.5, 0.35, depth + 0.5]} />
      </mesh>
      {/* Rooftop Parapet Border */}
      <mesh position={[-width * 0.22, height + 0.4, hd - 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width * 0.55, 0.55, 0.2]} />
      </mesh>
      <mesh position={[width * 0.26, height + 0.4, hd * 0.64]} castShadow material={bodyMat}>
        <boxGeometry args={[width * 0.48, 0.55, 0.2]} />
      </mesh>
      {/* Ground Floor Windows & Doors */}
      <EntranceDoorway position={[width * 0.26, 0.5, hd * 0.64 + 0.02]} width={1.4} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-width * 0.22, 2.2, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor Windows */}
      <FramedWindow position={[-width * 0.22, height * 0.72, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[width * 0.26, height * 0.72, hd * 0.64 + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, height * 0.72, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, height * 0.72, -depth * 0.12]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 4. Model: STEPPED_AWNING_TOWNHOUSE (Top 4th in Image 1)
 * 2-story townhouse with corrugated sloped awning over the ground floor
 * entrance and recessed upper room tower with parapet roof.
 */
export function SteppedAwningTownhouse({ width = 7, depth = 11, height = 9.2, bodyMat, trimMat, darkMat, roofMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const lowerH = 4.2;
  const upperH = height - lowerH;

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Ground Floor Extended Volume */}
      <mesh position={[0, lowerH / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, lowerH, depth]} />
      </mesh>
      {/* Sloped Corrugated Awning Over Front Half */}
      <mesh
        position={[0, lowerH + 0.6, hd * 0.42]}
        rotation={[0.42, 0, 0]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <boxGeometry args={[width + 0.8, 0.2, depth * 0.55]} />
      </mesh>
      {/* Recessed Upper Story Tower (Rear Half) */}
      <mesh position={[0, lowerH + upperH / 2 + 0.25, -depth * 0.2]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, upperH, depth * 0.6]} />
      </mesh>
      {/* Upper Story Roof Cornice */}
      <mesh position={[0, height, -depth * 0.2]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.5, 0.35, depth * 0.6 + 0.5]} />
      </mesh>
      {/* Upper Story Rooftop Parapet */}
      <mesh position={[0, height + 0.4, -depth * 0.2 + (depth * 0.3) - 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width, 0.55, 0.2]} />
      </mesh>
      {/* Ground Floor Entrance Door & Side Windows */}
      <EntranceDoorway position={[0, 0.5, hd + 0.02]} width={1.5} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 2.0, hd * 0.3]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.0, hd * 0.3]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor Front Window */}
      <FramedWindow position={[0, lowerH + upperH * 0.5, -depth * 0.2 + depth * 0.3 + 0.02]} scale={[1.3, 1.2, 1]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, lowerH + upperH * 0.5, -depth * 0.2]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, lowerH + upperH * 0.5, -depth * 0.2]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 5. Model: HERITAGE_BALCONY_GABLE (Top-Right in Image 1)
 * 2-story heritage house with corrugated/terracotta gable roof, triangular
 * pediment with circular relief emblem, cantilevered 1st-floor balcony with pillars & railing.
 */
export function HeritageBalconyGable({ width = 8, depth = 9, height = 10.4, bodyMat, trimMat, darkMat, roofMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const wallH = 7.2;
  const roofH = height - wallH;

  return (
    <group>
      {/* Plinth Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main 2-Story Body */}
      <mesh position={[0, wallH / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, wallH, depth]} />
      </mesh>
      {/* Mid-Floor Balcony Projection Slab */}
      <mesh position={[0, 3.8, hd + 0.8]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.4, 0.3, 1.8]} />
      </mesh>
      {/* Balcony Support Columns Below */}
      {[-hw + 0.4, hw - 0.4].map((px, idx) => (
        <mesh key={idx} position={[px, 1.9, hd + 1.5]} castShadow material={trimMat}>
          <cylinderGeometry args={[0.16, 0.16, 3.5, 8]} />
        </mesh>
      ))}
      {/* Balcony Railing / Balustrade Perimeter */}
      <mesh position={[0, 4.4, hd + 1.6]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.2, 0.8, 0.1]} />
      </mesh>
      <mesh position={[-hw - 0.1, 4.4, hd + 0.8]} rotation={[0, Math.PI / 2, 0]} castShadow material={trimMat}>
        <boxGeometry args={[1.6, 0.8, 0.1]} />
      </mesh>
      <mesh position={[hw + 0.1, 4.4, hd + 0.8]} rotation={[0, Math.PI / 2, 0]} castShadow material={trimMat}>
        <boxGeometry args={[1.6, 0.8, 0.1]} />
      </mesh>
      {/* Triangular Pediment / Gable Ends */}
      <mesh position={[0, wallH + 0.25 + roofH / 2, hd - 0.01]} rotation={[0, 0, Math.PI / 4]} castShadow material={bodyMat}>
        <boxGeometry args={[roofH * 1.414, roofH * 1.414, 0.2]} />
      </mesh>
      <mesh position={[0, wallH + 0.25 + roofH / 2, -hd + 0.01]} rotation={[0, 0, Math.PI / 4]} castShadow material={bodyMat}>
        <boxGeometry args={[roofH * 1.414, roofH * 1.414, 0.2]} />
      </mesh>
      {/* Front Circular Pediment Emblem / Relief Motif (Clock/Medallion) */}
      <mesh position={[0, wallH + 0.25 + roofH * 0.45, hd + 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow material={trimMat}>
        <cylinderGeometry args={[0.55, 0.55, 0.14, 16]} />
      </mesh>
      {/* Corrugated Sloped Gable Roof */}
      <mesh
        position={[-hw * 0.52, wallH + 0.25 + roofH * 0.52, 0]}
        rotation={[0, 0, Math.atan2(roofH, hw)]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <boxGeometry args={[Math.hypot(hw, roofH) + 1.0, 0.22, depth + 1.6]} />
      </mesh>
      <mesh
        position={[hw * 0.52, wallH + 0.25 + roofH * 0.52, 0]}
        rotation={[0, 0, -Math.atan2(roofH, hw)]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <boxGeometry args={[Math.hypot(hw, roofH) + 1.0, 0.22, depth + 1.6]} />
      </mesh>
      {/* Ground Floor Windows & Entrance */}
      <EntranceDoorway position={[0, 0.5, hd + 0.02]} width={1.5} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-2.2, 2.0, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[2.2, 2.0, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor French Balcony Doors & Windows */}
      <EntranceDoorway position={[0, 4.0, hd + 0.02]} width={1.6} height={2.5} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-2.2, 5.4, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[2.2, 5.4, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 5.4, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 5.4, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 6. Model: STEPPED_OPEN_TERRACE (Bottom-Left in Image 1)
 * 2-story townhouse with large front open rooftop terrace courtyard enclosed
 * by parapet wall, 2nd story rear tower with framed multi-pane windows.
 */
export function SteppedOpenTerrace({ width = 8, depth = 12, height = 8.8, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const lowerH = 4.2;
  const upperH = height - lowerH;

  return (
    <group>
      {/* Plinth Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Ground Floor Extended Footprint */}
      <mesh position={[0, lowerH / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, lowerH, depth]} />
      </mesh>
      {/* Front Rooftop Open Terrace Courtyard (Walkable with Parapet Border) */}
      <mesh position={[0, lowerH + 0.45, hd - 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width, 0.65, 0.2]} />
      </mesh>
      <mesh position={[-hw + 0.1, lowerH + 0.45, hd * 0.45]} castShadow material={bodyMat}>
        <boxGeometry args={[0.2, 0.65, depth * 0.45]} />
      </mesh>
      <mesh position={[hw - 0.1, lowerH + 0.45, hd * 0.45]} castShadow material={bodyMat}>
        <boxGeometry args={[0.2, 0.65, depth * 0.45]} />
      </mesh>
      {/* 2nd Story Set-back Tower (Rear Half) */}
      <mesh position={[0, lowerH + upperH / 2 + 0.25, -depth * 0.22]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, upperH, depth * 0.55]} />
      </mesh>
      {/* Top Roof Cornice Crown */}
      <mesh position={[0, height, -depth * 0.22]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.5, 0.35, depth * 0.55 + 0.5]} />
      </mesh>
      {/* Top Parapet */}
      <mesh position={[0, height + 0.4, -depth * 0.22 + depth * 0.275 - 0.1]} castShadow material={bodyMat}>
        <boxGeometry args={[width, 0.5, 0.2]} />
      </mesh>
      {/* Ground Floor Double Door & Symmetrical Windows */}
      <EntranceDoorway position={[0, 0.5, hd + 0.02]} width={1.8} height={2.5} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-2.4, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[2.4, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* 2nd Floor Terrace Access Door & Window Sequence */}
      <EntranceDoorway position={[-1.8, lowerH + 0.25, -depth * 0.22 + depth * 0.275 + 0.02]} width={1.4} height={2.3} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[1.8, lowerH + 1.8, -depth * 0.22 + depth * 0.275 + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, lowerH + 1.8, -depth * 0.22]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, lowerH + 1.8, -depth * 0.22]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 7. Model: FLARED_CORNICE_SHOP (Bottom 2nd in Image 1)
 * 2-story town building with signature outward flaring crown cornice,
 * large multi-pane shop window on upper floor, deep recessed entrance.
 */
export function FlaredCorniceShop({ width = 8, depth = 8, height = 8.4, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Ground Floor Main Block */}
      <mesh position={[0, 2.15, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, 3.8, depth]} />
      </mesh>
      {/* Mid-Floor Projecting Ledge Band */}
      <mesh position={[0, 4.15, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.5, 0.3, depth + 0.5]} />
      </mesh>
      {/* Upper Floor Main Block */}
      <mesh position={[0, 6.0, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, 3.4, depth]} />
      </mesh>
      {/* Signature Outward-Flared Cornice Crown (Tapered Top Molding) */}
      <mesh position={[0, height - 0.3, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.9, 0.7, depth + 0.9]} />
      </mesh>
      <mesh position={[0, height + 0.2, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 1.3, 0.35, depth + 1.3]} />
      </mesh>
      {/* Ground Floor Deep Recessed Portal Entrance */}
      <EntranceDoorway position={[0, 0.5, hd + 0.02]} width={2.2} height={2.8} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor Large Multi-Pane Showcase Window */}
      <FramedWindow position={[0, 5.8, hd + 0.02]} scale={[2.2, 1.8, 1]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.1, -1.2]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 2.1, 1.2]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.1, -1.2]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.1, 1.2]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 5.8, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[1.4, 1.4, 1]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 5.8, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.4, 1.4, 1]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 8. Model: ANGLED_CHAMFER_SHOP (Bottom 3rd Top in Image 1)
 * Hexagonal / 45-degree chamfered corner shop with diagonal entrance and faceted walls.
 */
export function AngledChamferShop({ width = 9, depth = 9, height = 5.6, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Plinth Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main Hexagonal / Chamfered Core Body */}
      <mesh position={[0, height / 2 + 0.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow material={bodyMat}>
        <cylinderGeometry args={[width * 0.56, width * 0.56, height - 0.5, 8]} />
      </mesh>
      {/* Top Roof Slab & Parapet */}
      <mesh position={[0, height, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={trimMat}>
        <cylinderGeometry args={[width * 0.6, width * 0.6, 0.4, 8]} />
      </mesh>
      {/* Angled Front Entrance Door */}
      <EntranceDoorway position={[0, 0.5, hd * 0.78]} rotation={[0, 0, 0]} width={1.6} height={2.5} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Faceted Perimeter Windows */}
      <FramedWindow position={[-hw * 0.7, 2.3, hd * 0.2]} rotation={[0, -Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw * 0.7, 2.3, hd * 0.2]} rotation={[0, Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw * 0.7, 2.3, -hd * 0.2]} rotation={[0, -3 * Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw * 0.7, 2.3, -hd * 0.2]} rotation={[0, 3 * Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 9. Model: LONG_STRIP_SHOP (Bottom 3rd Bottom in Image 1)
 * Low elongated 1-story commercial shop with flat overhanging slab roof
 * and repetitive sequence of 4 framed shop windows with deep sills.
 */
export function LongStripShop({ width = 16, depth = 7, height = 4.5, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.8, 0.5, depth + 0.8]} />
      </mesh>
      {/* Main Long Body */}
      <mesh position={[0, height / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, height - 0.5, depth]} />
      </mesh>
      {/* Overhanging Flat Roof Slab */}
      <mesh position={[0, height + 0.15, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.9, 0.35, depth + 0.9]} />
      </mesh>
      {/* Left End Recessed Entrance Door */}
      <EntranceDoorway position={[-hw + 1.8, 0.5, hd + 0.02]} width={1.5} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Sequence of 4 Framed Front Windows */}
      <FramedWindow position={[-2.4, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[0.4, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[3.2, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[6.0, 2.1, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 10. Model: CORNER_TWO_STORY_SHOP (Bottom 4th in Image 1)
 * 2-story faceted corner building with corner doorway, top parapet crown,
 * paired corner windows on both floors.
 */
export function CornerTwoStoryShop({ width = 9, depth = 9, height = 8.6, bodyMat, trimMat, darkMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main 2-Story Chamfered Body */}
      <mesh position={[0, height / 2 + 0.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow material={bodyMat}>
        <cylinderGeometry args={[width * 0.58, width * 0.58, height - 0.5, 8]} />
      </mesh>
      {/* Mid-Floor Cornice Band */}
      <mesh position={[0, height * 0.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={trimMat}>
        <cylinderGeometry args={[width * 0.62, width * 0.62, 0.28, 8]} />
      </mesh>
      {/* Top Roof Parapet Crown */}
      <mesh position={[0, height + 0.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={trimMat}>
        <cylinderGeometry args={[width * 0.64, width * 0.64, 0.45, 8]} />
      </mesh>
      {/* Ground Floor Corner Double Door */}
      <EntranceDoorway position={[0, 0.5, hd * 0.78]} width={1.8} height={2.6} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor Large Window Over Door */}
      <FramedWindow position={[0, height * 0.72, hd * 0.78 + 0.02]} scale={[1.6, 1.4, 1]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Flanking Windows on Both Floors */}
      <FramedWindow position={[-hw * 0.7, 2.2, hd * 0.2]} rotation={[0, -Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw * 0.7, 2.2, hd * 0.2]} rotation={[0, Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw * 0.7, height * 0.72, hd * 0.2]} rotation={[0, -Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw * 0.7, height * 0.72, hd * 0.2]} rotation={[0, Math.PI / 4, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 11. Model: HIP_ROOF_RESIDENCE (Bottom-Right in Image 1)
 * 2-story house with 4-sided pyramid / hip roof overhang, symmetrical double
 * windows with horizontal sill bands and chhajjas on both floors.
 */
export function HipRoofResidence({ width = 8, depth = 8, height = 9.0, bodyMat, trimMat, darkMat, roofMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const wallH = 6.8;
  const roofH = height - wallH;

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main 2-Story Wall Body */}
      <mesh position={[0, wallH / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, wallH, depth]} />
      </mesh>
      {/* Mid-Floor Continuous Sill Band */}
      <mesh position={[0, wallH * 0.5, 0]} castShadow material={trimMat}>
        <boxGeometry args={[width + 0.4, 0.2, depth + 0.4]} />
      </mesh>
      {/* 4-Sided Pyramid Hip Roof with Overhang */}
      <mesh position={[0, wallH + 0.25 + roofH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow material={roofMat || trimMat}>
        <coneGeometry args={[(width + 1.2) * 0.707, roofH, 4]} />
      </mesh>
      {/* Ground Floor Windows & Entrance */}
      <EntranceDoorway position={[0, 0.5, hd + 0.02]} width={1.5} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-2.2, 2.0, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[2.2, 2.0, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Floor Symmetrical Windows with Chhajjas */}
      <FramedWindow position={[-2.2, 5.2, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[0, 5.2, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[2.2, 5.2, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 5.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 5.2, 0]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

/**
 * 12. Model: VAULTED_BARREL_ROOF (From Image 2 Kit)
 * 1.5-story house with curved barrel vault / vaulted arched roof and framed windows.
 */
export function VaultedBarrelRoof({ width = 8, depth = 10, height = 6.5, bodyMat, trimMat, darkMat, roofMat }) {
  const hw = width / 2;
  const hd = depth / 2;
  const wallH = 3.8;
  const vaultRadius = hw + 0.4;

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={trimMat}>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
      </mesh>
      {/* Main Wall Body */}
      <mesh position={[0, wallH / 2 + 0.25, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[width, wallH, depth]} />
      </mesh>
      {/* Curved Semi-Cylindrical Barrel Vault Roof */}
      <mesh
        position={[0, wallH + 0.25, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={roofMat || trimMat}
      >
        <cylinderGeometry args={[vaultRadius, vaultRadius, depth + 1.0, 16, 1, false, 0, Math.PI]} />
      </mesh>
      {/* Front Gable Semicircle Wall Inset */}
      <mesh position={[0, wallH + 0.25, hd - 0.02]} rotation={[0, 0, 0]} castShadow material={bodyMat}>
        <circleGeometry args={[vaultRadius - 0.1, 16, 0, Math.PI]} />
      </mesh>
      {/* Entrance Door & Windows */}
      <EntranceDoorway position={[-1.5, 0.5, hd + 0.02]} width={1.5} height={2.4} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[1.8, 2.0, hd + 0.02]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Upper Semicircle Accent Window */}
      <FramedWindow position={[0, wallH + 0.9, hd + 0.02]} scale={[0.9, 0.9, 1]} hasChhajja={false} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      {/* Side Windows */}
      <FramedWindow position={[-hw - 0.02, 2.0, -1.8]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[-hw - 0.02, 2.0, 1.8]} rotation={[0, -Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.0, -1.8]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
      <FramedWindow position={[hw + 0.02, 2.0, 1.8]} rotation={[0, Math.PI / 2, 0]} material={bodyMat} trimMaterial={trimMat} darkMaterial={darkMat} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE MODULAR BUILDING DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

export const VERNACULAR_PALETTES = [
  { body: '#e2a58f', trim: '#f3e8df', dark: '#2d2522', roof: '#b85d43', name: 'Terracotta Clay' },
  { body: '#f3e8df', trim: '#cbb9aa', dark: '#242120', roof: '#c26d53', name: 'Sandstone Plaster' },
  { body: '#d79a84', trim: '#ede4dc', dark: '#2b2320', roof: '#a84c35', name: 'Warm Baked Clay' },
  { body: '#e8b796', trim: '#fdfaf6', dark: '#302824', roof: '#cf6a4b', name: 'Peach Stucco' },
  { body: '#dfa27c', trim: '#eedfd5', dark: '#28201d', roof: '#b2533b', name: 'Ochre Vernacular' },
  { body: '#c9856f', trim: '#e8ded4', dark: '#251e1c', roof: '#963f2a', name: 'Rustic Sienna' },
];

export function ModularVernacularBuilding({
  type = 'BUNGALOW_PARAPET',
  x = 0,
  y = 0,
  z = 0,
  rotation = 0,
  w = 10,
  d = 10,
  h = 6,
  colorIndex = 0,
  day = true
}) {
  const pal = VERNACULAR_PALETTES[colorIndex % VERNACULAR_PALETTES.length];

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: pal.body,
    roughness: 0.75,
    metalness: 0.05
  }), [pal.body]);

  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: pal.trim,
    roughness: 0.65,
    metalness: 0.1
  }), [pal.trim]);

  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: pal.dark,
    roughness: 0.9,
    metalness: 0.2
  }), [pal.dark]);

  const roofTexture = useMemo(() => createCorrugatedRoofTexture(), []);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: pal.roof,
    map: roofTexture,
    roughness: 0.6,
    metalness: 0.15
  }), [pal.roof, roofTexture]);

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      {type === 'BUNGALOW_PARAPET' && (
        <BungalowParapetBuilding width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'GABLE_SLOPED_COTTAGE' && (
        <GableSlopedCottage width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} roofMat={roofMat} />
      )}
      {type === 'L_SHAPED_TOWNHOUSE' && (
        <LShapedTownhouse width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'STEPPED_AWNING_TOWNHOUSE' && (
        <SteppedAwningTownhouse width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} roofMat={roofMat} />
      )}
      {type === 'HERITAGE_BALCONY_GABLE' && (
        <HeritageBalconyGable width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} roofMat={roofMat} />
      )}
      {type === 'STEPPED_OPEN_TERRACE' && (
        <SteppedOpenTerrace width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'FLARED_CORNICE_SHOP' && (
        <FlaredCorniceShop width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'ANGLED_CHAMFER_SHOP' && (
        <AngledChamferShop width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'LONG_STRIP_SHOP' && (
        <LongStripShop width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'CORNER_TWO_STORY_SHOP' && (
        <CornerTwoStoryShop width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} />
      )}
      {type === 'HIP_ROOF_RESIDENCE' && (
        <HipRoofResidence width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} roofMat={roofMat} />
      )}
      {type === 'VAULTED_BARREL_ROOF' && (
        <VaultedBarrelRoof width={w} depth={d} height={h} bodyMat={bodyMat} trimMat={trimMat} darkMat={darkMat} roofMat={roofMat} />
      )}
    </group>
  );
}

export default ModularVernacularBuilding;
