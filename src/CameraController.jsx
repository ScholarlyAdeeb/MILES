import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TRAVERSAL_STATES } from './playerState.js';

export function CameraController({
  isDrivingMode = true,
  cameraView = 'cockpit', // 'cockpit' | 'hood' | 'chase'
  playerTelemetry,
  worldObstacles = [],
  onCameraYawChange,
  controls = {}
}) {
  const { camera } = useThree();

  const cameraYawRef = useRef(0);
  const cameraPitchRef = useRef(0.12);
  const currentFovRef = useRef(60);
  const lookTargetRef = useRef(new THREE.Vector3(0, 10, 0));
  const camRaycaster = useRef(new THREE.Raycaster());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    // ==========================================
    // 1. HERO CAR DRIVING CAMERA MODES
    // ==========================================
    if (isDrivingMode) {
      const speedKmh = playerTelemetry?.speedKmh || 65;
      const speedRatio = Math.min(1.0, speedKmh / 160);
      const carPos = playerTelemetry?.position || new THREE.Vector3(0, 0.4, 0);
      const carYaw = playerTelemetry?.yaw || 0;

      // Dynamic FOV based on driving speed (60 -> 80 deg)
      const targetFov = 60 + speedRatio * 20;
      currentFovRef.current = THREE.MathUtils.lerp(currentFovRef.current, targetFov, dt * 5);
      camera.fov = currentFovRef.current;
      camera.updateProjectionMatrix();

      // Steering sway / road vibration
      let steerOffset = 0;
      if (controls?.left) steerOffset = 0.04;
      if (controls?.right) steerOffset = -0.04;
      const roadVibeY = (Math.sin(state.clock.elapsedTime * 25) * 0.004) * (speedRatio + 0.2);

      if (cameraView === 'cockpit') {
        // First Person Cockpit View inside Sedan Driver Seat
        const localOffset = new THREE.Vector3(-0.35 + steerOffset, 0.38 + roadVibeY, -0.05);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw);

        const targetCamPos = new THREE.Vector3(
          carPos.x + localOffset.x,
          carPos.y + localOffset.y,
          carPos.z + localOffset.z
        );

        camera.position.copy(targetCamPos);

        // Forward look direction along car yaw
        const lookDir = new THREE.Vector3(
          -Math.sin(carYaw) * 20,
          -0.5,
          -Math.cos(carYaw) * 20
        );
        camera.lookAt(targetCamPos.x + lookDir.x, targetCamPos.y + lookDir.y, targetCamPos.z + lookDir.z);
        camera.rotation.z = -steerOffset * 0.6;
      } else if (cameraView === 'hood') {
        // Hood / Bumper View
        const localOffset = new THREE.Vector3(0, 0.8 + roadVibeY, -2.1);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw);

        const targetCamPos = new THREE.Vector3(
          carPos.x + localOffset.x,
          carPos.y + localOffset.y,
          carPos.z + localOffset.z
        );

        camera.position.lerp(targetCamPos, dt * 14);
        const lookDir = new THREE.Vector3(
          -Math.sin(carYaw) * 25,
          0,
          -Math.cos(carYaw) * 25
        );
        camera.lookAt(targetCamPos.x + lookDir.x, targetCamPos.y, targetCamPos.z + lookDir.z);
      } else {
        // Third-Person Chase Camera behind Hero Sedan
        const localOffset = new THREE.Vector3(steerOffset * 4, 2.6 + roadVibeY, 6.2);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw);

        const targetCamPos = new THREE.Vector3(
          carPos.x + localOffset.x,
          carPos.y + localOffset.y,
          carPos.z + localOffset.z
        );

        camera.position.lerp(targetCamPos, dt * 10);
        camera.lookAt(carPos.x, carPos.y + 1.2, carPos.z);
      }
      return;
    }

    // ==========================================
    // 2. URBAN TRAVERSAL THIRD-PERSON CAMERA
    // ==========================================
    const playerPos = playerTelemetry?.position || new THREE.Vector3(0, 15, 0);
    const speed = playerTelemetry?.speed || 0;
    const traversalState = playerTelemetry?.state || TRAVERSAL_STATES.IDLE;

    // Dynamic FOV
    const targetFov = THREE.MathUtils.clamp(60 + (speed / 22) * 25, 60, 85);
    currentFovRef.current = THREE.MathUtils.lerp(currentFovRef.current, targetFov, dt * 4);
    camera.fov = currentFovRef.current;
    camera.updateProjectionMatrix();

    // Spring-Arm Camera Position behind Player
    const desiredDistance = 5.2;
    const eyeHeight = 1.6;
    const targetLookAt = new THREE.Vector3(
      playerPos.x,
      playerPos.y + eyeHeight,
      playerPos.z
    );

    const yaw = cameraYawRef.current;
    const pitch = cameraPitchRef.current;

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * desiredDistance;
    const offsetY = Math.sin(pitch) * desiredDistance + eyeHeight;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * desiredDistance;

    const idealCamPos = new THREE.Vector3(
      playerPos.x + offsetX,
      playerPos.y + offsetY,
      playerPos.z + offsetZ
    );

    let finalCamPos = idealCamPos;
    if (worldObstacles.length > 0) {
      const rayOrigin = targetLookAt.clone();
      const rayDir = new THREE.Vector3().subVectors(idealCamPos, targetLookAt).normalize();
      camRaycaster.current.set(rayOrigin, rayDir);
      camRaycaster.current.far = desiredDistance;

      const hits = camRaycaster.current.intersectObjects(worldObstacles, true);
      if (hits.length > 0) {
        const safeDist = Math.max(1.2, hits[0].distance - 0.4);
        finalCamPos = rayOrigin.clone().addScaledVector(rayDir, safeDist);
      }
    }

    camera.position.lerp(finalCamPos, dt * 10);
    lookTargetRef.current.lerp(targetLookAt, dt * 14);
    camera.lookAt(lookTargetRef.current);

    let targetRoll = 0;
    if (traversalState === TRAVERSAL_STATES.WALL_RUNNING_LEFT) {
      targetRoll = -0.21;
    } else if (traversalState === TRAVERSAL_STATES.WALL_RUNNING_RIGHT) {
      targetRoll = 0.21;
    } else if (traversalState === TRAVERSAL_STATES.DIVING) {
      camera.rotation.x -= 0.15;
    }

    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRoll, dt * 6);
  });

  return null;
}

export default CameraController;
