import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useAudio } from './AudioEngine.jsx';

// Generate dangling catenary curve between two 3D points for power cables
function createCatenaryCurve(start, end, sag = 1.2, segments = 20) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(start[0], end[0], t);
    const y = THREE.MathUtils.lerp(start[1], end[1], t) - Math.sin(t * Math.PI) * sag;
    const z = THREE.MathUtils.lerp(start[2], end[2], t);
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
}

// Overhead Utility Pole with transformers & crossbars
export function UtilityPole({ position = [0, 0, 0], height = 12, isDayMode = false }) {
  return (
    <group position={position}>
      {/* Main Concrete/Timber Pole */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, height, 12]} />
        <meshStandardMaterial color={isDayMode ? "#64748b" : "#334155"} roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Crossbar 1 */}
      <mesh position={[0, height - 1.2, 0]}>
        <boxGeometry args={[3.2, 0.15, 0.15]} />
        <meshStandardMaterial color={isDayMode ? "#475569" : "#1e293b"} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Crossbar 2 */}
      <mesh position={[0, height - 2.5, 0]}>
        <boxGeometry args={[2.6, 0.15, 0.15]} />
        <meshStandardMaterial color={isDayMode ? "#475569" : "#1e293b"} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Ceramic Insulators */}
      {[-1.4, -0.7, 0.7, 1.4].map((x, idx) => (
        <mesh key={idx} position={[x, height - 1.0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
        </mesh>
      ))}

      {/* Distribution Transformer Box */}
      <mesh position={[0.4, height - 3.8, 0]} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.7]} />
        <meshStandardMaterial color={isDayMode ? "#64748b" : "#475569"} metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Sodium Street Lamp attached to pole */}
      <group position={[-0.8, height - 2.0, 0]}>
        <mesh rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.7, -0.2, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Glowing 2200K Sodium Bulb */}
        <mesh position={[-0.7, -0.3, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color={isDayMode ? "#fed7aa" : "#ffaa33"} />
        </mesh>
        <pointLight
          position={[-0.7, -0.5, 0]}
          color="#ffaa33" // 2200K Warm Sodium Vapour
          intensity={isDayMode ? 0.4 : 3.5}
          distance={isDayMode ? 12 : 28}
          decay={2}
        />
      </group>
    </group>
  );
}

// Power Lines spanning across utility poles
export function PowerLinesCluster({ start, end, sag = 1.4 }) {
  const lineCurves = useMemo(() => {
    return [
      createCatenaryCurve(
        [start[0] - 1.4, start[1], start[2]],
        [end[0] - 1.4, end[1], end[2]],
        sag * 0.9
      ),
      createCatenaryCurve(
        [start[0] - 0.7, start[1] + 0.1, start[2]],
        [end[0] - 0.7, end[1] + 0.1, end[2]],
        sag * 1.1
      ),
      createCatenaryCurve(
        [start[0] + 0.7, start[1], start[2]],
        [end[0] + 0.7, end[1], end[2]],
        sag * 1.0
      ),
      createCatenaryCurve(
        [start[0] + 1.4, start[1] - 0.1, start[2]],
        [end[0] + 1.4, end[1] - 0.1, end[2]],
        sag * 1.25
      ),
    ];
  }, [start, end, sag]);

  return (
    <group>
      {lineCurves.map((curve, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[curve, 32, 0.025, 6, false]} />
          <meshBasicMaterial color="#0a0a0f" />
        </mesh>
      ))}
    </group>
  );
}

// Authentic Warm Chai Tapri / Stall Silhouette
export function ChaiStall({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const { bassLevel } = useAudio();

  return (
    <group position={position} rotation={rotation}>
      {/* Concrete base curb */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[4.2, 0.3, 3.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Wooden / Steel counter */}
      <mesh position={[0, 1.0, 0.6]} castShadow>
        <boxGeometry args={[3.6, 1.4, 1.2]} />
        <meshStandardMaterial color="#3b2d1d" roughness={0.8} />
      </mesh>

      {/* Brass Chai Samovar / Urn */}
      <mesh position={[-0.8, 1.9, 0.6]}>
        <cylinderGeometry args={[0.25, 0.2, 0.7, 16]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glass chai glasses rack */}
      <mesh position={[0.6, 1.8, 0.6]}>
        <boxGeometry args={[0.9, 0.2, 0.6]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tarpaulin / Corrugated Canopy Roof */}
      <mesh position={[0, 2.8, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.4, 0.1, 3.6]} />
        <meshStandardMaterial color="#0284c7" roughness={0.7} />
      </mesh>

      {/* Supporting bamboo / metal poles */}
      {[-1.9, 1.9].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 1.4]}>
          <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}

      {/* Glowing Warm Hanging Bulb & Light */}
      <mesh position={[0, 2.3, 0.6]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#ffb703" />
      </mesh>

      <pointLight
        position={[0, 2.1, 0.6]}
        color="#ffaa33" // 2200K Sodium / Tungsten
        intensity={2.8 + (bassLevel || 0) * 1.5}
        distance={14}
        decay={2}
      />

      {/* Neon Hindi/English Sign: "CHAI // 24 HRS" */}
      <group position={[0, 2.9, 1.6]}>
        <mesh>
          <boxGeometry args={[2.2, 0.5, 0.1]} />
          <meshStandardMaterial color="#09090b" roughness={0.5} />
        </mesh>
        <pointLight
          position={[0, 0, 0.2]}
          color="#06b6d4" // Cyan neon
          intensity={1.5}
          distance={6}
        />
      </group>
    </group>
  );
}

// Indian Road Highway Overhead Gantry Signboard
export function HighwayGantrySign({
  position = [0, 0, 0],
  textMain = "BANDRA - WORLI SEA LINK",
  textSub = "TOLL PLAZA 1.5 KM // LANE 1-4 FASTAG",
  width = 22
}) {
  return (
    <group position={position}>
      {/* Vertical truss pillars */}
      <mesh position={[-width / 2 + 1, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 12, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[width / 2 - 1, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 12, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Horizontal Bridge Truss */}
      <mesh position={[0, 10.5, 0]}>
        <boxGeometry args={[width, 1.2, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Green Highway Signboard (Standard Indian NHAI / Expressway Green) */}
      <mesh position={[0, 9.2, 0.5]}>
        <boxGeometry args={[14, 2.4, 0.15]} />
        <meshStandardMaterial color="#065f46" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Border Trim on sign */}
      <mesh position={[0, 9.2, 0.6]}>
        <boxGeometry args={[13.6, 2.1, 0.05]} />
        <meshStandardMaterial color="#047857" roughness={0.3} />
      </mesh>

      {/* Downward Illumination Spotlights */}
      {[-5, 0, 5].map((x, i) => (
        <group key={i} position={[x, 10.6, 1.2]}>
          <mesh rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <pointLight color="#ffffff" intensity={2.0} distance={10} decay={2} />
        </group>
      ))}
    </group>
  );
}
