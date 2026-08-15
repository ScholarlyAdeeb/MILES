import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';
import { timeOfDayState, computeAtmosphere } from '../../timeOfDayState.js';

// Contrast color palette: Warm Yellows vs Cool Blues
const WARM_YELLOW_COLORS = [
  new THREE.Color('#fef08a'), // Soft bright yellow
  new THREE.Color('#fde047'), // Vibrant warm gold
  new THREE.Color('#fbbf24'), // Amber yellow
  new THREE.Color('#f59e0b'), // Deep warm orange-yellow
];

const COOL_BLUE_COLORS = [
  new THREE.Color('#38bdf8'), // Electric cyan blue
  new THREE.Color('#60a5fa'), // Neon cobalt blue
  new THREE.Color('#06b6d4'), // Cyber turquoise
  new THREE.Color('#818cf8'), // Electric indigo
];

// Dusk-specific golden amber tones
const DUSK_GOLD_COLORS = [
  new THREE.Color('#fed7aa'), // Warm peach amber
  new THREE.Color('#fde047'), // Warm gold
  new THREE.Color('#f97316'), // Sunset orange
  new THREE.Color('#fbbf24'), // Amber
];

const LIGHT_POOL_SIZE = 10; // Number of real-time hardware dynamic point lights

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempRotation = new THREE.Euler();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();

