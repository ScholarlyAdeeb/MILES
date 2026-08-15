import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "./playerState";

const up = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const mid = new THREE.Vector3();
const quat = new THREE.Quaternion();

// Energy tether: thin emissive cylinder + pulsing anchor bloom + target ring
export default function GrappleRenderer() {
  const lineRef = useRef(null);
  const anchorRef = useRef(null);
  const matRef = useRef(null);
  const targetRef = useRef(null);

  useFrame((state) => {
    const line = lineRef.current;
    const anchor = anchorRef.current;
    if (!line || !anchor) return;

    // candidate target indicator (screen-space reticle marker in world space)
    const t = targetRef.current;
    if (t) {
      const c = player.anchorCandidate;
      if (c && !player.anchor) {
        t.visible = true;
        t.position.set(c[0], c[1] + 0.4, c[2]);
        t.lookAt(state.camera.position);
        t.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.08);
      } else {
        t.visible = false;
      }
    }

    const a = player.anchor;
    if (!a) {
      line.visible = false;
      anchor.visible = false;
      return;
    }
    line.visible = true;
    anchor.visible = true;

    const [px, py, pz] = player.position;
    const from = new THREE.Vector3(px, py + 1.2, pz);
    const to = new THREE.Vector3(a[0], a[1], a[2]);
    dir.subVectors(to, from);
    const len = dir.length() || 0.001;
    mid.copy(from).addScaledVector(dir, 0.5);
    line.position.copy(mid);
    quat.setFromUnitVectors(up, dir.clone().normalize());
    line.quaternion.copy(quat);
    line.scale.set(1, len, 1);

    anchor.position.copy(to);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.18;
    anchor.scale.setScalar(pulse);
    if (matRef.current) {
      matRef.current.opacity = 0.75 + Math.sin(state.clock.elapsedTime * 20) * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={lineRef} visible={false}>
        <cylinderGeometry args={[0.045, 0.045, 1, 6, 1, true]} />
        <meshBasicMaterial
          ref={matRef}
          color="#79e6ff"
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={targetRef} visible={false}>
        <ringGeometry args={[0.55, 0.75, 20]} />
        <meshBasicMaterial color="#ffb257" transparent opacity={0.7} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={anchorRef} visible={false}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshBasicMaterial color="#a9f0ff" transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}
