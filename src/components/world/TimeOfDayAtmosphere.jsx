import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { timeOfDayState, computeAtmosphere } from '../../timeOfDayState.js';

export function TimeOfDayAtmosphere({ onTimeUpdate }) {
  const { scene } = useThree();

  const dirLightRef = useRef();
  const hemiLightRef = useRef();
  const ambientLightRef = useRef();
  const horizonLightRefs = useRef([]);

  // Directional target
  const dirTargetRef = useRef(new THREE.Object3D());

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);

    // 1. Smoothly update Time Of Day progress
    if (timeOfDayState.autoCycle) {
      timeOfDayState.targetT = (timeOfDayState.targetT + timeOfDayState.cycleSpeed * dt) % 1.0;
    }

    // Exponential smooth damp towards target time-of-day
    const lerpAlpha = 1.0 - Math.pow(0.001, dt * timeOfDayState.lerpSpeed);
    timeOfDayState.currentT = THREE.MathUtils.lerp(
      timeOfDayState.currentT,
      timeOfDayState.targetT,
      lerpAlpha
    );

    // 2. Compute dynamic atmosphere parameters
    const atmo = computeAtmosphere(timeOfDayState.currentT);

    // 3. Update Scene Background & Fog in-place
    if (scene.background) {
      scene.background.copy(atmo.skyColor);
    }
    if (scene.fog) {
      scene.fog.color.copy(atmo.fogColor);
      scene.fog.density = atmo.fogDensity;
    }

    // 4. Update Directional Celestial Light
    if (dirLightRef.current) {
      const dir = dirLightRef.current;
      dir.color.copy(atmo.dirLightColor);
      dir.intensity = atmo.dirLightIntensity;
      dir.position.set(atmo.dirLightPos[0], atmo.dirLightPos[1], atmo.dirLightPos[2]);
    }

    // 5. Update Hemisphere Light
    if (hemiLightRef.current) {
      const hemi = hemiLightRef.current;
      hemi.color.copy(atmo.hemiSkyColor);
      hemi.groundColor.copy(atmo.hemiGroundColor);
      hemi.intensity = atmo.hemiIntensity;
    }

    // 6. Update Ambient Light
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = atmo.ambientIntensity;
    }

    // 7. Update Horizon Accent Point Lights
    atmo.horizonLights.forEach((hl, i) => {
      const pLight = horizonLightRefs.current[i];
      if (pLight) {
        pLight.position.set(hl.pos[0], hl.pos[1], hl.pos[2]);
        pLight.color.copy(hl.color);
        pLight.intensity = hl.intensity;
        pLight.distance = hl.distance;
      }
    });

    // Notify React state listener if provided (throttled)
    if (onTimeUpdate && Math.abs(timeOfDayState.currentT - (state.lastNotifiedT || -1)) > 0.02) {
      state.lastNotifiedT = timeOfDayState.currentT;
      onTimeUpdate(atmo);
    }
  });

  return (
    <group name="TimeOfDayAtmosphericSystem">
      {/* 1. Scene Background & Fog placeholders (mutated in useFrame) */}
      <color attach="background" args={['#0b1120']} />
      <fogExp2 attach="fog" args={['#0f172a', 0.0032]} />

      {/* 2. Celestial Directional Light (Sun/Moon arc) */}
      <directionalLight
        ref={dirLightRef}
        position={[50, 110, -40]}
        intensity={1.2}
        color="#818cf8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />

      {/* 3. Hemisphere Ambient (Sky vs Ground gradient) */}
      <hemisphereLight
        ref={hemiLightRef}
        args={['#38bdf8', '#1e1b4b', 1.0]}
      />

      {/* 4. Ambient Base */}
      <ambientLight ref={ambientLightRef} intensity={0.4} />

      {/* 5. Horizon City Ambient Neon Accent Lights */}
      {Array.from({ length: 4 }).map((_, i) => (
        <pointLight
          key={`horizon-light-${i}`}
          ref={(el) => (horizonLightRefs.current[i] = el)}
          position={[0, 40, -100]}
          color="#38bdf8"
          intensity={3.5}
          distance={180}
          decay={2}
        />
      ))}
    </group>
  );
}

export default TimeOfDayAtmosphere;
