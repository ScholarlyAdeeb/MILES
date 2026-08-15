import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { InfotainmentDisplay } from './InfotainmentDisplay.jsx';
import { useAudio } from './AudioEngine.jsx';

export function CarCockpit({ controls, speedKmh = 65, isDrivingMode = true }) {
  const steeringWheelRef = useRef();
  const { bassLevel } = useAudio();

  useFrame((state, delta) => {
    // Rotate steering wheel based on user input
    if (steeringWheelRef.current) {
      let targetRot = 0;
      if (controls.left) targetRot = 0.55;
      if (controls.right) targetRot = -0.55;
      steeringWheelRef.current.rotation.z = THREE.MathUtils.lerp(
        steeringWheelRef.current.rotation.z,
        targetRot,
        delta * 8
      );
    }
  });

  if (!isDrivingMode) return null;

  const currentSpeed = Math.round(speedKmh);
  const gear = controls.backward && currentSpeed < 5 ? 'R' : controls.handbrake ? 'P' : currentSpeed === 0 ? 'N' : 'D';

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Dashboard Body Structure */}
      <mesh position={[0, -0.4, -0.75]} receiveShadow>
        <boxGeometry args={[2.4, 0.45, 0.9]} />
        <meshStandardMaterial
          color="#080a10"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Soft leather dashboard top cowl */}
      <mesh position={[0, -0.16, -0.7]}>
        <boxGeometry args={[2.3, 0.08, 0.7]} />
        <meshStandardMaterial
          color="#0a0e17"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Ambient Interior LED Contour Strip (Deep Violet / Purple matching reference) */}
      <mesh position={[0, -0.21, -0.65]}>
        <boxGeometry args={[2.32, 0.02, 0.02]} />
        <meshBasicMaterial
          color="#a855f7" // Purple ambient strip
        />
      </mesh>
      <pointLight
        position={[0, -0.2, -0.6]}
        color="#c084fc"
        intensity={0.6 + (bassLevel || 0) * 1.0}
        distance={2.5}
        decay={2}
      />

      {/* 3. Driver Instrument Cluster (Digital Cockpit behind Steering Wheel) */}
      <group position={[-0.45, -0.15, -0.85]} rotation={[-0.2, 0, 0]}>
        {/* Cluster Housing */}
        <mesh>
          <boxGeometry args={[0.72, 0.34, 0.08]} />
          <meshStandardMaterial color="#020408" roughness={0.5} />
        </mesh>

        {/* Digital Screen Face with Integrated HTML Cluster */}
        <Html
          transform
          distanceFactor={1.2}
          position={[0, 0, 0.045]}
          rotation={[0, 0, 0]}
        >
          <div className="w-[360px] h-[170px] bg-[#020408]/95 border border-white/10 rounded-2xl p-3 flex items-center justify-between font-mono text-white select-none relative overflow-hidden backdrop-blur-md">
            {/* Left Dial: Tachometer / Power */}
            <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-cyan-500/40 flex items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-cyan-400/20" />
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 block">PWR</span>
                <span className="text-xs font-bold text-cyan-300">
                  {Math.min(100, Math.round(currentSpeed * 0.75))}%
                </span>
              </div>
            </div>

            {/* Center Digital Speedometer (Matching Reference: 87 KM/H & Gear D) */}
            <div className="text-center flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-sans tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {currentSpeed}
              </span>
              <span className="text-[10px] text-zinc-400 tracking-widest font-sans font-bold -mt-0.5">
                KM/H
              </span>
              <span className="text-xs font-bold text-cyan-400 mt-1 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                {gear}
              </span>
            </div>

            {/* Right Dial: Range / RPM */}
            <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-purple-500/40 flex items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-purple-400/20" />
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 block">RPM</span>
                <span className="text-xs font-bold text-purple-300">
                  {Math.min(8, (currentSpeed / 20).toFixed(1))}k
                </span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* 4. Luxury Sport Steering Wheel */}
      <group
        ref={steeringWheelRef}
        position={[-0.45, -0.28, -0.55]}
        rotation={[-0.35, 0, 0]}
      >
        {/* Outer Wheel Rim */}
        <mesh castShadow>
          <torusGeometry args={[0.22, 0.024, 16, 32]} />
          <meshStandardMaterial
            color="#080a10"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>

        {/* Center Hub */}
        <mesh position={[0, 0, -0.02]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Center Minimalist Emblem */}
        <mesh position={[0, 0, 0.005]}>
          <circleGeometry args={[0.035, 16]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>

        {/* Steering Wheel Spokes (3-spoke sports wheel) */}
        {[-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].map((angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, -0.01]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <boxGeometry args={[0.035, 0.16, 0.015]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* 5. Center Console & Integrated 3D Infotainment Display */}
      <group position={[0.22, -0.15, -0.72]} rotation={[-0.15, -0.12, 0]}>
        {/* Infotainment Screen Frame */}
        <mesh>
          <boxGeometry args={[0.66, 0.32, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Drei <Html> Interactive Center Screen */}
        <InfotainmentDisplay
          is3D={true}
          position={[0, 0, 0.025]}
          rotation={[0, 0, 0]}
          scale={0.0014}
        />
      </group>

      {/* 6. Center Gear Shifter Console Tunnel */}
      <mesh position={[0, -0.7, -0.4]} receiveShadow>
        <boxGeometry args={[0.5, 0.35, 0.9]} />
        <meshStandardMaterial color="#080a10" roughness={0.8} />
      </mesh>
      {/* Aluminum Trim on Tunnel */}
      <mesh position={[0, -0.52, -0.4]}>
        <boxGeometry args={[0.3, 0.02, 0.7]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 7. Windshield & A-Pillars Frame (Ultra-thin to maximize clear road view) */}
      {/* Left A-Pillar */}
      <mesh position={[-1.15, 0.3, -0.7]} rotation={[0.4, 0.2, -0.4]}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Right A-Pillar */}
      <mesh position={[1.15, 0.3, -0.7]} rotation={[0.4, -0.2, 0.4]}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Roof front trim */}
      <mesh position={[0, 0.78, -0.5]}>
        <boxGeometry args={[2.2, 0.08, 0.4]} />
        <meshStandardMaterial color="#080a10" roughness={0.6} />
      </mesh>

      {/* 8. Rearview Mirror */}
      <group position={[0, 0.58, -0.65]} rotation={[-0.1, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.1, 0.03]} />
          <meshStandardMaterial color="#020617" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[0.34, 0.08]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* 9. Forward Car Headlight Cones on Road */}
      {controls.headlights && (
        <group position={[0, -0.4, -1.8]}>
          {/* Left Headlight */}
          <spotLight
            position={[-0.8, 0, 0]}
            target-position={[-0.8, -1.5, -45]}
            color="#f8fafc"
            intensity={8.0 + (bassLevel || 0) * 3}
            angle={0.65}
            penumbra={0.6}
            distance={70}
            castShadow
          />
          {/* Right Headlight */}
          <spotLight
            position={[0.8, 0, 0]}
            target-position={[0.8, -1.5, -45]}
            color="#f8fafc"
            intensity={8.0 + (bassLevel || 0) * 3}
            angle={0.65}
            penumbra={0.6}
            distance={70}
            castShadow
          />
          {/* Warm fog ground fill light */}
          <pointLight
            position={[0, -0.2, -6]}
            color="#ffaa33"
            intensity={2.5}
            distance={20}
            decay={2}
          />
        </group>
      )}
    </group>
  );
}

export default CarCockpit;
