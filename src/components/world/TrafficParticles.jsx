import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';

export function TrafficParticles({ count = 280 }) {
  const pointsRef = useRef();

  // Generate particle systems along grid street vectors
  const [positions, colors, speeds, directions, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const dir = new Float32Array(count); // 0 = NS, 1 = EW
    const off = new Float32Array(count); // lane offset

    const whiteHeadlight = new THREE.Color('#ffffff');
    const amberHeadlight = new THREE.Color('#fef08a');
    const redTaillight = new THREE.Color('#ff0055');
    const cyanLight = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      const isNS = Math.random() > 0.5;
      const isOpposing = Math.random() > 0.5;
      const isHeadlight = Math.random() > 0.45;

      const laneOffset = (Math.floor(Math.random() * 3) + 1) * 3.8 * (isOpposing ? -1 : 1);
      const coordAlong = (Math.random() - 0.5) * 320;

      if (isNS) {
        pos[i * 3 + 0] = laneOffset;
        pos[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        pos[i * 3 + 2] = coordAlong;
        dir[i] = 0;
      } else {
        pos[i * 3 + 0] = coordAlong;
        pos[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        pos[i * 3 + 2] = laneOffset;
        dir[i] = 1;
      }

      off[i] = laneOffset;
      spd[i] = (22 + Math.random() * 20) * (isOpposing ? 1 : -1);

      let c = isHeadlight 
        ? (Math.random() > 0.3 ? whiteHeadlight : amberHeadlight)
        : (Math.random() > 0.2 ? redTaillight : cyanLight);

      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return [pos, col, spd, dir, off];
  }, [count]);

  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [colors, positions]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const px = player.position[0];
    const pz = player.position[2];

    const posAttr = pointsRef.current?.geometry?.attributes?.position;
    if (!posAttr) return;

    const array = posAttr.array;
    for (let i = 0; i < count; i++) {
      const isNS = directions[i] === 0;
      const speed = speeds[i];

      if (isNS) {
        array[i * 3 + 2] += speed * dt;
        // Keep recycled around player position in world space
        const relZ = array[i * 3 + 2] - pz;
        if (relZ > 160) array[i * 3 + 2] = pz - 160;
        if (relZ < -160) array[i * 3 + 2] = pz + 160;
      } else {
        array[i * 3 + 0] += speed * dt;
        const relX = array[i * 3 + 0] - px;
        if (relX > 160) array[i * 3 + 0] = px - 160;
        if (relX < -160) array[i * 3 + 0] = px + 160;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={2.4}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
}

export default TrafficParticles;
