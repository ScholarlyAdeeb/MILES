import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from './playerState.js';

// Multi-lane Ambient City Traffic AI with dynamic recycling around player
export function AmbientTraffic({ count = 12 }) {
  const trafficGroupRef = useRef();

  const trafficData = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const isNorthSouth = i % 2 === 0;
      const isOpposing = i % 4 < 2;
      const offsetLane = ((i % 3) + 1) * 3.6;
      list.push({
        id: i,
        x: isNorthSouth ? (isOpposing ? -offsetLane : offsetLane) : (Math.random() - 0.5) * 200,
        z: isNorthSouth ? (Math.random() - 0.5) * 240 : (isOpposing ? -offsetLane : offsetLane),
        isNorthSouth,
        isOpposing,
        speed: 18 + (i % 5) * 6,
        color: ['#090d16', '#1e293b', '#0f172a', '#18181b', '#020617'][i % 5]
      });
    }
    return list;
  }, [count]);

  const carsRef = useRef(trafficData);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const [px, , pz] = player.position;

    if (trafficGroupRef.current) {
      trafficGroupRef.current.children.forEach((meshGroup, idx) => {
        const car = carsRef.current[idx];
        if (!car) return;

        if (car.isNorthSouth) {
          const dir = car.isOpposing ? 1 : -1;
          car.z += dir * car.speed * dt;

          // Recycle if too far from player
          if (car.z - pz > 140) car.z = pz - 140;
          if (car.z - pz < -140) car.z = pz + 140;
          meshGroup.position.set(px + car.x, 0, car.z);
          meshGroup.rotation.y = car.isOpposing ? 0 : Math.PI;
        } else {
          const dir = car.isOpposing ? 1 : -1;
          car.x += dir * car.speed * dt;

          if (car.x - px > 140) car.x = px - 140;
          if (car.x - px < -140) car.x = px + 140;
          meshGroup.position.set(car.x, 0, pz + car.z);
          meshGroup.rotation.y = car.isOpposing ? Math.PI / 2 : -Math.PI / 2;
        }
      });
    }
  });

  return (
    <group ref={trafficGroupRef}>
      {trafficData.map((car) => (
        <group key={car.id} position={[car.x, 0, car.z]}>
          {/* Car Body */}
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[1.9, 0.65, 4.2]} />
            <meshStandardMaterial color={car.color} roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Cabin Glass */}
          <mesh position={[0, 1.25, -0.2]}>
            <boxGeometry args={[1.6, 0.55, 2.3]} />
            <meshStandardMaterial color="#020408" roughness={0.1} metalness={0.95} />
          </mesh>

          {/* Headlights */}
          <mesh position={[-0.65, 0.6, 2.12]}>
            <boxGeometry args={[0.35, 0.12, 0.05]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.65, 0.6, 2.12]}>
            <boxGeometry args={[0.35, 0.12, 0.05]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Taillights */}
          <mesh position={[-0.65, 0.65, -2.12]}>
            <boxGeometry args={[0.4, 0.1, 0.05]} />
            <meshBasicMaterial color="#ff0033" />
          </mesh>
          <mesh position={[0.65, 0.65, -2.12]}>
            <boxGeometry args={[0.4, 0.1, 0.05]} />
            <meshBasicMaterial color="#ff0033" />
          </mesh>
          <mesh position={[0, 0.65, -2.12]}>
            <boxGeometry args={[1.4, 0.04, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Light Trail Glow */}
          <mesh position={[0, 0.55, -4]}>
            <boxGeometry args={[1.5, 0.04, 4]} />
            <meshBasicMaterial color="#ff0033" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default AmbientTraffic;
