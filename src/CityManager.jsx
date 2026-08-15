import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "./playerState";
import { chunkCoordsAround, getChunk, CHUNK_SIZE, VIEW_RADIUS } from "./world";

const dummy = new THREE.Object3D();
const color = new THREE.Color();

const MAX_BUILDINGS = 260;
const MAX_LAMPS = 180;
const MAX_WINDOWS = 2600;
const MAX_HOARDINGS = 90;

export default function CityManager({ day = false }) {
  const buildingsRef = useRef(null);
  const windowsRef = useRef(null);
  const lampPolesRef = useRef(null);
  const lampHeadsRef = useRef(null);
  const hoardingsRef = useRef(null);
  const [version, setVersion] = useState(0);
  const lastKey = useRef("");

  // Rebuild instance transforms whenever the active chunk set changes.
  useFrame(() => {
    const [px, , pz] = player.position;
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    const key = cx + ":" + cz;
    if (key !== lastKey.current) {
      lastKey.current = key;
      setVersion((v) => v + 1);
    }
  });

  useMemo(() => {
    const bMesh = buildingsRef.current;
    const wMesh = windowsRef.current;
    const pMesh = lampPolesRef.current;
    const hMesh = lampHeadsRef.current;
    const adMesh = hoardingsRef.current;
    if (!bMesh || !wMesh || !pMesh || !hMesh || !adMesh) return;

    const [px, , pz] = player.position;
    let b = 0;
    let w = 0;
    let l = 0;
    let a = 0;

    for (const [cx, cz] of chunkCoordsAround(px, pz, VIEW_RADIUS)) {
      const chunk = getChunk(cx, cz);

      for (const bld of chunk.buildings) {
        if (b >= MAX_BUILDINGS) break;
        dummy.position.set(bld.x, bld.h / 2, bld.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(bld.w, bld.h, bld.d);
        dummy.updateMatrix();
        bMesh.setMatrixAt(b, dummy.matrix);
        const t = day ? 0.55 + bld.tone * 0.3 : 0.11 + bld.tone * 0.07;
        color.setRGB(t, t * 1.02, t * (day ? 0.98 : 1.15));
        bMesh.setColorAt(b, color);
        b++;

        // window grid strips on two facades
        const rows = Math.max(2, Math.floor(bld.h / 6));
        for (let r = 1; r < rows; r++) {
          if (w >= MAX_WINDOWS - 2) break;
          const yy = r * 6 - 1.5;
          if (yy > bld.h - 2) break;
          for (const face of [0, 1]) {
            if (w >= MAX_WINDOWS) break;
            const lit = ((r * 13 + face * 7 + Math.floor(bld.x)) % 5) < 3;
            if (!lit) continue;
            if (face === 0) {
              dummy.position.set(bld.x, yy, bld.z + bld.d / 2 + 0.06);
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(bld.w * 0.78, 1.5, 1);
            } else {
              dummy.position.set(bld.x + bld.w / 2 + 0.06, yy, bld.z);
              dummy.rotation.set(0, Math.PI / 2, 0);
              dummy.scale.set(bld.d * 0.78, 1.5, 1);
            }
            dummy.updateMatrix();
            wMesh.setMatrixAt(w, dummy.matrix);
            const warm = 0.55 + ((r * 31 + face) % 5) * 0.09;
            if (day) color.setRGB(warm * 0.45, warm * 0.55, warm * 0.72);
            else color.setRGB(warm, warm * 0.72, warm * 0.38);
            wMesh.setColorAt(w, color);
            w++;
          }
        }
      }

      for (const lamp of chunk.lamps) {
        if (l >= MAX_LAMPS) break;
        dummy.position.set(lamp.x, 3, lamp.z);
        dummy.rotation.set(0, lamp.r, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pMesh.setMatrixAt(l, dummy.matrix);
        dummy.position.set(lamp.x, 6.1, lamp.z);
        dummy.updateMatrix();
        hMesh.setMatrixAt(l, dummy.matrix);
        l++;
      }

      for (const ad of chunk.hoardings) {
        if (a >= MAX_HOARDINGS) break;
        dummy.position.set(ad.x, 7.5, ad.z);
        dummy.rotation.set(0, ad.r, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        adMesh.setMatrixAt(a, dummy.matrix);
        const tint = ad.tint;
        color.setRGB(0.5 + tint * 0.3, 0.32 + tint * 0.2, 0.22 + tint * 0.35);
        adMesh.setColorAt(a, color);
        a++;
      }
    }

    bMesh.count = b;
    wMesh.count = w;
    pMesh.count = l;
    hMesh.count = l;
    adMesh.count = a;
    for (const m of [bMesh, wMesh, pMesh, hMesh, adMesh]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false;
    }
  }, [version, day]);

  return (
    <group>
      {/* street plane, recentred on the player */}
      <StreetPlane day={day} />

      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, MAX_BUILDINGS]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={day ? 0.85 : 0.45}
          metalness={day ? 0.15 : 0.75}
          color={day ? "#cdd4dd" : "#20242c"}
        />
      </instancedMesh>

      <instancedMesh ref={windowsRef} args={[undefined, undefined, MAX_WINDOWS]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={lampPolesRef} args={[undefined, undefined, MAX_LAMPS]}>
        <cylinderGeometry args={[0.12, 0.16, 6, 6]} />
        <meshStandardMaterial color="#15181d" roughness={0.5} metalness={0.8} />
      </instancedMesh>

      <instancedMesh ref={lampHeadsRef} args={[undefined, undefined, MAX_LAMPS]}>
        <sphereGeometry args={[0.42, 8, 8]} />
        <meshBasicMaterial color={day ? "#8d9099" : "#ffb257"} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={hoardingsRef} args={[undefined, undefined, MAX_HOARDINGS]}>
        <boxGeometry args={[9, 5, 0.3]} />
        <meshStandardMaterial
          emissiveIntensity={day ? 0.15 : 0.9}
          emissive="#5a3a22"
          roughness={0.6}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
}

function StreetPlane({ day }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const [px, , pz] = player.position;
    ref.current.position.set(Math.round(px / 10) * 10, 0, Math.round(pz / 10) * 10);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial
        color={day ? "#5b6068" : "#0b0d11"}
        roughness={day ? 0.9 : 0.15}
        metalness={day ? 0.05 : 0.85}
      />
    </mesh>
  );
}
