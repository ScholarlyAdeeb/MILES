import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { chunkCoordsAround, getChunk, CHUNK_SIZE, BUILDING_PALETTES } from '../../world.js';
import { player } from '../../playerState.js';
import { BillboardHoarding } from '../../BillboardHoarding.jsx';
import { AmbientRoadTraffic } from './AmbientRoadTraffic.jsx';
import { DynamicWindowLights } from './DynamicWindowLights.jsx';
import { ModularVernacularBuilding } from './ModularVernacularBuilding.jsx';

// Reusable scratch objects
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempRotation = new THREE.Euler();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();

// Procedural skyscraper window grid texture for day and night
function createWindowTexture(day = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background facade tone
  ctx.fillStyle = day ? '#e2e8f0' : '#090d16';
  ctx.fillRect(0, 0, 512, 512);

  // Concrete vertical & horizontal structural mullions
  ctx.strokeStyle = day ? '#94a3b8' : '#030712';
  ctx.lineWidth = 3;

  const cols = 16;
  const rows = 32;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > (day ? 0.45 : 0.25);
      const isSkyReflect = Math.random() > 0.4;
      const isMagenta = Math.random() > 0.85;

      const wx = c * cellW + 3;
      const wy = r * cellH + 3;
      const ww = cellW - 6;
      const wh = cellH - 5;

      if (isLit) {
        if (day) {
          ctx.fillStyle = isSkyReflect ? '#bae6fd' : '#fef08a';
        } else {
          ctx.fillStyle = isMagenta ? '#f43f5e' : (isSkyReflect ? '#38bdf8' : '#fde047');
        }
      } else {
        ctx.fillStyle = day ? '#cbd5e1' : '#03050a';
      }

      ctx.fillRect(wx, wy, ww, wh);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  return texture;
}

