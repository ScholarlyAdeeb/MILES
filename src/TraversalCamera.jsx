import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "./playerState";
import { solidAt } from "./world";

const target = new THREE.Vector3();
const desired = new THREE.Vector3();
const smoothTarget = new THREE.Vector3(0, 2, 0);
const camPos = new THREE.Vector3(0, 5, 8);

export default function TraversalCamera() {
  const { camera } = useThree();
  const roll = useRef(0);
  const fov = useRef(60);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const p = player;
    const [x, y, z] = p.position;

    // lagged target tracking
    target.set(x, y + 1.6, z);
    smoothTarget.lerp(target, 1 - Math.pow(0.0009, dt));

    const dist = 7.5 + Math.min(p.speed, 30) * 0.09;
    const pitch = THREE.MathUtils.clamp(p.pitch, -0.9, 0.6);
    const height = 2.2 - pitch * 4 - THREE.MathUtils.clamp(p.velocity[1], -25, 15) * 0.05;
    const bx = Math.sin(p.rotation) * dist;
    const bz = Math.cos(p.rotation) * dist;
    desired.set(smoothTarget.x + bx, smoothTarget.y + height, smoothTarget.z + bz);

    // raycast collision: pull camera in if it would enter a building
    const dir = desired.clone().sub(smoothTarget);
    const len = dir.length();
    dir.normalize();
    let allowed = len;
    for (let s = 1.2; s <= len; s += 1.0) {
      const sx = smoothTarget.x + dir.x * s;
      const sy = smoothTarget.y + dir.y * s;
      const sz = smoothTarget.z + dir.z * s;
      if (sy < 0.5 || solidAt(sx, sy, sz, 0.5)) {
        allowed = Math.max(1.6, s - 1.0);
        break;
      }
    }
    desired.copy(smoothTarget).addScaledVector(dir, allowed);

    camPos.lerp(desired, 1 - Math.pow(0.0015, dt));
    camera.position.copy(camPos);

    // subtle pitch tilt from vertical velocity
    const look = smoothTarget.clone();
    look.y +=
      THREE.MathUtils.clamp(p.velocity[1], -30, 20) * 0.06 +
      pitch * 6 -
      (p.diving ? 3.2 : 0); // nose-down while diving
    camera.lookAt(look);

    // wall-run / swing roll
    roll.current += (p.lean - roll.current) * Math.min(1, 6 * dt);
    camera.rotateZ(roll.current);

    // dynamic FOV 60 -> 85
    const t = THREE.MathUtils.clamp(p.speed / 36, 0, 1);
    const wanted = 60 + t * 25;
    fov.current += (wanted - fov.current) * Math.min(1, 3 * dt);
    if (Math.abs(camera.fov - fov.current) > 0.01) {
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
