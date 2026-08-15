import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { player, STATES } from '../../playerState.js';
import { solidAt } from '../../world.js';

const target = new THREE.Vector3();
const desired = new THREE.Vector3();
const smoothTarget = new THREE.Vector3(0, 48, 0);
const camPos = new THREE.Vector3(0, 50, 8);

export function TraversalCamera() {
  const { camera } = useThree();
  const roll = useRef(0);
  const fov = useRef(62);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    const p = player;
    const [x, y, z] = p.position;

    // 1. Lagged Target Center Tracking
    target.set(x, y + 1.4, z);
    smoothTarget.lerp(target, 1 - Math.pow(0.0008, dt));

    // 2. Trajectory Distance & Offset
    const dist = 6.2 + Math.min(p.speed, 35) * 0.07;
    const pitch = THREE.MathUtils.clamp(p.pitch, -0.85, 0.65);
    const height = 1.6 - pitch * 3.5 - THREE.MathUtils.clamp(p.velocity[1], -25, 15) * 0.04;

    const bx = Math.sin(p.rotation) * dist;
    const bz = Math.cos(p.rotation) * dist;
    desired.set(smoothTarget.x + bx, smoothTarget.y + height, smoothTarget.z + bz);

    // 3. Raycast Obstacle Clipping Prevention
    const dir = desired.clone().sub(smoothTarget);
    const len = dir.length();
    dir.normalize();
    let allowed = len;
    for (let s = 1.0; s <= len; s += 0.8) {
      const sx = smoothTarget.x + dir.x * s;
      const sy = smoothTarget.y + dir.y * s;
      const sz = smoothTarget.z + dir.z * s;
      if (solidAt(sx, sy, sz, 0.45)) {
        allowed = Math.max(1.4, s - 0.8);
        break;
      }
    }
    desired.copy(smoothTarget).addScaledVector(dir, allowed);

    // 4. Smooth Camera Pos Lerp
    camPos.lerp(desired, 1 - Math.pow(0.0012, dt));
    camera.position.copy(camPos);

    // 5. Look Target with Pitch & Dive Tilt
    const isDiving = p.state === STATES.DIVING;
    const look = smoothTarget.clone();
    look.y += THREE.MathUtils.clamp(p.velocity[1], -30, 20) * 0.04 +
      pitch * 4.0 -
      (isDiving ? 2.5 : 0);
    camera.lookAt(look);

    // 6. 12° Camera Roll (Wall runs, fast strafes)
    roll.current += (p.lean - roll.current) * Math.min(1, 6 * dt);
    camera.rotateZ(roll.current);

    // 7. Dynamic FOV 62° (Rest) -> 88° (Top Speed)
    const speedRatio = THREE.MathUtils.clamp(p.speed / 32, 0, 1);
    const targetFov = 62 + speedRatio * 26;
    fov.current += (targetFov - fov.current) * Math.min(1, 4 * dt);
    if (Math.abs(camera.fov - fov.current) > 0.02) {
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

export default TraversalCamera;
