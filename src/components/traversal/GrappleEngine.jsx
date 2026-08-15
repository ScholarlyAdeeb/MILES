import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';

const up = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const mid = new THREE.Vector3();
const quat = new THREE.Quaternion();

export function GrappleEngine() {
  const lineRef = useRef(null);
  const anchorRef = useRef(null);
  const targetRef = useRef(null);
  const targetRingRef = useRef(null);

  useFrame((state) => {
    const line = lineRef.current;
    const anchor = anchorRef.current;
    const target = targetRef.current;
    if (!line || !anchor) return;

    // 1. Aim Reticle Preview for Candidate Anchor
    if (target) {
      const candidate = player.anchorCandidate;
      if (candidate && !player.anchor) {
        target.visible = true;
        target.position.set(candidate[0], candidate[1] + 0.3, candidate[2]);
        target.lookAt(state.camera.position);

        const time = state.clock.elapsedTime;
        if (targetRingRef.current) {
          targetRingRef.current.rotation.z = time * 3.5;
          const pulse = 1.0 + Math.sin(time * 8) * 0.15;
          target.scale.setScalar(pulse);
        }
      } else {
        target.visible = false;
      }
    }

    // 2. Active Web Line / Tether Rendering
    const activeAnchor = player.anchor;
    if (!activeAnchor) {
      line.visible = false;
      anchor.visible = false;
      return;
    }

    line.visible = true;
    anchor.visible = true;

    const [px, py, pz] = player.position;
    const from = new THREE.Vector3(px, py + 1.1, pz);
    const to = new THREE.Vector3(activeAnchor[0], activeAnchor[1], activeAnchor[2]);

    dir.subVectors(to, from);
    const len = dir.length() || 0.001;
    mid.copy(from).addScaledVector(dir, 0.5);

    line.position.copy(mid);
    quat.setFromUnitVectors(up, dir.clone().normalize());
    line.quaternion.copy(quat);
    line.scale.set(1, len, 1);

    // Anchor point burst
    anchor.position.copy(to);
    const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 14) * 0.25;
    anchor.scale.setScalar(pulse);
  });

  return (
    <group>
      {/* Dynamic Graphite Ink / Web Line */}
      <mesh ref={lineRef} visible={false}>
        <cylinderGeometry args={[0.045, 0.045, 1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Web Attachment Point Node */}
      <mesh ref={anchorRef} visible={false}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Spider-Verse Geometric Aim Reticle */}
      <group ref={targetRef} visible={false}>
        <mesh ref={targetRingRef}>
          <ringGeometry args={[0.85, 1.05, 16]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.2, 8]} />
          <meshBasicMaterial color="#ff0055" side={THREE.DoubleSide} />
        </mesh>
        {/* Diamond Reticle Brackets */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh key={idx} position={[Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.3, 0.08, 0.02]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default GrappleEngine;