export function DynamicWindowLights({ buildings = [] }) {
  const lightRefs = useRef([]);
  const fixturesInstancedRef = useRef();

  // 1. Generate all window anchor positions across active skyscrapers
  const windowNodes = useMemo(() => {
    const nodes = [];
    let id = 0;

    for (const b of buildings) {
      const hw = b.w / 2;
      const hd = b.d / 2;
      const floorSpacing = 9.0;
      const numFloors = Math.floor((b.h - 8) / floorSpacing);

      for (let f = 1; f <= numFloors; f++) {
        const wy = f * floorSpacing + 2.0;

        // Add window light nodes per face of the skyscraper
        const countPerSide = Math.max(2, Math.floor(Math.min(b.w, b.d) / 8));

        for (let i = 0; i < countPerSide; i++) {
          const t = (i + 0.5) / countPerSide - 0.5;
          const isWarm = (id % 2 === 0) || ((id * 7) % 3 === 0);

          // Face 1: +X (East)
          nodes.push({
            id: id++,
            pos: [b.x + hw + 0.25, wy, b.z + t * (b.d * 0.75)],
            normal: [1, 0, 0],
            isWarm,
            baseIntensity: isWarm ? 3.8 : 4.2
          });

          // Face 2: -X (West)
          nodes.push({
            id: id++,
            pos: [b.x - hw - 0.25, wy, b.z + t * (b.d * 0.75)],
            normal: [-1, 0, 0],
            isWarm,
            baseIntensity: isWarm ? 3.8 : 4.2
          });

          // Face 3: +Z (South)
          nodes.push({
            id: id++,
            pos: [b.x + t * (b.w * 0.75), wy, b.z + hd + 0.25],
            normal: [0, 0, 1],
            isWarm,
            baseIntensity: isWarm ? 3.8 : 4.2
          });

          // Face 4: -Z (North)
          nodes.push({
            id: id++,
            pos: [b.x + t * (b.w * 0.75), wy, b.z - hd - 0.25],
            normal: [0, 0, -1],
            isWarm,
            baseIntensity: isWarm ? 3.8 : 4.2
          });
        }
      }
    }

    return nodes;
  }, [buildings]);

  // 2. Setup Instanced Window Luminaire Fixtures (Visual glow nodes on facade)
  useEffect(() => {
    if (!fixturesInstancedRef.current) return;
    const mesh = fixturesInstancedRef.current;
    const count = windowNodes.length;

    for (let i = 0; i < count; i++) {
      const node = windowNodes[i];
      tempPosition.set(node.pos[0], node.pos[1], node.pos[2]);

      // Align fixture orientation with facade normal
      if (Math.abs(node.normal[0]) > 0.5) {
        tempRotation.set(0, Math.PI / 2, 0);
        tempScale.set(0.2, 1.4, 2.2);
      } else {
        tempRotation.set(0, 0, 0);
        tempScale.set(2.2, 1.4, 0.2);
      }

      tempMatrix.compose(tempPosition, tempRotation, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
      const color = node.isWarm ? WARM_YELLOW_COLORS[node.id % WARM_YELLOW_COLORS.length] : COOL_BLUE_COLORS[node.id % COOL_BLUE_COLORS.length];
      mesh.setColorAt(i, color);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [windowNodes]);

  // Track target positions and properties for the dynamic hardware point-light pool
  const lightTargets = useMemo(() => {
    return Array.from({ length: LIGHT_POOL_SIZE }, (_, i) => ({
      currentPos: new THREE.Vector3(0, 30, 0),
      targetPos: new THREE.Vector3(0, 30, 0),
      color: new THREE.Color(),
      intensity: 0,
      targetIntensity: 0,
      phase: i * 1.37
    }));
  }, []);

  // 3. Dynamic Proximity Light Attachment Loop with Time-Of-Day Transitions
  useFrame((state, delta) => {
    const atmo = computeAtmosphere(timeOfDayState.currentT);
    const px = player.position[0];
    const py = player.position[1];
    const pz = player.position[2];
    const time = state.clock.getElapsedTime();
    const timeT = atmo.t; // 0.0 (Dusk) -> 1.0 (Deep Night)

    // Update Instanced Fixture colors/intensities based on time of day (warm amber dusk vs cyber night)
    if (fixturesInstancedRef.current && fixturesInstancedRef.current.instanceColor) {
      // Throttle full buffer re-color
      if (!state.lastWindowRecolorT || Math.abs(state.lastWindowRecolorT - timeT) > 0.08) {
        state.lastWindowRecolorT = timeT;
        const mesh = fixturesInstancedRef.current;
        for (let i = 0; i < Math.min(mesh.count, windowNodes.length); i++) {
          const node = windowNodes[i];
          let c;
          if (timeT < 0.35) {
            // Dusk: heavily biased to warm gold/amber
            c = node.isWarm 
              ? DUSK_GOLD_COLORS[node.id % DUSK_GOLD_COLORS.length] 
              : WARM_YELLOW_COLORS[node.id % WARM_YELLOW_COLORS.length];
          } else {
            // Night & Deep Night: high-contrast warm yellow vs cool blue
            c = node.isWarm 
              ? WARM_YELLOW_COLORS[node.id % WARM_YELLOW_COLORS.length] 
              : COOL_BLUE_COLORS[node.id % COOL_BLUE_COLORS.length];
          }
          mesh.setColorAt(i, c);
        }
        mesh.instanceColor.needsUpdate = true;
      }
    }

    // Find the closest window light nodes to the player
    const sorted = [...windowNodes]
      .map(n => {
        const dx = n.pos[0] - px;
        const dy = n.pos[1] - (py + 2);
        const dz = n.pos[2] - pz;
        const distSq = dx * dx + dy * dy + dz * dz;
        return { node: n, distSq };
      })
      .filter(item => item.distSq < 7500) // Within ~85m radius
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, LIGHT_POOL_SIZE);

    // Assign closest window nodes to our dynamic PointLight pool with smooth lerp
    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const lightComp = lightRefs.current[i];
      const target = lightTargets[i];
      if (!lightComp) continue;

      if (i < sorted.length) {
        const item = sorted[i].node;
        // Position slightly pulled out from building wall along normal for optimal illumination
        target.targetPos.set(
          item.pos[0] + item.normal[0] * 1.5,
          item.pos[1],
          item.pos[2] + item.normal[2] * 1.5
        );

        // Breathing/subtle flickering night pulse
        const flicker = 1.0 + 0.16 * Math.sin(time * 3.5 + target.phase) + 0.08 * Math.cos(time * 7.2 + target.phase);
        
        // Intensity scales with Time of Day (softer during dusk, punchy & brilliant at deep night)
        target.targetIntensity = item.baseIntensity * atmo.windowLightIntensityMult * flicker;

        // Color transition: In Dusk, warm yellow tones dominate. In Deep Night, vibrant cyan vs yellow pop.
        if (timeT < 0.3) {
          // Warm sunset incandescent
          const duskColor = DUSK_GOLD_COLORS[item.id % DUSK_GOLD_COLORS.length];
          target.color.copy(duskColor);
        } else if (timeT < 0.6) {
          // Twilight transition
          const baseColor = item.isWarm 
            ? WARM_YELLOW_COLORS[item.id % WARM_YELLOW_COLORS.length]
            : COOL_BLUE_COLORS[item.id % COOL_BLUE_COLORS.length];
          const duskColor = DUSK_GOLD_COLORS[item.id % DUSK_GOLD_COLORS.length];
          const alpha = (timeT - 0.3) / 0.3;
          tempColor.copy(duskColor).lerp(baseColor, alpha);
          target.color.copy(tempColor);
        } else {
          // Night & Deep Night: pure high-contrast palette
          const targetColor = item.isWarm 
            ? WARM_YELLOW_COLORS[item.id % WARM_YELLOW_COLORS.length] 
            : COOL_BLUE_COLORS[item.id % COOL_BLUE_COLORS.length];
          target.color.copy(targetColor);
        }
      } else {
        target.targetIntensity = 0;
      }

      // Smooth interpolation to avoid abrupt popping
      const lerpSpeed = Math.min(1.0, delta * 8.0);
      target.currentPos.lerp(target.targetPos, lerpSpeed);
      target.intensity = THREE.MathUtils.lerp(target.intensity, target.targetIntensity, lerpSpeed);

      lightComp.position.copy(target.currentPos);
      lightComp.color.copy(target.color);
      lightComp.intensity = target.intensity;
      lightComp.distance = 28 + (timeT * 6); // Slightly wider glow radius at deep night
      lightComp.decay = 2.0;
    }
  });

  return (
    <group name="DynamicSkyscraperWindowLights">
      {/* Visual Instanced Window Luminaire Mesh Fixtures */}
      <instancedMesh
        ref={fixturesInstancedRef}
        args={[null, null, 1200]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Hardware Dynamic Point Light Pool */}
      {Array.from({ length: LIGHT_POOL_SIZE }).map((_, i) => (
        <pointLight
          key={`dynamic-window-light-${i}`}
          ref={(el) => (lightRefs.current[i] = el)}
          intensity={0}
          distance={28}
          decay={2}
          castShadow={false}
        />
      ))}
    </group>
  );
}

export default DynamicWindowLights;
