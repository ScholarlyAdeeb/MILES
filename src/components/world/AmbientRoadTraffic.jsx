import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';

// Clean low-poly stylized vehicle model
function StylizedCar({ color, isTaxi = false, isDayMode = false }) {
  return (
    <group position={[0, 0.45, 0]}>
      {/* 1. Main Car Chassis Body */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.5, 4.0]} />
        <meshStandardMaterial
          color={color}
          roughness={isDayMode ? 0.3 : 0.15}
          metalness={isDayMode ? 0.6 : 0.9}
        />
      </mesh>

      {/* 2. Cabin Glass Roof */}
      <mesh position={[0, 0.72, -0.15]} castShadow>
        <boxGeometry args={[1.5, 0.45, 2.2]} />
        <meshStandardMaterial
          color={isDayMode ? '#0f172a' : '#020617'}
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>

      {/* 3. Taxi Rooftop Sign (if Taxi) */}
      {isTaxi && (
        <mesh position={[0, 1.02, -0.15]}>
          <boxGeometry args={[0.6, 0.16, 0.3]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      )}

      {/* 4. Wheels */}
      {[-0.92, 0.92].map((wx, i) => (
        <React.Fragment key={`wheels-${i}`}>
          <mesh position={[wx, 0.0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.22, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
          <mesh position={[wx, 0.0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.22, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 5. Headlights */}
      <mesh position={[-0.6, 0.25, 2.01]}>
        <boxGeometry args={[0.3, 0.12, 0.05]} />
        <meshBasicMaterial color={isDayMode ? '#fef08a' : '#ffffff'} />
      </mesh>
      <mesh position={[0.6, 0.25, 2.01]}>
        <boxGeometry args={[0.3, 0.12, 0.05]} />
        <meshBasicMaterial color={isDayMode ? '#fef08a' : '#ffffff'} />
      </mesh>

      {/* 6. Taillights */}
      <mesh position={[-0.6, 0.3, -2.01]}>
        <boxGeometry args={[0.35, 0.1, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.6, 0.3, -2.01]}>
        <boxGeometry args={[0.35, 0.1, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// Exactly 1 to 4 cars per road avenue (No flooding!)
export function AmbientRoadTraffic({ isDayMode = false }) {
  const groupRef = useRef();

  // Create a clean set of 12 well-spaced vehicles across the surrounding 4 main avenues (3 cars per avenue on average, exactly 1-4 per road)
  const cars = useMemo(() => {
    const list = [];
    const colors = ['#eab308', '#0f172a', '#dc2626', '#0284c7', '#f8fafc', '#475569'];
    
    // Avenue 1: North-South Right Lane (2 cars)
    list.push({
      id: 0,
      road: 'NS_POS',
      laneX: 6.5,
      laneZ: 0,
      speed: 16,
      z: -70,
      color: colors[0],
      isTaxi: true
    });
    list.push({
      id: 1,
      road: 'NS_POS',
      laneX: 6.5,
      laneZ: 0,
      speed: 19,
      z: 45,
      color: colors[1],
      isTaxi: false
    });

    // Avenue 2: North-South Opposing Lane (2 cars)
    list.push({
      id: 2,
      road: 'NS_NEG',
      laneX: -6.5,
      laneZ: 0,
      speed: -17,
      z: 80,
      color: colors[2],
      isTaxi: false
    });
    list.push({
      id: 3,
      road: 'NS_NEG',
      laneX: -6.5,
      laneZ: 0,
      speed: -18,
      z: -40,
      color: colors[3],
      isTaxi: false
    });

    // Avenue 3: East-West Forward Lane (2 cars)
    list.push({
      id: 4,
      road: 'EW_POS',
      laneX: 0,
      laneZ: 6.5,
      speed: 15,
      x: -65,
      color: colors[4],
      isTaxi: false
    });
    list.push({
      id: 5,
      road: 'EW_POS',
      laneX: 0,
      laneZ: 6.5,
      speed: 18,
      x: 50,
      color: colors[0],
      isTaxi: true
    });

    // Avenue 4: East-West Opposing Lane (2 cars)
    list.push({
      id: 6,
      road: 'EW_NEG',
      laneX: 0,
      laneZ: -6.5,
      speed: -16,
      x: 75,
      color: colors[5],
      isTaxi: false
    });
    list.push({
      id: 7,
      road: 'EW_NEG',
      laneX: 0,
      laneZ: -6.5,
      speed: -17,
      x: -45,
      color: colors[1],
      isTaxi: false
    });

    // Secondary Cross-Streets (1 car per cross-street)
    list.push({
      id: 8,
      road: 'NS_CROSS_1',
      laneX: 80 + 6.5,
      laneZ: 0,
      speed: 16,
      z: -20,
      color: colors[3],
      isTaxi: false
    });
    list.push({
      id: 9,
      road: 'NS_CROSS_2',
      laneX: -80 - 6.5,
      laneZ: 0,
      speed: -17,
      z: 30,
      color: colors[0],
      isTaxi: true
    });
    list.push({
      id: 10,
      road: 'EW_CROSS_1',
      laneX: 0,
      laneZ: 80 + 6.5,
      speed: 16,
      x: -30,
      color: colors[2],
      isTaxi: false
    });
    list.push({
      id: 11,
      road: 'EW_CROSS_2',
      laneX: 0,
      laneZ: -80 - 6.5,
      speed: -16,
      x: 40,
      color: colors[4],
      isTaxi: false
    });

    return list;
  }, []);

  const carStates = useRef(cars);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const px = player.position[0];
    const pz = player.position[2];

    if (!groupRef.current) return;

    groupRef.current.children.forEach((meshGroup, i) => {
      const car = carStates.current[i];
      if (!car) return;

      if (car.road.startsWith('NS')) {
        car.z += car.speed * dt;

        // Smooth loop around player
        const relZ = car.z - pz;
        if (relZ > 120) car.z = pz - 120;
        if (relZ < -120) car.z = pz + 120;

        meshGroup.position.set(px + car.laneX, 0, car.z);
        meshGroup.rotation.y = car.speed > 0 ? 0 : Math.PI;
      } else {
        car.x += car.speed * dt;

        const relX = car.x - px;
        if (relX > 120) car.x = px - 120;
        if (relX < -120) car.x = px + 120;

        meshGroup.position.set(car.x, 0, pz + car.laneZ);
        meshGroup.rotation.y = car.speed > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {cars.map((car) => (
        <group key={car.id} position={[car.laneX || car.x || 0, 0, car.laneZ || car.z || 0]}>
          <StylizedCar
            color={car.color}
            isTaxi={car.isTaxi}
            isDayMode={isDayMode}
          />
        </group>
      ))}
    </group>
  );
}

export default AmbientRoadTraffic;
