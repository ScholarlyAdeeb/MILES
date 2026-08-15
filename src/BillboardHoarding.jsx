import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useAudio } from './AudioEngine.jsx';

// Procedurally generate canvas textures for aesthetic urban billboards & brand hoardings
function createBillboardTexture(title, subtitle, accentColor, bgGradient = ['#080a14', '#151c30'], brandTag = 'BRAND CAMPAIGN') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, bgGradient[0]);
  grad.addColorStop(1, bgGradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Geometric grid overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Glowing borders
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 992, 480);

  // Subtle corner brackets
  ctx.fillStyle = accentColor;
  ctx.fillRect(16, 16, 40, 8);
  ctx.fillRect(16, 16, 8, 40);
  ctx.fillRect(968, 16, 40, 8);
  ctx.fillRect(1000, 16, 8, 40);
  ctx.fillRect(16, 488, 40, 8);
  ctx.fillRect(16, 456, 8, 40);
  ctx.fillRect(968, 488, 40, 8);
  ctx.fillRect(1000, 456, 8, 40);

  // Category tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(60, 55, 260, 42);
  ctx.font = 'bold 18px "Space Grotesk", sans-serif';
  ctx.fillStyle = accentColor;
  ctx.fillText(`// ${brandTag}`, 80, 83);

  // Main Title
  ctx.font = '900 64px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 24;
  ctx.fillText(title.toUpperCase(), 60, 210);

  // Subtitle / Copy
  ctx.shadowBlur = 0;
  ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(subtitle, 60, 275);

  // Tech graphic / Waveform / Phone silhouette
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const waveY = 370;
  ctx.moveTo(60, waveY);
  for (let x = 60; x <= 960; x += 15) {
    const norm = (x - 60) / 900;
    const h = Math.sin(norm * Math.PI * 8) * Math.cos(norm * Math.PI * 4) * 45;
    ctx.lineTo(x, waveY + h);
  }
  ctx.stroke();

  // Bottom brand note
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('MILES URBAN AD NETWORK • NIGHT CITY BROADCAST', 60, 460);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export const BILLBOARD_PRESETS = [
  {
    title: 'SAMSUNG',
    subtitle: 'Galaxy S24 Ultra • Titanium Design with Galaxy AI',
    color: '#38bdf8',
    bg: ['#030712', '#0f172a'],
    tag: 'OFFICIAL PARTNER'
  },
  {
    title: 'HOTEL MONARCH',
    subtitle: 'Luxury Rooftop Suites & Midnight Lounge • Sector 7',
    color: '#f59e0b',
    bg: ['#1c1005', '#451a03'],
    tag: 'HOSPITALITY'
  },
  {
    title: 'NIGHT MONSOON',
    subtitle: 'High-Fidelity Rooftop Traversal & Wet Asphalt Dynamics',
    color: '#06b6d4',
    bg: ['#04121a', '#082f49'],
    tag: 'AUDIO ENGINE'
  },
  {
    title: 'CYBER SEA LINK',
    subtitle: 'High Speed Expressway • Coastal Highway Acoustic Flow',
    color: '#a855f7',
    bg: ['#180614', '#4a044e'],
    tag: 'HIGHWAY LINK'
  }
];

export function BillboardHoarding({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  presetIndex = 0
}) {
  const { bassLevel } = useAudio();
  const preset = BILLBOARD_PRESETS[presetIndex % BILLBOARD_PRESETS.length];

  const texture = useMemo(() => {
    return createBillboardTexture(preset.title, preset.subtitle, preset.color, preset.bg, preset.tag);
  }, [preset]);

  const emissiveIntensity = 0.8 + (bassLevel || 0) * 0.9;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Supporting Steel Truss Scaffolding / Poles */}
      <mesh position={[-6.5, -4, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 9, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[6.5, -4, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 9, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Main Board Structure Frame */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[15, 7.5, 0.6]} />
        <meshStandardMaterial color="#090d16" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Front Glowing Display Face */}
      <mesh position={[0, 0, 0.32]}>
        <planeGeometry args={[14.6, 7.1]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive={new THREE.Color(preset.color)}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Top Floodlights casting real downlight onto the sign */}
      {[-5, 0, 5].map((x, i) => (
        <group key={i} position={[x, 4.1, 1.2]} rotation={[0.5, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.3, 0.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <pointLight
            position={[0, -0.2, 0.3]}
            color={preset.color}
            intensity={1.2 + (bassLevel || 0) * 1.5}
            distance={16}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}

export default BillboardHoarding;