export function CityManager({ day = false }) {
  const [centerChunk, setCenterChunk] = useState([0, 0]);

  const windowTexture = useMemo(() => createWindowTexture(day), [day]);

  // Track player chunk coordinate for dynamic streaming
  useFrame(() => {
    const px = player.position[0];
    const pz = player.position[2];
    const cx = Math.round(px / CHUNK_SIZE);
    const cz = Math.round(pz / CHUNK_SIZE);

    if (cx !== centerChunk[0] || cz !== centerChunk[1]) {
      setCenterChunk([cx, cz]);
    }
  });

  // Query 3x3 active chunks around center
  const activeChunks = useMemo(() => {
    return chunkCoordsAround(
      centerChunk[0] * CHUNK_SIZE,
      centerChunk[1] * CHUNK_SIZE,
      1 // 3x3 grid (9 chunks)
    );
  }, [centerChunk]);

  // Aggregate all buildings of different sizes, modular vernacular houses, billboards, and rooftop features
  const { buildings, modularBuildings, hoardings, rooftopFeatures } = useMemo(() => {
    const bList = [];
    const mList = [];
    const hList = [];
    const rList = [];

    for (const [cx, cz] of activeChunks) {
      const c = getChunk(cx, cz);
      for (const b of c.buildings) {
        bList.push(b);

        // Antenna
        if (b.hasAntenna) {
          rList.push({
            type: 'antenna',
            x: b.x,
            y: b.h + 8,
            z: b.z,
            scaleY: b.h > 100 ? 22 : 14
          });
        }
        // Water tower (mostly on mid-rises and low-rises)
        if (b.hasWaterTower) {
          rList.push({
            type: 'waterTower',
            x: b.x + (b.w * 0.25),
            y: b.h + 2.5,
            z: b.z + (b.d * 0.25),
          });
        }
        // HVAC Unit
        if (b.hasHvac) {
          rList.push({
            type: 'hvac',
            x: b.x - (b.w * 0.22),
            y: b.h + 1.5,
            z: b.z - (b.d * 0.22),
            w: Math.min(6, b.w * 0.35),
            d: Math.min(5, b.d * 0.35),
            h: 2.8
          });
        }
        // Glowing Neon Roof Crown
        if (b.hasNeonCrown && !day) {
          const pal = BUILDING_PALETTES[b.colorIndex] || BUILDING_PALETTES[0];
          rList.push({
            type: 'neonCrown',
            x: b.x,
            y: b.h + 0.3,
            z: b.z,
            w: b.w + 0.3,
            d: b.d + 0.3,
            color: pal.trim
          });
        }
      }

      if (c.modularBuildings) {
        for (const mb of c.modularBuildings) {
          mList.push(mb);
        }
      }

      for (const h of c.hoardings) {
        hList.push(h);
      }
    }

    return { buildings: bList, modularBuildings: mList, hoardings: hList, rooftopFeatures: rList };
  }, [activeChunks, day]);

  // Instanced Meshes Refs
  const skyscraperInstancedRef = useRef();
  const rooftopHvacRef = useRef();
  const antennasRef = useRef();
  const neonCrownRef = useRef();

  // Populate Instanced Skyscraper Mesh
  useEffect(() => {
    if (!skyscraperInstancedRef.current) return;
    const mesh = skyscraperInstancedRef.current;
    const count = buildings.length;

    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      tempPosition.set(b.x, b.h / 2, b.z);
      tempRotation.set(0, 0, 0);
      tempScale.set(b.w, b.h, b.d);
      tempMatrix.compose(tempPosition, tempRotation, tempScale);
      mesh.setMatrixAt(i, tempMatrix);

      const pal = BUILDING_PALETTES[b.colorIndex] || BUILDING_PALETTES[0];
      if (day) {
        // Crisp daylight architectural materials (warm brick, stone, concrete, daylight glass)
        if (pal.style === 'brick') tempColor.set('#b45309');
        else if (pal.style === 'stone') tempColor.set('#64748b');
        else if (pal.style === 'concrete') tempColor.set('#475569');
        else if (pal.style === 'glass') tempColor.set('#334155');
        else tempColor.set(pal.body);
      } else {
        tempColor.set(pal.body);
      }
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [buildings, day]);

  // Update Rooftop HVAC Instanced Mesh
  useEffect(() => {
    if (!rooftopHvacRef.current) return;
    const mesh = rooftopHvacRef.current;
    const hvacs = rooftopFeatures.filter(f => f.type === 'hvac');

    for (let i = 0; i < hvacs.length; i++) {
      const h = hvacs[i];
      tempPosition.set(h.x, h.y, h.z);
      tempRotation.set(0, 0, 0);
      tempScale.set(h.w, h.h, h.d);
      tempMatrix.compose(tempPosition, tempRotation, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
      tempColor.set(day ? '#64748b' : '#334155');
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = hvacs.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [rooftopFeatures, day]);

  // Update Rooftop Antennas Instanced Mesh
  useEffect(() => {
    if (!antennasRef.current) return;
    const mesh = antennasRef.current;
    const ants = rooftopFeatures.filter(f => f.type === 'antenna');

    for (let i = 0; i < ants.length; i++) {
      const a = ants[i];
      tempPosition.set(a.x, a.y, a.z);
      tempRotation.set(0, 0, 0);
      tempScale.set(0.4, a.scaleY, 0.4);
      tempMatrix.compose(tempPosition, tempRotation, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
      tempColor.set(day ? '#ef4444' : '#f43f5e'); // Red aviation beacon
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = ants.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [rooftopFeatures, day]);

  // Update Neon Crown Trims Instanced Mesh
  useEffect(() => {
    if (!neonCrownRef.current) return;
    const mesh = neonCrownRef.current;
    const crowns = rooftopFeatures.filter(f => f.type === 'neonCrown');

    for (let i = 0; i < crowns.length; i++) {
      const c = crowns[i];
      tempPosition.set(c.x, c.y, c.z);
      tempRotation.set(0, 0, 0);
      tempScale.set(c.w, 0.6, c.d);
      tempMatrix.compose(tempPosition, tempRotation, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
      tempColor.set(c.color || '#38bdf8');
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = crowns.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [rooftopFeatures]);

  return (
    <group>
      {/* 1. Instanced Buildings of Varied Sizes with Window Grid */}
      <instancedMesh
        ref={skyscraperInstancedRef}
        args={[null, null, 240]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={windowTexture}
          roughness={day ? 0.5 : 0.4}
          metalness={day ? 0.3 : 0.6}
          emissive={day ? '#000000' : '#111827'}
          emissiveIntensity={day ? 0.0 : 0.8}
        />
      </instancedMesh>

      {/* 2. Instanced Glowing Neon Rooftop Crowns (Night only) */}
      {!day && (
        <instancedMesh
          ref={neonCrownRef}
          args={[null, null, 120]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial />
        </instancedMesh>
      )}

      {/* 3. Instanced Rooftop HVAC & Mechanical Penthouses */}
      <instancedMesh
        ref={rooftopHvacRef}
        args={[null, null, 120]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.7}
          metalness={0.3}
          color={day ? '#64748b' : '#334155'}
        />
      </instancedMesh>

      {/* 4. Instanced Rooftop Antenna Masts */}
      <instancedMesh
        ref={antennasRef}
        args={[null, null, 120]}
      >
        <cylinderGeometry args={[0.2, 0.5, 1, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </instancedMesh>

      {/* 5. Special Rooftop Spawn Helipad [ H ] on Central Tower */}
      <group position={[0, 46.05, 0]}>
        {/* Outer Yellow Warning Border */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[26, 26]} />
          <meshStandardMaterial color={day ? '#334155' : '#0f172a'} roughness={0.8} />
        </mesh>
        {/* Helipad Yellow Outer Ring */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8.5, 9.5, 32]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        {/* Helipad Center [ H ] Marker */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 7.5]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[-2.8, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 7.5]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[2.8, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 7.5]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        {/* Corner Landing Beacons */}
        {[-12, 12].map(bx => (
          [-12, 12].map(bz => (
            <mesh key={`beacon-${bx}-${bz}`} position={[bx, 0.5, bz]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshBasicMaterial color={day ? '#facc15' : '#38bdf8'} />
            </mesh>
          ))
        ))}
      </group>

      {/* 6. Modular Vernacular Indian & Asian Town Architecture Buildings (From Reference Kit) */}
      {modularBuildings.map((mb, idx) => (
        <ModularVernacularBuilding
          key={`modular-bldg-${mb.x.toFixed(1)}-${mb.z.toFixed(1)}-${idx}`}
          type={mb.type}
          x={mb.x}
          y={0}
          z={mb.z}
          w={mb.w}
          d={mb.d}
          h={mb.h}
          rotation={mb.rotation || 0}
          colorIndex={mb.colorIndex || 0}
          day={day}
        />
      ))}

      {/* 7. Emissive Animated Billboard Hoardings */}
      {hoardings.map((h, i) => (
        <BillboardHoarding
          key={`hoarding-${centerChunk[0]}-${centerChunk[1]}-${i}`}
          position={[h.x, h.y || (24 + (i % 3) * 16), h.z]}
          rotation={[0, h.r, 0]}
          tint={h.tint}
          index={i}
        />
      ))}

      {/* 8. Street Level Ground & Asphalt Grid */}
      <mesh
        position={[
          centerChunk[0] * CHUNK_SIZE,
          -0.05,
          centerChunk[1] * CHUNK_SIZE
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[CHUNK_SIZE * 3.2, CHUNK_SIZE * 3.2]} />
        <meshStandardMaterial
          color={day ? '#475569' : '#0a0e1a'}
          roughness={0.8}
        />
      </mesh>

      {/* 8. Controlled Ambient Road Traffic (1-4 cars per road avenue, no flooding) */}
      <AmbientRoadTraffic isDayMode={day} />

      {/* 9. Dynamic Skyscraper Window Point-Light System (Warm Yellow & Cool Blue with Time-of-Day Lerp) */}
      <DynamicWindowLights buildings={buildings} />
    </group>
  );
}

export default CityManager;
