import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BillboardHoarding } from './BillboardHoarding.jsx';
import { UtilityPole, PowerLinesCluster, ChaiStall, HighwayGantrySign } from './IndianStreetElements.jsx';

const SEGMENT_LENGTH = 100; // 100 units per segment
const ROAD_WIDTH = 22; // 4-lane highway with median & shoulders

// Single 100-unit Road Segment with asphalt, curbs, sidewalks, markings, and props
function RoadSegment({ positionZ, segmentIndex, isDayMode = false }) {
  // Road lane markings
  const dashes = useMemo(() => {
    const arr = [];
    for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 8) {
      arr.push(z);
    }
    return arr;
  }, []);

  return (
    <group position={[0, 0, positionZ]}>
      {/* 1. Main Asphalt Road Surface */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH, 16, 16]} />
        <meshStandardMaterial
          color={isDayMode ? "#2a3447" : "#0a0d14"}
          roughness={isDayMode ? 0.35 : 0.15}
          metalness={isDayMode ? 0.4 : 0.85}
        />
      </mesh>

      {/* 2. Puddle water gloss reflection layers */}
      <mesh position={[2.5, 0.01, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 16]} />
        <meshStandardMaterial
          color={isDayMode ? "#1e293b" : "#060910"}
          roughness={0.05}
          metalness={0.95}
        />
      </mesh>
      <mesh position={[-4.5, 0.01, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.8, 16]} />
        <meshStandardMaterial
          color={isDayMode ? "#1e293b" : "#060910"}
          roughness={0.05}
          metalness={0.95}
        />
      </mesh>

      {/* 3. Center Concrete Median Divider */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.7, SEGMENT_LENGTH]} />
        <meshStandardMaterial color={isDayMode ? "#64748b" : "#1e293b"} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Yellow reflectors on median */}
      {dashes.filter((_, i) => i % 2 === 0).map((z, i) => (
        <mesh key={`med-ref-${i}`} position={[0, 0.5, z]}>
          <boxGeometry args={[0.85, 0.1, 0.3]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      ))}

      {/* 4. Center lane dashed markings (-X and +X sides) */}
      {dashes.map((z, i) => (
        <React.Fragment key={i}>
          {/* Left lane dash */}
          <mesh position={[-5.2, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 4.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Right lane dash */}
          <mesh position={[5.2, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 4.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 5. Continuous Outer Solid Yellow / White Shoulder Lines */}
      <mesh position={[-10.2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
      <mesh position={[10.2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* 6. Concrete Curbs & Sidewalks */}
      {/* Left Sidewalk */}
      <mesh position={[-13.5, 0.25, 0]} receiveShadow>
        <boxGeometry args={[5, 0.5, SEGMENT_LENGTH]} />
        <meshStandardMaterial color={isDayMode ? "#64748b" : "#1e293b"} roughness={0.8} />
      </mesh>
      {/* Right Sidewalk */}
      <mesh position={[13.5, 0.25, 0]} receiveShadow>
        <boxGeometry args={[5, 0.5, SEGMENT_LENGTH]} />
        <meshStandardMaterial color={isDayMode ? "#64748b" : "#1e293b"} roughness={0.8} />
      </mesh>

      {/* 7. Steel Crash Guardrails */}
      <mesh position={[-11.2, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[11.2, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 8. Roadside Props & Indian Street Accents distributed per segment */}
      {/* Utility Poles with sodium lamps */}
      <UtilityPole position={[-15, 0.5, -30]} height={12} isDayMode={isDayMode} />
      <UtilityPole position={[-15, 0.5, 30]} height={12} isDayMode={isDayMode} />
      <UtilityPole position={[15, 0.5, 0]} height={12} isDayMode={isDayMode} />

      {/* Overhead Power Cables connecting poles */}
      <PowerLinesCluster
        start={[-15, 11, -30]}
        end={[-15, 11, 30]}
      />

      {/* Billboards */}
      {segmentIndex % 2 === 0 ? (
        <BillboardHoarding
          position={[18, 0.5, -20]}
          rotation={[0, -0.3, 0]}
          presetIndex={segmentIndex}
        />
      ) : (
        <BillboardHoarding
          position={[-18, 0.5, 20]}
          rotation={[0, 0.3, 0]}
          presetIndex={segmentIndex + 1}
        />
      )}

      {/* Chai Tapri / Stall Silhouette */}
      {segmentIndex % 2 === 0 && (
        <ChaiStall
          position={[-14.5, 0.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}

      {/* Overhead Highway Gantry on alternate segment */}
      {segmentIndex % 2 === 1 && (
        <HighwayGantrySign
          position={[0, 0, -40]}
          textMain="BANDRA - WORLI SEA LINK"
          textSub="2 KM AHEAD // TOLL INTEGRATED"
        />
      )}
    </group>
  );
}

// Highway traffic vehicle on road lanes (1 to 4 cars)
function HighwayCar({ color, initialZ, laneX, speed, isOpposing = false, isDayMode = false }) {
  const meshRef = useRef();
  const zRef = useRef(initialZ);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    zRef.current += speed * dt;

    if (zRef.current > 60) zRef.current = -140;
    if (zRef.current < -140) zRef.current = 60;

    if (meshRef.current) {
      meshRef.current.position.set(laneX, 0.45, zRef.current);
    }
  });

  return (
    <group ref={meshRef} rotation={[0, isOpposing ? 0 : Math.PI, 0]}>
      {/* Car Chassis Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 4.0]} />
        <meshStandardMaterial
          color={color}
          roughness={isDayMode ? 0.35 : 0.2}
          metalness={isDayMode ? 0.5 : 0.85}
        />
      </mesh>

      {/* Cabin Roof */}
      <mesh position={[0, 0.7, -0.15]}>
        <boxGeometry args={[1.5, 0.45, 2.2]} />
        <meshStandardMaterial color={isDayMode ? "#1e293b" : "#020617"} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.6, 0.25, 2.01]}>
        <boxGeometry args={[0.3, 0.12, 0.05]} />
        <meshBasicMaterial color={isDayMode ? "#fef08a" : "#ffffff"} />
      </mesh>
      <mesh position={[0.6, 0.25, 2.01]}>
        <boxGeometry args={[0.3, 0.12, 0.05]} />
        <meshBasicMaterial color={isDayMode ? "#fef08a" : "#ffffff"} />
      </mesh>

      {/* Taillights */}
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

export function InfiniteRoad({ playerVelocityZ = 0, isDayMode = false }) {
  const seg1Ref = useRef();
  const seg2Ref = useRef();

  // Positions of two segments: Seg 1 at 0, Seg 2 at -100
  const z1Ref = useRef(0);
  const z2Ref = useRef(-SEGMENT_LENGTH);

  useFrame((state, delta) => {
    const speed = Math.max(8, Math.abs(playerVelocityZ || 25));
    const travel = speed * delta;

    z1Ref.current += travel;
    z2Ref.current += travel;

    if (z1Ref.current > SEGMENT_LENGTH) {
      z1Ref.current = z2Ref.current - SEGMENT_LENGTH;
    }
    if (z2Ref.current > SEGMENT_LENGTH) {
      z2Ref.current = z1Ref.current - SEGMENT_LENGTH;
    }

    if (seg1Ref.current) seg1Ref.current.position.z = z1Ref.current;
    if (seg2Ref.current) seg2Ref.current.position.z = z2Ref.current;
  });

  return (
    <group>
      <group ref={seg1Ref} position={[0, 0, 0]}>
        <RoadSegment positionZ={0} segmentIndex={0} isDayMode={isDayMode} />
      </group>
      <group ref={seg2Ref} position={[0, 0, -SEGMENT_LENGTH]}>
        <RoadSegment positionZ={0} segmentIndex={1} isDayMode={isDayMode} />
      </group>

      {/* Exactly 2-3 Highway Traffic Cars on Adjacent & Opposing Lanes (Never flooded) */}
      <HighwayCar
        color="#eab308"
        initialZ={-45}
        laneX={5.2}
        speed={-6}
        isOpposing={false}
        isDayMode={isDayMode}
      />
      <HighwayCar
        color="#0284c7"
        initialZ={-110}
        laneX={-5.2}
        speed={14}
        isOpposing={true}
        isDayMode={isDayMode}
      />
      <HighwayCar
        color="#dc2626"
        initialZ={-20}
        laneX={-5.2}
        speed={16}
        isOpposing={true}
        isDayMode={isDayMode}
      />
    </group>
  );
}

export default InfiniteRoad;
