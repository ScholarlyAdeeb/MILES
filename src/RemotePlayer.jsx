import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNetwork } from './NetworkEngine.jsx';

export function RemotePlayer({ localPosition }) {
  const { remotePeer, playerIndex } = useNetwork();

  const groupRef = useRef();
  const avatarRef = useRef();
  const gliderRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const vehicleRef = useRef();
  const grappleLineRef = useRef();

  // Target buffers for smooth interpolation
  const currentPos = useRef(new THREE.Vector3(0, 10, 0));
  const targetPos = useRef(new THREE.Vector3(0, 10, 0));
  const currentVel = useRef(new THREE.Vector3(0, 0, 0));
  const currentRot = useRef(new THREE.Euler(0, 0, 0));
  const targetRot = useRef(new THREE.Euler(0, 0, 0));
  const animTime = useRef(0);

  // Accent theme for remote peer (Player 2 gets amber/magenta, Player 1 gets cyan)
  const isPeerPlayer1 = remotePeer?.playerIndex === 1;
  const accentColor = isPeerPlayer1 ? '#22d3ee' : '#f59e0b';
  const glowHex = isPeerPlayer1 ? 0x22d3ee : 0xf59e0b;

  // Memoized materials & geometries
  const runnerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.8,
        roughness: 0.25,
        emissive: glowHex,
        emissiveIntensity: 0.35,
      }),
    [glowHex]
  );

  const visorMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: glowHex,
      }),
    [glowHex]
  );

  const gliderMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: glowHex,
        emissive: glowHex,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    [glowHex]
  );

  const vehicleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.9,
        roughness: 0.15,
      }),
    []
  );

  const wheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.8,
      }),
    []
  );

  // Grapple cylinder geometry helper
  const grappleGeo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 1, 6), []);
  const grappleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: glowHex,
        transparent: true,
        opacity: 0.85,
      }),
    [glowHex]
  );

  useFrame((state, delta) => {
    if (!remotePeer || !remotePeer.state || !groupRef.current) return;

    const peerData = remotePeer.state;
    const isDrive = peerData.mode === 'drive';

    // Update target position and velocity
    if (peerData.position) {
      targetPos.current.set(peerData.position[0], peerData.position[1], peerData.position[2]);
    }
    if (peerData.velocity) {
      currentVel.current.set(peerData.velocity[0], peerData.velocity[1], peerData.velocity[2]);
    }
    if (peerData.rotation) {
      targetRot.current.set(peerData.rotation[0], peerData.rotation[1], peerData.rotation[2]);
    }

    // Dead-reckoning dead-time calculation
    const timeSincePacket = Math.min(0.15, (Date.now() - (peerData.timestamp || Date.now())) / 1000);
    const predictedX = targetPos.current.x + currentVel.current.x * timeSincePacket;
    const predictedY = targetPos.current.y + currentVel.current.y * timeSincePacket;
    const predictedZ = targetPos.current.z + currentVel.current.z * timeSincePacket;

    // Smooth exponential decay lerp for position
    const lerpFactor = 1.0 - Math.exp(-22 * delta);
    currentPos.current.x += (predictedX - currentPos.current.x) * lerpFactor;
    currentPos.current.y += (predictedY - currentPos.current.y) * lerpFactor;
    currentPos.current.z += (predictedZ - currentPos.current.z) * lerpFactor;

    // Direct assignment to group transform
    groupRef.current.position.copy(currentPos.current);

    // Smooth rotation interpolation
    const rotLerpFactor = 1.0 - Math.exp(-18 * delta);
    groupRef.current.rotation.y +=
      Math.atan2(
        Math.sin(targetRot.current.y - groupRef.current.rotation.y),
        Math.cos(targetRot.current.y - groupRef.current.rotation.y)
      ) * rotLerpFactor;

    // Procedural animation for runner mode
    if (!isDrive && avatarRef.current) {
      const speed = peerData.speed || currentVel.current.length();
      const pState = peerData.state || 'IDLE';
      animTime.current += delta * Math.max(1, speed * 1.2);

      // Running limb swings
      if (speed > 1.5 && (pState === 'RUNNING' || pState === 'SPRINTING')) {
        const swing = Math.sin(animTime.current * 8) * Math.min(0.6, speed * 0.05);
        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
      } else if (pState === 'WALL_RUNNING_LEFT' || pState === 'WALL_RUN_L') {
        avatarRef.current.rotation.z = THREE.MathUtils.lerp(avatarRef.current.rotation.z, -0.22, 0.1);
      } else if (pState === 'WALL_RUNNING_RIGHT' || pState === 'WALL_RUN_R') {
        avatarRef.current.rotation.z = THREE.MathUtils.lerp(avatarRef.current.rotation.z, 0.22, 0.1);
      } else if (pState === 'DIVING') {
        avatarRef.current.rotation.x = THREE.MathUtils.lerp(avatarRef.current.rotation.x, 0.9, 0.15);
      } else {
        avatarRef.current.rotation.z = THREE.MathUtils.lerp(avatarRef.current.rotation.z, 0, 0.1);
        avatarRef.current.rotation.x = THREE.MathUtils.lerp(avatarRef.current.rotation.x, 0, 0.1);
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      }

      // Glider visibility & breathing animation
      if (gliderRef.current) {
        const isGliding = peerData.isGliding || pState === 'GLIDING';
        gliderRef.current.visible = isGliding;
        if (isGliding) {
          gliderRef.current.scale.set(1 + Math.sin(animTime.current * 4) * 0.03, 1, 1);
        }
      }

      // Grapple line tether
      if (grappleLineRef.current) {
        const isGrappling = peerData.isGrappling || pState === 'GRAPPLING' || pState === 'SWINGING';
        if (isGrappling && peerData.grappleTarget) {
          grappleLineRef.current.visible = true;
          const target = new THREE.Vector3(
            peerData.grappleTarget[0],
            peerData.grappleTarget[1],
            peerData.grappleTarget[2]
          );
          const handPos = currentPos.current.clone().add(new THREE.Vector3(0, 1.3, 0));
          const diff = new THREE.Vector3().subVectors(target, handPos);
          const dist = diff.length();

          grappleLineRef.current.position.copy(handPos.add(diff.clone().multiplyScalar(0.5)));
          grappleLineRef.current.scale.set(1, dist, 1);
          grappleLineRef.current.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            diff.clone().normalize()
          );
        } else {
          grappleLineRef.current.visible = false;
        }
      }
    }
  });

  if (!remotePeer || !remotePeer.state) return null;

  const isDriveMode = remotePeer.state.mode === 'drive';
  const peerStateName = remotePeer.state.state || (isDriveMode ? 'DRIVING' : 'IDLE');
  const peerSpeed = remotePeer.state.speed ? remotePeer.state.speed.toFixed(1) : '0.0';

  // Distance to local player calculation for the nametag
  let distText = '';
  if (localPosition) {
    const d = currentPos.current.distanceTo(localPosition);
    distText = `${Math.round(d)}m`;
  }

  return (
    <>
      {/* Root transform group */}
      <group ref={groupRef}>
        {/* Floating Holographic Nametag HUD */}
        <Html
          position={[0, isDriveMode ? 2.2 : 2.5, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
        >
          <div className="flex flex-col items-center pointer-events-none select-none font-mono whitespace-nowrap">
            {/* Player Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 border border-white/20 backdrop-blur-md shadow-2xl shadow-black">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
              <span className="text-[11px] font-bold text-white tracking-wider">
                PLAYER {remotePeer.playerIndex || 2}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                  border: `1px solid ${accentColor}44`,
                }}
              >
                {peerStateName}
              </span>
              {distText && (
                <span className="text-[9px] text-zinc-400 border-l border-white/15 pl-1.5">
                  {distText}
                </span>
              )}
            </div>

            {/* Velocity Micro-badge */}
            <div className="text-[8px] text-zinc-500 font-mono mt-0.5">
              {peerSpeed} m/s
            </div>
          </div>
        </Html>

        {/* 3D Traversal Avatar Proxy */}
        {!isDriveMode && (
          <group ref={avatarRef}>
            {/* Cyber Runner Torso */}
            <mesh position={[0, 1.05, 0]} material={runnerMat} castShadow>
              <capsuleGeometry args={[0.22, 0.45, 8, 16]} />
            </mesh>

            {/* Visor & Helmet */}
            <mesh position={[0, 1.55, 0.08]} material={visorMat}>
              <boxGeometry args={[0.24, 0.09, 0.22]} />
            </mesh>
            <mesh position={[0, 1.55, 0]} material={runnerMat}>
              <sphereGeometry args={[0.18, 16, 16]} />
            </mesh>

            {/* Backpack / Thruster Core */}
            <mesh position={[0, 1.15, -0.22]} material={runnerMat}>
              <boxGeometry args={[0.25, 0.35, 0.12]} />
            </mesh>
            <mesh position={[0, 1.15, -0.29]} material={visorMat}>
              <boxGeometry args={[0.12, 0.22, 0.04]} />
            </mesh>

            {/* Left Arm */}
            <group ref={leftArmRef} position={[-0.32, 1.25, 0]}>
              <mesh position={[0, -0.25, 0]} material={runnerMat}>
                <capsuleGeometry args={[0.07, 0.35, 6, 8]} />
              </mesh>
            </group>

            {/* Right Arm */}
            <group ref={rightArmRef} position={[0.32, 1.25, 0]}>
              <mesh position={[0, -0.25, 0]} material={runnerMat}>
                <capsuleGeometry args={[0.07, 0.35, 6, 8]} />
              </mesh>
            </group>

            {/* Left Leg */}
            <group ref={leftLegRef} position={[-0.14, 0.65, 0]}>
              <mesh position={[0, -0.32, 0]} material={runnerMat}>
                <capsuleGeometry args={[0.08, 0.45, 6, 8]} />
              </mesh>
            </group>

            {/* Right Leg */}
            <group ref={rightLegRef} position={[0.14, 0.65, 0]}>
              <mesh position={[0, -0.32, 0]} material={runnerMat}>
                <capsuleGeometry args={[0.08, 0.45, 6, 8]} />
              </mesh>
            </group>

            {/* Holographic Glider Wings */}
            <group ref={gliderRef} position={[0, 1.45, -0.15]} visible={false}>
              <mesh material={gliderMat}>
                <boxGeometry args={[2.8, 0.02, 0.7]} />
              </mesh>
            </group>
          </group>
        )}

        {/* 3D Hero Sedan Proxy (Drive Mode) */}
        {isDriveMode && (
          <group ref={vehicleRef}>
            {/* Chassis Body */}
            <mesh position={[0, 0.45, 0]} material={vehicleMat} castShadow>
              <boxGeometry args={[1.85, 0.45, 4.4]} />
            </mesh>

            {/* Cabin Top */}
            <mesh position={[0, 0.88, -0.2]} material={vehicleMat}>
              <boxGeometry args={[1.45, 0.42, 2.2]} />
            </mesh>

            {/* Front Headlights LED */}
            <mesh position={[0.65, 0.45, 2.22]} material={visorMat}>
              <boxGeometry args={[0.35, 0.1, 0.05]} />
            </mesh>
            <mesh position={[-0.65, 0.45, 2.22]} material={visorMat}>
              <boxGeometry args={[0.35, 0.1, 0.05]} />
            </mesh>

            {/* Rear Taillights LED Strip */}
            <mesh position={[0, 0.48, -2.22]}>
              <boxGeometry args={[1.7, 0.08, 0.05]} />
              <meshBasicMaterial color={0xff1144} />
            </mesh>

            {/* 4 Wheels */}
            <mesh position={[-0.95, 0.32, 1.3]} material={wheelMat}>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 16]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0.95, 0.32, 1.3]} material={wheelMat}>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 16]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[-0.95, 0.32, -1.3]} material={wheelMat}>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 16]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0.95, 0.32, -1.3]} material={wheelMat}>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 16]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>

            {/* Underglow Neon Light */}
            <pointLight position={[0, 0.15, 0]} color={glowHex} intensity={2.5} distance={5} />
          </group>
        )}
      </group>

      {/* 3D Laser Grapple Cylinder Tether */}
      <mesh ref={grappleLineRef} material={grappleMat} geometry={grappleGeo} visible={false} />
    </>
  );
}
