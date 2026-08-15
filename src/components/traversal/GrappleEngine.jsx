import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';

const up = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const mid = new THREE.Vector3();
const quat = new THREE.Quaternion();

export function GrappleEngine() {
  // Swing single line & anchor
  const swingLineRef = useRef(null);
  const anchorRef = useRef(null);
  const targetRef = useRef(null);
  const targetRingRef = useRef(null);

  // Zip-to-Point dual lines & reticle
  const zipTargetRef = useRef(null);
  const zipRingRef = useRef(null);
  const zipLineLeftRef = useRef(null);
  const zipLineRightRef = useRef(null);
  const zipAnchorRef = useRef(null);

  // Web-Zip air line
  const webZipLineRef = useRef(null);

  // Charged Jump ground aura
  const chargeAuraRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const [px, py, pz] = player.position;

    // ─────────────────────────────────────────────────────────────
    // 1. AIM RETICLE FOR SWING ANCHOR CANDIDATE
    // ─────────────────────────────────────────────────────────────
    if (targetRef.current) {
      const candidate = player.anchorCandidate;
      if (candidate && !player.anchor && !player.zipTarget) {
        targetRef.current.visible = true;
        targetRef.current.position.set(candidate[0], candidate[1] + 0.3, candidate[2]);
        targetRef.current.lookAt(state.camera.position);

        if (targetRingRef.current) {
          targetRingRef.current.rotation.z = time * 3.5;
          const pulse = 1.0 + Math.sin(time * 8) * 0.15;
          targetRef.current.scale.setScalar(pulse);
        }
      } else {
        targetRef.current.visible = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ZIP-TO-POINT RETICLE PREVIEW (F / Middle Mouse)
    // ─────────────────────────────────────────────────────────────
    if (zipTargetRef.current) {
      const zipCand = player.zipCandidate;
      if (zipCand && !player.zipTarget) {
        zipTargetRef.current.visible = true;
        zipTargetRef.current.position.set(zipCand[0], zipCand[1], zipCand[2]);
        zipTargetRef.current.lookAt(state.camera.position);

        if (zipRingRef.current) {
          zipRingRef.current.rotation.z = -time * 4.0;
          const pulse = 1.0 + Math.sin(time * 12) * 0.2;
          zipTargetRef.current.scale.setScalar(pulse);
        }
      } else {
        zipTargetRef.current.visible = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ACTIVE WEB SWING SINGLE LINE RENDERING
    // ─────────────────────────────────────────────────────────────
    const activeAnchor = player.anchor;
    if (swingLineRef.current && anchorRef.current) {
      if (activeAnchor) {
        swingLineRef.current.visible = true;
        anchorRef.current.visible = true;

        const from = new THREE.Vector3(px, py + 1.2, pz);
        const to = new THREE.Vector3(activeAnchor[0], activeAnchor[1], activeAnchor[2]);

        dir.subVectors(to, from);
        const len = dir.length() || 0.001;
        mid.copy(from).addScaledVector(dir, 0.5);

        swingLineRef.current.position.copy(mid);
        quat.setFromUnitVectors(up, dir.clone().normalize());
        swingLineRef.current.quaternion.copy(quat);
        swingLineRef.current.scale.set(1, len, 1);

        anchorRef.current.position.copy(to);
        const pulse = 1.0 + Math.sin(time * 14) * 0.25;
        anchorRef.current.scale.setScalar(pulse);
      } else {
        swingLineRef.current.visible = false;
        anchorRef.current.visible = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ACTIVE ZIP-TO-POINT DUAL WEB LINES
    // ─────────────────────────────────────────────────────────────
    const activeZip = player.zipTarget;
    if (zipLineLeftRef.current && zipLineRightRef.current && zipAnchorRef.current) {
      if (activeZip) {
        zipLineLeftRef.current.visible = true;
        zipLineRightRef.current.visible = true;
        zipAnchorRef.current.visible = true;

        const to = new THREE.Vector3(activeZip[0], activeZip[1], activeZip[2]);
        const fromL = new THREE.Vector3(px - 0.35, py + 1.1, pz);
        const fromR = new THREE.Vector3(px + 0.35, py + 1.1, pz);

        // Left Web Line
        dir.subVectors(to, fromL);
        let len = dir.length() || 0.001;
        mid.copy(fromL).addScaledVector(dir, 0.5);
        zipLineLeftRef.current.position.copy(mid);
        quat.setFromUnitVectors(up, dir.clone().normalize());
        zipLineLeftRef.current.quaternion.copy(quat);
        zipLineLeftRef.current.scale.set(1, len, 1);

        // Right Web Line
        dir.subVectors(to, fromR);
        len = dir.length() || 0.001;
        mid.copy(fromR).addScaledVector(dir, 0.5);
        zipLineRightRef.current.position.copy(mid);
        quat.setFromUnitVectors(up, dir.clone().normalize());
        zipLineRightRef.current.quaternion.copy(quat);
        zipLineRightRef.current.scale.set(1, len, 1);

        zipAnchorRef.current.position.copy(to);
      } else {
        zipLineLeftRef.current.visible = false;
        zipLineRightRef.current.visible = false;
        zipAnchorRef.current.visible = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. WEB-ZIP AIR LINE BURST (C / Web Zip Air Boost)
    // ─────────────────────────────────────────────────────────────
    if (webZipLineRef.current) {
      if (player.webZipActive && player.webZipOrigin && player.webZipTarget) {
        webZipLineRef.current.visible = true;
        const from = new THREE.Vector3(...player.webZipOrigin);
        const to = new THREE.Vector3(...player.webZipTarget);

        dir.subVectors(to, from);
        const len = dir.length() || 0.001;
        mid.copy(from).addScaledVector(dir, 0.5);

        webZipLineRef.current.position.copy(mid);
        quat.setFromUnitVectors(up, dir.clone().normalize());
        webZipLineRef.current.quaternion.copy(quat);
        webZipLineRef.current.scale.set(1, len, 1);
      } else {
        webZipLineRef.current.visible = false;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. CHARGED JUMP POTENTIAL ENERGY GROUND AURA
    // ─────────────────────────────────────────────────────────────
    if (chargeAuraRef.current) {
      if (player.jumpCharging && player.jumpChargeRatio > 0.05) {
        chargeAuraRef.current.visible = true;
        chargeAuraRef.current.position.set(px, py + 0.04, pz);
        const scale = 0.8 + player.jumpChargeRatio * 1.6;
        chargeAuraRef.current.scale.set(scale, 1, scale);
        chargeAuraRef.current.rotation.y = time * 6.0;
      } else {
        chargeAuraRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Dynamic Web Swing Line */}
      <mesh ref={swingLineRef} visible={false}>
        <cylinderGeometry args={[0.045, 0.045, 1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Web Attachment Point Node */}
      <mesh ref={anchorRef} visible={false}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Spider-Verse Aim Reticle for Swing Anchor */}
      <group ref={targetRef} visible={false}>
        <mesh ref={targetRingRef}>
          <ringGeometry args={[0.85, 1.05, 16]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.2, 8]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh key={idx} position={[Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.3, 0.08, 0.02]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>

      {/* Zip-to-Point Dual Web Lines */}
      <mesh ref={zipLineLeftRef} visible={false}>
        <cylinderGeometry args={[0.035, 0.035, 1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={zipLineRightRef} visible={false}>
        <cylinderGeometry args={[0.035, 0.035, 1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={zipAnchorRef} visible={false}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Zip-to-Point Target Ledge Reticle (F / Middle Click) */}
      <group ref={zipTargetRef} visible={false}>
        <mesh ref={zipRingRef}>
          <ringGeometry args={[0.75, 0.95, 4]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.18, 4]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
        {/* Double Corner Chevron Brackets */}
        {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((angle, idx) => (
          <mesh key={idx} position={[Math.cos(angle) * 1.25, Math.sin(angle) * 1.25, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.26, 0.08, 0.02]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        ))}
      </group>

      {/* Web-Zip Air Line Boost (C / Quick RMB) */}
      <mesh ref={webZipLineRef} visible={false}>
        <cylinderGeometry args={[0.06, 0.02, 1, 6]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Charged Jump Potential Energy Ring */}
      <group ref={chargeAuraRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.1, 16]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 16]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export default GrappleEngine;
