import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InfiniteRoad } from './InfiniteRoad.jsx';
import { CarCockpit } from './CarCockpit.jsx';
import { CameraController } from './CameraController.jsx';
import { RemotePlayer } from './RemotePlayer.jsx';
import { useNetwork } from './NetworkEngine.jsx';
import CityManager from './components/world/CityManager.jsx';
import PencilPass from './components/world/PencilPass.jsx';
import TrafficParticles from './components/world/TrafficParticles.jsx';
import PlayerController from './components/traversal/PlayerController.jsx';
import GrappleEngine from './components/traversal/GrappleEngine.jsx';
import TraversalCamera from './components/traversal/TraversalCamera.jsx';
import TimeOfDayAtmosphere from './components/world/TimeOfDayAtmosphere.jsx';
import { useInput } from './useInput.js';
import { player } from './playerState.js';

// Hero Car Outer Mesh (Rendered in Third Person Chase Cam)
function HeroCarExterior({ controls, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const carRef = useRef();

  useFrame((state, delta) => {
    if (!carRef.current) return;
    let roll = 0;
    if (controls.left) roll = 0.06;
    if (controls.right) roll = -0.06;
    carRef.current.rotation.z = THREE.MathUtils.lerp(carRef.current.rotation.z, roll, delta * 8);
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={carRef}>
        {/* Aerodynamic Luxury Sedan Body */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.7, 4.8]} />
          <meshStandardMaterial
            color="#060911"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>

        {/* Cabin Roof & Tinted Glass */}
        <mesh position={[0, 1.35, -0.2]}>
          <boxGeometry args={[1.8, 0.65, 2.6]} />
          <meshStandardMaterial
            color="#020408"
            metalness={0.98}
            roughness={0.05}
          />
        </mesh>

        {/* Wheels */}
        {[-1.05, 1.05].map((x, xi) => (
          <React.Fragment key={xi}>
            <mesh position={[x, 0.38, 1.5]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.35, 16]} />
              <meshStandardMaterial color="#020202" roughness={0.8} />
            </mesh>
            <mesh position={[x, 0.38, -1.5]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.35, 16]} />
              <meshStandardMaterial color="#020202" roughness={0.8} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Rear Full-width LED Lightbar */}
        <mesh position={[0, 0.8, 2.42]}>
          <boxGeometry args={[2.0, 0.08, 0.05]} />
          <meshBasicMaterial color="#ff0033" />
        </mesh>
        <pointLight position={[0, 0.8, 2.8]} color="#ff0033" intensity={2.0} distance={8} />

        {/* Front Headlight DRLs */}
        <mesh position={[-0.8, 0.65, -2.42]}>
          <boxGeometry args={[0.4, 0.1, 0.05]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0.8, 0.65, -2.42]}>
          <boxGeometry args={[0.4, 0.1, 0.05]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      </group>
    </group>
  );
}

export function DriveScene({
  isDrivingMode = false,
  controls,
  consumeJumpBuffer,
  cameraView = 'cockpit',
  onTelemetryUpdate,
  isDayMode = false
}) {
  const [cameraYaw, setCameraYaw] = useState(0);
  const { broadcastLocalState } = useNetwork();
  const inputRef = useInput();

  // Free-roam Car Simulation Physics State
  const carPosRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const carYawRef = useRef(0);
  const carSpeedRef = useRef(18); // m/s (~65 km/h)
  const steerAngleRef = useRef(0);

  const currentTelemetryRef = useRef({
    state: 'CRUISING',
    speed: 18,
    speedKmh: 65,
    position: new THREE.Vector3(0, 0.4, 0),
    yaw: 0,
    velocity: new THREE.Vector3(0, 0, -18),
    grounded: true
  });

  // Dynamic Driving Simulation Loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    if (isDrivingMode) {
      // 1. Throttle / Brake Dynamics
      let targetSpeed = 18; // Cruise (~65 km/h)
      if (controls.forward) targetSpeed = 38; // Sprint (~137 km/h)
      if (controls.backward) targetSpeed = -8; // Reverse
      if (controls.handbrake) targetSpeed = 0; // Handbrake

      const accelRate = controls.handbrake ? 6 : controls.forward ? 3.5 : 2.5;
      carSpeedRef.current = THREE.MathUtils.lerp(carSpeedRef.current, targetSpeed, dt * accelRate);

      // 2. Steering & Yaw Rotation
      let steerInput = 0;
      if (controls.left) steerInput += 1;
      if (controls.right) steerInput -= 1;

      steerAngleRef.current = THREE.MathUtils.lerp(steerAngleRef.current, steerInput, dt * 7);

      const speedFactor = Math.abs(carSpeedRef.current) / 18;
      const turnRate = steerAngleRef.current * (controls.handbrake ? 2.2 : 1.3) * Math.min(1.6, Math.max(0.2, speedFactor));
      carYawRef.current += turnRate * dt;

      // 3. Move car through city space
      const forwardX = -Math.sin(carYawRef.current);
      const forwardZ = -Math.cos(carYawRef.current);

      carPosRef.current.x += forwardX * carSpeedRef.current * dt;
      carPosRef.current.z += forwardZ * carSpeedRef.current * dt;

      // 4. Update global player position for seamless city streaming & multiplayer
      player.position[0] = carPosRef.current.x;
      player.position[1] = 0.4;
      player.position[2] = carPosRef.current.z;
      player.yaw = carYawRef.current;
      player.speed = Math.abs(carSpeedRef.current);

      const currentKmh = Math.round(Math.abs(carSpeedRef.current) * 3.6);

      currentTelemetryRef.current = {
        state: currentKmh > 100 ? 'HIGHWAY SPRINT' : currentKmh > 10 ? 'CRUISING' : 'IDLE',
        speed: carSpeedRef.current,
        speedKmh: currentKmh,
        position: carPosRef.current.clone(),
        yaw: carYawRef.current,
        velocity: new THREE.Vector3(forwardX * carSpeedRef.current, 0, forwardZ * carSpeedRef.current),
        grounded: true
      };

      if (onTelemetryUpdate) {
        onTelemetryUpdate(currentTelemetryRef.current);
      }

      if (broadcastLocalState) {
        broadcastLocalState({
          mode: 'drive',
          position: [carPosRef.current.x, carPosRef.current.y, carPosRef.current.z],
          rotation: [0, carYawRef.current, 0],
          velocity: [forwardX * carSpeedRef.current, 0, forwardZ * carSpeedRef.current],
          state: currentTelemetryRef.current.state,
          speed: carSpeedRef.current
        });
      }
    }
  });

  const speedKmh = currentTelemetryRef.current.speedKmh || 65;

  return (
    <>
      {/* 1. Dynamic Time-of-Day Atmosphere & Lighting (Dusk -> Deep Night Lerp) */}
      <TimeOfDayAtmosphere />

      {/* 2. Infinite Roadway System */}
      <InfiniteRoad
        playerVelocityZ={-speedKmh / 3.6}
        isDayMode={isDayMode}
      />

      {/* 3. Chunk-Streamed High-Altitude Instanced Skyscraper City */}
      <CityManager day={isDayMode} />

      {/* 4. MODE A: Hero Car Cockpit & Exterior */}
      {isDrivingMode && (
        <group
          position={[carPosRef.current.x, 0, carPosRef.current.z]}
          rotation={[0, carYawRef.current, 0]}
        >
          {cameraView === 'cockpit' ? (
            <CarCockpit
              controls={controls}
              speedKmh={speedKmh}
              isDrivingMode={true}
            />
          ) : (
            <HeroCarExterior
              controls={controls}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
            />
          )}
        </group>
      )}

      {/* 5. MODE B: Kinetic Momentum Traversal Engine */}
      {!isDrivingMode && (
        <>
          <PlayerController
            input={inputRef}
            onTelemetryUpdate={onTelemetryUpdate}
          />
          <GrappleEngine />
          <TraversalCamera />
        </>
      )}

      {/* 6. Remote Co-Op Peer Player Proxy */}
      <RemotePlayer />

      {/* 7. Camera Controller for Driving Mode */}
      {isDrivingMode && (
        <CameraController
          isDrivingMode={isDrivingMode}
          cameraView={cameraView}
          playerTelemetry={currentTelemetryRef.current}
          worldObstacles={[]}
          onCameraYawChange={setCameraYaw}
          controls={controls}
        />
      )}

      {/* 8. Spider-Verse NPR Graphite Pencil Sketch + Halftone + Edge Inking Shader Engine */}
      <PencilPass isDayMode={isDayMode} />
    </>
  );
}

export default DriveScene;
